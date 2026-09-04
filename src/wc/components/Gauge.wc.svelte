<svelte:options
  customElement={{
    tag: 'sui-gauge',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true, attribute: 'show-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      max: { type: 'Number', attribute: 'max' },
      labelFormatter: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Gauge from '$lib/Gauge/Gauge.svelte';
  let props = $props();
</script>

<Gauge {...props} />
