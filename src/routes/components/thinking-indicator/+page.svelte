<script lang="ts">
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';

  let expanded = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ThinkingIndicator</h1>
</div>

<h2>Status line — shimmering label with the built-in spinner</h2>
<div class="demo-row">
  <ThinkingIndicator label="Working on your refund summary…" />
</div>

<h2>Status line — with an image avatar</h2>
<div class="demo-row">
  <ThinkingIndicator label="Working on your refund summary…">
    {#snippet avatar()}
      <img class="assistant-avatar" src="/demo-media/assistant-avatar.png" alt="" />
    {/snippet}
  </ThinkingIndicator>
</div>

<h2>Expandable — a detail string makes it a disclosure</h2>
<div class="demo-row">
  <ThinkingIndicator
    label="Thought for 6 seconds"
    detail="Looked up the last 30 days of refunds, grouped them by payment method, and compared the totals against the previous period before drafting the summary."
    bind:expanded
  />
</div>

<h2>Expandable — with an image avatar</h2>
<div class="demo-row">
  <ThinkingIndicator
    label="Thought for 12 seconds"
    detail="Compared conversion by device class, checked the two campaigns that changed this week, and ruled out the pricing experiment before answering."
    expanded={false}
  >
    {#snippet avatar()}
      <img class="assistant-avatar" src="/demo-media/assistant-avatar.png" alt="" />
    {/snippet}
  </ThinkingIndicator>
</div>

<h2>Bare — label only, for use inside a chat bubble</h2>
<div class="demo-row">
  <ThinkingIndicator label="Analyzing your storefront…" variant="bare" />
</div>

<p class="demo-note">
  The bare variant deliberately ignores the <code>avatar</code> snippet — it renders inside a chat bubble
  whose surrounding UI already supplies the avatar and layout.
</p>

<h2>Custom avatar snippet</h2>
<div class="demo-row">
  <ThinkingIndicator label="Calling the catalog tool…">
    {#snippet avatar()}
      <span style="font-size: 1.25rem; line-height: 1;">✨</span>
    {/snippet}
  </ThinkingIndicator>
</div>

<style>
  .assistant-avatar {
    display: block;
    width: 20px;
    height: 20px;
  }
</style>
