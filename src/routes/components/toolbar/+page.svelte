<script lang="ts">
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Toolbar</h1>
</div>

<div class="demo-row" style="max-width: 500px; flex-direction: column; gap: 24px;">
  <Toolbar text="Page Title" showBackButton onbackClick={() => alert('Back clicked')} />

  <Toolbar
    text="Order Details"
    subheading="Placed on 5 Jun 2026"
    showBackButton
    onbackClick={() => alert('Back clicked')}
  />

  <Toolbar
    text="Settings"
    subheading="Manage your account preferences"
    testId="settings-toolbar"
    headingTestId="settings-toolbar-heading"
    subheadingTestId="settings-toolbar-subheading"
    showBackButton
    onbackClick={() => alert('Back clicked')}
  />
</div>
