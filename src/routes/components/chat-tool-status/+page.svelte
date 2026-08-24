<script lang="ts">
  import ChatToolStatus from '$lib/ChatToolStatus/ChatToolStatus.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatToolStatus</h1>
</div>

<div class="demo-row">
  <ChatToolStatus label="Searching the catalog…" />
</div>

<h2>Custom leading icon — the icon snippet replaces the spinner</h2>
<div class="chat-theme demo-row">
  <ChatToolStatus label="Fetched 42 orders">
    {#snippet icon()}
      <span class="tool-done-icon">✓</span>
    {/snippet}
  </ChatToolStatus>
</div>

<style>
  .tool-done-icon {
    display: inline-flex;
    align-items: center;
  }
</style>
