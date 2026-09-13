import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import './Pagination.wc.svelte';
import './Pill.wc.svelte';
import './Radio.wc.svelte';
import { declaredCallbackPropNames } from '../dispatch';

/**
 * Proof for Pagination.wc.svelte, Pill.wc.svelte, and Radio.wc.svelte: mounts real
 * custom elements (not a stand-in) and drives them the way a consumer actually
 * would -- set/don't set a JS callback, attach addEventListener, interact.
 * Pagination and Pill each cover a wrapper with ONE colliding and ONE
 * non-colliding callback side by side; Radio covers the form-associated
 * "subclass" trap -- its declared `onchange` accessor sits two prototype levels
 * above `hostEl` (extend: extendRadio wraps radioGrouping around formAssociated
 * around the Svelte-generated class), so this asserts the collision is still
 * found there rather than assuming it is. Mirrors the shape of
 * dispatch-integration.test.ts's own cases rather than extending that file, so
 * each wrapper's proof stays self-contained.
 */

// Radio is form-associated (src/wc/form-associated.ts), which calls
// internals.setFormValue()/setValidity() on every change -- jsdom's
// ElementInternals implements neither (same pre-existing gap dispatch-integration.test.ts
// already stubs for Checkbox; unrelated to callback dispatch).
beforeAll(() => {
  Object.defineProperty(ElementInternals.prototype, 'setFormValue', {
    value: () => {},
    writable: true,
    configurable: true
  });
  Object.defineProperty(ElementInternals.prototype, 'setValidity', {
    value: () => {},
    writable: true,
    configurable: true
  });
});
afterAll(() => {
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

describe('Pagination.wc.svelte (onchange collides, onloadmore does not)', () => {
  it('dispatches loadmore for a listener-only consumer, and still calls a set onloadmore', async () => {
    const el = mount('sui-pagination');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onloadmore = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.totalPages = 3;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.currentPage = 3;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.hasMore = true;
    await tick();

    let fired = 0;
    el.addEventListener('loadmore', () => {
      fired += 1;
    });

    // hasMore + currentPage >= totalPages swaps the next button for the
    // load-more CTA (Pagination.svelte's own `isLoadMore` derivation).
    const loadMoreButton = el.shadowRoot?.querySelector('[aria-label="Load more"]');
    expect(loadMoreButton).not.toBeNull();
    loadMoreButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith();
  });

  it("calls the consumer's onchange with the new page, and never dispatches a synthetic change", async () => {
    const el = mount('sui-pagination');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, typed (page: number) => void,
    // not the native Event-taking onchange HTMLElement declares.
    el.onchange = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.totalPages = 5;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.currentPage = 1;
    await tick();

    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });

    const pageTwo = el.shadowRoot?.querySelector('[aria-label="Page 2"]');
    expect(pageTwo).not.toBeNull();
    pageTwo?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Pagination's page buttons are plain <button>s carrying no 'change' event
    // of their own, so zero here proves dispatchEvents added no synthetic one --
    // not merely that a native event failed to cross the shadow boundary, the
    // way Checkbox's/Radio's native 'click'/'change' cases must distinguish.
    expect(fired).toBe(0);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(2);
  });
});

describe('Pill.wc.svelte (onclick collides, ondismiss does not)', () => {
  it('dispatches dismiss for a listener-only consumer, and still calls a set ondismiss', async () => {
    const el = mount('sui-pill');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.ondismiss = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.text = 'Active';
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.dismissible = true;
    await tick();

    let fired = 0;
    el.addEventListener('dismiss', () => {
      fired += 1;
    });

    const dismissButton = el.shadowRoot?.querySelector('[aria-label="Dismiss"]');
    expect(dismissButton).not.toBeNull();
    dismissButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith();
  });

  it("calls the consumer's onclick with the real MouseEvent, and never dispatches a synthetic click", async () => {
    const el = mount('sui-pill');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.text = 'Active';
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.as = 'button';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const root = el.shadowRoot?.querySelector('[data-pw]') ?? el.shadowRoot?.firstElementChild;
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

describe('Radio.wc.svelte (onchange collides -- the extend/subclass trap)', () => {
  it('the prototype walk reaches onchange through the subclass extendRadio inserts', () => {
    // The assertion with teeth. Radio's ONLY callback collides, so "no event
    // fired" is what a correctly-guarded element AND a completely unwired one
    // both produce -- the behavioural test below passes with the wiring deleted,
    // which makes it worthless on its own. This is the half that fails when the
    // real hazard regresses: `extend: extendRadio` wraps radioGrouping around
    // formAssociated around the Svelte-generated class, so the `onchange`
    // accessor sits SEVERAL levels up. A one-level walk found nothing at all, and
    // an element with no detected callbacks cannot dispatch a wrong event for the
    // same reason it cannot dispatch a right one.
    const el = mount('sui-radio');
    expect(declaredCallbackPropNames(el)).toContain('onchange');
  });

  it("calls the consumer's onchange with the new value, and never dispatches a synthetic change, despite extend: extendRadio", async () => {
    const el = mount('sui-radio');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, typed (value: string) => void,
    // not the native Event-taking onchange HTMLElement declares.
    el.onchange = original;
    // `name` is a getter-only accessor on a form-associated element (reflects the
    // attribute; see form-associated.ts) -- set via attribute, not property.
    el.setAttribute('name', 'radio-dispatch');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.value = 'red';
    await tick();

    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });

    const input = el.shadowRoot?.querySelector('input[type="radio"]');
    expect(input).not.toBeNull();
    if (input instanceof HTMLInputElement) {
      input.checked = true;
      // A native 'change' event is NOT composed, so it never reaches a listener
      // on the host in the first place -- unlike Checkbox's/Avatar's collision
      // cases, where the real click DOES cross the boundary on its own. That
      // makes 0 here the whole proof: the only way `el`'s 'change' listener could
      // ever fire is a synthetic, composed CustomEvent from dispatchEvents, which
      // this asserts never happens even though `extend: extendRadio` registers
      // hostEl through a subclass chain (radioGrouping -> formAssociated -> the
      // Svelte-generated class that actually declares the `onchange` accessor)
      // rather than directly declaring it.
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    expect(fired).toBe(0);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('red');
  });
});
