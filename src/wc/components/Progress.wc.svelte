<svelte:options
  customElement={{
    tag: 'sui-progress',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true, attribute: 'show-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      segments: { type: 'Number', reflect: true }
    }
  }}
/>

<script lang="ts">
  import Progress from '$lib/Progress/Progress.svelte';
  let props = $props();
</script>

<Progress {...props} />
