<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  import Pill from '$lib/Pill/Pill.svelte';
  import type { JSONValue } from 'type-decoder';

  let clickedRow = $state<string | null>(null);
  let currentPage = $state(1);
  const totalPages = 3;
  let lastCellTestId = $state<string | null>(null);

  function handleRowClick(rowIndex: number, rowData: unknown[]) {
    clickedRow = `Row ${rowIndex}: ${rowData[0]}`;
  }

  function getRowTestId(row: JSONValue[], rowIndex: number): string {
    return `row-${rowIndex}`;
  }

  function getCellTestId(row: JSONValue[], _cell: JSONValue, rowIndex: number): string {
    return `cell-${rowIndex}-${String(row[0]).toLowerCase().replace(/\s+/g, '-')}`;
  }

  const statusClasses: Record<string, string> = {
    Active: 'pill-success',
    Pending: 'pill-warning',
    Inactive: 'pill-error',
    Review: 'pill-info'
  };

  const scrollableData: Array<[string, string, number, string]> = [
    ['Alice Johnson', 'Engineering', 94, 'Active'],
    ['Bob Smith', 'Design', 78, 'Pending'],
    ['Carol White', 'Marketing', 65, 'Inactive'],
    ['Dan Brown', 'Engineering', 88, 'Review'],
    ['Eve Davis', 'Sales', 92, 'Active'],
    ['Frank Miller', 'Engineering', 71, 'Pending'],
    ['Grace Lee', 'Marketing', 85, 'Active'],
    ['Hank Wilson', 'Design', 69, 'Inactive'],
    ['Ivy Chen', 'Sales', 91, 'Active'],
    ['Jack Taylor', 'Engineering', 76, 'Review']
  ];

  // ── Checkbox selection demos ─────────────────────────────────────────────────
  let multipleSelectedIds = $state<Set<string>>(new Set());
  let singleSelectedId = $state<string | null>(null);

  const employeeData: Array<[string, string, string]> = [
    ['Alice Johnson', 'Engineering', 'Staff Engineer'],
    ['Bob Smith', 'Design', 'Product Designer'],
    ['Carol White', 'Marketing', 'Growth Lead'],
    ['Dan Brown', 'Engineering', 'Senior Engineer'],
    ['Eve Davis', 'Sales', 'Account Executive']
  ];

  // ── Search demos ─────────────────────────────────────────────────────────────
  let serverSearchTerm = $state('');

  // Simulate server-side rows reacting to the search term
  const allProductRows: Array<[string, string, string]> = [
    ['MacBook Pro 16"', 'Laptops', '$3,499'],
    ['MacBook Air M3', 'Laptops', '$1,299'],
    ['iPhone 15 Pro', 'Phones', '$999'],
    ['iPhone 15', 'Phones', '$799'],
    ['iPad Pro 13"', 'Tablets', '$1,099'],
    ['AirPods Pro 2', 'Audio', '$249'],
    ['Apple Watch S9', 'Wearables', '$399']
  ];

  let serverFilteredRows = $derived(
    serverSearchTerm.trim() === ''
      ? allProductRows
      : allProductRows.filter((row) =>
          row.some((cell) => cell.toLowerCase().includes(serverSearchTerm.trim().toLowerCase()))
        )
  );

  // ── onCellChange wiring demo ─────────────────────────────────────────────────
  let editableRows = $state<Array<[string, string]>>([
    ['Alice Johnson', 'Engineering'],
    ['Bob Smith', 'Design'],
    ['Carol White', 'Marketing']
  ]);

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: JSONValue): void => {
    editableRows = editableRows.map((row, idx) => {
      if (idx !== rowIndex) {
        return row;
      }
      const nextRow: [string, string] = [row[0], row[1]];
      nextRow[colIndex] = String(newValue ?? '');
      return nextRow;
    });
  };
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Table</h1>
</div>

