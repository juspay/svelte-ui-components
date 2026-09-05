<script lang="ts">
  import ContextMenu from '$lib/ContextMenu/ContextMenu.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>ContextMenu</h1>
</div>

<div class="demo-row">
  <ContextMenu
    testId="context-menu-demo"
    items={[
      { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' },
      { label: 'Delete', value: 'delete', danger: true, separator: true }
    ]}
    onselect={(item) => alert(`Context: ${item.label}`)}
  >
    <!-- Focusable *and* named, with a role that says what it is. A bare
         `tabindex="0"` div is a tab stop that announces nothing and does
         nothing on Enter, which is a poor pattern to demonstrate. -->
    <div
      class="context-menu-target"
      tabindex="0"
      role="button"
      aria-haspopup="menu"
      data-pw="context-menu-target"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.dispatchEvent(
            new MouseEvent('contextmenu', { bubbles: true, clientX: 0, clientY: 0 })
          );
        }
      }}
    >
      Right-click me for context menu
    </div>
  </ContextMenu>
  <!-- A second focusable control outside the menu. Closing by clicking here
       must leave focus here, rather than the menu pulling it back to whatever
       opened it. -->
  <button type="button" data-pw="context-menu-outside-button">Something else to focus</button>
</div>
