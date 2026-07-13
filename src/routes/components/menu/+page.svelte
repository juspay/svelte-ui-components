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

<h3>usePortal — escape a clipping container</h3>
<p>
  Inside an <code>overflow: hidden</code> ancestor (like a table cell), the default in-flow panel is
  clipped. Set <code>usePortal</code> to portal the panel to <code>&lt;body&gt;</code> and position
  it
  <code>fixed</code> at the resolved corner so it renders in full.
</p>
<div class="overflow-demo-grid">
  <div class="clipper" data-pw="menu-inflow-clipper">
    <span class="clipper-label">Default (clipped)</span>
    <Menu
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive', separator: true },
        { label: 'Delete', value: 'delete', danger: true }
      ]}
      testId="menu-inflow-demo"
    >
      {#snippet trigger()}
        <Button text="In-flow" />
      {/snippet}
    </Menu>
  </div>
  <div class="clipper" data-pw="menu-portal-clipper">
    <span class="clipper-label">usePortal (escapes)</span>
    <Menu
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive', separator: true },
        { label: 'Delete', value: 'delete', danger: true }
      ]}
      usePortal
      testId="menu-portal-demo"
    >
      {#snippet trigger()}
        <Button text="Portaled" />
      {/snippet}
    </Menu>
  </div>
</div>

<style>
  .corner-pinned-demo {
    position: fixed;
    right: 16px;
    bottom: 16px;
  }

  /* Small, fixed-height, overflow-clipping boxes to contrast the in-flow and
     portaled dropdown. */
  .overflow-demo-grid {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .clipper {
    width: 220px;
    height: 90px;
    overflow: hidden;
    border: 1px dashed #bbb;
    border-radius: 6px;
    padding: 12px;
  }

  .clipper-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: #888;
  }
</style>
