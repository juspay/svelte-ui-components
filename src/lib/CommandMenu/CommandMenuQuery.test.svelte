<script lang="ts">
  import CommandMenu from './CommandMenu.svelte';
  import type { CommandItem } from './properties';

  let { onselect }: { onselect: (item: CommandItem) => void } = $props();
  let query = $state('');
  let items = $derived(
    query.trim() ? [{ label: `Ask: ${query}`, value: 'ask' }] : [{ label: 'Help', value: 'help' }]
  );
</script>

<CommandMenu open bind:query {items} {onselect} />
<output aria-label="Caller query">{query}</output>
