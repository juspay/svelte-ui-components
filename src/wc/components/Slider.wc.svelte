<svelte:options
  customElement={{
    tag: 'sui-slider',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      min: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      step: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showValue: { type: 'Boolean', reflect: true, attribute: 'show-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      oninput: { type: 'Object' },
      onchange: { type: 'Object' },
      labelFormatter: { type: 'Object' },
      sliderAriaLabel: { type: 'String', attribute: 'aria-label' }
    }
  }}
/>

<script lang="ts">
  import Slider from '$lib/Slider/Slider.svelte';
  import type { SliderProperties } from '$lib/Slider/properties';
  // The element renames `ariaLabel` to `sliderAriaLabel` because the platform already
  // defines `ariaLabel` on every HTMLElement; the attribute stays `aria-label`.
  let {
    sliderAriaLabel,
    ...props
  }: Omit<SliderProperties, 'ariaLabel'> & {
    sliderAriaLabel?: SliderProperties['ariaLabel'];
  } = $props();
</script>

<Slider {...props} ariaLabel={sliderAriaLabel} />
