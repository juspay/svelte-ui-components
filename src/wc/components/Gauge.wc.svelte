<svelte:options
  customElement={{
    tag: 'sui-gauge',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Gauge from '$lib/Gauge/Gauge.svelte';
  let props = $props();
</script>

<Gauge {...props} />
