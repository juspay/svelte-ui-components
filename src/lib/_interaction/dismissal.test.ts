import { afterEach, describe, expect, it, vi } from 'vitest';
import { dismissibleLayerCount, registerDismissible } from './dismissal';

const press = (key: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

function layerElement(): HTMLElement {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('dismissal stack ownership', () => {
  it('sends Escape to the most recently registered layer only', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const releaseOuter = registerDismissible({ element: () => layerElement(), onEscape: outer });
    const releaseInner = registerDismissible({ element: () => layerElement(), onEscape: inner });

    press('Escape');

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();

    releaseInner();
    press('Escape');
    expect(outer).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(1);

    releaseOuter();
  });

  it('ignores keys other than Escape', () => {
    const onEscape = vi.fn();
    const release = registerDismissible({ element: () => layerElement(), onEscape });

    press('Enter');
    press('a');

    expect(onEscape).not.toHaveBeenCalled();
    release();
  });

  it('treats a press inside the topmost layer as inside, and outside as outside', () => {
    const element = layerElement();
    const child = document.createElement('button');
    element.append(child);
    const onOutside = vi.fn();
    const release = registerDismissible({ element: () => element, onOutside });

    child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(onOutside).not.toHaveBeenCalled();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);

    release();
  });

  it('does not tell a covered layer about a press, even outside its own element', () => {
    const under = layerElement();
    const over = layerElement();
    const underOutside = vi.fn();
    const overOutside = vi.fn();
    const releaseUnder = registerDismissible({ element: () => under, onOutside: underOutside });
    const releaseOver = registerDismissible({ element: () => over, onOutside: overOutside });

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

    expect(overOutside).toHaveBeenCalledTimes(1);
    expect(underOutside).not.toHaveBeenCalled();

    releaseOver();
    releaseUnder();
  });

  it('releases a layer from the middle of the stack without disturbing the rest', () => {
    const first = vi.fn();
    const second = vi.fn();
    const third = vi.fn();
    const releaseFirst = registerDismissible({ element: () => layerElement(), onEscape: first });
    const releaseSecond = registerDismissible({ element: () => layerElement(), onEscape: second });
    const releaseThird = registerDismissible({ element: () => layerElement(), onEscape: third });

    releaseSecond();
    press('Escape');
    expect(third).toHaveBeenCalledTimes(1);

    releaseThird();
    press('Escape');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    releaseFirst();
  });

  it('detaches its listeners once the last layer is released', () => {
    expect(dismissibleLayerCount()).toBe(0);
    const onEscape = vi.fn();
    const release = registerDismissible({ element: () => layerElement(), onEscape });
    expect(dismissibleLayerCount()).toBe(1);

    release();
    expect(dismissibleLayerCount()).toBe(0);

    press('Escape');
    expect(onEscape).toHaveBeenCalledTimes(0);

    // Releasing twice must not corrupt the stack.
    release();
    expect(dismissibleLayerCount()).toBe(0);
  });

  it('skips a layer whose element has gone, rather than trapping dismissal', () => {
    const onOutside = vi.fn();
    const release = registerDismissible({ element: () => null, onOutside });

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

    expect(onOutside).toHaveBeenCalledTimes(1);
    release();
  });
});
