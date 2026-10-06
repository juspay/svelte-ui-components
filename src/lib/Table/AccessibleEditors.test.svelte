<script lang="ts">
  import Table from './Table.svelte';

  let { onedit }: { onedit?: (originalIndex: number, colIndex: number, value: string) => void } =
    $props();
  let rows = $state([
    ['Zoe', 'Operations'],
    ['Amy', 'Engineering']
  ]);
  const headers = ['Name', 'Department'];
  const save = (originalIndex: number, colIndex: number, value: string) => {
    rows = rows.map((row, index) =>
      index === originalIndex
        ? row.map((cell, column) => (column === colIndex ? value : cell))
        : row
    );
    onedit?.(originalIndex, colIndex, value);
  };
</script>

<form>
  <Table tableHeaders={headers} tableData={rows}>
    {#snippet cell(value, rowIndex, colIndex, originalIndex)}
      {@const sourceIndex = originalIndex ?? rowIndex}
      {#if colIndex === 1}
        <textarea
          aria-label="{headers[colIndex]} for employee {sourceIndex + 1}"
          name="employee-{sourceIndex + 1}-{colIndex}"
          value={String(value ?? '')}
          oninput={(event) => save(sourceIndex, colIndex, event.currentTarget.value)}
        ></textarea>
      {:else}
        <input
          aria-label="{headers[colIndex]} for employee {sourceIndex + 1}"
          name="employee-{sourceIndex + 1}-{colIndex}"
          value={String(value ?? '')}
          oninput={(event) => save(sourceIndex, colIndex, event.currentTarget.value)}
        />
      {/if}
    {/snippet}
  </Table>
  <output data-pw="saved-editors">{JSON.stringify(rows)}</output>
</form>
