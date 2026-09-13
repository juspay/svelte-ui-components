import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import './AttachmentChipRow.wc.svelte';
import './Avatar.wc.svelte';

/**
 * Mounts two real custom elements (not a stand-in) and drives them the way a
 * consumer actually would -- set/don't set a JS callback, attach
 * addEventListener, interact. AttachmentChipRow covers the non-colliding,
 * 1-argument dispatch path; Avatar covers the all-collide, dispatch-nothing
 * path. Mirrors the shape of dispatch-integration.test.ts's own cases rather
 * than extending that file, so each wrapper's proof stays self-contained.
 */

// AttachmentChipRow renders through Scroller, which sizes itself off a
// ResizeObserver in onMount -- absent from jsdom by default. Same stub shape as
// dispatch-integration.test.ts and src/lib/_chart/consumer-adapters.test.ts.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const mounted: HTMLElement[] = [];
function mount(tag: string): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}
afterEach(() => {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
});

describe('AttachmentChipRow.wc.svelte (onremoveimage, 1 argument, non-colliding)', () => {
  it('dispatches removeimage for a listener-only consumer, and still calls a set callback', async () => {
    const el = mount('sui-attachment-chip-row');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onremoveimage = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'composer';
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.images = [{ id: 'img-1', thumbnailData: 'data:image/png;base64,', filename: 'cat.png' }];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('removeimage', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const removeButton = el.shadowRoot?.querySelector('[data-pw="composer-remove-image-img-1"]');
    expect(removeButton).not.toBeNull();
    removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toBe('img-1');
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('img-1');
  });

  it('renders no remove control, and dispatches nothing, until onremoveimage is set', async () => {
    // `onremoveimage` is presence-gated: AttachmentChipRow renders the remove button
    // only when `typeof onremoveimage === 'function'` (presence-gated-callbacks.ts).
    // This asserted the opposite until the dispatcher was made conditional -- an
    // unconditional one satisfied that check, so every chip grew a remove button for
    // a consumer who had wired nothing, and the button is what this test then clicked.
    const el = mount('sui-attachment-chip-row');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'composer2';
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.images = [{ id: 'img-2', thumbnailData: 'data:image/png;base64,', filename: 'dog.png' }];
    await tick();

    let fired = 0;
    el.addEventListener('removeimage', () => {
      fired += 1;
    });

    expect(el.shadowRoot?.querySelector('[data-pw="composer2-remove-image-img-2"]')).toBeNull();
    expect(fired).toBe(0);

    // Assigned after mount: the wrapper reads props through $derived, so the control
    // appears and the event fires alongside the consumer's own callback.
    const onremoveimage = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onremoveimage = onremoveimage;
    await tick();

    const removeButton = el.shadowRoot?.querySelector('[data-pw="composer2-remove-image-img-2"]');
    expect(removeButton).not.toBeNull();
    removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(onremoveimage).toHaveBeenCalledWith('img-2');
  });
});

describe('Avatar.wc.svelte (onclick collides -- must dispatch NOTHING)', () => {
  it("calls the consumer's onclick with the real MouseEvent, and never dispatches a synthetic click", async () => {
    const el = mount('sui-avatar');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.name = 'Ada Lovelace';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const root = el.shadowRoot?.firstElementChild;
    expect(root).not.toBeNull();
    // bubbles + composed: a real click on shadow content crosses the shadow
    // boundary on its own, with no help from dispatch.ts.
    root?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
  });
});
