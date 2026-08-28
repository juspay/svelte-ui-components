<script lang="ts">
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  import ToolCallLog from '$lib/ToolCallLog/ToolCallLog.svelte';
  import type { ThinkingIndicatorTraceRow } from '$lib/ThinkingIndicator/properties';
  import type { ToolCallChip } from '$lib/ToolCallLog/properties';

  // A settled turn, exactly as it sits in chat history: the trace already
  // finished (busy=false) so it renders as a collapsed, permanent row rather
  // than a live status, and the tool log records what ran to produce the
  // reply. collapseDelayMs=null documents that intent even though a turn
  // that starts collapsed never schedules an auto-collapse timer anyway.
  const settledTraceRows: ThinkingIndicatorTraceRow[] = [
    { primary: 'Reviewed order history', secondary: 'last 6 months' },
    { primary: 'Filtered catalog by price', secondary: 'under $50' },
    { primary: 'Ranked by rating', secondary: '4★ and up' }
  ];

  const markdownReply =
    'Same thing from **markdown** — parsed and sanitized internally:\n\n- Wireless earbuds\n- A scented candle set';

  const settledToolChips: ToolCallChip[] = [
    { label: 'Fetch', meta: 'catalog.json', mono: true, state: 'done' },
    { label: 'Run', meta: 'price-filter', mono: true, state: 'done' }
  ];
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
  <ChatMessage role="responder" markdown={markdownReply} testId="chat-message-markdown" />
  <ChatMessage role="responder" content="" streaming={true} />
</div>

<h2>Settled turn — a persistent trace and tool log in history</h2>
<p class="demo-note">
  What an assistant message looks like once its turn is over: a <code>ThinkingIndicator</code> with
  <code>busy={false}</code> stays a collapsed, always-visible row above the bubble instead of a live
  status, and a <code>ToolCallLog</code> beneath it records the tools that produced the reply — both
  composed straight around this same <code>ChatMessage</code>, no new component involved.
</p>
<div class="chat-theme demo-col">
  <div class="assistant-turn" data-pw="chat-message-settled-turn">
    <ThinkingIndicator
      label="Thought for 4 seconds"
      kind="steps"
      rows={settledTraceRows}
      busy={false}
      collapseDelayMs={null}
      testId="chat-message-settled-trace"
    />
    <ChatMessage
      role="responder"
      content="Sure! Wireless earbuds and a scented candle set both land under $50 and ship by Friday."
      testId="chat-message-settled-bubble"
    />
    <ToolCallLog chips={settledToolChips} testId="chat-message-settled-tools" />
  </div>
</div>

<style>
  .demo-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 480px;
  }

  .assistant-turn {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-self: flex-start;
    max-width: 100%;
    --chat-message-max-width: 100%;
  }
</style>
