import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('a second Escape within the debounce window does not fire ondismiss again', async () => {
    // OverlayAnimation's out:tokenizedFly outro (~350ms fallback) keeps the
    // popstate/Escape listeners registered for as long as the overlay is
    // still fading out, so a second Escape landing in that window used to
    // fire onoverlayclick/ondismiss a second time for one dismissal.
    // handleEscape is now routed through the same debounce() instance
    // handleOverlayClick already used, at its 700ms default -- comfortably
    // wider than two synchronous presses in this test.
    const ondismiss = vi.fn();
    const view = render(Modal, { ondismiss });
    await tick();

    press('Escape');
    press('Escape');

    expect(ondismiss).toHaveBeenCalledTimes(1);

    view.unmount();
    await tick();
  });
});

// Modal built its debouncer from the first render's `debounceTime`, so a delay changed while
// the modal was open was never seen. These drive the real overlay, Escape and back-press paths
// on one open instance and move the clock by hand: the debouncer measures with Date.now().
describe('Modal debounceTime reactivity', () => {
  // Overlay and content transitions run through the Web Animations API, which jsdom lacks.
  // Stubbed here rather than in vitest-setup.ts for the reason Sheet's suite gives.
  beforeAll(() => {
    if (typeof Element.prototype.animate !== 'function') {
      const stub = { cancel: () => {}, finished: Promise.resolve() };
      Element.prototype.animate = () => stub as unknown as Animation;
    }
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-03T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const advance = (ms: number): void => {
    vi.setSystemTime(new Date(Date.now() + ms));
  };

  const content = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));

  const open = async (props: { debounceTime?: number; supportHardwareBackPress?: boolean }) => {
    const onoverlayclick = vi.fn();
    const ondismiss = vi.fn();
    const onclose = vi.fn();
    const view = render(Modal, { content, onoverlayclick, ondismiss, onclose, ...props });
    await tick();
    const overlay = view.container.querySelector<HTMLElement>('.modal');
    if (overlay === null) {
      throw new Error('the overlay did not render');
    }
    return { view, overlay, onoverlayclick, ondismiss, onclose };
  };

  it('lowering the delay on the open modal lets overlay clicks 100ms apart both fire', async () => {
    const { view, overlay, onoverlayclick } = await open({ debounceTime: 700 });

    await fireEvent.click(overlay);
    expect(onoverlayclick).toHaveBeenCalledTimes(1);

    await view.rerender({ debounceTime: 20 });
    advance(100);
    await fireEvent.click(overlay);

    expect(onoverlayclick).toHaveBeenCalledTimes(2);
  });

  it('still suppresses a second click inside an unchanged window', async () => {
    const { overlay, onoverlayclick } = await open({ debounceTime: 700 });

    await fireEvent.click(overlay);
    advance(100);
    await fireEvent.click(overlay);

    expect(onoverlayclick).toHaveBeenCalledTimes(1);
  });

  it('raising the delay applies to the next click and keeps when the last one fired', async () => {
    const { view, overlay, onoverlayclick } = await open({ debounceTime: 20 });

    await fireEvent.click(overlay);
    advance(100);
    await fireEvent.click(overlay);
    expect(onoverlayclick).toHaveBeenCalledTimes(2);

    // Rebuilding the debouncer for the new delay would drop the click above from its memory
    // and let this one through.
    await view.rerender({ debounceTime: 5000 });
    advance(100);
    await fireEvent.click(overlay);
    expect(onoverlayclick).toHaveBeenCalledTimes(2);

    advance(5000);
    await fireEvent.click(overlay);
    expect(onoverlayclick).toHaveBeenCalledTimes(3);
  });

  it('overlay click, Escape and back-press share one history and one delay', async () => {
    const { view, overlay, ondismiss, onclose } = await open({
      debounceTime: 700,
      supportHardwareBackPress: true
    });

    await fireEvent.click(overlay);
    expect(ondismiss).toHaveBeenCalledTimes(1);

    advance(100);
    press('Escape');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(ondismiss).toHaveBeenCalledTimes(1);
    expect(onclose).not.toHaveBeenCalled();

    // The delay change reaches the back-press path as well, not only the overlay.
    await view.rerender({ debounceTime: 20 });
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(ondismiss).toHaveBeenCalledTimes(2);
    expect(onclose).toHaveBeenCalledTimes(1);

    advance(100);
    press('Escape');
    expect(ondismiss).toHaveBeenCalledTimes(3);

    view.unmount();
    await tick();
  });

  it('releases its Escape layer on unmount after a delay change', async () => {
    const { view, ondismiss } = await open({ debounceTime: 700 });
    await view.rerender({ debounceTime: 20 });

    view.unmount();
    await tick();
    advance(100);
    press('Escape');

    expect(ondismiss).not.toHaveBeenCalled();
  });
});

