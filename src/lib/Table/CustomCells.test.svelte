<script lang="ts">
  import Table from './Table.svelte';
  import type { TableColumn, TableRow } from './properties';

  /**
   * Harness for the row-activation rules: a clickable row whose last column is
   * a caller-written `cell` snippet holding the four controls the pack names — a
   * button, a link, an editable input and a popup trigger — plus one control
   * that deliberately does NOT opt out, so "intentionally bubbling consumers
   * keep working" is measured rather than assumed.
   */
  let {
    onrowclick,
    onaction
  }: {
    onrowclick: (rowIndex: number, rowData: unknown[], originalIndex: number) => void;
    onaction: (action: string) => void;
  } = $props();

  const columns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'actions', label: 'Actions', type: 'custom', cell: actionsCell }
  ];

  const rows: TableRow[] = [
    { name: 'Alice', actions: null },
    { name: 'Bob', actions: null }
  ];
</script>

{#snippet actionsCell(row: TableRow)}
  <button
    type="button"
    data-row-activation="ignore"
    data-pw="cell-button"
    onclick={() => onaction(`button:${String(row.name)}`)}>Retry</button
  >
  <a href="#detail" data-row-activation="ignore" data-pw="cell-link">Details</a>
  <input data-row-activation="ignore" data-pw="cell-input" aria-label="Rename {String(row.name)}" />
  <span data-row-activation="ignore" data-pw="cell-popup">
    <button type="button" data-pw="cell-popup-trigger" onclick={() => onaction('popup')}>⋯</button>
  </span>
  <button type="button" data-pw="cell-bubbling" onclick={() => onaction('bubbling')}>Bubbles</button
  >
{/snippet}

<Table {columns} {rows} {onrowclick} testId="custom-cells" />
