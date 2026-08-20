<script lang="ts">
  import ChatSuggestions from '$lib/ChatSuggestions/ChatSuggestions.svelte';

  let picked = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatSuggestions</h1>
</div>

<div class="demo-row">
  <ChatSuggestions
    items={['Recommend a gift', 'Track my order', 'Return policy?', 'Talk to a human']}
    onselect={(value) => (picked = value)}
  />
</div>

{#if picked.length > 0}
  <p class="demo-note">Selected: {picked}</p>
{/if}
