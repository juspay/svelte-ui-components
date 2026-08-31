<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  import Button from '$lib/Button/Button.svelte';
  import type {
    ThinkingIndicatorKind,
    ThinkingIndicatorTraceRow
  } from '$lib/ThinkingIndicator/properties';

  let expanded = $state(false);

  // Elapsed-counter showcase: the status line runs busy for 4s, then settles —
  // the counter freezes at its final value next to the settled summary.
  let elapsedDetail = $state<string | null>(null);
  let elapsedTimers: ReturnType<typeof setTimeout>[] = [];

  const replayElapsed = (): void => {
    elapsedTimers.forEach(clearTimeout);
    elapsedTimers = [];
    elapsedDetail = null;
    elapsedTimers.push(
      setTimeout(() => {
        elapsedDetail =
          'Looked up the last 30 days of refunds, grouped them by payment method, and compared totals against the previous period before drafting the summary.';
      }, 4000)
    );
  };

  // ---- Reasoning trace showcase ----

  type TraceScenario = {
    activeLabel: string;
    settledLabel: string;
    rows: ThinkingIndicatorTraceRow[];
    query?: string;
    moreLabel?: string;
    selectable?: boolean;
  };

  const traceScenarios: Record<ThinkingIndicatorKind, TraceScenario> = {
    steps: {
      activeLabel: 'Thinking',
      settledLabel: 'Thought for 4 seconds',
      rows: [
        { primary: 'Scanning weekly sales', secondary: '6 flavors' },
        { primary: 'Comparing to last month' },
        { primary: 'Checking supplier invoices' },
        { primary: 'Drafting summary' }
      ]
    },
    reasoning: {
      activeLabel: 'Thinking',
      settledLabel: 'Thought for 4 seconds',
      rows: [
        {
          primary:
            'Weekend sales spike correlates with the heatwave — separating weather lift from promo lift first.'
        },
        {
          primary:
            'Waffle cones outsold cups 3:1 above 28°C; margin holds even with the topping bundle.'
        },
        { primary: 'The Tuesday dip repeats across four weeks, so it is structural, not noise.' }
      ]
    },
    search: {
      activeLabel: 'Searching the web',
      settledLabel: 'Searched 10 sources',
      query: 'best waffle cone supplier',
      moreLabel: '+7 more',
      rows: [
        {
          primary: 'Joy Cone wholesale pricing',
          secondary: 'joycone.com',
          href: 'https://example.com'
        },
        {
          primary: 'Cone supplier comparison 2026',
          secondary: 'scoopdata.io',
          href: 'https://example.com'
        },
        {
          primary: 'Regional distributor reviews',
          secondary: 'marketbasket.io',
          href: 'https://example.com'
        }
      ]
    },
    coding: {
      activeLabel: 'Writing code',
      settledLabel: 'Edited 2 files',
      selectable: true,
      rows: [
        { primary: 'Read', secondary: 'flavors.ts', mono: true },
        { primary: 'Edit', secondary: 'ChurnSchedule.tsx', mono: true, added: 74, removed: 41 },
        { primary: 'Run', secondary: 'npm run freeze', mono: true }
      ]
    }
  };

  // Showcase choreography: the host owns busy/rows; this recreates the reference
  // cadence — busy at mount, rows arriving in two waves, settle at 3.2s.
  const WAVE_DELAYS = [800, 600, 1800];

  let traceKind = $state<ThinkingIndicatorKind>('steps');
  let traceBusy = $state(true);
  let shownRows = $state<ThinkingIndicatorTraceRow[]>([]);
  let followUpVisible = $state(false);
  let traceSelected = $state<number | null>(null);
  let traceTimers: ReturnType<typeof setTimeout>[] = [];

  const replayTrace = (nextKind: ThinkingIndicatorKind = traceKind): void => {
    traceTimers.forEach(clearTimeout);
    traceTimers = [];
    traceKind = nextKind;
    traceBusy = true;
    shownRows = [];
    followUpVisible = false;
    traceSelected = null;
    const all = traceScenarios[nextKind].rows;
    let elapsed = 0;
    const waves: ThinkingIndicatorTraceRow[][] = [[], all.slice(0, 2), all];
    WAVE_DELAYS.forEach((delay, waveIndex) => {
      elapsed += delay;
      traceTimers.push(
        setTimeout(() => {
          shownRows = waves[waveIndex + 1] ?? all;
          if (waveIndex === WAVE_DELAYS.length - 1) {
            traceBusy = false;
          }
        }, elapsed)
      );
    });
  };

  const traceKinds: ThinkingIndicatorKind[] = ['steps', 'reasoning', 'search', 'coding'];

  const traceScenario = $derived(traceScenarios[traceKind]);
  const traceLabel = $derived(traceBusy ? traceScenario.activeLabel : traceScenario.settledLabel);

  onMount(() => {
    replayElapsed();
    replayTrace('steps');
    return () => {
      elapsedTimers.forEach(clearTimeout);
      traceTimers.forEach(clearTimeout);
    };
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ThinkingIndicator</h1>
</div>

<h2>Status line — shimmering label with the built-in spinner</h2>
<div class="demo-row">
  <ThinkingIndicator label="Working on your refund summary…" />
</div>

<h2>Status line — with an image avatar</h2>
<div class="demo-row">
  <ThinkingIndicator label="Working on your refund summary…">
    {#snippet avatar()}
      <img class="assistant-avatar" src="{base}/demo-media/assistant-avatar.png" alt="" />
    {/snippet}
  </ThinkingIndicator>
</div>

<h2>Expandable — a detail string makes it a disclosure</h2>
<div class="demo-row">
  <ThinkingIndicator
    label="Thought for 6 seconds"
    detail="Looked up the last 30 days of refunds, grouped them by payment method, and compared the totals against the previous period before drafting the summary."
    bind:expanded
  />
</div>

<h2>Expandable — with an image avatar</h2>
<div class="demo-row">
  <ThinkingIndicator
    label="Thought for 12 seconds"
    detail="Compared conversion by device class, checked the two campaigns that changed this week, and ruled out the pricing experiment before answering."
    expanded={false}
  >
    {#snippet avatar()}
      <img class="assistant-avatar" src="{base}/demo-media/assistant-avatar.png" alt="" />
    {/snippet}
  </ThinkingIndicator>
</div>

<h2>Bare — label only, for use inside a chat bubble</h2>
<div class="demo-row">
  <ThinkingIndicator label="Analyzing your storefront…" variant="bare" />
</div>

<p class="demo-note">
  The bare variant deliberately ignores the <code>avatar</code> snippet — it renders inside a chat bubble
  whose surrounding UI already supplies the avatar and layout.
</p>

<h2>Chip — self-contained floating pill, static label by default</h2>
<div class="demo-row">
  <ThinkingIndicator
    label="Searching the catalog…"
    variant="chip"
    testId="thinking-indicator-chip-static-demo"
  />
</div>
<div class="demo-row">
  <ThinkingIndicator
    label="Searching the catalog…"
    variant="chip"
    busy
    testId="thinking-indicator-chip-busy-demo"
  />
</div>

<p class="demo-note">
  What <code>Chat</code> renders internally for its <code>toolStatus</code> prop, replacing the
  deprecated <code>ChatToolStatus</code>. Unlike every other variant, <code>chip</code> defaults to
  a static label — pass <code>busy</code> to shimmer it (second example above).
</p>

<h2>Custom avatar snippet</h2>
<div class="demo-row">
  <ThinkingIndicator label="Calling the catalog tool…">
    {#snippet avatar()}
      <span style="font-size: 1.25rem; line-height: 1;">✨</span>
    {/snippet}
  </ThinkingIndicator>
</div>

<h2>Status line — elapsed counter</h2>
<div class="demo-row elapsed-demo-row">
  <ThinkingIndicator
    label={elapsedDetail ? 'Thought for 4 seconds' : 'Working on your refund summary…'}
    showElapsed
    testId="thinking-indicator-elapsed-demo"
    {...elapsedDetail ? { detail: elapsedDetail } : {}}
  />
  <Button text="Replay" onclick={replayElapsed} testId="thinking-indicator-elapsed-replay" />
</div>
<p class="demo-note">
  The counter starts at 0 when the status line goes live, ticks every second, and freezes at its
  final value once the reasoning settles into <code>detail</code>.
</p>

<h2>Reasoning trace — pick a kind, watch the machine run</h2>
<p class="demo-note">
  Passing <code>rows</code> and <code>busy</code> switches the disclosure body to a kind-aware
  trace: a checklist with a live frontier spinner, prose reasoning, linked sources with toned
  badges, or selectable file edits with diff stats. One shared machine drives all four — auto-open
  while busy, rows staggering in as they stream, a shimmer label that settles into a summary, an
  <code>onsettled</code> hook to gate the reply, and an automatic post-settle collapse the user's own
  toggle overrides.
</p>
<div class="demo-row">
  <div class="kind-switch">
    {#each traceKinds as availableKind (availableKind)}
      <Button
        text={availableKind[0].toUpperCase() + availableKind.slice(1)}
        classes={traceKind === availableKind ? 'kind-on' : ''}
        onclick={() => replayTrace(availableKind)}
        testId="thinking-indicator-trace-kind-{availableKind}"
      />
    {/each}
    <Button text="Replay" onclick={() => replayTrace()} testId="thinking-indicator-trace-replay" />
  </div>
  <div class="trace-host">
    <ThinkingIndicator
      label={traceLabel}
      kind={traceKind}
      rows={shownRows}
      busy={traceBusy}
      query={traceScenario.query}
      moreLabel={traceScenario.moreLabel}
      selectable={traceScenario.selectable ?? false}
      bind:selected={traceSelected}
      onsettled={() => (followUpVisible = true)}
      testId="thinking-indicator-trace-demo"
    />
    {#if followUpVisible}
      <p class="follow-up" data-pw="thinking-indicator-trace-follow-up">
        Based on that, winter promos should lead with the waffle-cone bundle.
      </p>
    {/if}
  </div>
</div>

<h2>Reasoning trace — settled, manual disclosure (history rendering)</h2>
<div class="demo-row">
  <div class="trace-host">
    <ThinkingIndicator
      label="Thought for 4 seconds"
      kind="steps"
      rows={traceScenarios.steps.rows}
      busy={false}
      collapseDelayMs={null}
      expanded={false}
      testId="thinking-indicator-trace-history"
    />
  </div>
</div>

<style>
  .assistant-avatar {
    display: block;
    width: 20px;
    height: 20px;
  }

  .elapsed-demo-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .kind-switch {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .kind-switch :global(.kind-on) {
    --button-color: var(--doc-accent-subtle-bg);
  }

  .trace-host {
    max-width: 520px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--doc-input-bg);
    box-shadow: 0 0 0 1px var(--doc-border);
  }

  .follow-up {
    margin: 12px 0 0;
    animation: follow-up-in 400ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }

  @keyframes follow-up-in {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
