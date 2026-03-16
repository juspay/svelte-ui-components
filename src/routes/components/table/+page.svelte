<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  import Pill from '$lib/Pill/Pill.svelte';

  let clickedRow = $state<string | null>(null);

  function handleRowClick(rowIndex: number, rowData: unknown[]) {
    clickedRow = `Row ${rowIndex}: ${rowData[0]}`;
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

<style>
  :global(.custom-cell-table) th:nth-child(1),
  :global(.custom-cell-table) td:nth-child(1) {
    width: 180px;
  }
  :global(.custom-cell-table) th:nth-child(2),
  :global(.custom-cell-table) td:nth-child(2) {
    width: 140px;
  }
  :global(.custom-cell-table) th:nth-child(3),
  :global(.custom-cell-table) td:nth-child(3) {
    width: 120px;
  }
  :global(.custom-cell-table) th:nth-child(4),
  :global(.custom-cell-table) td:nth-child(4) {
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
