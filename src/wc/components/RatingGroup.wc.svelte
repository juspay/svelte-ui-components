<svelte:options
  customElement={{
    tag: 'sui-rating-group',
    shadow: 'open',
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
  import RatingGroup from '$lib/RatingGroup/RatingGroup.svelte';
  import type { RatingGroupProperties } from '$lib/RatingGroup/properties';
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
</script>

<RatingGroup {...props} ariaLabel={ratingGroupAriaLabel} />
