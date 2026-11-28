<script lang="ts">
  import TableCore from './TableCore.svelte';
  import type { PlainTableProperties } from './properties';

  let props: PlainTableProperties = $props();
</script>

<TableCore {...props} />
