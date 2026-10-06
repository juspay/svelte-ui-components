import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Scroller from './Scroller.svelte';
import AttachmentChipRow from '../AttachmentChipRow/AttachmentChipRow.svelte';
import ChatSuggestions from '../ChatSuggestions/ChatSuggestions.svelte';

/*
 * jsdom has no layout and no ResizeObserver, so what is measured and observed is stubbed here and
 * the component's own decisions are what is under test: when the scroll region joins the Tab
 * order, what it is named, and which keys it takes. Real Tab reachability and real scrolling are
 * proven in a browser by tests/scroller-keyboard-access.test.ts and
 * tests/wc-scroller-keyboard-access.spec.ts. The stub dimensions below are synthetic.
 */
const layout = { scrollWidth: 1600, clientWidth: 500, scrollHeight: 600, clientHeight: 140 };

const scrollBy = vi.fn();

/** Callbacks of every ResizeObserver the component created, so a test can deliver a notification. */
const resizeCallbacks: (() => void)[] = [];

/** Every element handed to a ResizeObserver, in order. */
const resizeObserved: Element[] = [];

beforeAll(() => {
  class StubResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resizeCallbacks.push(() => callback([], this as unknown as ResizeObserver));
    }
    observe(target: Element): void {
      resizeObserved.push(target);
    }
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', StubResizeObserver);

  for (const key of Object.keys(layout) as (keyof typeof layout)[]) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('scroll-container') ? layout[key] : 0;
      }
    });
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
    configurable: true,
    value: scrollBy
  });
});

afterEach(() => {
  scrollBy.mockClear();
  resizeCallbacks.length = 0;
  resizeObserved.length = 0;
  Object.assign(layout, {
    scrollWidth: 1600,
    clientWidth: 500,
    scrollHeight: 600,
    clientHeight: 140
  });
});

const plain = createRawSnippet(() => ({ render: () => '<div>Nothing focusable in here</div>' }));
const withButton = createRawSnippet(() => ({
  render: () => '<div><button type="button">Inside</button></div>'
}));

const region = (container: HTMLElement): HTMLElement => {
  const el = container.querySelector<HTMLElement>('.scroll-container');
  if (el === null) {
    throw new Error('scroll region did not render');
  }
  return el;
};

describe('Scroller keyboard route', () => {
  it('names the read-only attachment strip and offers its scroll region as the keyboard route', async () => {
    const { container, getByRole, queryByRole } = render(AttachmentChipRow, {
      files: [{ id: 'report', filename: 'report.pdf' }]
    });
    const el = getByRole('region', { name: 'Pending attachments' });
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    expect(region(container)).toBe(el);
    expect(queryByRole('button')).toBeNull();
    expect(container.textContent).toContain('report.pdf');
  });

  it('names the disabled suggestion strip when its scroll region becomes the keyboard route', async () => {
    const { getByRole } = render(ChatSuggestions, {
      items: ['Refund trends', 'Recent orders'],
      disabled: true,
      layout: 'scroll',
      direction: 'vertical'
    });
    const el = getByRole('region', { name: 'Chat suggestions' });
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
  });

  it('makes an overflowing region with no arrows and no focusable content a named Tab stop', async () => {
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Scrollable content');
  });

  it('adds no Tab stop and no name while the content fits', async () => {
    Object.assign(layout, { scrollWidth: 400, clientWidth: 500 });
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);
    expect(el.getAttribute('tabindex')).toBe('-1');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  // jsdom defines `ontouchstart` on window, so it reads as a touch device and would hide the arrows
  // by itself; the cases that need arrows rendered opt out of that explicitly.
  it('leaves the arrows as the route when they are rendered', async () => {
    const { container } = render(Scroller, {
      children: plain,
      showArrows: true,
      hideArrowsOnTouch: false
    });
    await waitFor(() => expect(container.querySelector('.arrow-next')).not.toBeNull());
    expect(region(container).getAttribute('tabindex')).toBe('-1');
  });

  it('treats arrows hidden on touch as absent', async () => {
    // Control: the environment really is touch-capable, so the arrows are hidden by the
    // component's own hideArrowsOnTouch default rather than by this test.
    expect('ontouchstart' in window).toBe(true);
    const { container } = render(Scroller, { children: plain, showArrows: true });
    await waitFor(() => expect(region(container).getAttribute('tabindex')).toBe('0'));
    expect(container.querySelector('.arrow')).toBeNull();
  });

  it('adds no Tab stop when the content already holds a focusable control', async () => {
    const { container } = render(Scroller, { children: withButton, showArrows: false });
    expect(region(container).getAttribute('tabindex')).toBe('-1');
  });

  it('keeps a consumer-supplied name, and uses it for the Tab stop', async () => {
    const { container } = render(Scroller, {
      children: plain,
      showArrows: false,
      ariaLabel: 'Release timeline'
    });
    const el = region(container);
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    expect(el.getAttribute('aria-label')).toBe('Release timeline');

    Object.assign(layout, { scrollWidth: 400 });
    const fits = render(Scroller, {
      children: plain,
      showArrows: false,
      ariaLabel: 'Release timeline'
    });
    expect(region(fits.container).getAttribute('aria-label')).toBe('Release timeline');
  });

  it('picks up content that starts to overflow after mount', async () => {
    Object.assign(layout, { scrollWidth: 400 });
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);
    expect(el.getAttribute('tabindex')).toBe('-1');

    Object.assign(layout, { scrollWidth: 1600 });
    el.append(document.createElement('span'));
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
  });

  it('hands the Tab stop to a focusable control that appears, and takes it back when it goes', async () => {
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));

    const button = document.createElement('button');
    el.append(button);
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));

    button.remove();
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
  });
});

