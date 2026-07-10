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
    testId="menu-default-demo"
    onselect={(item) => alert(`Selected: ${item.label}`)}
  >
    {#snippet trigger()}
      <Button text="Actions Menu" />
    {/snippet}
  </Menu>

  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="bottom-right"
    testId="menu-bottom-right-demo"
  >
    {#snippet trigger()}
      <Button text="Bottom-right" />
    {/snippet}
  </Menu>

  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="auto"
    testId="menu-auto-roomy-demo"
  >
    {#snippet trigger()}
      <Button text="Auto (roomy)" />
    {/snippet}
  </Menu>
</div>

<!-- placement="auto" — the trigger is pinned to the bottom-right viewport corner,
     so the resolved corner must flip to top-right to stay inside the viewport. -->
<div class="corner-pinned-demo">
  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Archive', value: 'archive', separator: true },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    placement="auto"
    testId="menu-auto-corner-demo"
  >
    {#snippet trigger()}
      <Button text="Auto (corner)" />
    {/snippet}
  </Menu>
</div>

<style>
  .corner-pinned-demo {
    position: fixed;
    right: 16px;
    bottom: 16px;
  }
</style>
