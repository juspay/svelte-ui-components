<script lang="ts">
  import ChatHeader from '$lib/ChatHeader/ChatHeader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatHeader</h1>
</div>

<div class="chat-theme chat-card header-frame">
  <ChatHeader title="Shopping Assistant" subtitle="Online" onclose={() => {}} />
</div>

<style>
  .header-frame {
    max-width: 480px;
    background: var(--doc-demo-bg);
  }
</style>
