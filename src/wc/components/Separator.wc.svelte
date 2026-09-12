<svelte:options
  customElement={{
    tag: 'sui-separator',
    shadow: 'open',
    props: {
      orientation: { type: 'String', reflect: true },
      decorative: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Separator from '$lib/Separator/Separator.svelte';
  let props = $props();
</script>

<Separator {...props} />
