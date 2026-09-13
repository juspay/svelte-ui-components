<svelte:options
  customElement={{
    tag: 'sui-toggle',
    shadow: 'open',
    extend: formAssociated({ checked: 'checked' }),
    props: {
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      text: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      inputId: { type: 'String', attribute: 'input-id' },
      inputAriaLabel: { type: 'String', attribute: 'input-aria-label' },
      inputAriaLabelledby: { type: 'String', attribute: 'input-aria-labelledby' },
      name: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      form: { type: 'String', reflect: true }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Toggle from '$lib/Toggle/Toggle.svelte';
  import { dispatchEvents } from '../dispatch';

  // Keep the host's native identity and ARIA accessors independent of its shadow input.
  let { inputId = '', inputAriaLabel = '', inputAriaLabelledby = '', ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  //
  // A KNOWN TRAP: this element's `extend` registers a subclass (../form-associated), so
  // the declared callback accessors (onclick included) live one prototype level above
  // the class Svelte itself defines -- dispatchEvents walks the whole chain up to (but
  // excluding) HTMLElement.prototype specifically so this still finds them.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-toggle:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `toggle.onclick = fn` still runs `fn(checked)` exactly as before, but no synthetic
  // 'click' is ever dispatched (a real composed click already bubbles out of the shadow
  // root, and doubling it up is the exact hazard the collision rule exists to prevent).
  // Called anyway, on every wrapper, rather than special-cased away: proves the
  // collision guard produces this no-op instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Toggle
  {...props}
  {...dispatchers}
  id={inputId}
  ariaLabel={inputAriaLabel}
  ariaLabelledby={inputAriaLabelledby}
/>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-toggle-display, block);
  }
</style>
