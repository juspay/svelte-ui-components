import { createRawSnippet } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Resizable from './Resizable.svelte';

function fixture() {
  const onresize = vi.fn();
  const onresizestart = vi.fn();
  const onresizeend = vi.fn();
  const destroyed = vi.fn();
  const mounted = vi.fn();
  const view = render(Resizable, {
    props: {
      width: 300,
      height: null,
      minWidth: 200,
      maxWidth: 340,
      handles: ['right', 'left'],
      onresize,
      onresizestart,
      onresizeend,
      children: createRawSnippet(() => ({
        render: () => '<input aria-label="Unsent draft" value="Keep this draft">',
        setup: () => {
          mounted();
          return destroyed;
        }
      }))
    }
  });
  const panel = view.container.querySelector('.resizable') as HTMLElement;
  const handle = view.getAllByRole('separator')[0];
  let captured: number | null = null;
  const set = vi.fn((id: number) => {
    captured = id;
  });
  const has = vi.fn((id: number) => captured === id);
  const release = vi.fn((id: number) => {
    captured = null;
    handle.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: id, bubbles: true }));
  });
  Object.defineProperties(handle, {
    setPointerCapture: { value: set },
    hasPointerCapture: { value: has },
    releasePointerCapture: { value: release }
  });
  Object.defineProperty(view.getAllByRole('separator')[1], 'setPointerCapture', { value: vi.fn() });
  const start = () => fireEvent.pointerDown(handle, { pointerId: 11, clientX: 300 });
  const move = (clientX: number, pointerId = 11) =>
    fireEvent.pointerMove(handle, { pointerId, clientX });
  return {
    ...view,
    panel,
    handle,
    set,
    has,
    release,
    onresize,
    onresizestart,
    onresizeend,
    mounted,
    destroyed,
    start,
    move
  };
}

