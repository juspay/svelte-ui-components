<svelte:options
  customElement={{
    tag: 'sui-shimmer',
    shadow: 'open',
    props: {
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Shimmer from '$lib/Shimmer/Shimmer.svelte';
  let props = $props();
</script>

<Shimmer {...props} />
