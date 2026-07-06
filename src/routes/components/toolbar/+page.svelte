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

  <div
    style="position: relative; width: 100%; background: #eef1f5;
           --toolbar-position: relative;
           --toolbar-width: 100%;
           --toolbar-height: 64px;
           --toolbar-content-height: 100%;
           --toolbar-content-max-width: 320px;
           --toolbar-content-margin: 0 auto;"
  >
    <Toolbar
      text="Centered & Clamped"
      testId="toolbar-content-tokens"
      showBackButton
      onbackClick={() => alert('Back clicked')}
    />
  </div>
</div>