describe('Scroller keyboard route follows visibility changes that move no box', () => {
  /*
   * jsdom has no layout, so `checkVisibility` is stubbed to answer the way a browser would for the two
   * ways a control is usually hidden: an inline `display: none` and a class. Hiding the only control
   * inside a fixed-width child resizes nothing, so these changes reach the component only as attribute
   * mutations (or, for a stylesheet-driven change, not at all -- the last two cases). The stub is
   * synthetic; tests/scroller-keyboard-access.test.ts and tests/wc-scroller-keyboard-access.spec.ts
   * prove the same transitions against real browser layout and real Tab presses.
   */
  const hiddenByRule = new Set<Element>();
  const hiddenByStyleOrClass = (el: Element): boolean =>
    hiddenByRule.has(el) ||
    el.closest('.gone') !== null ||
    el.closest<HTMLElement>('[style]')?.style.display === 'none';

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'checkVisibility', {
      configurable: true,
      value(this: HTMLElement) {
        return !hiddenByStyleOrClass(this);
      }
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  });

  afterEach(() => {
    hiddenByRule.clear();
  });

  const mountWithButton = async () => {
    const { container, component } = render(Scroller, {
      children: withButton,
      showArrows: false
    });
    const el = region(container);
    const button = el.querySelector('button');
    if (button === null) {
      throw new Error('nested button did not render');
    }
    expect(el.getAttribute('tabindex')).toBe('-1');
    return { el, button, component };
  };

  it('takes over the Tab stop when the only control is hidden with an inline style, and gives it back', async () => {
    const { el, button } = await mountWithButton();

    button.style.display = 'none';
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    expect(el.getAttribute('aria-label')).toBe('Scrollable content');

    button.style.display = '';
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
  });

  it('follows a control hidden and shown by a class', async () => {
    const { el, button } = await mountWithButton();

    button.classList.add('gone');
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));

    button.classList.remove('gone');
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
  });

  it('follows a control hidden through the wrapper around it', async () => {
    const { el, button } = await mountWithButton();
    const wrapper = button.parentElement;
    if (wrapper === null) {
      throw new Error('wrapper did not render');
    }

    wrapper.classList.add('gone');
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    wrapper.classList.remove('gone');
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
  });

  it('does not report a scroll position for a change that scrolled nothing', async () => {
    const onscrollposition = vi.fn();
    const { container } = render(Scroller, {
      children: withButton,
      showArrows: false,
      onscrollposition
    });
    const el = region(container);
    const button = el.querySelector('button');
    if (button === null) {
      throw new Error('nested button did not render');
    }
    onscrollposition.mockClear();

    button.style.display = 'none';
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));
    button.style.display = '';
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
    expect(onscrollposition).not.toHaveBeenCalled();
  });

  it('re-scans when observed content resizes, for a change no mutation announced', async () => {
    const { el, button } = await mountWithButton();

    // A stylesheet rule (no attribute written) hides the control and the box around it resizes.
    hiddenByRule.add(button);
    for (const notify of resizeCallbacks) {
      notify();
    }
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));

    hiddenByRule.clear();
    for (const notify of resizeCallbacks) {
      notify();
    }
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
  });

  it('watches the controls themselves, hidden ones included, so a stylesheet-only change is noticed', async () => {
    // A class on an ancestor outside the component, or a media query, hides a control without
    // writing to the content or resizing any box around it. The control's own box is what moves.
    const { button } = await mountWithButton();
    hiddenByRule.add(button);
    expect(resizeObserved).toContain(button);

    // Even a control that is already hidden when the observers are aimed is still watched.
    const hiddenAtStart = render(Scroller, { children: withButton, showArrows: false });
    const hiddenButton = region(hiddenAtStart.container).querySelector('button');
    if (hiddenButton === null) {
      throw new Error('nested button did not render');
    }
    hiddenButton.hidden = true;
    hiddenButton.after(document.createElement('span'));
    await waitFor(() => expect(resizeObserved.filter((t) => t === hiddenButton).length).toBe(2));
  });

  it('re-scans when the viewport changes, for a media query that hid a control', async () => {
    const { el, button } = await mountWithButton();

    hiddenByRule.add(button);
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('0'));

    hiddenByRule.clear();
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(el.getAttribute('tabindex')).toBe('-1'));
  });

  it('stops listening to the viewport once unmounted', async () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(Scroller, { children: plain, showArrows: false });
    unmount();
    expect(removed.mock.calls.some(([type]) => type === 'resize')).toBe(true);
    removed.mockRestore();
  });
});

