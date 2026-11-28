<script lang="ts">
  import BuiltinCell from './BuiltinCell.svelte';
  import TableCore from './TableCore.svelte';
  import type { TableProperties } from './properties';

  let props: TableProperties = $props();
</script>

<TableCore {...props} builtinCell={BuiltinCell} />