<!-- Basic Table -->
<h3>Basic</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableTitle="Users"
    tableHeaders={['Name', 'Email', 'Role']}
    tableData={[
      ['Alice Johnson', 'alice@example.com', 'Admin'],
      ['Bob Smith', 'bob@example.com', 'Editor'],
      ['Carol White', 'carol@example.com', 'Viewer']
    ]}
  />
</div>

<!-- Custom Cells with Pill Classes -->
<h3>Custom Cell Rendering</h3>
<div class="demo-row" style="max-width: 700px;">
  <Table
    tableHeaders={['Name', 'Department', 'Status', 'Score']}
    tableData={[
      ['Alice Johnson', 'Engineering', 'Active', 94],
      ['Bob Smith', 'Design', 'Pending', 78],
      ['Carol White', 'Marketing', 'Inactive', 65],
      ['Dan Brown', 'Engineering', 'Review', 88]
    ]}
    classes="custom-cell-table"
    sortableColumns={[0, 3]}
    --table-row-hover-background="#f8fafc"
    --table-header-text-transform="uppercase"
    --table-header-font-size="12px"
  >
    {#snippet cell(value, _rowIndex, colIndex)}
      {#if colIndex === 2 && typeof value === 'string'}
        <Pill text={value} classes={statusClasses[value] ?? ''} />
      {:else if colIndex === 3 && typeof value === 'number'}
        <strong style="color: {value >= 80 ? '#16a34a' : '#dc2626'}">{value}</strong>
      {:else}
        {value}
      {/if}
    {/snippet}
  </Table>
</div>

<!-- Row Click -->
<h3>Row Click</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableHeaders={['Product', 'Category', 'Price']}
    tableData={[
      ['MacBook Pro', 'Laptop', '$2,499'],
      ['iPhone 15', 'Phone', '$999'],
      ['AirPods Pro', 'Audio', '$249']
    ]}
    onRowClick={handleRowClick}
    --table-row-hover-background="#f0f9ff"
  />
  {#if clickedRow}
    <p style="margin-top: 8px; color: #64748b; font-size: 14px;">Clicked: {clickedRow}</p>
  {/if}
</div>

<!-- Sticky Header -->
<h3>Sticky Header</h3>
<div class="demo-row" style="max-width: 700px;">
  <Table
    tableHeaders={['Name', 'Department', 'Score', 'Status']}
    tableData={scrollableData}
    stickyHeader
    isTableScrollable
    --table-container-height="260px"
    --table-row-hover-background="#f9fafb"
  />
</div>

<!-- Custom Sort Icons -->
<h3>Custom Sort Icons</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableHeaders={['City', 'Population', 'Area (km\u00B2)']}
    tableData={[
      ['Tokyo', 13960000, 2194],
      ['Delhi', 11030000, 1484],
      ['Shanghai', 24870000, 6341],
      ['Mumbai', 12440000, 603]
    ]}
    --table-row-border="1px solid #f0f0f0"
    --table-header-background="#fafafa"
  >
    {#snippet sortAscIcon()}<span style="font-size: 12px;">↑</span>{/snippet}
    {#snippet sortDescIcon()}<span style="font-size: 12px;">↓</span>{/snippet}
    {#snippet sortDefaultIcon()}<span style="font-size: 12px; opacity: 0.3;">↕</span>{/snippet}
  </Table>
</div>

<!-- Empty State -->
<h3>Empty State</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table tableHeaders={['Name', 'Email', 'Role']} tableData={[]}>
    {#snippet empty()}
      <div style="padding: 16px; color: #94a3b8;">
        <p style="font-size: 16px; margin: 0 0 4px 0;">No data found</p>
        <p style="font-size: 13px; margin: 0;">Try adjusting your search or filters.</p>
      </div>
    {/snippet}
  </Table>
</div>

<!-- Paginator Slot -->
<h3>Paginator Slot</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableHeaders={['Name', 'Department', 'Role']}
    tableData={[
      ['Alice Johnson', 'Engineering', 'Staff Engineer'],
      ['Bob Smith', 'Design', 'Product Designer'],
      ['Carol White', 'Marketing', 'Growth Lead']
    ]}
    --table-footer-background="#f9fafb"
  >
    {#snippet paginatorSlot()}
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
        <button
          onclick={() => {
            if (currentPage > 1) {
              currentPage -= 1;
            }
          }}
          disabled={currentPage === 1}
          style="padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; background: white;"
          >‹ Prev</button
        >
        <span style="color: #6b7280;">Page {currentPage} of {totalPages}</span>
        <button
          onclick={() => {
            if (currentPage < totalPages) {
              currentPage += 1;
            }
          }}
          disabled={currentPage === totalPages}
          style="padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; background: white;"
          >Next ›</button
        >
      </div>
    {/snippet}
  </Table>
</div>

<!-- Row & Cell Test IDs -->
<h3>Row & Cell Test IDs</h3>
<div class="demo-row" style="max-width: 600px; flex-direction: column; gap: 8px;">
  <Table
    tableHeaders={['Name', 'Score', 'Status']}
    tableData={[
      ['Alice Johnson', 94, 'Active'],
      ['Bob Smith', 78, 'Pending'],
      ['Carol White', 65, 'Inactive']
    ]}
    {getRowTestId}
    {getCellTestId}
    onRowClick={(rowIndex, rowData) => {
      lastCellTestId = getCellTestId(rowData, rowData[0], rowIndex);
    }}
    --table-row-hover-background="#f0f9ff"
  />
  {#if lastCellTestId}
    <p class="state-display">Last clicked row data-pw prefix: {lastCellTestId}</p>
  {/if}
</div>

<!-- Checkbox Selection — Multiple Mode -->
<h3>Checkbox Selection (multiple)</h3>
<div class="demo-row" style="max-width: 700px; flex-direction: column; gap: 8px;">
  <Table
    tableHeaders={['Name', 'Department', 'Role']}
    tableData={employeeData}
    checkboxSelection={{
      selectionMode: 'multiple',
      getRowId: (_row, rowIndex) => `emp-${rowIndex}`,
      disabledRowIds: new Set(['emp-2']),
      onSelectionChange: (ids) => {
        multipleSelectedIds = ids;
      }
    }}
    --table-row-selected-background="#eff6ff"
  />
  {#if multipleSelectedIds.size > 0}
    <p class="state-display">
      Selected IDs: {[...multipleSelectedIds].join(', ')}
    </p>
  {/if}
</div>

<!-- Checkbox Selection — Single Mode -->
<h3>Checkbox Selection (single)</h3>
<div class="demo-row" style="max-width: 700px; flex-direction: column; gap: 8px;">
  <Table
    tableHeaders={['Name', 'Department', 'Role']}
    tableData={employeeData}
    checkboxSelection={{
      selectionMode: 'single',
      getRowId: (_row, rowIndex) => `single-emp-${rowIndex}`,
      onSelectionChange: (ids) => {
        singleSelectedId = ids.size > 0 ? [...ids][0] : null;
      }
    }}
    --table-row-selected-background="#f0fdf4"
    --table-checkbox-checked-background="#16a34a"
    --table-checkbox-checked-border-color="#16a34a"
  />
  {#if singleSelectedId}
    <p class="state-display">Selected: {singleSelectedId}</p>
  {/if}
</div>

<!-- Search — Client-Side Filtering -->
<h3>Search (client-side filtering)</h3>
<div class="demo-row" style="max-width: 700px;">
  <Table
    tableHeaders={['Name', 'Department', 'Score', 'Status']}
    tableData={[
      ['Alice Johnson', 'Engineering', 94, 'Active'],
      ['Bob Smith', 'Design', 78, 'Pending'],
      ['Carol White', 'Marketing', 65, 'Inactive'],
      ['Dan Brown', 'Engineering', 88, 'Review'],
      ['Eve Davis', 'Sales', 92, 'Active'],
      ['Frank Miller', 'Engineering', 71, 'Pending']
    ]}
    searchConfig={{
      placeholder: 'Search employees…',
      searchableColumnIndices: [0, 1, 3],
      testId: 'employee-search'
    }}
    --table-row-hover-background="#f9fafb"
  >
    {#snippet cell(value, _rowIndex, colIndex)}
      {#if colIndex === 3 && typeof value === 'string'}
        <Pill text={value} classes={statusClasses[value] ?? ''} />
      {:else}
        {value}
      {/if}
    {/snippet}
  </Table>
</div>

<!-- Search — Server-Side Delegation -->
<h3>Search (server-side delegation via onSearchChange)</h3>
<div class="demo-row" style="max-width: 700px; flex-direction: column; gap: 8px;">
  <Table
    tableHeaders={['Product', 'Category', 'Price']}
    tableData={serverFilteredRows}
    searchConfig={{ placeholder: 'Search products…', testId: 'product-search' }}
    onSearchChange={(term) => {
      serverSearchTerm = term;
    }}
    --table-row-hover-background="#f9fafb"
  />
  <p class="state-display">
    Showing {serverFilteredRows.length} of {allProductRows.length} products
    {serverSearchTerm ? `— filtered by "${serverSearchTerm}"` : ''}
  </p>
</div>

<!-- onCellChange Wiring Pattern -->
<h3>Editable Cells (onCellChange pattern)</h3>
<p style="color: #6b7280; margin: 0 0 8px 0;">
  Table does not forward <code>onCellChange</code> internally — wire your handler directly inside
  the <code>cell</code> snippet, which runs in consumer scope.
</p>
<div class="demo-row" style="max-width: 600px; flex-direction: column; gap: 8px;">
  <Table
    tableHeaders={['Name', 'Department']}
    tableData={editableRows}
    onCellChange={handleCellChange}
  >
    {#snippet cell(value, rowIndex, colIndex)}
      <!-- The snippet runs in consumer scope — handleCellChange is already in closure -->
      <input
        type="text"
        value={String(value ?? '')}
        oninput={(inputEvent) => {
          if (inputEvent.target instanceof HTMLInputElement) {
            handleCellChange(rowIndex, colIndex, inputEvent.target.value);
          }
        }}
        style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 8px; width: 100%; background: transparent;"
      />
    {/snippet}
  </Table>
  <div style="margin-top: 4px;">
    <p class="state-display">Live data: {JSON.stringify(editableRows)}</p>
  </div>
</div>

<style>
  :global(.custom-cell-table th:nth-child(1)),
  :global(.custom-cell-table td:nth-child(1)) {
    width: 180px;
  }
  :global(.custom-cell-table th:nth-child(2)),
  :global(.custom-cell-table td:nth-child(2)) {
    width: 140px;
  }
  :global(.custom-cell-table th:nth-child(3)),
  :global(.custom-cell-table td:nth-child(3)) {
    width: 120px;
  }
  :global(.custom-cell-table th:nth-child(4)),
  :global(.custom-cell-table td:nth-child(4)) {
    width: 80px;
  }

  :global(.pill-success) {
    --pill-background: #d4edda;
    --pill-color: #155724;
    --pill-hover-background: #c3e6cb;
  }

  :global(.pill-warning) {
    --pill-background: #fff3cd;
    --pill-color: #856404;
    --pill-hover-background: #ffeeba;
  }

  :global(.pill-error) {
    --pill-background: #f8d7da;
    --pill-color: #721c24;
    --pill-hover-background: #f1b0b7;
  }

  :global(.pill-info) {
    --pill-background: #d1ecf1;
    --pill-color: #0c5460;
    --pill-hover-background: #bee5eb;
  }
</style>
