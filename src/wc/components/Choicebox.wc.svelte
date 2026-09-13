<svelte:options
  customElement={{
    tag: 'sui-choicebox',
    shadow: 'open',
    extend: formAssociated({ checked: 'selected' }),
    props: {
      selected: { type: 'Boolean', reflect: true },
      mode: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showIndicator: { type: 'Boolean', reflect: true, attribute: 'show-indicator' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      name: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      form: { type: 'String', reflect: true },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';
  import { dispatchEvents } from '../dispatch';
  // Checkbox-shaped for the form even in `radio` mode: `selected` is a boolean
  // per card, so an unselected card submits nothing and a selected one submits
  // its `value`. The one-of-N rule a native radio group gets from the browser is
  // enforced by Choicebox's own grouping, which cannot cross shadow roots -- so
  // `<sui-choicebox mode="radio" name="plan">` siblings each own their
  // selection. See docs/Choicebox.md.
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-choicebox:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `choicebox.onclick = fn` still runs `fn(selected)` exactly as before, but no
  // synthetic 'click' event is ever dispatched. Called anyway, on every wrapper,
  // rather than special-cased away: proves the collision guard produces this no-op
  // instead of assuming it.
  //
  // KNOWN TRAP (see Checkbox.wc.svelte): `extend: formAssociated(...)` above
  // registers a SUBCLASS, so this element's declared `onclick` accessor lives one
  // prototype level above `hostEl`'s own -- dispatchEvents' declaredCallbackPropNames
  // (src/wc/dispatch.ts) walks the whole chain to find it. Asserted directly in
  // src/wc/components/dispatch-chat-message-list-choicebox.test.ts rather than assumed: onclick collides
  // either way here, so a wrapper that silently failed to find it at all would still
  // dispatch nothing and look identical from this file alone.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Choicebox {...props} {...dispatchers}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Choicebox>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-choicebox-display, block);
  }
</style>
