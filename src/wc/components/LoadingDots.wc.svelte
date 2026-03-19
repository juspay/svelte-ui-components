<svelte:options
  customElement={{
    tag: 'sui-loading-dots',
    shadow: 'open',
    props: {
      size: { type: 'String', reflect: true },
      animation: { type: 'String', reflect: true },
      duration: { type: 'Number', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import LoadingDots from '$lib/LoadingDots/LoadingDots.svelte';
  let props = $props();
</script>

<LoadingDots {...props} />
