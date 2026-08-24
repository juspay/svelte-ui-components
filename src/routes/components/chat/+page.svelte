<script lang="ts">
  import Chat from '$lib/Chat/Chat.svelte';
  import Button from '$lib/Button/Button.svelte';
  import Resizable from '$lib/Resizable/Resizable.svelte';
  import { ChatController } from '$lib/Chat/controller.svelte';
  import type { ChatTransport } from '$lib/Chat/types';

  type ChatOption = { label: string };

  function optionsOf(items: unknown[]): ChatOption[] {
    const options: ChatOption[] = [];
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'label' in item) {
        const { label } = item;
        if (typeof label === 'string') {
          options.push({ label });
        }
      }
    }
    return options;
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const mockTransport: ChatTransport = async ({ message, signal }, handlers) => {
    handlers.onToolStatus?.({ label: 'Searching the catalog…' });
    await delay(700);
    if (signal.aborted) {
      return;
    }
    handlers.onToolStatus?.(null);

    const reply = `Thanks for asking about "${message}". This reply streams in word by word, and you can stop, copy, or retry it.`;
    for (const word of reply.split(' ')) {
      if (signal.aborted) {
        return;
      }
      handlers.onText(`${word} `);
      await delay(45);
    }

    handlers.onAttachment?.({ label: 'Show similar' });
    handlers.onAttachment?.({ label: 'Something else' });
    handlers.onDone?.();
  };

  const chat = new ChatController({ transport: mockTransport, typewriter: true });
  let value = $state('');
  let attachments: File[] = $state([]);
  let recording = $state(false);
  let panelWidth = $state(420);
  let panelHeight = $state(600);

  // Expand toggle: swap to a larger preset (animated by Resizable's transition),
  // restoring the prior size on collapse.
  let expanded = $state(false);
  const expandedWidth = 640;
  const expandedHeight = 760;
  let liveWidth = $derived(expanded ? expandedWidth : panelWidth);
  let liveHeight = $derived(expanded ? expandedHeight : panelHeight);

  function setLiveWidth(value: number): void {
    if (!expanded) {
      panelWidth = value;
    }
  }

  function setLiveHeight(value: number): void {
    if (!expanded) {
      panelHeight = value;
    }
  }
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>Chat</h1>
</div>

<div class="expand-control">
  <Button
    text={expanded ? 'Collapse panel' : 'Expand panel'}
    onclick={() => (expanded = !expanded)}
  />
</div>

<div class="chat-stage">
  <Resizable
    bind:width={() => liveWidth, setLiveWidth}
    bind:height={() => liveHeight, setLiveHeight}
    minWidth={340}
    maxWidth={640}
    minHeight={420}
    maxHeight={760}
    handles={['right', 'bottom', 'bottom-right']}
    classes="chat-theme chat-card"
  >
    <Chat
      messages={chat.messages}
      bind:value
      bind:attachments
      image="https://picsum.photos/64?random=7"
      title="Shopping Assistant"
      subtitle="Online"
      placeholder="Ask anything…"
      streaming={chat.isStreaming}
      {recording}
      toolStatus={chat.toolStatus}
      suggestions={['Recommend a gift', 'Track my order', 'Return policy?']}
      accept="image/*"
      multiple
      allowCopy
      onsend={(text) => chat.send(text)}
      onstop={() => chat.stop()}
      onretry={() => chat.retry()}
      onvoice={() => (recording = !recording)}
      onattach={() => {}}
      onfeedback={() => {}}
      onclose={() => {}}
    >
      {#snippet headerContent()}
        <div class="header-note">Powered by your own transport — fully decoupled</div>
      {/snippet}

      {#snippet messageAttachments(msg)}
        {@const options = optionsOf(msg.attachments ?? [])}
        {#if options.length > 0}
          <div class="message-options">
            {#each options as option (option.label)}
              <Button text={option.label} onclick={() => chat.send(option.label)} />
            {/each}
          </div>
        {/if}
      {/snippet}
    </Chat>
  </Resizable>
</div>

<p class="demo-note">
  Drag the right / bottom edge or corner to resize, or use the button above to expand the panel with
  an animated scale-up. {liveWidth} × {liveHeight}
</p>

<h2>Empty state — the empty snippet fills the blank transcript</h2>
<div class="chat-theme chat-card empty-frame">
  <Chat
    messages={[]}
    value=""
    title="Shopping Assistant"
    placeholder="Ask anything…"
    onsend={() => {}}
  >
    {#snippet empty()}
      <div class="empty-note">
        <p><strong>No messages yet.</strong></p>
        <p>Ask about an order, a product, or returns — or pick a suggestion below.</p>
      </div>
    {/snippet}
  </Chat>
</div>

<style>
  /* Cascades into the child Resizable, which animates width/height on expand
     (and disables it while drag-resizing / under reduced motion). */
  .chat-stage {
    --resizable-transition:
      width 0.32s cubic-bezier(0.22, 1, 0.36, 1), height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

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
  }

  .message-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    --button-color: transparent;
    --button-text-color: var(--doc-text-primary, #18181b);
    --button-hover-color: var(--doc-btn-hover-bg, #f4f4f5);
    --button-border: 1px solid var(--doc-btn-border, #e4e4e7);
    --button-hover-border: 1px solid var(--doc-btn-border, #e4e4e7);
    --button-padding: 5px 12px;
    --button-font-size: 12px;
    --button-border-radius: 999px;
  }

  .header-note {
    font-size: 11px;
    color: var(--doc-text-muted, #71717a);
    background: var(--doc-accent-bg, #eef2ff);
    border-radius: 999px;
    padding: 3px 10px;
    width: fit-content;
  }

  .empty-frame {
    max-width: 480px;
    height: 360px;
  }

  .empty-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--doc-text-secondary);
  }
</style>
