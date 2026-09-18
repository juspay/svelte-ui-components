<svelte:options
  customElement={{
    tag: 'sui-animated-number',
    shadow: 'open',
    props: {
      // `number | string` cannot survive an HTML attribute round-trip as two
      // distinct things -- `Attr.value` is always a string, so the platform
      // gives no way to tag "this text is secretly numeric." `type: 'Object'`
      // is RelativeTime.wc.svelte's answer to the same shape of union
      // (`Date | string | number`), but its toProp conversion is
      // `JSON.parse(attributeValue)`, which throws on exactly the strings this
      // prop exists to accept: `JSON.parse('1,234')` and `JSON.parse('$99.99')`
      // both throw SyntaxError, so the two examples AnimatedNumber.svelte's own
      // properties.ts gives for the string branch -- a consumer's own
      // formatter, a pre-formatted StatCard.value -- would crash the element
      // the moment either arrived as an attribute. `type: 'Number'` fares no
      // better: `+'$99.99'` is `NaN`. Left as `'String'`, the attribute path
      // is honest about what it actually is -- a bare string -- and never
      // throws: AnimatedNumber.svelte's own `typeof value === 'number'` check
      // sees a string either way and takes the already-formatted text branch,
      // rolling the right glyphs with no locale-aware grouping added. The
      // JS-property setter is a different code path: Svelte only runs the
      // type conversion above for attribute-sourced values (see
      // get_custom_element_value in svelte/src/internal/client/dom/elements/
      // custom-element.js -- the property setter calls it with no `transform`
      // argument, which short-circuits to `return value` unchanged), so
      // `document.querySelector('sui-animated-number').value = 1234` still
      // arrives as a real `number` and gets full `Intl.NumberFormat`
      // treatment. Only the attribute spelling is string-only; the property
      // keeps the full union.
      value: { type: 'String' },
      locale: { type: 'String' },
      // `Intl.NumberFormatOptions` has no attribute encoding that would not
      // just be hand-written JSON risking the same throw as `value` above on
      // the next edit, so -- same as DeltaIndicator.wc.svelte's own `format`
      // and StatCard.wc.svelte's object-valued props -- this is JS-property
      // only:
      //   document.querySelector('sui-animated-number').format = { style: 'currency', currency: 'USD' };
      format: { type: 'Object' },
      live: { type: 'String' },
      // Renamed the same way Breadcrumb.wc.svelte, Menu.wc.svelte,
      // RatingGroup.wc.svelte and Checkbox.wc.svelte rename `ariaLabel`:
      // ARIAMixin already defines `ariaLabel` as an accessor on every
      // HTMLElement, so declaring the component's own prop under that name
      // would shadow the platform's accessor instead of adding one. The
      // attribute is unaffected -- `<sui-animated-number aria-label="...">`
      // still works, only the JavaScript property name moved.
      animatedNumberAriaLabel: { type: 'String', attribute: 'aria-label' },
      animateOnMount: { type: 'Boolean', attribute: 'animate-on-mount', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import AnimatedNumber from '$lib/AnimatedNumber/AnimatedNumber.svelte';
  import type { AnimatedNumberProperties } from '$lib/AnimatedNumber/properties';

  let {
    animatedNumberAriaLabel,
    ...props
  }: Omit<AnimatedNumberProperties, 'ariaLabel'> & {
    animatedNumberAriaLabel?: AnimatedNumberProperties['ariaLabel'];
  } = $props();
</script>

<AnimatedNumber {...props} ariaLabel={animatedNumberAriaLabel} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. Per
     DESIGN_PRINCIPLES.md section 2 the value matches this component's own root
     element, and AnimatedNumber.svelte's root is a `<span>` -- inline-level,
     not block -- so this is `inline-block`, not the `block` most wrappers here
     use for a `<div>` root. It is a token so a consumer can change it without
     reaching inside the shadow root -- which they could not do, since a
     stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-animated-number-display, inline-block);
  }
</style>
