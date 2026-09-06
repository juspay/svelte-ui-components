<script lang="ts">
  import SplitButton from '$lib/SplitButton/SplitButton.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>SplitButton</h1>
</div>

<div class="demo-row">
  <SplitButton
    text="Save"
    items={[
      { label: 'Save as Draft', value: 'draft' },
      { label: 'Save & Publish', value: 'publish' },
      { label: 'Save & Close', value: 'close' }
    ]}
    testId="split-button-default"
    onclick={() => alert('Primary action')}
    onselect={(item) => alert(`Selected: ${item.label}`)}
  />
</div>

<h3>Naming the dropdown trigger</h3>
<p>
  The second control shows only a chevron, so it has no text to be named by. It defaults to
  <code>More &lt;text&gt; options</code>; <code>triggerAriaLabel</code> overrides that.
</p>
<div class="demo-row">
  <SplitButton
    text="Export"
    triggerAriaLabel="Choose an export format"
    items={[
      { label: 'CSV', value: 'csv' },
      { label: 'XLSX', value: 'xlsx' }
    ]}
    testId="split-button-named"
    onselect={(item) => alert(`Selected: ${item.label}`)}
  />
</div>
