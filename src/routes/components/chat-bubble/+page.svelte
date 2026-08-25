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
  let pillOpen = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatBubble</h1>
</div>

<p class="demo-note">
  A launcher pinned to the corner of the viewport opens a floating chat panel. Drag the bubble — it
  snaps to the nearest screen edge on release (the default; pass <code>dragMode="free"</code> to
  keep it where dropped). Resize the open panel from its inner edges, or use the button below to
  expand the panel to a larger size with an animated scale-up. The bottom-left corner shows a
  <strong>pill launcher</strong>: the <code>icon</code> snippet renders a label next to the glyph
  and
  <code>--chat-bubble-width: fit-content</code> lets the button's width follow its content while
  <code>--chat-bubble-size</code> keeps governing the height.
</p>

<div class="expand-control">
  <Button
    text={expanded ? 'Collapse panel' : 'Expand panel'}
    disabled={!open}
    onclick={() => (expanded = !expanded)}
  />
</div>

<div class="corner-pointers">
  <p class="corner-pointer">
    ↘ The <strong>circular launcher</strong> floats bottom-right — click it to open the chat panel, or
    grab and drag it.
  </p>
  <p class="corner-pointer">
    ↙ The <strong>pill launcher</strong> floats bottom-left — the new
    <code>--chat-bubble-width: fit-content</code> shape.
  </p>
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

<ChatBubble
  bind:open={pillOpen}
  position="bottom-left"
  label="Ask Assistant"
  classes="pill-launcher"
  testId="pill-launcher-bubble"
>
  {#snippet icon()}<span class="pill-launcher-content">💬 Ask Assistant</span>{/snippet}
  {#snippet openIcon()}<span class="pill-launcher-content">✕ Close</span>{/snippet}
  <div class="pill-panel">
    <h3>Pill launcher</h3>
    <p>
      The launcher stays a real <code>Button</code>; only two CSS variables changed:
      <code>--chat-bubble-width: fit-content</code> and a capsule
      <code>--chat-bubble-border-radius</code>.
    </p>
  </div>
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

  .corner-pointers {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 24px;
    padding: 12px 16px;
    border: 1px dashed var(--doc-btn-border);
    border-radius: var(--doc-radius);
  }

  .corner-pointer {
    margin: 0;
    color: var(--doc-text-secondary);
  }

  :global(.pill-launcher) {
    --chat-bubble-width: fit-content;
    --chat-bubble-border-radius: 999px;
    --chat-bubble-padding: 8px 20px;
  }

  .pill-launcher-content {
    white-space: nowrap;
    font-size: 15px;
  }

  .pill-panel {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 20px;
    overflow: auto;
  }

  .pill-panel h3 {
    margin: 0 0 8px;
  }

  .pill-panel p {
    margin: 0;
  }
</style>
