<script lang="ts">
  import SnippetComponent from '$lib/Snippet/Snippet.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Snippet</h1>
</div>

<div class="demo-row" style="max-width: 500px; flex-direction: column; gap: 12px;">
  <SnippetComponent text="npm install @juspay/svelte-ui-components" prompt="$" showCopyButton />
  <SnippetComponent text="npx create-svelte@latest my-app" prompt=">" showCopyButton />
</div>
