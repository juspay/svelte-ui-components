<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';

  let checkboxChecked = $state(false);
  let checkboxIndeterminate = $state(true);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Checkbox</h1>
</div>

<div class="demo-row">
  <Checkbox text="Default checkbox" bind:checked={checkboxChecked} />
  <Checkbox text="Disabled" disabled />
  <Checkbox text="Indeterminate" bind:indeterminate={checkboxIndeterminate} checked={false} />
  <Checkbox text="Checked disabled" checked disabled />
</div>
