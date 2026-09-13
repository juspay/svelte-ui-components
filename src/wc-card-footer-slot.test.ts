import { describe, expect, it } from 'vitest';
import './wc/components/Card.wc.svelte';

/**
 * The content-slot rule, made concrete for one prop: `Card.footer` used to
 * have no host path at all, and now `Card.wc.svelte` bridges it to a `footer`
 * slot, guarded by `$host().querySelector('[slot="footer"]')` so an unfilled
 * slot leaves the JS-assigned prop (and, absent that, nothing) rather than an
 * empty `<footer>`.
 *
 * This does not stop at reading the wrapper's markup -- it runs the real
 * compiled custom element in jsdom and inspects the actual shadow tree,
 * because the failure mode that rule exists to catch (a `<slot>` that compiles
 * and sits in the file but never receives anything, see
 * `check-wc-contract.js`'s `component-default-replaced-by-empty-slot` rule)
 * looks identical to a working one under a text-only check. Importing
 * `Card.wc.svelte` for its side effect runs the same
 * `customElements.define('sui-card', …)` a real `<sui-card>` consumer would
 * trigger; nothing here is a stand-in for it.
 *
 * `.textContent` cannot be the assertion: a `<slot>` element's own DOM
 * subtree is its (empty, here) fallback content, never the projected node --
 * only `HTMLSlotElement.assignedElements()` reports what the browser actually
 * routed through the slot, which is the one fact this test exists to check.
 */

const flushConnectedCallback = async (): Promise<void> => {
  // `SvelteElement#connectedCallback` is `async` and awaits one microtask
  // ("wait for possible child slot elements to be created/mounted") before it
  // even creates the component instance, so a single microtask flush is not
  // enough -- two macrotask ticks clear both that wait and the mount it gates.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('sui-card — footer slot genuinely projects light-DOM content', () => {
  it('registers the custom element', () => {
    expect(typeof customElements.get('sui-card')).toBe('function');
  });

  it('projects a light-DOM child slotted as "footer" into the real shadow tree', async () => {
    const el = document.createElement('sui-card');
    const footerContent = document.createElement('div');
    footerContent.setAttribute('slot', 'footer');
    footerContent.textContent = 'Renewed nightly';
    // Assigned BEFORE connection: `get_custom_elements_slots` in Svelte's
    // custom-element runtime inspects `childNodes[].slot` once
    // `connectedCallback` runs, so slotting after append would miss it.
    el.appendChild(footerContent);
    document.body.appendChild(el);
    await flushConnectedCallback();

    const shadow = el.shadowRoot;
    expect(shadow).not.toBeNull();
    if (shadow === null) {
      throw new Error('expected a shadow root');
    }

    const footerEl = shadow.querySelector<HTMLElement>('.card-footer');
    // `.card-footer` exists at all only when Card.svelte's own `footer` prop is
    // a function -- proving the wrapper handed one down, not merely that some
    // `<slot>` sits somewhere in the shadow root.
    expect(footerEl).not.toBeNull();
    if (footerEl === null) {
      throw new Error('expected a .card-footer element');
    }

    const slotEl = footerEl.querySelector<HTMLSlotElement>('slot[name="footer"]');
    expect(slotEl).not.toBeNull();
    if (slotEl === null) {
      throw new Error('expected a <slot name="footer"> element');
    }

    const assigned = slotEl.assignedElements();
    expect(assigned).toHaveLength(1);
    expect(assigned[0].textContent).toBe('Renewed nightly');

    document.body.removeChild(el);
  });

  it('renders no footer element when nothing is slotted and no property is assigned', async () => {
    const el = document.createElement('sui-card');
    document.body.appendChild(el);
    await flushConnectedCallback();

    // The other half of the guard: an unfilled footer must not leave an empty
    // `<footer class="card-footer">` sitting in every `<sui-card>`.
    const shadow = el.shadowRoot;
    expect(shadow).not.toBeNull();
    expect(shadow === null ? null : shadow.querySelector('.card-footer')).toBeNull();

    document.body.removeChild(el);
  });
});
