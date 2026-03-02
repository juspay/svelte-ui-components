<script lang="ts">
  import Loader from '$lib/Loader/Loader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Loader</h1>
</div>

<div class="demo-row" style="align-items: center;">
  <div
    style="--loader-foreground: #4f46e5; --loader-foreground-end: transparent; --loader-background: white;"
  >
    <Loader />
  </div>
</div>
