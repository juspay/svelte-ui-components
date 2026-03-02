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
    onclick={() => alert('Primary action')}
    onselect={(item) => alert(`Selected: ${item.label}`)}
  />
</div>
