<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Menu from '$lib/Menu/Menu.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Menu</h1>
</div>

<div class="demo-row">
  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Archive', value: 'archive', separator: true },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    onselect={(item) => alert(`Selected: ${item.label}`)}
  >
    {#snippet trigger()}
      <Button text="Actions Menu" />
    {/snippet}
  </Menu>
</div>
