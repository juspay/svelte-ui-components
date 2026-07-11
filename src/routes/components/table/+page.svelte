<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  import Pill from '$lib/Pill/Pill.svelte';
  import Button from '$lib/Button/Button.svelte';
  import type { JSONValue } from 'type-decoder';
  import type { TableColumn, TableRow } from '$lib/Table/properties';

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

  // ── Keyed column model demos ─────────────────────────────────────────────────
  const keyedColumns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role' }
  ];

  const keyedRows: TableRow[] = [
    { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
    { name: 'Carol White', email: 'carol@example.com', role: 'Viewer' }
  ];

  const featureColumns: TableColumn[] = [
    { id: 'name', label: 'Name', testId: 'keyed-header-name' },
    { id: 'department', label: 'Department', sortable: false },
    { id: 'status', label: 'Status', type: 'custom', cell: keyedStatusCell }
  ];

  const featureRows: TableRow[] = [
    { name: 'Alice Johnson', department: 'Engineering', status: 'Active' },
    { name: 'Bob Smith', department: 'Design', status: 'Pending' },
    { name: 'Carol White', status: 'Inactive' }
  ];

  // ── Built-in cell renderers demo ─────────────────────────────────────────────
  let toggledRow = $state<string | null>(null);

  const builtinColumns: TableColumn[] = [
    { id: 'plan', label: 'Plan', type: 'two-line-text' },
    { id: 'state', label: 'State', type: 'tag' },
    { id: 'channels', label: 'Channels', type: 'tag-array' },
    { id: 'owners', label: 'Owners', type: 'avatar-stack' },
    { id: 'revenue', label: 'Revenue', type: 'compare', align: 'right', highlighted: true },
    {
      id: 'active',
      label: 'Active',
      type: 'toggle',
      sortable: false,
      onToggle: (rowIndex, checked) => {
        toggledRow = `row ${rowIndex} → ${checked}`;
      }
    },
    { id: 'docs', label: 'Docs', type: 'link', sortable: false, testId: 'builtin-docs' }
  ];

  const builtinRows: TableRow[] = [
    {
      plan: { text1: 'Growth Monthly', text2: 'PLN-0042' },
      state: { text: 'Active', classes: 'pill-success' },
      channels: [
        { text: 'Web', classes: 'pill-info' },
        { text: 'App', classes: 'pill-info' }
      ],
      owners: {
        items: [
          { id: 'u1', label: 'alice' },
          { id: 'u2', label: 'bob' }
        ]
      },
      revenue: { primary: '₹4,938.10', comparison: '₹4,100.00', trendPercent: 20 },
      active: { checked: true, ariaLabel: 'Toggle Growth Monthly', testId: 'builtin-toggle-0' },
      docs: { url: 'https://example.com/plans/42', label: 'plans/42' }
    },
    {
      plan: { text1: 'Starter Annual', text2: 'PLN-0007' },
      state: { text: 'Paused', classes: 'pill-warning' },
      channels: [{ text: 'Web', classes: 'pill-info' }],
      owners: {
        items: [
          { id: 'u1', label: 'carol' },
          { id: 'u2', label: 'dan' },
          { id: 'u3', label: 'eve' },
          { id: 'u4', label: 'frank' },
          { id: 'u5', label: 'grace' },
          { id: 'u6', label: 'hank' }
        ]
      },
      revenue: { primary: '₹1,200.00', comparison: '₹1,500.00', trendPercent: -20 },
      active: { checked: false, ariaLabel: 'Toggle Starter Annual', testId: 'builtin-toggle-1' },
      docs: { url: 'https://example.com/plans/7', copyable: false }
    },
    {
      plan: { text1: 'Legacy', text2: 'PLN-0001' },
      state: { text: 'Expired', classes: 'pill-error' },
      channels: [],
      owners: { items: [] },
      revenue: 'n/a',
      active: { checked: false },
      docs: null
    }
  ];

  // ── Interactive cell renderers demo ──────────────────────────────────────────
  let interactiveLog = $state('none');
  let rowClickLog = $state('none');

  const demoDotIcon =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><circle cx='8' cy='8' r='8' fill='%2394a3b8'/></svg>";

  const interactiveColumns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    {
      id: 'tier',
      label: 'Tier',
      type: 'select',
      sortable: false,
      onSelect: (rowIndex, selectedId) => {
        interactiveLog = `select r${rowIndex} → ${selectedId}`;
      }
    },
    {
      id: 'note',
      label: 'Note',
      type: 'input',
      sortable: false,
      onInput: (rowIndex, newValue) => {
        interactiveLog = `input r${rowIndex} → ${newValue}`;
      }
    },
    {
      id: 'action',
      label: 'Action',
      type: 'button',
      sortable: false,
      onButtonClick: (rowIndex) => {
        interactiveLog = `button r${rowIndex}`;
      }
    },
    {
      id: 'manage',
      label: 'Manage',
      type: 'action-group',
      sortable: false,
      testId: 'demo-manage',
      onPrimaryAction: (rowIndex) => {
        interactiveLog = `primary r${rowIndex}`;
      },
      onMenuAction: (rowIndex, itemId) => {
        interactiveLog = `menu r${rowIndex} → ${itemId}`;
      }
    },
    {
      id: 'more',
      label: 'More',
      type: 'popup-menu',
      sortable: false,
      testId: 'demo-more',
      onMenuAction: (rowIndex, itemId) => {
        interactiveLog = `popup r${rowIndex} → ${itemId}`;
      }
    }
  ];

  const interactiveRows: TableRow[] = [
    {
      name: 'Growth Monthly',
      tier: {
        options: [
          { id: 'basic', label: 'Basic' },
          { id: 'pro', label: 'Pro' }
        ],
        selectedId: 'pro',
        testId: 'demo-tier-0',
        itemTestId: 'demo-tier-option'
      },
      note: { value: 'renews in June', testId: 'demo-note-0' },
      action: { text: 'Renew', testId: 'demo-renew-0' },
      manage: {
        primaryButton: { text: 'Edit', testId: 'demo-edit-0' },
        menuItems: [
          { id: 'duplicate', label: 'Duplicate' },
          { id: 'delete', label: 'Delete', danger: true }
        ]
      },
      more: { items: [{ id: 'archive', label: 'Archive' }] }
    },
    {
      name: 'Starter Annual',
      tier: {
        options: [
          { id: 'basic', label: 'Basic' },
          { id: 'pro', label: 'Pro' }
        ],
        selectedId: 'basic',
        testId: 'demo-tier-1'
      },
      note: {
        value: '',
        placeholder: 'Add note',
        testId: 'demo-note-1',
        validationPattern: '^\\d+$',
        onErrorMessage: 'Digits only',
        ariaLabel: 'Note for Starter Annual',
        iconUrl: demoDotIcon
      },
      action: { text: 'Renew', disabled: true, testId: 'demo-renew-1' },
      manage: { menuItems: [{ id: 'delete', label: 'Delete', danger: true }] },
      more: { items: [{ id: 'archive', label: 'Archive' }] }
    }
  ];

  // ── Header metadata + getSortValue demo ──────────────────────────────────────
  let metaFilterValue = $state<string | null>(null);

  const metaRowsAll: TableRow[] = [
    {
      id: 'ORD-9f3k2m8x7c1v5b9n4q6w2e',
      name: 'alice',
      amount: '₹4,938.10',
      status: 'Active'
    },
    { id: 'ORD-2', name: 'Bob', amount: '₹19,752.40', status: 'Paused' },
    { id: 'ORD-3', name: 'carol', amount: '₹1,200.00', status: 'Active' }
  ];

  let metaRows = $derived(
    metaFilterValue === null
      ? metaRowsAll
      : metaRowsAll.filter((row) => String(row.status).toLowerCase() === metaFilterValue)
  );

  let metaColumns = $derived<TableColumn[]>([
    { id: 'id', label: 'Order', maxWidth: '120px', testId: 'meta-id' },
    { id: 'name', label: 'Name', tooltip: 'Customer display name', testId: 'meta-name' },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      testId: 'meta-amount',
      getSortValue: (row) => Number(String(row.amount).replace(/[₹,]/g, ''))
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      testId: 'meta-status',
      filter: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' }
        ],
        selectedValue: metaFilterValue,
        onFilterChange: (newValue) => {
          metaFilterValue = newValue;
        }
      }
    }
  ]);

  // ── Server-mode sort demo ────────────────────────────────────────────────────
  let serverSortLog = $state('none');
  let serverRows = $state<TableRow[]>([
    { name: 'Gamma', score: 30 },
    { name: 'Alpha', score: 10 },
    { name: 'Beta', score: 20 }
  ]);

  const serverColumns: TableColumn[] = [
    { id: 'name', label: 'Name', sortable: false },
    { id: 'score', label: 'Score' }
  ];

  const handleServerSort = (colIndex: number, direction: 'asc' | 'desc'): void => {
    serverSortLog = `col ${colIndex} ${direction}`;
    serverRows = [...serverRows].sort(
      (rowA, rowB) => (Number(rowA.score) - Number(rowB.score)) * (direction === 'asc' ? 1 : -1)
    );
  };

  // ── Built-in pagination + row numbers demo ───────────────────────────────────
  const pagedColumns: TableColumn[] = [
    { id: 'item', label: 'Item' },
    { id: 'qty', label: 'Qty', align: 'right' }
  ];

  const pagedRows: TableRow[] = Array.from({ length: 23 }, (_, index) => ({
    item: `Item ${String(index + 1).padStart(2, '0')}`,
    qty: (index * 3) % 17
  }));

  // ── Controlled selection + toolbar demo ──────────────────────────────────────
  let controlledSelection = $state<Set<string>>(new Set());
  let lastBulkAction = $state('none');

  const selectionColumns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'team', label: 'Team' }
  ];

  const selectionRows: TableRow[] = [
    { name: 'Alice', team: 'Engineering' },
    { name: 'Bob', team: 'Design' },
    { name: 'Carol', team: 'Marketing' },
    { name: 'Dan', team: 'Sales' }
  ];

  // ── Page-scoped select-all demo (client pagination + checkboxes) ────────────
  let pagedSelectionLog = $state('empty');

  const pagedSelectColumns: TableColumn[] = [{ id: 'member', label: 'Member' }];

  const pagedSelectRows: TableRow[] = Array.from({ length: 7 }, (_, index) => ({
    member: `Member ${index + 1}`
  }));

  // ── Media cell renderers demo (icon-label, image-two-line-text) ─────────────
  const mediaColumns: TableColumn[] = [
    { id: 'gateway', label: 'Gateway', type: 'icon-label', sortable: false },
    { id: 'product', label: 'Product', type: 'image-two-line-text', sortable: false }
  ];

  const mediaRows: TableRow[] = [
    {
      gateway: { icons: [demoDotIcon, demoDotIcon], label: 'UPI + Card' },
      product: { imageUrl: demoDotIcon, text1: 'Silk Kurta', text2: 'SKU-1042' }
    },
    {
      gateway: { label: 'NetBanking' },
      product: { text1: 'Cotton Saree', text2: 'SKU-2088' }
    }
  ];

  // ── Server-mode pagination demo ──────────────────────────────────────────────
  const SERVER_PAGE_SIZE = 5;
  const SERVER_TOTAL_RECORDS = 12;
  let serverPageNumber = $state(1);

  const serverPagedColumns: TableColumn[] = [{ id: 'record', label: 'Record', sortable: false }];

  const serverPagedRows = $derived(
    Array.from(
      {
        length: Math.min(
          SERVER_PAGE_SIZE,
          SERVER_TOTAL_RECORDS - (serverPageNumber - 1) * SERVER_PAGE_SIZE
        )
      },
      (_, index) => ({
        record: `Record ${String((serverPageNumber - 1) * SERVER_PAGE_SIZE + index + 1).padStart(2, '0')}`
      })
    )
  );
