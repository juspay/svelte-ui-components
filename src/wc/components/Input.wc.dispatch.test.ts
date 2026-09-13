import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import './Input.wc.svelte';

/**
 * dispatchEvents's own "known trap", proven rather than assumed: sui-input is
 * form-associated (`extend: formAssociated(...)` in Input.wc.svelte), which
 * registers a SUBCLASS one prototype level below `hostEl`'s immediate
 * prototype (src/wc/form-associated.ts). A test that only checked "does the
 * file compile" or "is dispatchEvents called" could pass while
 * declaredCallbackPropNames (src/wc/dispatch.ts) silently found zero callback
 * props on a form control -- it walks the chain up to HTMLElement.prototype
 * for exactly this reason, and this file is what turns "walks the chain" from
 * an assumption into an observed result: a real `<sui-input>`, mounted, with
 * `onfocusout` actually dispatching.
 *
 * Isolated in its own file rather than added to dispatch-integration.test.ts so it
 * can name an exact wrapper count without colliding with edits to that shared
 * file.
 */

beforeAll(() => {
  // Same jsdom gap dispatch-integration.test.ts's Checkbox case documents: jsdom's
  // ElementInternals implements neither method, and formAssociated
  // (src/wc/form-associated.ts) calls both from connectedCallback via
  // syncFormState() -- undefined here would throw before the element finishes
  // mounting, not just leave form participation untested.
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
function mount(): HTMLElement {
  const el = document.createElement('sui-input');
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}
afterEach(() => {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
});

describe('Input.wc.svelte (onfocusout, 1 argument, non-colliding, form-associated subclass)', () => {
  it('dispatches focusout with the FocusEvent as detail, and still calls a set onfocusout', async () => {
    const el = mount();
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onfocusout = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'email';
    await tick();

    let fired = 0;
    let detail: unknown;
    el.addEventListener('focusout', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const input = el.shadowRoot?.querySelector('[data-pw="email"]');
    expect(input).not.toBeNull();
    const focusOutEvent = new FocusEvent('focusout', { bubbles: true });
    input?.dispatchEvent(focusOutEvent);

    expect(fired).toBe(1);
    // eventDetail's 1-argument case (src/wc/dispatch.ts) forwards the callback's
    // own single argument unchanged -- the very same FocusEvent instance, not a
    // clone or a re-derived one.
    expect(detail).toBe(focusOutEvent);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(focusOutEvent);
  });

  it('onclick collides and stays callback-only: dispatches no synthetic click beyond the one real DOM click already delivers', async () => {
    const el = mount();
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'email2';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const input = el.shadowRoot?.querySelector('[data-pw="email2"]');
    expect(input).not.toBeNull();
    // bubbles + composed: a real click on shadow content crosses the shadow
    // boundary on its own, with no help from dispatch.ts.
    input?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
  });
});
