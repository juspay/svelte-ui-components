<svelte:options
  customElement={{
    tag: 'sui-relative-time',
    shadow: 'open',
    props: {
      date: { type: 'Object' },
      locale: { type: 'String', reflect: true },
      format: { type: 'String', reflect: true },
      updateInterval: { type: 'Number', reflect: true },
      tooltip: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import RelativeTime from '$lib/RelativeTime/RelativeTime.svelte';
  let props = $props();
</script>

<RelativeTime {...props} />
