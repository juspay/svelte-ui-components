<script lang="ts">
  import Divider from '$lib/Divider/Divider.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Divider</h1>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Horizontal (default)</h2>
  <div class="demo-box">
    <p>Section above</p>
    <Divider testId="divider-horizontal" />
    <p>Section below</p>
  </div>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">Vertical</h2>
  <div class="demo-row demo-row-inline">
    <p>Left content</p>
    <Divider orientation="vertical" testId="divider-vertical" classes="divider-tall" />
    <p>Right content</p>
  </div>
</div>

<div class="demo-section">
  <h2 class="demo-section-title">CSS Variable Overrides</h2>
  <div class="demo-box divider-custom">
    <p>Custom border color and margin</p>
    <Divider classes="divider-brand" />
    <p>Section after custom divider</p>
  </div>
</div>

<style>
  .demo-section {
    margin-bottom: 40px;
  }

  .demo-section-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--doc-text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .demo-box {
    max-width: 480px;
    padding: 16px;
    background: var(--doc-demo-bg, #f9fafb);
    border: 1px solid var(--doc-border, #e5e7eb);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .demo-box p {
    margin: 0;
  }

  .demo-row-inline {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    max-width: 360px;
    background: var(--doc-demo-bg, #f9fafb);
    border: 1px solid var(--doc-border, #e5e7eb);
    border-radius: 8px;
  }

  .demo-row-inline p {
    margin: 0;
  }

  :global(.divider-tall) {
    --divider-length: 40px;
  }

  .divider-custom :global(.divider-brand) {
    --divider-border: 2px dashed #6366f1;
    --divider-margin: 4px 0;
  }
</style>
