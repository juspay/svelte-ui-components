<script lang="ts">
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';

  let value = $state('');
  let sent: string[] = $state([]);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatComposer</h1>
</div>

<div class="chat-theme composer-frame">
  <ChatComposer bind:value placeholder="Type a message…" onsubmit={(text) => sent.push(text)} />
</div>

{#each sent as message, i (i)}
  <p class="demo-note">{message}</p>
{/each}

<style>
  .composer-frame {
    max-width: 480px;
  }
</style>
