<script lang="ts">
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Toolbar</h1>
</div>

<div class="demo-row" style="max-width: 500px;">
  <Toolbar text="Page Title" showBackButton onbackClick={() => alert('Back clicked')} />
</div>
