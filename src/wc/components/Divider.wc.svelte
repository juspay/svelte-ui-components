<svelte:options
  customElement={{
    tag: 'sui-divider',
    shadow: 'open',
    props: {
      orientation: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Divider from '$lib/Divider/Divider.svelte';
  let props = $props();
</script>

<Divider {...props} />
