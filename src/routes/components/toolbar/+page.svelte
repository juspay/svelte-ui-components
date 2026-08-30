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

  <!-- In-flow page-header shape: same component, no extra props. Positioning and row
       behaviour come from CSS variables; the title block is the consumer's own markup,
       passed through centerContent. -->
  <div class="page-header-demo">
    <Toolbar testId="toolbar-page-header" showBackButton onbackClick={() => alert('Back clicked')}>
      {#snippet centerContent()}
        <div class="heading-block">
          <h2 class="demo-title" data-pw="toolbar-page-header-heading">Shipping profiles</h2>
          <p class="demo-subheading" data-pw="toolbar-page-header-subheading">
            Set delivery rates and zones for this store
          </p>
        </div>
      {/snippet}
      {#snippet rightContent()}
        <div class="demo-actions">
          <button type="button">Discard</button>
          <button type="button">Save</button>
        </div>
      {/snippet}
    </Toolbar>
  </div>

  <!-- backIcon={null} keeps its historical meaning: render no icon at all. -->
  <div
    style="position: relative; width: 100%;
           --toolbar-position: relative;
           --toolbar-width: 100%;
           --toolbar-background: transparent;
           --toolbar-box-shadow: none;"
  >
    <Toolbar text="No back icon" testId="toolbar-no-back-icon" showBackButton backIcon={null} />
  </div>
</div>

<style>
  .page-header-demo {
    position: relative;
    width: 100%;

    --toolbar-position: relative;
    --toolbar-width: 100%;
    --toolbar-background: transparent;
    --toolbar-box-shadow: none;

    /* Top-align the row so the back control sits on the title's first line rather than
       centred against the whole two-line block. */
    --toolbar-content-align-items: flex-start;
    --toolbar-content-column-gap: 16px;

    /* The title side yields and ellipsizes; the actions stay whole. */
    --toolbar-center-flex: 1 1 auto;
    --toolbar-center-min-width: 0;
    --toolbar-right-flex-shrink: 0;
  }

  /* The title block is this page's markup, so it is styled with ordinary scoped CSS —
     no class-name props and no typography tokens on the component. */
  .heading-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .demo-title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .demo-subheading {
    margin: 0;
    font-size: 13px;
    color: #59616e;
  }

  .demo-actions {
    display: flex;
    gap: 8px;
  }
</style>
