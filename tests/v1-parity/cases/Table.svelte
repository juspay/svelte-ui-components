<script context="module">
  const sort = (n) => ['click', `th:nth-child(${n}) .sort-arrow`];

  export const cases = [
    { name: 'default', allowBlank: true },
    { name: 'title-only' },
    { name: 'title-null' },
    { name: 'title-empty' },
    { name: 'headers-only' },
    { name: 'data-only-no-headers' },
    { name: 'full' },
    { name: 'mixed-cell-types' },
    { name: 'long-words' },
    { name: 'table-scrollable' },
    { name: 'content-scrollable' },
    { name: 'both-scrollable' },
    { name: 'sort-name-asc', actions: [sort(1)] },
    { name: 'sort-name-desc', actions: [sort(1), sort(1)] },
    { name: 'sort-name-asc-again', actions: [sort(1), sort(1), sort(1)] },
    { name: 'sort-number-asc', actions: [sort(2)] },
    { name: 'sort-number-desc', actions: [sort(2), sort(2)] },
    { name: 'sort-boolean-asc', actions: [sort(3)] },
    { name: 'sort-boolean-desc', actions: [sort(3), sort(3)] },
    { name: 'sort-mixed-column', actions: [sort(4)] },
    { name: 'sort-two-columns', actions: [sort(1), sort(2)] },
    { name: 'sort-scrollable', actions: [sort(2)] },
    { name: 'hover-arrow', actions: [['hover', 'th:nth-child(1) .sort-arrow']] },
    { name: 'focus-arrow', actions: [['focus', 'th:nth-child(1) .sort-arrow']] },
    { name: 'press-arrow', actions: [['press', 'th:nth-child(1) .sort-arrow', 'Enter']] },
    { name: 'themed' },
    { name: 'themed-scrollable' },
    { name: 'style-props' }
  ];
</script>

<script>
  import { Table } from 'sui-v1-under-test';
  export let name;

  const headers = ['Name', 'Amount', 'Paid', 'Note'];
  const rows = [
    ['Charlie', 30, true, 'late'],
    ['Alice', 120, false, 'ok'],
    ['Bob', 7, true, null],
    ['Dana', 55, false, 'refund'],
    ['Eve', 7, true, 'dup']
  ];
  const manyRows = Array.from({ length: 12 }, (_, i) => [
    `User ${i + 1}`,
    (i * 37) % 101,
    i % 3 === 0,
    `n${i}`
  ]);
  const base = {
    tableTitle: 'Payments',
    tableHeaders: headers,
    tableData: rows,
    isTableScrollable: false,
    isContentScrollable: false
  };

  const variants = {
    'title-only': { ...base, tableHeaders: [], tableData: [] },
    'title-null': { ...base, tableTitle: null },
    'title-empty': { ...base, tableTitle: '' },
    'headers-only': { ...base, tableData: [] },
    'data-only-no-headers': { ...base, tableTitle: '', tableHeaders: [] },
    'mixed-cell-types': {
      ...base,
      tableData: [
        ['x', 1, true, null],
        ['y', 'two', false, [1, 2]],
        ['z', null, null, { a: 1 }]
      ]
    },
    'long-words': {
      ...base,
      tableData: [
        [
          'Supercalifragilisticexpialidocious',
          1000000000,
          true,
          'https://example.invalid/a/very/long/path/segment/here'
        ]
      ]
    },
    'table-scrollable': { ...base, tableData: manyRows, isTableScrollable: true },
    'content-scrollable': {
      ...base,
      tableData: [['Alice', 1, true, 'line one line two line three line four line five line six']],
      isContentScrollable: true
    },
    'both-scrollable': {
      ...base,
      tableData: manyRows.map((r) => [
        ...r.slice(0, 3),
        'a long note that wraps over several lines in the cell'
      ]),
      isTableScrollable: true,
      isContentScrollable: true
    },
    'sort-mixed-column': {
      ...base,
      tableData: [
        ['x', 1, true, 5],
        ['y', 2, false, 'b'],
        ['z', 3, true, 'a'],
        ['w', 4, false, 2]
      ]
    },
    'sort-scrollable': { ...base, tableData: manyRows, isTableScrollable: true },
    themed: base,
    'themed-scrollable': {
      ...base,
      tableData: manyRows,
      isTableScrollable: true,
      isContentScrollable: true
    },
    'style-props': base
  };
  const props = variants[name] ?? base;
</script>

{#if name === 'default'}
  <Table />
{:else if name === 'themed' || name === 'themed-scrollable'}
  <div class="themed">
    <Table properties={props} />
  </div>
{:else if name === 'style-props'}
  <Table
    properties={props}
    --table-title-margin="0px 0px 20px 0px"
    --table-tile-font-size="18px"
    --table-title-font-family="serif"
    --table-title-padding="4px"
    --table-border="3px solid #1d4ed8"
    --table-container-width="380px"
    --table-width="380px"
    --table-inner-border="2px dotted #b91c1c"
    --table-padding="12px"
    --table-text-align="center"
    --table-column-width="80px"
    --table-header-border-bgcolor="#dbeafe"
    --table-header-font-size="16px"
    --table-header-font-color="#1d4ed8"
    --table-content-border-bgcolor="#fef9c3"
    --table-content-font-size="13px"
    --table-content-font-color="#7c2d12"
  />
{:else}
  <Table properties={props} />
{/if}

<style>
  .themed {
    --table-title-margin: 0px 0px 16px 0px;
    --table-tile-font-size: 20px;
    --table-title-font-family: Georgia, serif;
    --table-title-padding: 0px 4px;
    --table-border: 2px solid #047857;
    --table-container-width: 360px;
    --table-container-height: 120px;
    --table-width: 360px;
    --table-border-collapse: separate;
    --table-inner-border: 1px dashed #047857;
    --table-padding: 4px 10px;
    --table-text-align: right;
    --table-column-width: 70px;
    --table-header-border-bgcolor: #d1fae5;
    --table-header-font-size: 13px;
    --table-header-font-family: monospace;
    --table-header-font-color: #064e3b;
    --table-content-border-bgcolor: #f0fdf4;
    --table-content-font-size: 12px;
    --table-content-font-family: monospace;
    --table-content-font-color: #065f46;
    --scrollable-column-height: 30px;
  }
</style>
