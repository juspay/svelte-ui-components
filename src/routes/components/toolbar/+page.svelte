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
    testId="toolbar-root"
    headingTestId="toolbar-heading"
    showBackButton
    onbackClick={() => alert('Back clicked')}
  />
</div>
