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

<h2>Copied-label / reset-duration options</h2>

<div class="demo-row" style="max-width: 500px; flex-direction: column; gap: 12px;">
  <!-- Regression guard: no copiedLabel/copyResetMs passed, so this stays on the
       unchanged default -- 'Copied!' text, 2000ms reset. -->
  <SnippetComponent testId="snippet-default" text="echo default" prompt="$" />
  <!-- copiedLabel/copyResetMs proof: a short reset so the test does not need to
       wait out the real 2000ms default. -->
  <SnippetComponent
    testId="snippet-copy-options"
    text="echo custom"
    prompt="$"
    copiedLabel="Link copied!"
    copyResetMs={300}
  />
</div>
