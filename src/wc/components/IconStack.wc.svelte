<svelte:options
  customElement={{
    tag: 'sui-icon-stack',
    shadow: 'open',
    props: {
      icons: { type: 'Object' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import IconStack from '$lib/IconStack/IconStack.svelte';
  let props = $props();
</script>

<IconStack {...props} />
