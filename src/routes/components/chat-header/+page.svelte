<script lang="ts">
  import ChatHeader from '$lib/ChatHeader/ChatHeader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatHeader</h1>
</div>

<h2>Title, subtitle and close</h2>
<div class="chat-theme chat-card header-frame">
  <ChatHeader title="Shopping Assistant" subtitle="Online" onclose={() => {}} />
</div>

<h2>Image avatar</h2>
<div class="chat-theme chat-card header-frame">
  <ChatHeader title="Breeze Assistant" subtitle="Typically replies in seconds" onclose={() => {}}>
    {#snippet avatar()}
      <img class="header-avatar" src="/demo-media/assistant-avatar.png" alt="" />
    {/snippet}
  </ChatHeader>
</div>

<h2>Header actions</h2>
<div class="chat-theme chat-card header-frame">
  <ChatHeader title="Support" subtitle="Online" onclose={() => {}}>
    {#snippet actions()}
      <span class="header-action-hint">⟳</span>
    {/snippet}
  </ChatHeader>
</div>

<h2>No close button — omit onclose</h2>
<div class="chat-theme chat-card header-frame">
  <ChatHeader title="Read-only transcript" subtitle="Archived" />
</div>

<style>
  .header-frame {
    max-width: 480px;
    background: var(--doc-demo-bg);
  }

  .header-avatar {
    display: block;
    width: 32px;
    height: 32px;
  }

  .header-action-hint {
    display: inline-flex;
    align-items: center;
  }
</style>
