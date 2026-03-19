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
      showValue: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      oninput: { type: 'Object' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Slider from '$lib/Slider/Slider.svelte';
  let props = $props();
</script>

<Slider {...props} />
