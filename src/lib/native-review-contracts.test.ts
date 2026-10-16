import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Avatar from './Avatar/Avatar.svelte';
import type { AvatarProperties } from './Avatar/properties';
import Dialog from './Dialog/Dialog.svelte';
import FileInput from './FileInput/FileInput.svelte';
import Icon from './Icon/Icon.svelte';
import IframeViewer from './IframeViewer/IframeViewer.svelte';
import MediaPlayer from './MediaPlayer/MediaPlayer.svelte';

afterEach(() => vi.restoreAllMocks());

describe('reviewed native contracts', () => {
  it('keeps an omitted avatar alt decorative for JavaScript and WC consumers', () => {
    const view = render(Avatar, { name: 'Ada Lovelace' } as AvatarProperties);
    expect(view.queryByRole('img')).toBeNull();
    expect(view.container.querySelector('.avatar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([false, true])(
    'retains selection only for native file inputs (native=%s)',
    async (native) => {
      const onfiles = vi.fn();
      const view = render(FileInput, { native, onfiles });
      const input = view.container.querySelector('input')!;
      const file = new File(['photo'], 'profile.png', { type: 'image/png' });
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      Object.defineProperty(input, 'value', {
        configurable: true,
        writable: true,
        value: 'profile.png'
      });
      await fireEvent.change(input);
      expect(onfiles).toHaveBeenCalledWith([file]);
      expect(input.value).toBe(native ? 'profile.png' : '');
    }
  );

  it('escapes quotes and backslashes in a CSS mask URL', () => {
    const view = render(Icon, { mask: true, icon: '/icons/a"b\\c.svg' });
    expect(view.container.querySelector('span')?.style.getPropertyValue('--icon-url')).toBe(
      'url("/icons/a\\22 b\\5c c.svg")'
    );
  });

  it.each([false, true])(
    'keeps the file picker reference after replacing props (native=%s)',
    async (native) => {
      const view = render(FileInput, { native });
      const input = view.container.querySelector('input')!;
      const click = vi.spyOn(input, 'click').mockImplementation(() => {});
      await view.rerender({ native, disabled: true });
      await view.rerender({ native, disabled: false });
      view.component.openFilePicker();
      expect(click).toHaveBeenCalledOnce();
    }
  );

  it('keeps frame messaging available after replacing props', async () => {
    const view = render(IframeViewer, { unstyled: true, src: 'about:blank' });
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => {});
    await view.rerender({ unstyled: true, src: 'about:blank', title: 'Updated frame' });
    view.component.postMessage('review-message', '*');
    expect(post).toHaveBeenCalledWith('review-message', '*');
  });

  it('keeps a dedicated unstyled iframe hook and preserves native-attribute hooks when omitted', async () => {
    const view = render(IframeViewer, { unstyled: true, src: 'about:blank', testId: 'frame' });
    expect(view.container.querySelector('iframe')?.getAttribute('data-pw')).toBe('frame');
    view.unmount();
    const nativeView = render(IframeViewer, {
      unstyled: true,
      src: 'about:blank',
      nativeAttrs: { 'data-pw': 'native-frame' }
    });
    expect(nativeView.container.querySelector('iframe')?.getAttribute('data-pw')).toBe(
      'native-frame'
    );
  });

  it.each(['audio', 'video'] as const)(
    'respects disabled autoplay for %s unless playback is explicitly requested',
    async (type) => {
      const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
      vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
      const view = render(MediaPlayer, {
        type,
        src: '/sample.wav',
        unstyled: true,
        autoplay: false
      });
      await tick();
      expect(play).not.toHaveBeenCalled();
      await view.rerender({
        type,
        src: '/sample.wav',
        unstyled: true,
        autoplay: false,
        playing: true
      });
      expect(play).toHaveBeenCalledOnce();
    }
  );

  it('forwards styled video attributes while explicit media props retain precedence', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const view = render(MediaPlayer, {
      type: 'video',
      src: '/clip.mp4',
      autoplay: false,
      controls: false,
      nativeAttrs: { poster: '/poster.svg', preload: 'none', controls: true }
    });
    const video = view.container.querySelector('video')!;
    expect(video.getAttribute('poster')).toBe('/poster.svg');
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.hasAttribute('controls')).toBe(false);
  });

  it('ignores a native close queued by destruction and restores focus only once', async () => {
    const prototype = HTMLDialogElement.prototype;
    const saved = ['showModal', 'close'].map(
      (name) => [name, Object.getOwnPropertyDescriptor(prototype, name)] as const
    );
    Object.defineProperty(prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      }
    });
    Object.defineProperty(prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        queueMicrotask(() => this.dispatchEvent(new Event('close')));
      }
    });
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const focus = vi.spyOn(opener, 'focus');
    const onclose = vi.fn();
    const view = render(Dialog, { open: true, returnFocusTo: opener, onclose });
    try {
      await tick();
      await view.rerender({ open: false, returnFocusTo: opener, onclose });
      await tick();
      expect(view.container.querySelector('dialog')?.open).toBe(false);
      expect(onclose).toHaveBeenCalledOnce();
      await view.rerender({ open: true, returnFocusTo: opener, onclose });
      await tick();
      onclose.mockClear();
      focus.mockClear();
      view.unmount();
      await tick();
      expect(onclose).not.toHaveBeenCalled();
      expect(focus).toHaveBeenCalledOnce();
    } finally {
      view.unmount();
      opener.remove();
      for (const [name, descriptor] of saved) {
        if (descriptor) {
          Object.defineProperty(prototype, name, descriptor);
        } else {
          Reflect.deleteProperty(prototype, name);
        }
      }
    }
  });
});
