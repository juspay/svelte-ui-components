<svelte:options
  customElement={{
    tag: 'sui-loader',
    shadow: 'open',
    props: {
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Loader from '$lib/Loader/Loader.svelte';
  let props = $props();
</script>

<Loader {...props} />
