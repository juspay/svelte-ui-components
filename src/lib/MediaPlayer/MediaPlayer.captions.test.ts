import { createRawSnippet } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MediaPlayer from './MediaPlayer.svelte';

/**
 * jsdom has no TextTrack, so the track-mode contract is exercised against a SYNTHETIC adapter:
 * a per-`<track>` object with a writable `mode`, and a list that dispatches `change` when a mode
 * is set, which is what a real `TextTrackList` does (spec: queued, coalesced; here a microtask).
 * It proves the component's wiring -- what it writes, what it follows, what it reports. That a
 * real browser fetches the WebVTT and paints the cues is proven in a real engine by
 * tests/media-player-captions.test.ts, not here.
 */
class FakeTrack {
  private current: TextTrackMode;
  constructor(
    private readonly list: EventTarget,
    initial: TextTrackMode
  ) {
    this.current = initial;
  }
  get mode(): TextTrackMode {
    return this.current;
  }
  set mode(next: TextTrackMode) {
    if (next === this.current) {
      return;
    }
    this.current = next;
    queueMicrotask(() => this.list.dispatchEvent(new Event('change')));
  }
}

const tracks = new WeakMap<HTMLTrackElement, FakeTrack>();
const lists = new WeakMap<HTMLMediaElement, EventTarget>();
let initialMode: TextTrackMode = 'disabled';

const listOf = (video: HTMLMediaElement): EventTarget => {
  const existing = lists.get(video);
  if (existing instanceof EventTarget) {
    return existing;
  }
  const created = new EventTarget();
  lists.set(video, created);
  return created;
};

