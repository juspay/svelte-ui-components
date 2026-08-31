<script lang="ts">
  import EmptyState from '$lib/EmptyState/EmptyState.svelte';
  import Button from '$lib/Button/Button.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>EmptyState</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 500px; gap: 24px;">
  <EmptyState
    title="No results found"
    description="Try adjusting your search or filters to find what you're looking for."
  >
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg
      >
    {/snippet}
    <Button text="Clear filters" />
  </EmptyState>

  <EmptyState
    title="No notifications"
    description="You're all caught up! New notifications will appear here."
  >
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path
          d="M13.73 21a2 2 0 0 1-3.46 0"
        /></svg
      >
    {/snippet}
  </EmptyState>

  <EmptyState title="Empty inbox" description="Messages you receive will show up here.">
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path
          d="M9 21V9"
        /></svg
      >
    {/snippet}
  </EmptyState>
</div>

<h3>Test attributes</h3>
<div class="demo-row" style="flex-direction: column; max-width: 500px; gap: 24px;">
  <EmptyState
    testId="empty-state-attributes"
    title="Fallback title"
    description="Fallback description"
  />

  <EmptyState testId="empty-state-snippet-attributes" title="">
    {#snippet titleSnippet()}
      <strong>Snippet title</strong>
    {/snippet}
    {#snippet descriptionSnippet()}
      <span>Snippet description</span>
    {/snippet}
  </EmptyState>

  <EmptyState testId="empty-state-without-description" title="Title only" />
</div>

<h3>Title only (no description)</h3>
<div class="demo-row" style="flex-direction: column; max-width: 500px; gap: 24px;">
  <EmptyState title="No items yet" />

  <EmptyState title="Nothing here">
    {#snippet icon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
          x1="12"
          y1="16"
          x2="12.01"
          y2="16"
        /></svg
      >
    {/snippet}
    <Button text="Get started" />
  </EmptyState>
</div>
