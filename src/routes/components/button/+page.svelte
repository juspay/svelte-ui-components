<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>Button</h1>
</div>

<div class="demo-row">
  <Button text="Primary" onclick={() => alert('Clicked!')} />
  <Button text="Disabled" enable={false} />
  <Button text="With Loader" showLoader loaderType="Circular" />
</div>
