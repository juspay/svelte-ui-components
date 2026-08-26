<script lang="ts">
  import { onMount } from 'svelte';
  import ToolCallLog from '$lib/ToolCallLog/ToolCallLog.svelte';
  import Button from '$lib/Button/Button.svelte';
  import type { ToolCallChip } from '$lib/ToolCallLog/properties';

  const READ_CHIP: ToolCallChip = {
    label: 'Read',
    meta: 'flavors.ts',
    mono: true,
    state: 'done'
  };
  const EDIT_CHIP: ToolCallChip = {
    label: 'Edit',
    meta: 'ChurnSchedule.tsx',
    mono: true,
    state: 'done',
    added: 74,
    removed: 41,
    detail:
      '- const cadence = weeklySchedule(flavors);\n+ const cadence = seasonalSchedule(flavors, weather);'
  };
  const RUN_CHIP: ToolCallChip = {
    label: 'Run',
    meta: 'npm run freeze',
    mono: true,
    state: 'running'
  };
  const ERROR_CHIP: ToolCallChip = {
    label: 'Fetch',
    meta: 'supplier API',
    mono: true,
    state: 'error',
    detail: 'GET https://supplier.example.com/v1/stock timed out after 8000ms.'
  };

  const settledChips: ToolCallChip[] = [
    { ...READ_CHIP },
    { ...EDIT_CHIP },
    { ...RUN_CHIP, state: 'done' },
    { ...ERROR_CHIP }
  ];

  // Showcase choreography: a turn's tools land one per 700ms, the Run chip stays
  // `running` for 1.6s before settling, and the log ends with an error chip.
  const CHIP_INTERVAL_MS = 700;
  const RUN_DURATION_MS = 1600;
  const RUN_CHIP_INDEX = 2;

  let liveChips = $state<ToolCallChip[]>([]);
  let lastClickedLabel = $state<string | null>(null);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const replay = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
    liveChips = [];
    lastClickedLabel = null;

    timers.push(
      setTimeout(() => {
        liveChips = [...liveChips, { ...READ_CHIP }];
      }, CHIP_INTERVAL_MS)
    );
    timers.push(
      setTimeout(() => {
        liveChips = [...liveChips, { ...EDIT_CHIP }];
      }, CHIP_INTERVAL_MS * 2)
    );
    timers.push(
      setTimeout(() => {
        liveChips = [...liveChips, { ...RUN_CHIP }];
      }, CHIP_INTERVAL_MS * 3)
    );
    timers.push(
      setTimeout(
        () => {
          liveChips = liveChips.map((chip, index) =>
            index === RUN_CHIP_INDEX ? { ...chip, state: 'done' } : chip
          );
        },
        CHIP_INTERVAL_MS * 3 + RUN_DURATION_MS
      )
    );
    timers.push(
      setTimeout(() => {
        liveChips = [...liveChips, { ...ERROR_CHIP }];
      }, CHIP_INTERVAL_MS * 4)
    );
  };

  const handleChipClick = (_index: number, chip: ToolCallChip): void => {
    lastClickedLabel = chip.label;
  };

  onMount(() => {
    replay();
    return () => timers.forEach(clearTimeout);
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ToolCallLog</h1>
</div>

<p class="intro">
  A chip log of an agent turn's tool calls: a wrapping row of pill buttons, each carrying a state —
  a live spinner while <code>running</code>, default ink once <code>done</code>, red-toned on
  <code>error</code> — plus <code>+N</code>/<code>−N</code> diff-stat pills. A chip with a
  <code>detail</code> string is expandable into a popover anchored below it; only one popover is
  open at a time. Unlike <code>ChatToolStatus</code> (a single one-line "using a tool now" status
  that disappears when the turn settles), <code>ToolCallLog</code> is the persistent record that stays
  in the transcript after the turn.
</p>

<h2>Live — a turn's tools land as they run</h2>
<div class="demo-row">
  <div class="demo-controls">
    <Button text="Replay" onclick={() => replay()} testId="tool-call-log-replay" />
  </div>
  <div class="log-host">
    <ToolCallLog chips={liveChips} onchipclick={handleChipClick} testId="tool-call-log-live-demo" />
    {#if lastClickedLabel !== null}
      <p class="click-note" data-pw="tool-call-log-click-note">Clicked: {lastClickedLabel}</p>
    {/if}
  </div>
</div>

<h2>Settled — a static log with an openable detail popover</h2>
<div class="demo-row">
  <div class="log-host">
    <ToolCallLog
      chips={settledChips}
      onchipclick={handleChipClick}
      testId="tool-call-log-settled-demo"
    />
  </div>
</div>

<h2>Detail popover — escapes a clipping card</h2>
<p class="intro">
  The detail popover portals to <code>document.body</code> and positions itself with
  <code>position: fixed</code> against the chip's live anchor rect (Menu's portal placement math,
  reused). An <code>overflow: hidden</code> ancestor — a chat bubble, a narrow card — can never clip it.
  Open the chip below: the popover renders in full despite the clipping card it lives in, and stays anchored
  under it while the card scrolls.
</p>
<div class="clipper" data-pw="tool-call-log-clipper">
  <span class="clipper-label">overflow: hidden card</span>
  <ToolCallLog
    chips={[{ ...EDIT_CHIP }]}
    onchipclick={handleChipClick}
    testId="tool-call-log-clip-demo"
  />
</div>

<style>
  .intro {
    max-width: 640px;
    color: var(--doc-text-primary);
  }
  .demo-row {
    margin: 12px 0 28px;
  }
  .demo-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .log-host {
    max-width: 620px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--doc-input-bg);
    box-shadow: 0 0 0 1px var(--doc-border);
  }
  .click-note {
    margin: 12px 0 0;
    animation: click-note-in 400ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }
  @keyframes click-note-in {
    from {
      opacity: 0;
      transform: translateY(9px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Small, fixed-height, overflow-clipping card — proves the popover escapes
     via its document.body portal instead of being cut off (mirrors Menu's
     usePortal clipping demo). */
  .clipper {
    width: 220px;
    height: 90px;
    overflow: hidden;
    border: 1px dashed #bbb;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0 28px;
  }
  .clipper-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: #888;
  }
</style>