// The dialog name is an aria-label on the panel itself, so moving the overlay to document.body
// cannot separate it from the thing it names.
describe('Modal dialog name with usePortal', () => {
  beforeAll(() => {
    if (typeof Element.prototype.animate !== 'function') {
      const stub = { cancel: () => {}, finished: Promise.resolve() };
      Element.prototype.animate = () => stub as unknown as Animation;
    }
  });

  it('keeps role, aria-modal and the accessible name when the overlay is portalled', async () => {
    const content = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));
    const view = render(Modal, {
      content,
      usePortal: true,
      role: 'alertdialog',
      ariaLabel: 'Confirm Action',
      header: { text: 'Confirm Action' }
    });
    await tick();

    const panel = document.body.querySelector(':scope > .modal .modal-content');
    expect(panel).not.toBeNull();
    expect(view.container.querySelector('.modal-content')).toBeNull();

    const dialog = view.getByRole('alertdialog', { name: 'Confirm Action' });
    expect(dialog).toBe(panel);
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    view.unmount();
    await tick();
  });
});

// An alertdialog's message is its accessible description. The id is resolved by the browser inside the
// panel's own root, so the test checks both that the attribute lands on the panel and that it resolves.
describe('Modal dialog description', () => {
  beforeAll(() => {
    if (typeof Element.prototype.animate !== 'function') {
      const stub = { cancel: () => {}, finished: Promise.resolve() };
      Element.prototype.animate = () => stub as unknown as Animation;
    }
  });

  const messageSnippet = createRawSnippet(() => ({
    render: () => '<p id="confirm-message">Are you sure you want to proceed?</p>'
  }));

  it('renders aria-describedby on the panel and the id resolves to the message', async () => {
    const view = render(Modal, {
      content: messageSnippet,
      role: 'alertdialog',
      ariaLabel: 'Confirm Action',
      ariaDescribedby: 'confirm-message',
      header: { text: 'Confirm Action' }
    });
    await tick();

    const dialog = view.getByRole('alertdialog', { name: 'Confirm Action' });
    expect(dialog.getAttribute('aria-describedby')).toBe('confirm-message');
    const described = dialog.ownerDocument.getElementById('confirm-message');
    expect(described?.textContent).toBe('Are you sure you want to proceed?');
    expect(dialog.contains(described)).toBe(true);

    view.unmount();
    await tick();
  });

  it('renders no aria-describedby when the prop is not set', async () => {
    const view = render(Modal, {
      content: messageSnippet,
      role: 'alertdialog',
      ariaLabel: 'Confirm Action',
      header: { text: 'Confirm Action' }
    });
    await tick();

    const dialog = view.getByRole('alertdialog', { name: 'Confirm Action' });
    expect(dialog.hasAttribute('aria-describedby')).toBe(false);

    view.unmount();
    await tick();
  });

  it('keeps the description when the overlay is portalled', async () => {
    const view = render(Modal, {
      content: messageSnippet,
      usePortal: true,
      role: 'alertdialog',
      ariaLabel: 'Confirm Action',
      ariaDescribedby: 'confirm-message',
      header: { text: 'Confirm Action' }
    });
    await tick();

    const dialog = view.getByRole('alertdialog', { name: 'Confirm Action' });
    expect(dialog.getAttribute('aria-describedby')).toBe('confirm-message');
    expect(document.getElementById('confirm-message')?.closest('.modal-content')).toBe(dialog);

    view.unmount();
    await tick();
  });
});
