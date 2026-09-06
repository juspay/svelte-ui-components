<svelte:options
  customElement={{
    tag: 'sui-context-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      maxHeight: { type: 'String', reflect: true, attribute: 'max-height' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ContextMenu from '$lib/ContextMenu/ContextMenu.svelte';
  let props = $props();
</script>

<ContextMenu {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</ContextMenu>
