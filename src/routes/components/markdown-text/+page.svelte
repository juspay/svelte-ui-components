<script lang="ts">
  import MarkdownText from '$lib/MarkdownText/MarkdownText.svelte';
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';

  const assistantReply = [
    '## Order summary',
    '',
    'Your store processed **12 orders** today — zero payment failures.',
    '',
    '| Status | Count |',
    '| --- | --- |',
    '| Paid | 11 |',
    '| COD | 1 |',
    '',
    'Retry a failed sync with:',
    '',
    '```bash',
    'breeze sync --orders --since=today',
    '```',
    '',
    '> COD orders confirm automatically once the call completes.',
    '',
    'Full details in the [orders dashboard](https://example.com/orders).'
  ].join('\n');

  // Every construct here is an attack in the source and inert text in the
  // output — this block exists so the demo page proves the security model
  // instead of asserting it.
  const hostileSource = [
    'A reply that tries everything at once:',
    '',
    '<script>alert("xss")<' + '/script>',
    '',
    'Inline <img src=x onerror=alert(1)> injection,',
    'a [javascript link](javascript:alert(1)),',
    'a [data link](data:text/html,<b>x</b>),',
    'and an entity-smuggled [protocol](jav&#x09;ascript:alert(1)).'
  ].join('\n');

  const twoLines = 'roses are red\nviolets are blue';

  // Six columns of real order data, in a panel narrower than the table needs. A
  // model asked for a summary answers in exactly this shape, and a chat bubble
  // is never wide enough for it — so the overflow behaviour is the common case,
  // not an edge case.
  const wideTable = [
    '| Order ID | Customer | Payment method | Status | Amount | Created |',
    '| --- | --- | --- | --- | --- | --- |',
    '| ORD-100001 | Priya Raghunathan | Netbanking (HDFC) | Completed | 12,500.00 | 2026-09-01 10:22 |',
    '| ORD-100002 | Sundaram Venkatesh | UPI Collect | Pending capture | 3,499.50 | 2026-09-01 11:04 |'
  ].join('\n');
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>MarkdownText</h1>
</div>

<h2>A model reply, rendered</h2>
<p class="demo-note">
  Headings, tables, fenced code, blockquotes and links — the constructs LLM replies actually use —
  from one <code>markdown</code> prop. No sanitizer to configure: safety is built into the renderer.
</p>
<div class="demo-panel">
  <MarkdownText markdown={assistantReply} testId="markdown-text-reply" />
</div>

<h2>Inside ChatMessage</h2>
<p class="demo-note">
  <code>ChatMessage</code> accepts the same source via its <code>markdown</code> prop and renders it
  through this pipeline — one prop replaces the render-then-inject dance around <code>html</code>.
</p>
<div class="chat-theme demo-col">
  <ChatMessage role="user" content="How did the store do today?" />
  <ChatMessage role="assistant" markdown={assistantReply} testId="markdown-text-chat-message" />
</div>

<h2>Hostile input stays text</h2>
<p class="demo-note">
  The source below carries raw HTML, an inline event handler, and three unsafe link protocols. All
  of it renders as visible, inert text — nothing executes, no anchor keeps an unsafe protocol.
</p>
<div class="demo-panel">
  <MarkdownText markdown={hostileSource} testId="markdown-text-hostile" />
</div>

<h2>A table wider than the message</h2>
<p class="demo-note">
  The table scrolls inside itself, so the message around it does not. Its columns stay aligned
  across header and body while it does.
</p>
<div class="demo-panel">
  <MarkdownText markdown={wideTable} testId="markdown-text-wide-table" />
</div>

<h2>A named table region</h2>
<p class="demo-note">
  Passing <code>tableLabel</code> names the scroll region, which is what makes
  <code>role="region"</code> useful. Without it the wrapper is still keyboard-scrollable but announces
  no landmark, because an unnamed region is worse than none.
</p>
<div class="demo-panel">
  <MarkdownText
    markdown={wideTable}
    tableLabel="Recent orders"
    testId="markdown-text-labelled-table"
  />
</div>

<h2>Line breaks</h2>
<p class="demo-note">
  Default follows the markdown spec (single newlines flow together); <code>breaks</code> renders
  them as <code>&lt;br&gt;</code> — the mode most chat transcripts want.
</p>
<div class="demo-panel demo-row">
  <div class="demo-half">
    <h3>breaks=false</h3>
    <MarkdownText markdown={twoLines} />
  </div>
  <div class="demo-half">
    <h3>breaks=true</h3>
    <MarkdownText markdown={twoLines} breaks={true} />
  </div>
</div>

<style>
  .demo-panel {
    padding: 16px;
    border: 1px solid var(--doc-border, #e4e4e7);
    border-radius: 10px;
    max-width: 560px;
  }

  .demo-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 480px;
  }

  .demo-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .demo-half {
    flex: 1;
    min-width: 200px;
  }

  .demo-half h3 {
    font-size: 0.85rem;
    margin: 0 0 8px;
  }
</style>