describe('Resizable pointer lifecycle', () => {
  it.each(['pointerup', 'pointercancel', 'lostpointercapture'])(
    '%s finishes the owner once at the last clamped size and retains the draft',
    async (type) => {
      const f = fixture();
      const draft = f.getByRole('textbox');
      await f.start();
      await f.move(500);
      await fireEvent(f.handle, new PointerEvent(type, { pointerId: 11, bubbles: true }));
      await fireEvent(f.handle, new PointerEvent(type, { pointerId: 11, bubbles: true }));
      expect(f.onresizeend).toHaveBeenCalledExactlyOnceWith({ width: 340, height: 0 });
      expect(f.panel.classList.contains('resizing')).toBe(false);
      await f.move(200);
      expect(f.panel.style.width).toBe('340px');
      expect(f.panel.style.height).toBe('');
      expect(f.getByRole('textbox')).toBe(draft);
      expect((draft as HTMLInputElement).value).toBe('Keep this draft');
      expect(f.mounted).toHaveBeenCalledTimes(1);
      expect(f.destroyed).not.toHaveBeenCalled();
    }
  );

  it('ignores a second start and foreign moves and terminal events', async () => {
    const f = fixture();
    await f.start();
    await fireEvent.pointerDown(f.getAllByRole('separator')[1], { pointerId: 22, clientX: 100 });
    await f.move(200, 22);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      await fireEvent(f.handle, new PointerEvent(type, { pointerId: 22, bubbles: true }));
    }
    expect(f.onresizestart).toHaveBeenCalledTimes(1);
    expect(f.onresize).not.toHaveBeenCalled();
    expect(f.onresizeend).not.toHaveBeenCalled();
    expect(f.panel.classList.contains('resizing')).toBe(true);
    await f.move(320);
    await fireEvent.pointerUp(f.handle, { pointerId: 11 });
    expect(f.onresizeend).toHaveBeenCalledExactlyOnceWith({ width: 320, height: 0 });
    expect(f.release).toHaveBeenCalledExactlyOnceWith(11);
  });

  it.each(['disable', 'remove'])(
    '%s quietly ends capture without remounting children',
    async (mode) => {
      const f = fixture();
      const draft = f.getByRole('textbox');
      await f.start();
      await f.move(320);
      await f.rerender(
        mode === 'disable' ? { width: 320, disabled: true } : { width: 320, handles: ['left'] }
      );
      expect(f.panel.classList.contains('resizing')).toBe(false);
      expect(f.release).toHaveBeenCalledExactlyOnceWith(11);
      expect(f.onresizeend).not.toHaveBeenCalled();
      expect(f.getByRole('textbox')).toBe(draft);
      expect(f.destroyed).not.toHaveBeenCalled();
      await f.move(200);
      expect(f.panel.style.width).toBe('320px');
    }
  );

  it('destruction quietly releases capture with no late persistence callback', async () => {
    const f = fixture();
    await f.start();
    await f.move(320);
    f.unmount();
    expect(f.release).toHaveBeenCalledExactlyOnceWith(11);
    expect(f.onresizeend).not.toHaveBeenCalled();
    expect(f.destroyed).toHaveBeenCalledTimes(1);
  });

  it('failed capture leaves no active session or start/end callbacks and allows recovery', async () => {
    const f = fixture();
    f.set.mockImplementationOnce(() => {
      throw new DOMException('No active pointer', 'NotFoundError');
    });
    await f.start();
    expect(f.panel.classList.contains('resizing')).toBe(false);
    expect(f.onresizestart).not.toHaveBeenCalled();
    expect(f.onresizeend).not.toHaveBeenCalled();
    await f.start();
    await f.move(320);
    await fireEvent.pointerUp(f.handle, { pointerId: 11 });
    expect(f.onresizeend).toHaveBeenCalledExactlyOnceWith({ width: 320, height: 0 });
  });

  it('failed capture preserves both CSS-owned null axes and the unsent child', async () => {
    const onresize = vi.fn();
    const onresizestart = vi.fn();
    const onresizeend = vi.fn();
    const view = render(Resizable, {
      props: {
        width: null,
        height: null,
        minWidth: 200,
        minHeight: 100,
        onresize,
        onresizestart,
        onresizeend,
        children: createRawSnippet(() => ({
          render: () => '<input aria-label="Draft" value="Unsent">'
        }))
      }
    });
    const draft = view.getByRole('textbox');
    const handle = view.getByRole('separator');
    Object.defineProperty(handle, 'setPointerCapture', {
      value: () => {
        throw new DOMException('No pointer', 'NotFoundError');
      }
    });
    await fireEvent.pointerDown(handle, { pointerId: 11, clientX: 300, clientY: 100 });
    await fireEvent.pointerMove(handle, { pointerId: 11, clientX: 400, clientY: 200 });
    const panel = view.container.querySelector('.resizable') as HTMLElement;
    expect(panel.style.width).toBe('');
    expect(panel.style.height).toBe('');
    expect(panel.classList.contains('resizing')).toBe(false);
    expect(view.getByRole('textbox')).toBe(draft);
    expect((draft as HTMLInputElement).value).toBe('Unsent');
    expect(onresize).not.toHaveBeenCalled();
    expect(onresizestart).not.toHaveBeenCalled();
    expect(onresizeend).not.toHaveBeenCalled();
  });

  it('release failure still clears ownership and finishes once', async () => {
    const f = fixture();
    f.release.mockImplementationOnce(() => {
      throw new DOMException('Capture already lost', 'NotFoundError');
    });
    await f.start();
    await fireEvent.pointerUp(f.handle, { pointerId: 11 });
    expect(f.panel.classList.contains('resizing')).toBe(false);
    expect(f.onresizeend).toHaveBeenCalledTimes(1);
  });

  it('keyboard retains resize-only callback policy', async () => {
    const f = fixture();
    await fireEvent.keyDown(f.handle, { key: 'ArrowRight' });
    expect(f.onresize).toHaveBeenCalledExactlyOnceWith({ width: 316, height: 0 });
    expect(f.onresizestart).not.toHaveBeenCalled();
    expect(f.onresizeend).not.toHaveBeenCalled();
  });
});
