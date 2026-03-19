<svelte:options
  customElement={{
    tag: 'sui-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      position: { type: 'String', reflect: true },
      maxHeight: { type: 'String', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Menu from '$lib/Menu/Menu.svelte';
  let props = $props();
</script>

<Menu {...props}>
  {#snippet trigger()}
    <slot name="trigger"></slot>
  {/snippet}
</Menu>
