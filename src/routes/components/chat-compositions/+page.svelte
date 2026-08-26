<script lang="ts">
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  import Card from '$lib/Card/Card.svelte';
  import Gauge from '$lib/Gauge/Gauge.svelte';
  import Button from '$lib/Button/Button.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';
  import type { ThinkingIndicatorTraceRow } from '$lib/ThinkingIndicator/properties';

  const assistantMessageId = 'assistant-1';

  const transcript: ChatMessageData[] = [
    { id: 'user-1', role: 'user', content: 'How is the waffle cone inventory looking?' },
    {
      id: assistantMessageId,
      role: 'assistant',
      content:
        "At the current sell-through rate you have about 4 days of waffle cones left — I'd reorder from Joy Cone today to avoid a weekend stockout."
    }
  ];

  const traceRows: ThinkingIndicatorTraceRow[] = [
    { primary: 'Checked current stock', secondary: '340 units' },
    { primary: 'Compared to weekend sell-through', secondary: '85 units/day' },
    { primary: 'Estimated days of cover remaining' }
  ];

  let decision = $state<'approved' | 'denied' | null>(null);
  let replayKey = $state(0);

  const replay = (): void => {
    replayKey += 1;
    decision = null;
  };
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>Chat compositions</h1>
</div>

<p class="intro">
  Two reference patterns built entirely from existing components — no new component is needed for
  either. <code>ThinkingIndicator</code> settles into a persistent, collapsed row inside chat
  history, and <code>Gauge</code> drops into a <code>Card</code> header to build an approve/deny recommendation
  card.
</p>

<div class="replay-row">
  <Button text="Replay entrance" onclick={replay} testId="chat-compositions-replay" />
</div>

<h2>Persistent trace in history</h2>
<p class="section-note">
  <code>ChatMessageList</code>'s <code>message</code> snippet renders one root element per row, so
  the assistant turn pairs a settled <code>ThinkingIndicator</code>
  (<code>busy=false</code>, <code>expanded=false</code>, <code>collapseDelayMs=null</code>) with its
  <code>ChatMessage</code> bubble — the trace stays visible, collapsed, as part of the permanent record
  instead of auto-hiding a few seconds after it settles.
</p>
{#key replayKey}
  <div class="entrance chat-theme transcript-frame">
    <ChatMessageList messages={transcript} jump={false} testId="chat-compositions-transcript">
      {#snippet message(msg)}
        {#if msg.id === assistantMessageId}
          <div class="assistant-turn" data-pw="chat-compositions-assistant-turn">
            <ThinkingIndicator
              label="Thought for 3 seconds"
              kind="steps"
              rows={traceRows}
              busy={false}
              expanded={false}
              collapseDelayMs={null}
              testId="chat-compositions-trace"
            />
            <ChatMessage
              role={msg.role}
              content={msg.content}
              testId="chat-compositions-assistant-message"
            />
          </div>
        {:else}
          <ChatMessage
            role={msg.role}
            content={msg.content}
            testId="chat-compositions-user-message"
          />
        {/if}
      {/snippet}
    </ChatMessageList>
  </div>
{/key}

<h2>Recommendation card</h2>
<p class="section-note">
  <code>HITL</code> has no slot for arbitrary children, so a confidence <code>Gauge</code> can't sit
  inside it — this composes <code>Card</code>'s <code>headerRight</code> snippet for the gauge and
  its <code>footer</code> snippet for the approve/deny actions instead.
</p>
{#key replayKey}
  <div class="entrance recommendation-frame">
    <Card
      title="Restock recommendation"
      description="Waffle cones, based on the last 7 days"
      testId="chat-compositions-recommendation"
    >
      {#snippet headerRight()}
        <Gauge
          value={82}
          showLabel
          classes="confidence-gauge"
          ariaLabel="82% confidence"
          testId="chat-compositions-confidence"
        />
      {/snippet}
      <p class="recommendation-copy">
        Sell-through says 4 days of cover left. Reorder 600 units from Joy Cone today to avoid a
        stockout over the weekend rush.
      </p>
      {#snippet footer()}
        <div class="recommendation-actions">
          <Button
            text="Approve"
            variant="primary"
            onclick={() => (decision = 'approved')}
            testId="chat-compositions-approve"
          />
          <Button
            text="Deny"
            variant="secondary"
            classes="deny-action"
            onclick={() => (decision = 'denied')}
            testId="chat-compositions-deny"
          />
        </div>
        {#if decision !== null}
          <p class="decision-note" data-pw="chat-compositions-decision">Recorded: {decision}</p>
        {/if}
      {/snippet}
    </Card>
  </div>
{/key}

<style>
  @keyframes chat-compositions-fade-up {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .intro {
    max-width: 620px;
    color: var(--doc-text-primary);
  }

  .replay-row {
    margin: 12px 0 28px;
  }

  .section-note {
    max-width: 620px;
    font-size: 0.875rem;
    color: var(--doc-text-muted);
    margin: 0 0 14px;
  }

  .transcript-frame {
    max-width: 480px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--doc-input-bg);
    box-shadow: 0 0 0 1px var(--doc-border);
    margin-bottom: 32px;
  }

  .assistant-turn {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-self: flex-start;
    max-width: 82%;
    --chat-message-max-width: 100%;
  }

  .recommendation-frame {
    max-width: 420px;
    margin-bottom: 24px;
    /* Card defaults to `background: inherit`, so without this it picks up
       whichever ambient background it happens to sit on (the page body in
       light, which is near-black in dark) instead of a real card surface. */
    --card-background: var(--doc-input-bg);
    --card-border: 1px solid var(--doc-border);
  }

  .recommendation-copy {
    margin: 0;
    color: var(--doc-text-primary);
  }

  .recommendation-actions {
    display: flex;
    gap: 10px;
  }

  .decision-note {
    margin: 10px 0 0;
    font-size: 0.8125rem;
    color: var(--doc-text-muted);
  }

  .entrance {
    animation: chat-compositions-fade-up 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }

  :global(.confidence-gauge) {
    --gauge-size: 56px;
    --gauge-label-font-size: 13px;
    /* Gauge's own default label ink (#333) reads fine on a white card but is
       all but invisible on the dark card surface above — read the same ink
       the card title already renders in. */
    --gauge-label-color: var(--doc-text-primary);
  }

  /* Button's secondary variant hardcodes its resting text ink (#3a4550,
     near-black) with no dark counterpart, so on the dark card surface above
     the Deny button's label disappears. Only the resting state needs it —
     the hover state keeps the variant's own dark-on-light-hover pairing,
     which stays readable in both themes since the hover background isn't
     theme-aware either. */
  :global(.deny-action) {
    --button-text-color: var(--doc-text-primary);
  }

  @media (prefers-reduced-motion: reduce) {
    .entrance {
      animation-duration: 0.001s;
    }
  }
</style>
