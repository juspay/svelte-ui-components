# TaskList

An agent work-plan list with a real per-row status machine. Rows fade up as they're appended, and
each row's leading glyph transitions between four states as the host updates its `status`: a dim
**pending** dot, a spinning **running** ring, a pop-in **done** check, or a **failed** cross with
an optional inline retry button. The host owns every state change — the component never invents
its own timings, so it fits any polling/streaming/websocket cadence a caller drives it with.

Unlike `Stepper` (a linear, navigable form wizard with a `currentStepIndex`) and `CheckListItem` (a
single static, user-toggleable checkbox row), `TaskList` renders a whole host-driven list whose rows
move through their own independent status machine — no navigation, no user toggling, just work
progressing and, on failure, a retry.

## Usage

```svelte
<script lang="ts">
  import { TaskList } from '@juspay/svelte-ui-components';
  import type { TaskListRow } from '@juspay/svelte-ui-components';

  let rows = $state<TaskListRow[]>([
    { label: 'Read repository structure', status: 'done' },
    { label: 'Draft migration plan', status: 'running' },
    { label: 'Apply schema changes', status: 'pending' }
  ]);

  const handleRetry = (index: number) => {
    rows[index] = { ...rows[index], status: 'running' };
    // ...re-run the task, then flip status to 'done' or 'failed' again
  };
</script>

<TaskList {rows} onretry={handleRetry} />
```

## Props

| Prop      | Type                      | Default | Description                                                                                                              |
| --------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `rows`    | `TaskListRow[]`           | —       | The work-plan rows, host-owned. Append rows or flip `status` in place — newly appended rows stagger in at 120ms steps.   |
| `onretry` | `(index: number) => void` | —       | Fires when a failed row's retry button is clicked, with that row's index.                                                |
| `testId`  | `string`                  | —       | `data-pw`/`testID` on the root; each row gets `<testId>-row-<index>`, and its retry button `<testId>-row-<index>-retry`. |
| `classes` | `string`                  | —       | Extra classes on the root.                                                                                               |

### TaskListRow

| Field        | Type                                           | Description                                                                |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `label`      | `string`                                       | The task/step description.                                                 |
| `secondary`  | `string?`                                      | A count, file, or command shown after the label.                           |
| `mono`       | `boolean?`                                     | Render `secondary` in the mono face.                                       |
| `status`     | `'pending' \| 'running' \| 'failed' \| 'done'` | Current state of the row's status machine.                                 |
| `retryLabel` | `string?`                                      | Failed rows only: when set, renders an inline retry button with this text. |

## CSS Variables

| Variable                                                        | Default                               | Description                                                                 |
| --------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `--task-list-ease`                                              | `cubic-bezier(0.23, 1, 0.32, 1)`      | The curve behind row entrances and the check pop-in.                        |
| `--task-list-row-gap`                                           | `10px`                                | Vertical gap between rows.                                                  |
| `--task-list-row-inline-gap`                                    | `10px`                                | Gap between the glyph and the row text.                                     |
| `--task-list-glyph-size`                                        | `16px`                                | The fixed-size box the status glyph renders in.                             |
| `--task-list-dot-color`                                         | `#9a9a9a`                             | Pending status dot.                                                         |
| `--task-list-spinner-color` / `--task-list-spinner-track-color` | `#6b6b6b` / `#dcdcdc`                 | Running status spinner (library `Loader`'s gradient leading/trailing edge). |
| `--task-list-spinner-size`                                      | `11px`                                | Running status spinner diameter.                                            |
| `--task-list-done-color`                                        | `#6b6b6b`                             | Done status check ink.                                                      |
| `--task-list-error-color`                                       | `#c93f38`                             | Failed status cross ink.                                                    |
| `--task-list-pending-opacity`                                   | `0.55`                                | Row text opacity while the row is pending.                                  |
| `--task-list-row-color`                                         | `#2b2b2b`                             | Row label ink.                                                              |
| `--task-list-row-weight`                                        | `500`                                 | Row label font weight.                                                      |
| `--task-list-row-font-size` / `--task-list-secondary-font-size` | `0.875rem` / `0.75rem`                | Row type scale.                                                             |
| `--task-list-secondary-color`                                   | `#9a9a9a`                             | Secondary text ink.                                                         |
| `--task-list-mono-font`                                         | `ui-monospace, Menlo, monospace`      | Mono face for `secondary` when `mono` is set.                               |
| `--task-list-text-gap`                                          | `8px`                                 | Gap between label and secondary.                                            |
| `--task-list-retry-color` / `--task-list-retry-background`      | `#c93f38` / `rgba(201, 63, 56, 0.12)` | The retry pill button, resting state.                                       |
| `--task-list-retry-hover-background`                            | `rgba(201, 63, 56, 0.2)`              | The retry pill button, hover state.                                         |
| `--task-list-retry-font-size` / `--task-list-retry-weight`      | `0.75rem` / `600`                     | Retry button type.                                                          |
| `--task-list-retry-padding` / `--task-list-retry-radius`        | `3px 10px` / `999px`                  | Retry button shape.                                                         |

## Web component

```html
<sui-task-list></sui-task-list>
<script>
  const list = document.querySelector('sui-task-list');
  list.rows = [
    { label: 'Read repository structure', status: 'done' },
    { label: 'Draft migration plan', status: 'running' }
  ];
  list.onretry = (index) => console.log('retry', index);
</script>
```

`rows` is an array property and `onretry` a callback property — both are set from script, not
attributes.

## Accessibility

Each row's status glyph is `aria-hidden` — the meaning lives in the visible label and, for a failed
row, in the retry button's own accessible name. The retry action is a real `<button>`. Under
`prefers-reduced-motion` the row entrance, glyph fade/pop-in and the running spinner are all
disabled.

## Notes

- The running status glyph is the library `Loader`, sized and colored via its `--loader-*`
  properties; the retry action is the library `Button` in its compact `size="sm"` form, both
  themed from the `--task-list-*` tokens above rather than re-implemented locally.
