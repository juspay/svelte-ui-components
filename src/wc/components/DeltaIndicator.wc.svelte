<svelte:options
  customElement={{
    tag: 'sui-delta-indicator',
    shadow: 'open',
    props: {
      value: { type: 'Number' },
      invertColors: { type: 'Boolean', attribute: 'invert-colors' },
      hideArrow: { type: 'Boolean', attribute: 'hide-arrow' },
      neutralThreshold: { type: 'Number', attribute: 'neutral-threshold' },
      format: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import DeltaIndicator from '$lib/DeltaIndicator/DeltaIndicator.svelte';
  let props = $props();
</script>

<DeltaIndicator {...props} />