</script>

{#snippet bulkToolbar({ selectedIds }: { selectedIds: Set<string> })}
  <span data-pw="bulk-count">{selectedIds.size} selected</span>
  <Button
    text="Delete"
    testId="bulk-delete"
    onclick={() => {
      lastBulkAction = `deleted ${[...selectedIds].sort().join(',')}`;
      controlledSelection = new Set();
    }}
  />
{/snippet}

{#snippet keyedStatusCell(row: TableRow, _rowIndex: number)}
  <Pill text={String(row.status)} classes={statusClasses[String(row.status)] ?? ''} />
{/snippet}

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

<!-- Keyed column model: keyed table + positional twin rendering identical data -->
<h3>Keyed Columns</h3>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableTitle="Users (keyed)"
    columns={keyedColumns}
    rows={keyedRows}
    testId="table-keyed-basic"
  />
</div>
<div class="demo-row" style="max-width: 600px;">
  <Table
    tableTitle="Users (positional twin)"
    tableHeaders={['Name', 'Email', 'Role']}
    tableData={[
      ['Alice Johnson', 'alice@example.com', 'Admin'],
      ['Bob Smith', 'bob@example.com', 'Editor'],
      ['Carol White', 'carol@example.com', 'Viewer']
    ]}
    testId="table-positional-twin"
  />
</div>

<!-- Keyed column features: per-column sortable opt-out, custom cell snippet, missing keys -->
<h3>Keyed Columns — per-column features</h3>
<div class="demo-row" style="max-width: 700px;">
  <Table columns={featureColumns} rows={featureRows} testId="table-keyed-features" />
</div>

<!-- Built-in cell renderers: tag, tag-array, two-line-text, avatar-stack, compare, toggle, link -->
<h3>Built-in Cell Renderers</h3>
<div class="demo-row" style="max-width: 1000px;">
  <Table columns={builtinColumns} rows={builtinRows} testId="table-builtin-cells" />
  {#if toggledRow}
    <p data-pw="builtin-toggle-result" style="margin-top: 8px; color: #64748b; font-size: 14px;">
      Toggled: {toggledRow}
    </p>
  {/if}
</div>

<!-- Interactive cell renderers: select, input, button, action-group, popup-menu + row-click guard -->
<h3>Interactive Cell Renderers</h3>
<div class="demo-row" style="max-width: 1100px;">
  <Table
    columns={interactiveColumns}
    rows={interactiveRows}
    testId="table-interactive-cells"
    onRowClick={(rowIndex) => {
      rowClickLog = `row ${rowIndex}`;
    }}
  />
  <p data-pw="interactive-log" style="margin-top: 8px; color: #64748b; font-size: 14px;">
    Last action: {interactiveLog}
  </p>
  <p data-pw="row-click-log" style="margin-top: 4px; color: #64748b; font-size: 14px;">
    Last row click: {rowClickLog}
  </p>
</div>

<!-- Header metadata: tooltip, align, maxWidth ellipsis, filter dropdown, getSortValue -->
<h3>Header Metadata + getSortValue</h3>
<div class="demo-row" style="max-width: 760px;">
  <Table columns={metaColumns} rows={metaRows} testId="table-header-meta" />
</div>

<!-- Server-mode sort: header UI + onSort only; consumer reorders the rows -->
<h3>Server-mode Sort</h3>
<div class="demo-row" style="max-width: 500px;">
  <Table
    columns={serverColumns}
    rows={serverRows}
    sortMode="server"
    testId="table-server-sort"
    onSort={handleServerSort}
  />
  <p data-pw="server-sort-log" style="margin-top: 8px; color: #64748b; font-size: 14px;">
    Sort request: {serverSortLog}
  </p>
</div>

<!-- Built-in client pagination + row-number column -->
<h3>Built-in Pagination + Row Numbers</h3>
<div class="demo-row" style="max-width: 560px;">
  <Table
    columns={pagedColumns}
    rows={pagedRows}
    rowNumberColumn
    searchConfig={{ placeholder: 'Search items…', testId: 'paged-search' }}
    pagination={{ pageSize: 5, pageSizeOptions: [5, 10], testId: 'paged' }}
    getRowTestId={(_row, rowIndex) => `paged-idx-${rowIndex}`}
    testId="table-paginated"
  />
</div>

<!-- Controlled checkbox selection + bulk-action toolbar -->
<h3>Controlled Selection + Toolbar</h3>
<div class="demo-row" style="max-width: 560px;">
  <Table
    columns={selectionColumns}
    rows={selectionRows}
    sortable={false}
    checkboxSelection={{
      enabled: true,
      selectedIds: controlledSelection,
      onSelectionChange: (nextSelection) => {
        controlledSelection = nextSelection;
      },
      getRowId: (row) => String(row[0] ?? ''),
      getRowAttributes: (rowId) => ({ 'data-selrow': rowId })
    }}
    toolbarSlot={bulkToolbar}
    testId="table-controlled-selection"
  />
  <p data-pw="bulk-action-log" style="margin-top: 8px; color: #64748b; font-size: 14px;">
    Last bulk action: {lastBulkAction}
  </p>
</div>

<!-- Client pagination + page-scoped header select-all -->
<h3>Paginated Selection (page-scoped select-all)</h3>
<div class="demo-row" style="max-width: 560px;">
  <Table
    columns={pagedSelectColumns}
    rows={pagedSelectRows}
    sortable={false}
    checkboxSelection={{
      enabled: true,
      getRowId: (row) => String(row[0] ?? ''),
      disabledRowIds: new Set(['Member 2']),
      onSelectionChange: (nextSelection) => {
        pagedSelectionLog = [...nextSelection].sort().join(',') || 'empty';
      }
    }}
    pagination={{ pageSize: 5, pageSizeOptions: [5], testId: 'psel' }}
    testId="table-paged-select"
  />
  <p data-pw="paged-select-log" style="margin-top: 8px; color: #64748b; font-size: 14px;">
    Selected: {pagedSelectionLog}
  </p>
</div>

<!-- Media cell renderers: icon-label + image-two-line-text -->
<h3>Media Cell Renderers</h3>
<div class="demo-row" style="max-width: 560px;">
  <Table columns={mediaColumns} rows={mediaRows} sortable={false} testId="table-media-cells" />
</div>

<!-- Server-mode pagination: consumer owns the page data -->
<h3>Server-Mode Pagination</h3>
<div class="demo-row" style="max-width: 480px;">
  <Table
    columns={serverPagedColumns}
    rows={serverPagedRows}
    sortable={false}
    getRowTestId={(row) => `srv-row-${String(row[0] ?? '')}`}
    pagination={{
      mode: 'server',
      page: serverPageNumber,
      pageSize: SERVER_PAGE_SIZE,
      totalItems: SERVER_TOTAL_RECORDS,
      pageSizeOptions: [],
      onPageChange: (nextPage) => {
        serverPageNumber = nextPage;
      },
      testId: 'srv-paged'
    }}
    testId="table-server-paginated"
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