describe('Scroller region arrow keys', () => {
  it('scrolls a horizontal region 40px per ArrowRight/ArrowLeft, immediately', async () => {
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);

    await fireEvent.keyDown(el, { key: 'ArrowRight' });
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 40, behavior: 'instant' });
    await fireEvent.keyDown(el, { key: 'ArrowLeft' });
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -40, behavior: 'instant' });
  });

  it('uses ArrowDown/ArrowUp for a vertical region and ignores the other axis', async () => {
    const { container } = render(Scroller, {
      children: plain,
      showArrows: false,
      direction: 'vertical'
    });
    const el = region(container);

    await fireEvent.keyDown(el, { key: 'ArrowDown' });
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 40, behavior: 'instant' });
    scrollBy.mockClear();
    await fireEvent.keyDown(el, { key: 'ArrowRight' });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('prevents the default only for the keys it takes', async () => {
    const { container } = render(Scroller, { children: plain, showArrows: false });
    const el = region(container);

    expect(await fireEvent.keyDown(el, { key: 'ArrowRight' })).toBe(false);
    expect(await fireEvent.keyDown(el, { key: 'ArrowDown' })).toBe(true);
    expect(await fireEvent.keyDown(el, { key: 'a' })).toBe(true);
  });

  it('moves a snapping region by the arrow-button amount, since a 40px nudge snaps back', async () => {
    const { container } = render(Scroller, {
      children: plain,
      showArrows: false,
      snapToItem: true,
      scrollAmount: 120
    });
    await fireEvent.keyDown(region(container), { key: 'ArrowRight' });
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 120, behavior: 'instant' });
  });

  it('leaves keys pressed inside nested content, and modified keys, alone', async () => {
    const { container } = render(Scroller, { children: withButton, showArrows: false });
    const el = region(container);
    const inner = el.querySelector('button');
    if (inner === null) {
      throw new Error('nested button did not render');
    }

    await fireEvent.keyDown(inner, { key: 'ArrowRight' });
    await fireEvent.keyDown(el, { key: 'ArrowRight', shiftKey: true });
    await fireEvent.keyDown(el, { key: 'ArrowRight', ctrlKey: true });
    await fireEvent.keyDown(el, { key: 'ArrowRight', altKey: true });
    await fireEvent.keyDown(el, { key: 'ArrowRight', metaKey: true });
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
