<svelte:options
  customElement={{
    tag: 'sui-command-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      placeholder: { type: 'String', reflect: true },
      emptyText: { type: 'String', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';
  let props = $props();
</script>

<CommandMenu {...props} />
