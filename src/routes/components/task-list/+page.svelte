<script lang="ts">
  import { onMount } from 'svelte';
  import TaskList from '$lib/TaskList/TaskList.svelte';
  import Button from '$lib/Button/Button.svelte';
  import type { TaskListRow, TaskStatus } from '$lib/TaskList/properties';

  const ROWS_TEMPLATE: Array<Omit<TaskListRow, 'status'>> = [
    { label: 'Scan repository structure', secondary: '128 files' },
    { label: 'Draft migration plan' },
    {
      label: 'Apply schema changes',
      secondary: 'migrations/0007_add_index.sql',
      mono: true,
      retryLabel: 'Retry'
    },
    { label: 'Verify deployment', secondary: 'staging' }
  ];

  const STATIC_ROWS: TaskListRow[] = [
    { label: 'Scan repository structure', secondary: '128 files', status: 'done' },
    { label: 'Draft migration plan', status: 'done' },
    {
      label: 'Apply schema changes',
      secondary: 'migrations/0007_add_index.sql',
      mono: true,
      status: 'failed'
    },
    { label: 'Verify deployment', secondary: 'staging', status: 'pending' }
  ];

  const toPendingRow = (row: Omit<TaskListRow, 'status'>): TaskListRow => {
    return { ...row, status: 'pending' };
  };

  // Showcase choreography: the host owns every status change and every timer.
  // Cadence: row 0 starts, finishes; row 1 starts, finishes; row 2 starts, then
  // FAILS; after a grace beat, an automatic retry fires unless the visitor
  // already clicked Retry — either path resolves row 2, then cascades row 3
  // to completion the same way.
  const BEAT_DELAYS = [600, 900, 2400, 1400, 2400, 600];

  let rows = $state<TaskListRow[]>(ROWS_TEMPLATE.map(toPendingRow));
  let timers: ReturnType<typeof setTimeout>[] = [];

  const setStatus = (index: number, status: TaskStatus): void => {
    const row = rows[index];
    if (!row) {
      return;
    }
    rows[index] = { ...row, status };
  };

  const completeRetry = (index: number): void => {
    setStatus(index, 'running');
    timers.push(
      setTimeout(() => {
        setStatus(index, 'done');
        const nextIndex = index + 1;
        if (rows[nextIndex]) {
          setStatus(nextIndex, 'running');
          timers.push(
            setTimeout(() => {
              setStatus(nextIndex, 'done');
            }, BEAT_DELAYS[1])
          );
        }
      }, BEAT_DELAYS[5])
    );
  };

  const handleRetry = (index: number): void => {
    if (rows[index]?.status !== 'failed') {
      return;
    }
    completeRetry(index);
  };

  const replay = (): void => {
    timers.forEach(clearTimeout);
    timers = [];
    rows = ROWS_TEMPLATE.map(toPendingRow);

    let elapsed = 0;
    const at = (delayMs: number, action: () => void): void => {
      elapsed += delayMs;
      timers.push(setTimeout(action, elapsed));
    };

    at(BEAT_DELAYS[0], () => setStatus(0, 'running'));
    at(BEAT_DELAYS[1], () => {
      setStatus(0, 'done');
      setStatus(1, 'running');
    });
    at(BEAT_DELAYS[2], () => {
      setStatus(1, 'done');
      setStatus(2, 'running');
    });
    at(BEAT_DELAYS[3], () => setStatus(2, 'failed'));
    at(BEAT_DELAYS[4], () => {
      if (rows[2]?.status === 'failed') {
        completeRetry(2);
      }
    });
  };

  onMount(() => {
    replay();
    return () => timers.forEach(clearTimeout);
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>TaskList</h1>
</div>

<p class="intro">
  An agent work-plan list with a real per-row status machine: a dim pending dot, a spinning running
  ring, a pop-in done check, or a failed cross with an optional inline retry. Rows fade up as
  they're appended, and the leading glyph transitions with a short fade whenever a row's <code
    >status</code
  > changes. The host drives every transition — the component never invents its own timing.
</p>

<h2>Live — a work plan runs, one row fails, then recovers</h2>
<div class="demo-row">
  <div class="task-host">
    <TaskList {rows} onretry={handleRetry} testId="task-list-demo" />
  </div>
  <Button text="Replay" onclick={() => replay()} testId="task-list-replay" />
</div>

<h2>Settled — a finished run rendered read-only</h2>
<div class="demo-row">
  <div class="task-host">
    <TaskList rows={STATIC_ROWS} testId="task-list-history" />
  </div>
</div>

<style>
  .intro {
    max-width: 620px;
    color: var(--doc-text-primary);
  }
  .demo-row {
    margin: 12px 0 28px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .task-host {
    width: 100%;
    max-width: 480px;
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--doc-input-bg);
    box-shadow: 0 0 0 1px var(--doc-border);
  }
</style>
