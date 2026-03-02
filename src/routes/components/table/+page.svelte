<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Table</h1>
</div>

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
