<svelte:options
  customElement={{
    tag: 'sui-relative-time',
    shadow: 'open',
    props: {
      date: { type: 'Object' },
      locale: { type: 'String', reflect: true },
      interval: { type: 'Number', reflect: true },
      showTooltip: { type: 'Boolean', reflect: true },
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
