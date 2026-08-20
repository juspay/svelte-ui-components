<script lang="ts">
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatMessage</h1>
</div>

<div class="chat-theme demo-col">
  <ChatMessage role="sender" content="Hey, can you recommend a gift under $50?" />
  <ChatMessage
    role="responder"
    html="<p>Sure! Here are a few <strong>great picks</strong> under $50:</p><ul><li>Wireless earbuds</li><li>A scented candle set</li></ul>"
  />
  <ChatMessage role="responder" content="" streaming={true} />
</div>

<style>
  .demo-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 480px;
  }
</style>
