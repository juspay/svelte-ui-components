<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Menu from '$lib/Menu/Menu.svelte';

  let lastSelected = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Menu</h1>
</div>

<h3>Basic</h3>
<div class="demo-row">
  <Menu
    items={[
      { label: 'Edit', value: 'edit' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Archive', value: 'archive', separator: true },
      { label: 'Delete', value: 'delete', danger: true }
    ]}
    onselect={(item) => (lastSelected = item.label)}
  >
    {#snippet trigger()}
      <Button text="Actions" />
    {/snippet}
  </Menu>
</div>
{#if lastSelected}
  <p class="state-display">Last selected: {lastSelected}</p>
{/if}

<h3>triggerTestId — test selector on the trigger element</h3>
<div class="demo-row">
  <Menu
    items={[
      { label: 'Profile', value: 'profile' },
      { label: 'Settings', value: 'settings' },
      { label: 'Sign out', value: 'signout', danger: true }
    ]}
    testId="user-menu"
    triggerTestId="user-menu-trigger"
  >
    {#snippet trigger()}
      <Button text="Account" />
    {/snippet}
  </Menu>
  <p class="state-display">
    data-pw="user-menu-trigger" on the trigger · data-pw="user-menu" on the container
  </p>
</div>

<h3>triggerAriaLabel — accessible label for the trigger</h3>
<div class="demo-row">
  <Menu
    items={[
      { label: 'Copy link', value: 'copy' },
      { label: 'Share', value: 'share' },
      { label: 'Report', value: 'report', danger: true }
    ]}
    triggerAriaLabel="Open share options"
  >
    {#snippet trigger()}
      <button class="toggle-btn">⋯</button>
    {/snippet}
  </Menu>
  <p class="state-display">aria-label="Open share options" is set on the trigger element</p>
</div>

<h3>portal — dropdown rendered outside the DOM hierarchy</h3>
<div class="demo-row" style="overflow: hidden; height: 60px; position: relative;">
  <Menu
    portal
    items={[
      { label: 'New file', value: 'new' },
      { label: 'Open', value: 'open' },
      { label: 'Save', value: 'save' }
    ]}
  >
    {#snippet trigger()}
      <Button text="File (portal=true)" />
    {/snippet}
  </Menu>
  <p class="state-display">
    Container has overflow:hidden — dropdown escapes via portal and stays fully visible
  </p>
</div>
