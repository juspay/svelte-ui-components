import { render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Toast from './Toast.svelte';
import type { ToastProperties } from './properties';

/**
 * The stylesheet reads `translate(var(--toast-enter-x, 0px), var(--toast-enter-y, 0px))`.
 * A unitless non-zero number inside translate() is invalid at computed-value time, so
 * if the inline custom property is written as `-200` the whole transform computes to
 * `none` and the toast silently stops travelling. The transitions themselves are real
 * browser behaviour (tests/toast-motion.spec.ts, including the `<sui-toast>` prop
 * route); what jsdom can pin is the value written to the element.
 */
const toastElement = (props: ToastProperties): HTMLElement => {
  const { container } = render(Toast, { props });
  const element = container.querySelector<HTMLElement>('.toast');
  if (element === null) {
    throw new Error('Toast rendered no .toast element');
  }
  return element;
};

const read = (element: HTMLElement, name: string): string =>
  element.style.getPropertyValue(name).trim();

describe('Toast — inline enter offsets carry a length unit', () => {
  it('writes inAnimationOffset to the horizontal axis in px for right-to-left', () => {
    const element = toastElement({
      message: 'Saved',
      direction: 'right-to-left',
      inAnimationOffset: 200
    });
    expect(read(element, '--toast-enter-x')).toBe('200px');
    expect(read(element, '--toast-enter-y')).toBe('');
  });

  it('writes a negative horizontal offset for left-to-right', () => {
    const element = toastElement({
      message: 'Saved',
      direction: 'left-to-right',
      inAnimationOffset: 200
    });
    expect(read(element, '--toast-enter-x')).toBe('-200px');
  });

  it('writes the vertical axis in px for bottom-to-top and the default top-to-bottom', () => {
    const up = toastElement({
      message: 'Saved',
      direction: 'bottom-to-top',
      inAnimationOffset: 120
    });
    expect(read(up, '--toast-enter-y')).toBe('120px');

    const down = toastElement({ message: 'Saved', inAnimationOffset: 120 });
    expect(read(down, '--toast-enter-y')).toBe('-120px');
  });

  it('falls back to outAnimationOffset when inAnimationOffset is unset', () => {
    const element = toastElement({ message: 'Saved', outAnimationOffset: 80 });
    expect(read(element, '--toast-enter-y')).toBe('-80px');
  });

  it('writes no inline offset when neither is set, so the --distance-overlay default applies', () => {
    const element = toastElement({ message: 'Saved' });
    expect(read(element, '--toast-enter-x')).toBe('');
    expect(read(element, '--toast-enter-y')).toBe('');
  });

  it('floors a 0ms animation duration at 50ms so transitionend still fires', () => {
    const element = toastElement({
      message: 'Saved',
      inAnimationDuration: 0,
      outAnimationDuration: 10
    });
    expect(read(element, '--toast-open-duration')).toBe('50ms');
    expect(read(element, '--toast-close-duration')).toBe('50ms');
  });
});

describe('Toast — ontoasthide fires once per hide', () => {
  const injected: HTMLStyleElement[] = [];

  afterEach(() => {
    for (const style of injected.splice(0)) {
      style.remove();
    }
  });

  const injectCss = (css: string): void => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    injected.push(style);
  };

  const transitionEnd = (element: HTMLElement, propertyName: string): void => {
    element.dispatchEvent(
      Object.assign(new Event('transitionend', { bubbles: true }), { propertyName })
    );
  };

  it('waits for the exit transition where the toast is still displayed, then fires once', async () => {
    const onhide = vi.fn();
    const { container } = render(Toast, {
      props: { message: 'Saved', duration: 10, ontoasthide: onhide }
    });
    const element = container.querySelector<HTMLElement>('.toast');
    if (element === null) {
      throw new Error('no .toast');
    }

    await waitFor(() => expect(element.classList.contains('is-visible')).toBe(false));
    // jsdom keeps the unstyled div at display:block, as an engine does while the
    // discrete display transition is still holding the toast on screen.
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onhide).not.toHaveBeenCalled();

    transitionEnd(element, 'transform');
    expect(onhide, 'only the opacity transition ends the hide').not.toHaveBeenCalled();

    transitionEnd(element, 'opacity');
    transitionEnd(element, 'opacity');
    expect(onhide).toHaveBeenCalledTimes(1);
  });

  it('reports the hide at once where the closed state is already display:none (no exit can run)', async () => {
    // What an engine without discrete display transitions does: display:none applies
    // immediately, the exit never starts, and no transitionend will ever follow.
    injectCss('.toast { display: none; }');
    const onhide = vi.fn();
    render(Toast, { props: { message: 'Saved', duration: 10, ontoasthide: onhide } });

    await waitFor(() => expect(onhide).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onhide, 'a hide is reported once, not once per code path').toHaveBeenCalledTimes(1);
  });

  it('reports the next hide after the message changes and the toast is shown again', async () => {
    injectCss('.toast { display: none; }');
    const onhide = vi.fn();
    const view = render(Toast, { props: { message: 'one', duration: 10, ontoasthide: onhide } });
    await waitFor(() => expect(onhide).toHaveBeenCalledTimes(1));

    await view.rerender({ message: 'two', duration: 10, ontoasthide: onhide });
    await waitFor(() => expect(onhide).toHaveBeenCalledTimes(2));
  });
});
