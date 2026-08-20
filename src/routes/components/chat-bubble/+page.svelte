<script lang="ts">
  import Chat from '$lib/Chat/Chat.svelte';
  import Button from '$lib/Button/Button.svelte';
  import ChatBubble from '$lib/ChatBubble/ChatBubble.svelte';
  import { ChatController } from '$lib/Chat/controller.svelte';
  import type { ChatTransport } from '$lib/Chat/types';

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const mockTransport: ChatTransport = async ({ message, signal }, handlers) => {
    await delay(500);
    if (signal.aborted) {
      return;
    }
    const reply = `You said "${message}". This is a floating chat bubble — click the launcher to toggle it.`;
    for (const word of reply.split(' ')) {
      if (signal.aborted) {
        return;
      }
      handlers.onText(`${word} `);
      await delay(45);
    }
    handlers.onDone?.();
  };

  const chat = new ChatController({ transport: mockTransport, typewriter: true });
  let value = $state('');
  let open = $state(false);
  let expanded = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatBubble</h1>
</div>

<p class="demo-note">
  A launcher pinned to the corner of the viewport opens a floating chat panel. Drag the bubble — it
  snaps to the nearest screen edge on release (the default; pass <code>dragMode="free"</code> to keep
  it where dropped). Resize the open panel from its inner edges, or use the button below to expand the
  panel to a larger size with an animated scale-up.
</p>

<div class="expand-control">
  <Button
    text={expanded ? 'Collapse panel' : 'Expand panel'}
    disabled={!open}
    onclick={() => (expanded = !expanded)}
  />
</div>

<ChatBubble bind:open bind:expanded label="Open chat" draggable resizable classes="chat-theme">
  <Chat
    messages={chat.messages}
    bind:value
    title="Shopping Assistant"
    subtitle="Online"
    placeholder="Ask anything…"
    streaming={chat.isStreaming}
    allowCopy
    onsend={(text) => chat.send(text)}
    onstop={() => chat.stop()}
    onclose={() => (open = false)}
  />
</ChatBubble>

<style>
  /* Theme the reused Button to match the site's controls (vars inherit into it). */
  .expand-control {
    margin-bottom: 16px;
    --button-color: var(--doc-btn-bg);
    --button-text-color: var(--doc-text-primary);
    --button-hover-color: var(--doc-btn-hover-bg);
    --button-hover-text-color: var(--doc-text-primary);
    --button-border: 1px solid var(--doc-btn-border);
    --button-hover-border: 1px solid var(--doc-btn-border);
    --button-padding: 8px 16px;
    --button-font-size: 14px;
    --button-border-radius: var(--doc-radius);
    --button-disabled-background-color: var(--doc-btn-bg);
    --button-disabled-text-color: var(--doc-text-faint);
    --button-disabled-border: 1px solid var(--doc-btn-border);
  }
</style>
