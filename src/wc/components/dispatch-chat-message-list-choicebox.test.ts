import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import './ChatMessageList.wc.svelte';
import './Choicebox.wc.svelte';

/**
 * Mounts two real custom elements (not a stand-in) and drives them the way a
 * consumer actually would -- set/don't set a JS callback, attach
 * addEventListener, interact. src/wc/dispatch.test.ts already covers
 * dispatchEvents' own discovery/collision/bundling logic in isolation, and
 * src/wc/components/dispatch-integration.test.ts is the same proof for an earlier
 * round of wrappers; this file extends that integration proof to the two
 * shapes needed here:
 *
 * - ChatMessageList.wc.svelte's onfeedback, a 2-argument non-colliding callback,
 *   proving CALLBACK_ARGUMENT_NAMES['sui-chat-message-list:onfeedback'] in
 *   ../dispatch.ts actually matches ChatMessageList.svelte's own parameter names
 *   at runtime, not just by inspection.
 * - Choicebox.wc.svelte's onclick, which collides (so must dispatch NOTHING) AND
 *   is declared behind `extend: formAssociated(...)` -- a subclass registration
 *   that (see ../dispatch.ts's declaredCallbackPropNames comment) puts the
 *   declared onclick accessor one prototype level above hostEl's own. A wrapper
 *   whose discovery walk silently failed to find onclick at all would dispatch
 *   nothing here too, for the wrong reason, and look identical from the
 *   .wc.svelte file alone -- so the first test below asserts the accessor's
 *   actual position on the prototype chain directly, independent of whether
 *   dispatchEvents' own walk gets it right, before the second test relies on
 *   dispatchEvents having gotten it right.
 */

beforeAll(() => {
  // Choicebox is form-associated (src/wc/form-associated.ts), which calls
  // internals.setFormValue()/setValidity() on every click -- jsdom's
  // ElementInternals implements neither (confirmed empirically: attachInternals()
  // returns an object exposing only the ARIA-reflection properties). Same
  // pre-existing jsdom gap dispatch-integration.test.ts stubs for Checkbox.
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

describe('ChatMessageList.wc.svelte (onfeedback, 2 arguments, non-colliding)', () => {
  it('bundles detail as { value, message } -- the parameter names ChatMessageList.svelte itself uses -- and still calls a set callback', async () => {
    const el = mount('sui-chat-message-list');
    const original = vi.fn();
    const message = { id: 'm1', role: 'assistant', content: 'Hi there' };
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onfeedback = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.messages = [message];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('feedback', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    // ChatMessage.svelte only renders the thumbs-up/down actions once
    // onfeedback is a function (showFeedback), so setting it above is what
    // makes this button exist at all -- not just what makes it useful.
    const button = el.shadowRoot?.querySelector('[aria-label="Good response"]');
    expect(button).not.toBeNull();
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({ value: 'up', message });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('up', message);
  });
});

describe('Choicebox.wc.svelte (onclick collides, and is behind extend: formAssociated -- the KNOWN TRAP)', () => {
  it("declares onclick one prototype level above hostEl's own, not on hostEl's immediate prototype", () => {
    const el = mount('sui-choicebox');
    const immediate: unknown = Object.getPrototypeOf(el);
    const outer: unknown =
      typeof immediate === 'object' && immediate !== null ? Object.getPrototypeOf(immediate) : null;
    // extend: formAssociated({ checked: 'selected' }) (Choicebox.wc.svelte)
    // registers a subclass: hostEl's own class is that subclass, and the props
    // declared in <svelte:options> -- onclick among them -- are installed on
    // the class it extends, one level up. If this ever collapsed to a single
    // level (a Svelte internals change, or formAssociated stopping doing this),
    // this assertion fails loudly instead of the collision guard below quietly
    // starting to test nothing.
    expect(
      typeof immediate === 'object' && immediate !== null
        ? Object.prototype.hasOwnProperty.call(immediate, 'onclick')
        : null
    ).toBe(false);
    expect(
      typeof outer === 'object' && outer !== null
        ? Object.prototype.hasOwnProperty.call(outer, 'onclick')
        : null
    ).toBe(true);
  });

  it("calls the consumer's onclick with the new selected value, and never dispatches a synthetic click", async () => {
    const el = mount('sui-choicebox');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, typed (selected: boolean) => void,
    // not the native MouseEvent-taking onclick HTMLElement declares.
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.mode = 'checkbox';
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'cb';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const card = el.shadowRoot?.querySelector('[data-pw="cb"]');
    expect(card).not.toBeNull();
    // bubbles + composed: a real click on shadow content crosses the shadow
    // boundary on its own, with no help from dispatch.ts.
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, or the discovery walk above
    // had (wrongly) not needed to cross a level to find it, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(true);
  });
});