const trackOf = (container: HTMLElement): FakeTrack => {
  const element = container.querySelector('track');
  if (element === null) {
    throw new Error('no <track> rendered');
  }
  const track = tracks.get(element);
  if (!(track instanceof FakeTrack)) {
    throw new Error('the track was never read');
  }
  return track;
};

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('MediaPlayer captions toggle', () => {
  beforeEach(() => {
    initialMode = 'disabled';
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', {
      configurable: true,
      get(this: HTMLMediaElement) {
        return listOf(this);
      }
    });
    Object.defineProperty(HTMLTrackElement.prototype, 'track', {
      configurable: true,
      get(this: HTMLTrackElement) {
        const existing = tracks.get(this);
        if (existing instanceof FakeTrack) {
          return existing;
        }
        const video = this.parentElement;
        if (!(video instanceof HTMLMediaElement)) {
          throw new Error('a <track> outside a media element');
        }
        const created = new FakeTrack(listOf(video), initialMode);
        tracks.set(this, created);
        return created;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLMediaElement.prototype, 'textTracks');
    Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');
  });

  const base = { type: 'video', src: '/clip.mp4', autoplay: false, playing: false } as const;
  const captions = { captionsSrc: '/clip.vtt', captionsLabel: 'English', captionsSrcLang: 'en' };

  it('draws nothing extra unless asked: no toggle, and the track mode is left alone', async () => {
    const { container, queryByRole } = render(MediaPlayer, { props: { ...base, ...captions } });
    await settle();
    expect(queryByRole('button', { name: 'Captions' })).toBeNull();
    expect(container.querySelector('track')).not.toBeNull();
    // A player nobody asked to show captions on must not have its track rewritten.
    expect(trackOf(container).mode).toBe('disabled');
  });

  it('is only drawn when there is a track behind it', () => {
    const { queryByRole, container } = render(MediaPlayer, {
      props: { ...base, captionsButton: true }
    });
    expect(queryByRole('button', { name: 'Captions' })).toBeNull();
    expect(container.querySelector('track')).toBeNull();
  });

  it('is not layered over the browser controls, which have their own captions menu', () => {
    const { queryByRole } = render(MediaPlayer, {
      props: { ...base, ...captions, controls: true, captionsButton: true }
    });
    expect(queryByRole('button', { name: 'Captions' })).toBeNull();
  });

  it('is a named toggle button whose pressed state is the captions state', () => {
    const { getByRole } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true }
    });
    const toggle = getByRole('button', { name: 'Captions' });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('type')).toBe('button');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows and hides the track when pressed, and reports each viewer change', async () => {
    const oncaptionschange = vi.fn();
    const { getByRole, container } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true, oncaptionschange }
    });
    await settle();
    const toggle = getByRole('button', { name: 'Captions' });

    await fireEvent.click(toggle);
    await settle();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(trackOf(container).mode).toBe('showing');
    expect(oncaptionschange).toHaveBeenLastCalledWith(true);

    await fireEvent.click(toggle);
    await settle();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    // `hidden`, not `disabled`: the cues stay loaded so showing them again is instant.
    expect(trackOf(container).mode).toBe('hidden');
    expect(oncaptionschange).toHaveBeenLastCalledWith(false);
    // The track's own `change` echo of the component's writes must not double-report.
    expect(oncaptionschange).toHaveBeenCalledTimes(2);
  });

  it('shows the track at mount when the host starts it visible, without reporting a change', async () => {
    const oncaptionschange = vi.fn();
    const { container, getByRole } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true, captionsVisible: true, oncaptionschange }
    });
    await settle();
    expect(trackOf(container).mode).toBe('showing');
    expect(getByRole('button', { name: 'Captions' }).getAttribute('aria-pressed')).toBe('true');
    expect(oncaptionschange).not.toHaveBeenCalled();
  });

  it('follows a host write in both directions and never mistakes it for a viewer change', async () => {
    const oncaptionschange = vi.fn();
    const { container, getByRole, rerender } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true, oncaptionschange }
    });
    await settle();

    await rerender({ captionsVisible: true });
    await settle();
    expect(trackOf(container).mode).toBe('showing');
    expect(getByRole('button', { name: 'Captions' }).getAttribute('aria-pressed')).toBe('true');

    await rerender({ captionsVisible: false });
    await settle();
    expect(trackOf(container).mode).toBe('hidden');
    expect(getByRole('button', { name: 'Captions' }).getAttribute('aria-pressed')).toBe('false');

    expect(oncaptionschange).not.toHaveBeenCalled();
  });

  it('follows the browser: a mode change it makes itself (its own captions menu) is adopted', async () => {
    const oncaptionschange = vi.fn();
    const { container, getByRole } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true, oncaptionschange }
    });
    await settle();
    const toggle = getByRole('button', { name: 'Captions' });

    trackOf(container).mode = 'showing';
    await settle();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(oncaptionschange).toHaveBeenLastCalledWith(true);

    trackOf(container).mode = 'disabled';
    await settle();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(oncaptionschange).toHaveBeenLastCalledWith(false);
  });

  it('keeps a track the browser already chose to show (an accessibility preference) showing', async () => {
    initialMode = 'showing';
    const { container, getByRole } = render(MediaPlayer, {
      props: { ...base, ...captions, captionsButton: true }
    });
    await settle();
    expect(trackOf(container).mode).toBe('showing');
    expect(getByRole('button', { name: 'Captions' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('swaps the glyph per state through the icon snippets', async () => {
    const glyph = (name: string) =>
      createRawSnippet(() => ({ render: () => `<i data-glyph="${name}"></i>` }));
    const { container, getByRole } = render(MediaPlayer, {
      props: {
        ...base,
        ...captions,
        captionsButton: true,
        captionsIcon: glyph('off'),
        captionsOnIcon: glyph('on')
      }
    });
    const toggle = getByRole('button', { name: 'Captions' });
    expect(container.querySelector('[data-glyph="off"]')).not.toBeNull();
    expect(container.querySelector('[data-glyph="on"]')).toBeNull();
    await fireEvent.click(toggle);
    await settle();
    expect(container.querySelector('[data-glyph="on"]')).not.toBeNull();
    expect(container.querySelector('[data-glyph="off"]')).toBeNull();
  });
});

describe('MediaPlayer captions without a TextTrack implementation', () => {
  it('still renders the toggle and its state (jsdom has no textTracks)', async () => {
    const { getByRole } = render(MediaPlayer, {
      props: {
        type: 'video',
        src: '/clip.mp4',
        autoplay: false,
        playing: false,
        captionsSrc: '/clip.vtt',
        captionsButton: true
      }
    });
    const toggle = getByRole('button', { name: 'Captions' });
    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
