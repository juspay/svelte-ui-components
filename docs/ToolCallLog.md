# ToolCallLog

A chip log of an agent turn's tool calls. Chips wrap into a row, each one carrying a state
(`running`, `done`, `error`), an optional mono meta string, and optional `+N`/`−N` diff-stat pills
(the library `Pill`). A chip with a `detail` string is expandable — clicking it opens a small
popover anchored below the chip with the full detail text and its diff stats; only one popover is
open at a time. The popover portals to `document.body` (reusing Menu's `usePortal` placement math)
and repositions itself on scroll/resize, so an `overflow: hidden` or scrolling ancestor — a chat
bubble, a narrow card — can never clip it.

Unlike `ChatToolStatus` (a single one-line "using a tool now" status that disappears when the turn
settles), `ToolCallLog` is the persistent, multi-call record: it stays in the transcript after the
turn, showing every tool the model called in order.

## Usage

```svelte
<script lang="ts">
  import { ToolCallLog } from '@juspay/svelte-ui-components';
  import type { ToolCallChip } from '@juspay/svelte-ui-components';

  let chips = $state<ToolCallChip[]>([]);
  // append chips as tool calls stream in; set state: 'running' -> 'done' | 'error'
</script>

<ToolCallLog {chips} onchipclick={(index, chip) => console.log('clicked', index, chip.label)} />
```

## Props

| Prop          | Type                                          | Default | Description                                                                           |
| ------------- | --------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `chips`       | `ToolCallChip[]`                              | —       | The tool calls made so far this turn; newly appended chips stagger in at 120ms steps. |
| `onchipclick` | `(index: number, chip: ToolCallChip) => void` | —       | Fires when a chip **without** a `detail` string is clicked.                           |
| `testId`      | `string`                                      | —       | `data-pw`/`testID` on the root; each chip gets `<testId>-chip-<index>`.               |
| `classes`     | `string`                                      | —       | Extra classes on the root.                                                            |

### ToolCallChip

| Field               | Type                              | Description                                                                          |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `label`             | `string`                          | The tool action, e.g. "Read", "Edit", "Run".                                         |
| `meta`              | `string?`                         | A filename, command or count shown after the label.                                  |
| `mono`              | `boolean?`                        | Render `meta` (and the popover `detail`) in the mono face.                           |
| `state`             | `'running' \| 'done' \| 'error'?` | `running` shows a spinner; `error` renders red-toned; omitted/`done` is default ink. |
| `added` / `removed` | `number?`                         | Diff stats, rendered as `+N` / `−N` pills.                                           |
| `detail`            | `string?`                         | When present, the chip becomes expandable and shows this text in a popover.          |

## CSS Variables

| Variable                                                                                                                                      | Default                           | Description                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--tool-call-log-ease`                                                                                                                        | `cubic-bezier(0.23, 1, 0.32, 1)`  | The curve behind chip and popover entrances.                                                                                                                  |
| `--tool-call-log-gap`                                                                                                                         | `8px`                             | Gap between chips in the wrapping row.                                                                                                                        |
| `--tool-call-log-chip-radius`                                                                                                                 | `6px`                             | Chip corner rounding.                                                                                                                                         |
| `--tool-call-log-chip-border`                                                                                                                 | `1px solid #e4e4e7`               | Chip border.                                                                                                                                                  |
| `--tool-call-log-chip-background` / `--tool-call-log-chip-hover-background`                                                                   | `#fafafa` / `#f1f1f1`             | Chip fill, resting / hover.                                                                                                                                   |
| `--tool-call-log-chip-open-border-color`                                                                                                      | `#c7c7cc`                         | Chip border while its popover is open.                                                                                                                        |
| `--tool-call-log-chip-padding` / `--tool-call-log-chip-gap`                                                                                   | `6px 10px` / `6px`                | Chip padding and internal gap (spinner/label/meta/diffstat).                                                                                                  |
| `--tool-call-log-chip-line-height` / `--tool-call-log-chip-cursor`                                                                            | `1` / `pointer`                   | Chip sizing pulled from Pill's own recipe (line-height, cursor).                                                                                              |
| `--tool-call-log-label-color` / `--tool-call-log-label-weight`                                                                                | `#2b2b2b` / `500`                 | Chip label ink and weight (default/`done` ink).                                                                                                               |
| `--tool-call-log-font-size`                                                                                                                   | `0.8125rem`                       | Chip label font size.                                                                                                                                         |
| `--tool-call-log-meta-color` / `--tool-call-log-meta-font-size`                                                                               | `#9a9a9a` / `0.75rem`             | The `meta` string ink and size.                                                                                                                               |
| `--tool-call-log-mono-font`                                                                                                                   | `ui-monospace, Menlo, monospace`  | Mono face for `meta`, diff stats and the popover `detail`.                                                                                                    |
| `--tool-call-log-spinner-color` / `--tool-call-log-spinner-track-color`                                                                       | `#6b6b6b` / `#dcdcdc`             | The `running` state's spinner (library `Loader`'s gradient leading/trailing edge).                                                                            |
| `--tool-call-log-spinner-size`                                                                                                                | `11px`                            | The `running` state's spinner diameter.                                                                                                                       |
| `--tool-call-log-error-color` / `--tool-call-log-error-border-color` / `--tool-call-log-error-background`                                     | `#c93f38` / `#f2b8b5` / `#fdf1f0` | The `error` state's ink, border and fill.                                                                                                                     |
| `--tool-call-log-error-hover-background`                                                                                                      | `#fbe6e5`                         | The `error` chip's hover fill.                                                                                                                                |
| `--tool-call-log-added-color` / `--tool-call-log-added-background`                                                                            | `#1f7a5f` / `#e4f5ee`             | The `+N` diff pill (library `Pill`, sized via its `--pill-*` tokens).                                                                                         |
| `--tool-call-log-removed-color` / `--tool-call-log-removed-background`                                                                        | `#c93f38` / `#fbeceb`             | The `−N` diff pill (library `Pill`, sized via its `--pill-*` tokens).                                                                                         |
| `--tool-call-log-diffstat-radius` / `--tool-call-log-diffstat-padding` / `--tool-call-log-diffstat-font-size`                                 | `4px` / `0 4px` / `0.6875rem`     | Diff pill shape and scale.                                                                                                                                    |
| `--tool-call-log-diffstat-margin`                                                                                                             | `2px`                             | Space before the diff pills inside a chip.                                                                                                                    |
| `--tool-call-log-popover-background` / `--tool-call-log-popover-border` / `--tool-call-log-popover-radius` / `--tool-call-log-popover-shadow` | pill card recipe                  | The detail popover's surface.                                                                                                                                 |
| `--tool-call-log-popover-padding` / `--tool-call-log-popover-gap`                                                                             | `10px 12px` / `6px`               | Popover inner spacing.                                                                                                                                        |
| `--tool-call-log-popover-min-width` / `--tool-call-log-popover-max-width`                                                                     | `220px` / `340px`                 | Popover width bounds.                                                                                                                                         |
| `--tool-call-log-popover-color` / `--tool-call-log-popover-font-size`                                                                         | `#2b2b2b` / `0.8125rem`           | The `detail` text ink and size.                                                                                                                               |
| `--tool-call-log-popover-z-index`                                                                                                             | `1000`                            | Popover stacking order — the portaled panel sits in the same top-layer band as a portaled Menu/Tooltip; raise it if it must sit above an even higher overlay. |

