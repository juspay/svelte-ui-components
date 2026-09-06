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

  // Clamping is a prop, so a parent can withdraw it. The bubble has to fall back to
  // its clamped default when it is restored, rather than staying open.
  let toggleClampLines = $state(4);

  // A streamed assistant turn: text arrives in pieces and the reveal continues from
  // where it left off, then completes the moment streaming stops.
  let streamedMarkdown = $state('');
  let isStreamingDemo = $state(false);
  const startStreamingDemo = () => {
    streamedMarkdown = '';
    isStreamingDemo = true;
    streamedMarkdown = 'Here is a **streamed** reply that types as it arrives.';
  };
  // A deliberately slow reveal. The demo above is paced for a human to watch; at 30ms
  // over 51 characters its partial window is ~1.5s, which a stalled CI runner can step
  // clean over. This one is for the mid-reveal assertion and nothing else.
  let slowMarkdown = $state('');
  let isSlowStreaming = $state(false);
  const startSlowDemo = () => {
    slowMarkdown = '';
    isSlowStreaming = true;
    slowMarkdown = 'A deliberately slow reveal, so the partial window stays open.';
  };
  const finishSlowDemo = () => {
    isSlowStreaming = false;
  };

  const finishStreamingDemo = () => {
    isStreamingDemo = false;
  };

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

<div class="demo-col">
  <h2 id="marker-link-target">Marker</h2>
  <ChatMessage
    role="user"
    testId="marker-demo"
    marker
    content="An accent bar on the bubble's leading edge, at the default offset."
  />
  <ChatMessage
    role="user"
    testId="marker-demo-off"
    content="The same message with no marker — this is the control the test compares against."
  />

  <!-- The case the prop exists for: a surface where neither party has a filled bubble,
       so the bar is the only thing telling the turns apart. -->
  <div class="marker-gutter">
    <ChatMessage
      role="user"
      testId="marker-demo-gutter"
      marker
      classes="marker-flat"
      content="Unfilled, with the bar offset into the gutter beside it."
    />
    <ChatMessage
      role="assistant"
      testId="marker-demo-gutter-reply"
      classes="marker-flat"
      content="The reply on the same flat surface carries no bar, which is the distinction."
    />
  </div>

  <ChatMessage role="user" testId="marker-demo-link" marker>
    {#snippet body()}
      <p>
        <a href="#marker-link-target" data-pw="marker-inner-link">A link at the very start</a>
        sits under the bar's own box, so the bar must not intercept its clicks.
      </p>
    {/snippet}
  </ChatMessage>

  <h2 id="clamp-link-target">Clamped, expandable</h2>
  <ChatMessage
    role="user"
    testId="clamp-demo"
    clampLines={2}
    content="Line one of a message long enough to need collapsing. Line two continues it. Line three is past the clamp and must stay hidden until the bubble is expanded, which is what the test checks."
  />
  <ChatMessage
    role="user"
    testId="clamp-demo-four"
    clampLines={4}
    content="Line one of a message long enough to need collapsing. Line two continues it. Line three is past a two-line clamp. Line four is still within a four-line clamp, and line five is past both, so the two bubbles must not be the same height."
  />

  <ChatMessage role="user" testId="clamp-demo-link" clampLines={2}>
    {#snippet body()}
      <p>
        A clamped message can still contain a
        <a href="#clamp-link-target" data-pw="clamp-inner-link">link</a>, and activating that link
        must not also expand the bubble. Line three exists so there is something to clamp away.
      </p>
    {/snippet}
  </ChatMessage>

  <ChatMessage
    role="user"
    testId="clamp-demo-toggle"
    clampLines={toggleClampLines}
    content="Line one of a message long enough to need collapsing. Line two continues it. Line three is past the clamp and must stay hidden until the bubble is expanded, which is what the test checks."
  />
  <button
    type="button"
    data-pw="clamp-toggle"
    onclick={() => (toggleClampLines = toggleClampLines > 0 ? 0 : 4)}
  >
    Toggle clamping
  </button>
</div>

<div class="demo-col">
  <h2>Progressive reveal</h2>
  <ChatMessage
    role="assistant"
    testId="typewriter-demo"
    typewriter
    typewriterSpeed={30}
    streaming={isStreamingDemo}
    markdown={streamedMarkdown}
  />
  <button type="button" data-pw="typewriter-start" onclick={startStreamingDemo}>Start</button>
  <button type="button" data-pw="typewriter-finish" onclick={finishStreamingDemo}>Finish</button>

  <ChatMessage
    role="assistant"
    testId="typewriter-slow"
    typewriter
    typewriterSpeed={200}
    streaming={isSlowStreaming}
    markdown={slowMarkdown}
  />
  <button type="button" data-pw="typewriter-slow-start" onclick={startSlowDemo}>Start slow</button>
  <button type="button" data-pw="typewriter-slow-finish" onclick={finishSlowDemo}>
    Finish slow
  </button>

  <ChatMessage
    role="assistant"
    testId="typewriter-at-load"
    typewriter
    markdown="A **bold** claim present at first paint."
  />

  <ChatMessage
    role="assistant"
    testId="typewriter-static"
    typewriter
    content="A message that is not streaming shows in full immediately."
  />
</div>

<style>
  .marker-gutter {
    /* Logical, to match the marker's own inset-inline-start: in RTL the bar moves to
       the right gutter, and physical padding would reserve the space on the wrong side. */
    padding-inline-start: 14px;
  }

  /* A genuinely flat surface: no fill on either party, which is the condition that
     leaves the bar as the only thing distinguishing the turns. */
  .marker-gutter :global(.marker-flat) {
    --chat-message-sender-background: transparent;
    --chat-message-sender-color: inherit;
    --chat-message-marker-offset: -14px;
    --chat-message-marker-width: 3px;
    --chat-message-marker-color: #0ea5e9;
  }

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
