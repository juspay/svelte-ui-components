<svelte:options
  customElement={{
    tag: 'sui-progress',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Progress from '$lib/Progress/Progress.svelte';
  let props = $props();
</script>

<Progress {...props} />
