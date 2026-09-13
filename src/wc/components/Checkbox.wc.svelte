<svelte:options
  customElement={{
    tag: 'sui-checkbox',
    shadow: 'open',
    extend: formAssociated({ checked: 'checked' }),
    props: {
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      indeterminate: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      checkedIcon: { type: 'Object' },
      indeterminateIcon: { type: 'Object' },
      classes: { type: 'String' },
      checkboxAriaLabel: { type: 'String', attribute: 'aria-label' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      controlled: { type: 'Boolean', reflect: true },
      checkboxAttributes: { type: 'Object' },
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
  import { dispatchEvents } from '../dispatch';
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import type { CheckboxProperties } from '$lib/Checkbox/properties';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';
  // The element renames `ariaLabel` to `checkboxAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement, and `attributes` to `checkboxAttributes` for the same reason -- with a sharper consequence.
  // `Element.prototype.attributes` is the live NamedNodeMap that Svelte's own generated `connectedCallback`
  // iterates (`for (const attr of this.attributes)`), so declaring a prop of that name did not merely shadow
  // the accessor -- it replaced it with a plain object, threw `TypeError: this.attributes is not iterable` on
  // connect, and left every `<sui-checkbox>` with an empty shadow root. There is no attribute spelling for it:
  // the value is an object, so it is set as a property.
  // The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    checkboxAriaLabel,
    checkboxAttributes,
    ...props
  }: Omit<CheckboxProperties, 'ariaLabel' | 'attributes'> & {
    checkboxAriaLabel?: CheckboxProperties['ariaLabel'];
    checkboxAttributes?: CheckboxProperties['attributes'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-checkbox:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `checkbox.onclick = fn` still runs `fn(checked)` exactly as before, but no
  // synthetic 'click' is ever dispatched (a real composed click already bubbles out
  // of the shadow root, and doubling it up is the exact hazard the collision rule
  // exists to prevent). Called anyway, on every wrapper, rather than special-cased
  // away: proves the collision guard produces this no-op instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Checkbox {...props} {...dispatchers} ariaLabel={checkboxAriaLabel} attributes={checkboxAttributes}>
  {#snippet checkedIcon()}
    <!-- Mirrors Checkbox.svelte's checkedIcon fallback:
         <span class="icon">{@html checkmarkSvg}</span> -->
    <slot name="checked-icon">
      <span class="icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html checkmarkSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet indeterminateIcon()}
    <!-- Mirrors Checkbox.svelte's indeterminateIcon fallback:
         <span class="icon dash">{@html minusSvg}</span> -->
    <slot name="indeterminate-icon">
      <span class="icon dash">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html minusSvg}
      </span>
    </slot>
  {/snippet}
</Checkbox>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-checkbox-display, inline-block);
  }
</style>