The popover's anchor gap (6px below the chip) and its portal target (`document.body`) are fixed,
matching Menu's own portal gap, which is likewise not exposed as a CSS variable.

## Internal Dependencies

This component uses the following library components internally:

- `Loader` — the `running` state's spinner, sized/colored via `--loader-*` custom-property
  inheritance (no `:global()` needed, `Loader` is a plain DOM descendant).
- `Pill` — the `+N`/`−N` diff-stat badges, likewise customized via `--pill-*` inheritance. The
  chip itself stays bespoke `<button>` markup rather than `Pill` — see Accessibility below.

## Web component

```html
<sui-tool-call-log></sui-tool-call-log>
```

`chips` is an array property (set it from script); `onchipclick` is property-only.

## Accessibility

Every chip is a real `<button>` — `Pill`'s root is a non-interactive `<div>` and can't host
`aria-expanded`/button semantics, so chips are not `Pill`-based even though their sizing recipe
(line-height, cursor) is pulled from Pill's own tokens. Chips with a `detail` string get
`aria-expanded`, toggling their popover.

The open popover is portaled to `document.body` (Menu's `usePortal` placement math, reused) and
positioned `position: fixed` against the chip's live anchor rect, so it can never be clipped by an
`overflow: hidden` or scrolling ancestor; it repositions on scroll and resize. It carries
`role="dialog"` and an `aria-label` naming the chip. It closes on: clicking the open chip again,
clicking anywhere outside both the chip and the popover, or pressing Escape (bound at the window,
so it works regardless of focus, without forcing an interactive role onto the popover). The
popover is conditionally rendered (`{#if}`), so it never sits in the tab order while closed. Under
`prefers-reduced-motion`, chip and popover entrances and the `running` spinner are disabled.
