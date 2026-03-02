<script lang="ts">
  import ContextMenu from '$lib/ContextMenu/ContextMenu.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>ContextMenu</h1>
</div>

<div class="demo-row">
  <ContextMenu
    items={[
      { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' },
      { label: 'Delete', value: 'delete', danger: true, separator: true }
    ]}
    onselect={(item) => alert(`Context: ${item.label}`)}
  >
    <div class="context-menu-target">Right-click me for context menu</div>
  </ContextMenu>
</div>
