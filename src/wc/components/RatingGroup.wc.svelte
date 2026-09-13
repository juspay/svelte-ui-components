<svelte:options
  customElement={{
    tag: 'sui-rating-group',
    shadow: 'open',
    // `<sui-rating-group name="..." required>` declared both and submitted
    // nothing, because its radio inputs live in a shadow root the form cannot
    // reach. The default binding is right here: the submitted value is `value`,
    // and `required` is honoured, so an unrated required group now blocks submit
    // the way the Svelte build already did.
    extend: formAssociated({}),
    props: {
      value: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      readonly: { type: 'Boolean', reflect: true },
      allowHalf: { type: 'Boolean', reflect: true, attribute: 'allow-half' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      ratingGroupAriaLabel: { type: 'String', attribute: 'aria-label' },
      star: { type: 'Object' },
      name: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      form: { type: 'String', reflect: true },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import RatingGroup from '$lib/RatingGroup/RatingGroup.svelte';
  import type { RatingGroupProperties } from '$lib/RatingGroup/properties';
  import { dispatchEvents } from '../dispatch';
  // Renamed the same way Checkbox.wc.svelte and Slider.wc.svelte rename `ariaLabel`:
  // ARIAMixin already defines `ariaLabel` on every HTMLElement, so declaring the
  // component's own prop under that name would shadow the platform's accessor instead
  // of adding one. The attribute is unaffected -- `<sui-rating-group aria-label="...">`
  // still works, only the JavaScript property name differs.
  let {
    ratingGroupAriaLabel,
    ...props
  }: Omit<RatingGroupProperties, 'ariaLabel'> & {
    ratingGroupAriaLabel?: RatingGroupProperties['ariaLabel'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onchange accessor with no exception recorded for
  // 'sui-rating-group:onchange' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS --
  // so dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `ratingGroup.onchange = fn` still runs `fn(value)` exactly as before, but no
  // synthetic 'change' is ever dispatched. Called anyway, on every wrapper, rather
  // than special-cased away: proves the collision guard produces this no-op
  // instead of assuming it. The capture is safe and the warning does not apply to
  // this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<RatingGroup {...props} {...dispatchers} ariaLabel={ratingGroupAriaLabel} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-rating-group-display, block);
  }
</style>
