import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal.svelte';
import { registerDismissible } from '../_interaction/dismissal';

const press = (key: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

// The body scroll lock is reference counted and shared by Modal, Sheet and
// CommandMenu, so a component that releases a lock it never took, or keeps one it
// did, breaks scrolling for every other holder rather than just itself.
describe('Modal body scroll lock accounting', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('releases the lock it took even if lockScroll is turned off while open', async () => {
    const view = render(Modal, { lockScroll: true });
    await tick();
    expect(document.body.style.overflow).toBe('hidden');

    await view.rerender({ lockScroll: false });
    view.unmount();
    await tick();

    expect(document.body.style.overflow).toBe('');
  });

  it('does not release a lock it never took when lockScroll is turned on while open', async () => {
    const holder = render(Modal, { lockScroll: true });
    const passenger = render(Modal, { lockScroll: false });
    await tick();
    expect(document.body.style.overflow).toBe('hidden');

    await passenger.rerender({ lockScroll: true });
    passenger.unmount();
    await tick();

    // The first modal is still open, so the page must still be locked.
    expect(document.body.style.overflow).toBe('hidden');

    holder.unmount();
    await tick();
    expect(document.body.style.overflow).toBe('');
  });
});

// Modal used to listen for Escape on the window unconditionally, so a Menu (or
// any other overlay) opened on top of it never got the chance to own the
// keypress -- a single Escape closed both the layer the user meant and the
// modal behind it. These cases exercise Modal's adoption of the shared
// dismissal module (src/lib/_interaction/dismissal.ts) against that module's
// real ownership stack, standing in for a layer like Menu/CommandMenu that
// this task does not own.
describe('Modal dismissal ownership', () => {
  it('yields Escape to a layer registered after it, and regains ownership once that layer releases', async () => {
    const ondismiss = vi.fn();
    const view = render(Modal, { ondismiss });
    await tick();

    const coveringEscape = vi.fn();
    const releaseCovering = registerDismissible({
      element: () => null,
      onEscape: coveringEscape
    });

    press('Escape');
    expect(coveringEscape).toHaveBeenCalledTimes(1);
    expect(ondismiss).not.toHaveBeenCalled();

    releaseCovering();
    press('Escape');
    expect(ondismiss).toHaveBeenCalledTimes(1);

    view.unmount();
    await tick();
  });
});
