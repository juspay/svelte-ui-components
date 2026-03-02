<script lang="ts">
  import Input from '$lib/Input/Input.svelte';

  let inputValue = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Input</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={inputValue} placeholder="Enter your name" label="Name" />
</div>
