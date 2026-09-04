<svelte:options
  customElement={{
    tag: 'sui-command-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      placeholder: { type: 'String', reflect: true },
      emptyText: { type: 'String', reflect: true, attribute: 'empty-text' },
      testId: { type: 'String', attribute: 'test-id' },
      searchIcon: { type: 'Object' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onclose: { type: 'Object' },
      itemIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';
  let props = $props();
</script>

<CommandMenu {...props}>
  {#snippet searchIcon()}
    <slot name="search-icon"></slot>
  {/snippet}
</CommandMenu>
