import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/svelte';
import { adoptMediaChildren } from './media-children';

const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.replaceChildren();
});

function fixture() {
  const host = document.createElement('div');
  host.innerHTML =
    '<source src="/first.wav"><track src="/captions.vtt"><span slot="play-icon">Play</span>';
  const shadow = host.attachShadow({ mode: 'open' });
  const media = document.createElement('video');
  media.append(document.createElement('slot'));
  shadow.append(media);
  document.body.append(host);
  const metadata = Array.from(host.children).slice(0, 2);
  const cleanup = adoptMediaChildren(host, media);
  cleanups.push(cleanup);
  return { host, media, metadata, cleanup };
}

describe('native WC media children', () => {
  it('adopts original source/track nodes and restores their identity and order on cleanup', () => {
    const { host, media, metadata, cleanup } = fixture();
    expect(Array.from(media.children).slice(0, 2)).toEqual(metadata);
    expect(host.querySelector('[slot="play-icon"]')?.textContent).toBe('Play');
    cleanup();
    expect(Array.from(host.children).slice(0, 2)).toEqual(metadata);
    expect(host.childNodes).toHaveLength(3);
  });

  it('keeps declarative metadata order when a source is inserted later', async () => {
    const { host, media, metadata } = fixture();
    const earlier = document.createElement('source');
    earlier.src = '/earlier.wav';
    host.prepend(earlier);
    await waitFor(() => expect(media.firstElementChild).toBe(earlier));
    expect(Array.from(media.children).slice(0, 3)).toEqual([earlier, ...metadata]);
  });

  it('honors removal of an adopted node without resurrecting it on cleanup', async () => {
    const { host, metadata, cleanup } = fixture();
    metadata[0].remove();
    await waitFor(() => expect(host.childNodes).toHaveLength(2));
    cleanup();
    expect(host.querySelector('source')).toBeNull();
    expect(host.querySelector('track')).toBe(metadata[1]);
  });

  it('removes native metadata when its declarative host content is cleared', async () => {
    const { host, media } = fixture();
    host.replaceChildren();
    await waitFor(() => expect(media.querySelectorAll('source,track')).toHaveLength(0));
  });
});
