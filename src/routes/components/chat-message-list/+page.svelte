<script lang="ts">
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  const messages: ChatMessageData[] = [
    { id: '1', role: 'sender', content: 'What can you help me with?' },
    {
      id: '2',
      role: 'responder',
      content: 'I can help you find products, track orders, and more.'
    },
    { id: '3', role: 'sender', content: 'Find me a blue jacket.' },
    { id: '4', role: 'responder', content: 'Searching now…', streaming: true }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatMessageList</h1>
</div>

<div class="chat-theme chat-card list-frame">
  <ChatMessageList {messages} />
</div>

<style>
  .list-frame {
    height: 360px;
    max-width: 480px;
    background: var(--doc-demo-bg);
  }
</style>
