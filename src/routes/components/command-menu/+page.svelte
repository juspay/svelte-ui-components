<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';

  let showCommandMenu = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>CommandMenu</h1>
</div>

<div class="demo-row">
  <Button text="Open Command Menu (Ctrl+K)" onclick={() => (showCommandMenu = true)} />
  <CommandMenu
    bind:open={showCommandMenu}
    items={[
      { label: 'New File', value: 'new-file', group: 'File', shortcut: 'Ctrl+N' },
      { label: 'Open File', value: 'open-file', group: 'File', shortcut: 'Ctrl+O' },
      { label: 'Save', value: 'save', group: 'File', shortcut: 'Ctrl+S' },
      { label: 'Search', value: 'search', group: 'Edit', shortcut: 'Ctrl+F' },
      { label: 'Replace', value: 'replace', group: 'Edit', shortcut: 'Ctrl+H' },
      { label: 'Settings', value: 'settings', group: 'Preferences' }
    ]}
    placeholder="Type a command..."
    onselect={(item) => {
      alert(`Command: ${item.label}`);
    }}
  />
</div>
