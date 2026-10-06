<script lang="ts">
  import { onMount } from 'svelte';
  import Chat from '$lib/Chat/Chat.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  const messages: ChatMessageData[] = Array.from({ length: 12 }, (_, index) => ({
    id: `message-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${index}`
  }));

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<div class="chs-grid">
  <div class="chs-host" data-pw="chs-default">
    <Chat {messages} />
  </div>
  <div class="chs-host" data-pw="chs-hidden">
    <Chat {messages} hideScrollbar />
  </div>
</div>

<style>
  .chs-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    align-items: flex-start;
  }

  .chs-host {
    display: flex;
    flex-direction: column;
    width: 360px;
    height: 360px;
  }
</style>
