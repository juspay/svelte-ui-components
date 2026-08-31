# ThinkingIndicator

The assistant's "working on it" line: a shimmering status label with a leading indicator,
optionally expandable to reveal the reasoning behind it. One component covers five shapes — a live
status row, a disclosure with a plain reasoning paragraph, a bare label for inside a chat bubble,
a self-contained floating pill (`chip`, for a status above a composer — this is what `Chat` renders
internally for its `toolStatus` prop, in place of the now-deprecated `ChatToolStatus`), and a
disclosure whose body is a kind-aware, host-streamed reasoning **trace** (checklist, reasoning
prose, search sources, or file edits).

Passing `rows` (even `[]`) switches the disclosure body from the `detail` paragraph to the trace
renderer selected by `kind`, and turns on the optional `busy`-driven disclosure machine: auto-open
while busy, an `onsettled` hook that fires exactly once when the turn finishes, and an automatic
post-settle collapse that a user's own toggle permanently overrides. Every prop below `label` is
optional — a mount that never passes them behaves exactly like the originally released component.

## Usage

```svelte
<script>
  import { ThinkingIndicator } from '@juspay/svelte-ui-components';
</script>

<!-- Live status line -->
<ThinkingIndicator label="Working on your refund summary…" />

<!-- Live status line with an elapsed counter -->
<ThinkingIndicator label="Working on your refund summary…" showElapsed />

<!-- Expandable reasoning (plain detail string) -->
<ThinkingIndicator
  label="Thought for 6 seconds"
  detail="Looked up the last 30 days…"
  bind:expanded
/>

<!-- Inside a chat bubble: label only -->
<ThinkingIndicator label="Analyzing…" variant="bare" />

<!-- Floating pill above a composer (static label by default, unlike the other variants) -->
<ThinkingIndicator label="Searching the catalog…" variant="chip" />
```

### Reasoning trace

```svelte
<script lang="ts">
  import { ThinkingIndicator } from '@juspay/svelte-ui-components';
  import type { ThinkingIndicatorTraceRow } from '@juspay/svelte-ui-components';

  let busy = $state(true);
  let rows = $state<ThinkingIndicatorTraceRow[]>([]);
  // append rows as trace events stream in; set busy = false when the turn settles
</script>

<ThinkingIndicator
  label={busy ? 'Searching the web' : 'Searched 10 sources'}
  kind="search"
  {rows}
  {busy}
  query="best waffle cone supplier"
  moreLabel="+7 more"
  onsettled={() => revealAnswer()}
/>
```

## Props

| Prop              | Type                                             | Required | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------ | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`                                         | Yes      | `-`         | Status text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `detail`          | `string`                                         | No       | `-`         | Reasoning text. Providing one (or `rows`) turns the indicator into a disclosure; ignored in favour of `rows`.                                                                                                                                                                                                                                                                                                                                                                                               |
| `expanded`        | `boolean` (bindable)                             | No       | `false`     | Disclosure state; meaningful only with `detail` or `rows`. An explicit host binding always wins over the automatic `busy`-driven machine.                                                                                                                                                                                                                                                                                                                                                                   |
| `variant`         | `'default' \| 'bare' \| 'chip'`                  | No       | `'default'` | `bare` renders only the shimmering label — no avatar, no disclosure, never expandable. `chip` renders a self-contained bordered/shadowed pill (own background, like the deprecated `ChatToolStatus`); its label is static by default instead of shimmering — pass `busy` to override. Neither `bare` nor `chip` is ever expandable.                                                                                                                                                                     |
| `showElapsed`     | `boolean`                                        | No       | `false`     | Live `Ns` counter while the label is busy; freezes once it settles. No effect on `bare` or `chip`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `onToggle`        | `() => void`                                     | No       | `-`         | Fires after each manual toggle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `avatar`          | `Snippet`                                        | No       | `-`         | Leading indicator. Falls back to the built-in `Loader` spinner.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `toggleIcon`      | `Snippet`                                        | No       | `-`         | Overrides the built-in chevron on the disclosure toggle.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `testId`          | `string`                                         | No       | `-`         | `data-pw`/`testID` on the root; the toggle gets `<testId>-toggle`, the detail `<testId>-detail`, the elapsed counter `<testId>-elapsed`.                                                                                                                                                                                                                                                                                                                                                                    |
| `toggleTestId`    | `string`                                         | No       | derived     | Override the toggle's test id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `detailTestId`    | `string`                                         | No       | derived     | Override the detail text's test id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `labelTestId`     | `string`                                         | No       | `-`         | Test id on the status label itself.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `classes`         | `string`                                         | No       | `-`         | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `rows`            | `ThinkingIndicatorTraceRow[]`                    | No       | `-`         | Trace rows revealed so far — append as the model streams; newly appended rows stagger in. Presence (even `[]`) switches the disclosure body to the trace renderer and makes the indicator expandable even without `detail`.                                                                                                                                                                                                                                                                                 |
| `kind`            | `'steps' \| 'reasoning' \| 'search' \| 'coding'` | No       | `'steps'`   | Which trace row renderer `rows` uses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `busy`            | `boolean`                                        | No       | `-`         | Host-owned turn state. While `true`: the label shimmers, the `steps` kind's newest row shows a live spinner, the elapsed counter ticks, and the disclosure auto-opens. Flipping to `false` freezes the counter, fires `onsettled` once, and — unless the user toggled the disclosure by hand — schedules the auto-collapse after `collapseDelayMs`. Omitted entirely: the label shimmers per the original rule (settled while expandable, live otherwise) for `default`/`bare`, but stays static for `chip` (matching the deprecated `ChatToolStatus`, which never shimmered) — and no automatic disclosure machine runs. |
| `query`           | `string`                                         | No       | `-`         | Search kind: query chip rendered above the rows.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `moreLabel`       | `string`                                         | No       | `-`         | Search kind: settled trailing caption, e.g. `"+7 more"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `selectable`      | `boolean`                                        | No       | `false`     | Coding kind: rows become `aria-pressed` toggle buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `selected`        | `number \| null` (bindable)                      | No       | `null`      | Index of the selected coding row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `onrowselect`     | `(index: number \| null) => void`                | No       | `-`         | Fires when a coding row's selection changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onsettled`       | `() => void`                                     | No       | `-`         | Fires exactly once, the moment `busy` flips false. No effect while `busy` is never passed.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `collapseDelayMs` | `number \| null`                                 | No       | `2600`      | Delay before the automatic post-settle collapse. `null` disables it. No effect while `busy` is never passed, or once the disclosure has been toggled by hand.                                                                                                                                                                                                                                                                                                                                               |

### `ThinkingIndicatorTraceRow`

| Field               | Type       | Description                                       |
| ------------------- | ---------- | ------------------------------------------------- |
| `primary`           | `string`   | The step, sentence, source title, or file action. |
| `secondary`         | `string?`  | Count, domain, filename or command.               |
| `mono`              | `boolean?` | Render `secondary` in the mono face.              |
| `added` / `removed` | `number?`  | Coding diff stats, rendered `+N` / `−N`.          |
| `href`              | `string?`  | Search rows: renders the row as a new-tab link.   |

## CSS Variables

| Variable                                                                                                                                       | Default                                             | Description                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--thinking-indicator-font-size`                                                                                                               | `0.75rem`                                           | Label font size.                                                                                                 |
| `--thinking-indicator-line-height`                                                                                                             | `1.25rem`                                           | Label line height.                                                                                               |
| `--thinking-indicator-label-color`                                                                                                             | `#858585`                                           | Label color (static / fill).                                                                                     |
| `--thinking-indicator-shimmer-gradient`                                                                                                        | `linear-gradient(90deg, #858585, #bebebe, #858585)` | Shimmer sweep gradient.                                                                                          |
| `--thinking-indicator-shimmer-duration`                                                                                                        | `2s`                                                | Shimmer sweep duration.                                                                                          |
| `--thinking-indicator-gap`                                                                                                                     | `0.25rem`                                           | Gap between avatar and label.                                                                                    |
| `--thinking-indicator-header-gap`                                                                                                              | `0.375rem`                                          | Gap between the label cluster and the elapsed counter (status line), and the `Button` content gap on the toggle. |
| `--thinking-indicator-arrow-gap`                                                                                                               | `0.125rem`                                          | Gap between the label and the chevron.                                                                           |
| `--thinking-indicator-avatar-size`                                                                                                             | `1.5rem`                                            | Avatar box size.                                                                                                 |
| `--thinking-indicator-avatar-loader-size`                                                                                                      | `1rem`                                              | Built-in spinner size.                                                                                           |
| `--thinking-indicator-chip-gap`                                                                                                                | `8px`                                                | `chip`: gap between icon and label.                                                                              |
| `--thinking-indicator-chip-padding`                                                                                                            | `8px 14px`                                           | `chip`: pill padding.                                                                                            |
| `--thinking-indicator-chip-background`                                                                                                         | `#ffffff`                                            | `chip`: pill background.                                                                                         |
| `--thinking-indicator-chip-border`                                                                                                              | `1px solid #e4e4e7`                                  | `chip`: pill border.                                                                                             |
| `--thinking-indicator-chip-border-radius`                                                                                                       | `999px`                                              | `chip`: pill corner rounding.                                                                                    |
| `--thinking-indicator-chip-box-shadow`                                                                                                          | `0 6px 20px rgba(0, 0, 0, 0.08)`                     | `chip`: pill shadow.                                                                                             |
| `--thinking-indicator-chip-max-width`                                                                                                           | `100%`                                               | `chip`: max pill width.                                                                                          |
| `--thinking-indicator-chip-color`                                                                                                               | `#52525b`                                            | `chip`: label color (static and shimmer base).                                                                  |
| `--thinking-indicator-chip-font-size`                                                                                                           | `0.85rem`                                            | `chip`: label font size.                                                                                        |
| `--thinking-indicator-chip-font-weight`                                                                                                         | `500`                                                | `chip`: label weight.                                                                                            |
| `--thinking-indicator-chip-shimmer-gradient`                                                                                                    | `linear-gradient(90deg, #52525b, #a0a0a0, #52525b)`  | `chip`: shimmer sweep gradient (only visible with `busy`).                                                       |
| `--thinking-indicator-chip-shimmer-duration`                                                                                                    | `2s`                                                 | `chip`: shimmer sweep duration.                                                                                 |
| `--thinking-indicator-chip-icon-color`                                                                                                          | `currentColor`                                       | `chip`: icon slot color.                                                                                        |
| `--thinking-indicator-chip-spinner-size`                                                                                                        | `14px`                                               | `chip`: built-in spinner size.                                                                                  |
| `--thinking-indicator-chip-spinner-color` / `--thinking-indicator-chip-spinner-color-end`                                                       | `currentColor` / `transparent`                       | `chip`: spinner `Loader` foreground/foreground-end.                                                             |
| `--thinking-indicator-border-bottom`                                                                                                           | `1px solid #e4e4e7`                                 | Expandable variant separator.                                                                                    |
| `--thinking-indicator-padding-block`                                                                                                           | `0.5rem`                                            | Expandable variant vertical padding.                                                                             |
| `--thinking-indicator-margin-bottom`                                                                                                           | `1rem`                                              | Expandable variant bottom margin.                                                                                |
| `--thinking-indicator-arrow-size`                                                                                                              | `1rem`                                              | Chevron box size.                                                                                                |
| `--thinking-indicator-arrow-color`                                                                                                             | `#7a7a7a`                                           | Chevron color.                                                                                                   |
| `--thinking-indicator-arrow-transition`                                                                                                        | `transform 0.2s ease-in-out`                        | Chevron rotate transition.                                                                                       |
| `--thinking-indicator-detail-font-size`                                                                                                        | `0.875rem`                                          | Detail text font size.                                                                                           |
| `--thinking-indicator-detail-line-height`                                                                                                      | `1.5`                                               | Detail text line height.                                                                                         |
| `--thinking-indicator-detail-color`                                                                                                            | `#bebebe`                                           | Detail text color.                                                                                               |
| `--thinking-indicator-detail-padding-top`                                                                                                      | `0.5rem`                                            | Space above the detail text.                                                                                     |
| `--thinking-indicator-elapsed-color`                                                                                                           | `#9a9a9a`                                           | Elapsed counter ink.                                                                                             |
| `--thinking-indicator-elapsed-font-size`                                                                                                       | `0.75rem`                                           | Elapsed counter font size.                                                                                       |
| `--thinking-indicator-trace-ease`                                                                                                              | `cubic-bezier(0.23, 1, 0.32, 1)`                    | The curve behind the busy min-height, connector and row entrances.                                               |
| `--thinking-indicator-trace-busy-min-height`                                                                                                   | `0px`                                               | Height held while busy so settling doesn't jump the layout.                                                      |
| `--thinking-indicator-trace-connector-color`                                                                                                   | `#dcdcdc`                                           | The vertical connector line.                                                                                     |
| `--thinking-indicator-trace-row-color` / `--thinking-indicator-trace-prose-color`                                                              | `#2b2b2b` / `#6b6b6b`                               | Row ink, labels / reasoning prose.                                                                               |
| `--thinking-indicator-trace-row-weight`                                                                                                        | `500`                                               | Primary text weight.                                                                                             |
| `--thinking-indicator-trace-row-font-size` / `--thinking-indicator-trace-secondary-font-size`                                                  | `0.8125rem` / `0.75rem`                             | Row type scale.                                                                                                  |
| `--thinking-indicator-trace-secondary-color`                                                                                                   | `#9a9a9a`                                           | Secondary text ink.                                                                                              |
| `--thinking-indicator-trace-mono-font`                                                                                                         | `ui-monospace, Menlo, monospace`                    | Mono face for filenames/commands/diff stats.                                                                     |
| `--thinking-indicator-trace-icon-color`                                                                                                        | `#9a9a9a`                                           | Steps checkmark ink.                                                                                             |
| `--thinking-indicator-trace-spinner-size`                                                                                                      | `11px`                                              | Steps frontier spinner size (a `Loader` instance).                                                               |
| `--thinking-indicator-trace-spinner-color` / `--thinking-indicator-trace-spinner-color-end` / `--thinking-indicator-trace-spinner-track-color` | `#6b6b6b` / `transparent` / `#dcdcdc`               | The frontier spinner's `Loader` foreground/foreground-end/background.                                            |
| `--thinking-indicator-trace-tone-1` / `-tone-2` / `-tone-3`                                                                                    | blue / orange / green                               | Search badge tones, cycled by row index.                                                                         |
| `--thinking-indicator-trace-badge-check-color`                                                                                                 | `#fff`                                              | Check glyph inside search badges.                                                                                |
| `--thinking-indicator-trace-added-color` / `--thinking-indicator-trace-removed-color`                                                          | green / red                                         | Diff stat inks.                                                                                                  |
| `--thinking-indicator-trace-row-hover-background` / `--thinking-indicator-trace-row-selected-background`                                       | `#f4f4f4` / `#ececec`                               | Selectable coding rows.                                                                                          |
| `--thinking-indicator-trace-row-radius`                                                                                                        | `6px`                                               | Selectable coding row corner radius.                                                                             |
| `--thinking-indicator-trace-query-background` / `-query-color` / `-query-radius` / `-query-padding` / `-query-margin` / `-query-font-size`     | pill recipe                                         | The search query chip (wired onto the library `Pill`).                                                           |
| `--thinking-indicator-trace-more-color` / `--thinking-indicator-trace-more-font-size`                                                          | `#9a9a9a` / `0.75rem`                               | The settled `moreLabel` caption.                                                                                 |
| `--thinking-indicator-trace-body-gap` / `-row-gap` / `-body-padding-top`                                                                       | `12px` / `7px` / `10px`                             | Trace layout rhythm.                                                                                             |

> Renamed from `ThinkingTrace`: every `--thinking-trace-*` variable is now `--thinking-indicator-trace-*`.
> `--thinking-trace-label-color` / `-settled-color` / `-shimmer-gradient` were absorbed into the
> existing `--thinking-indicator-label-color` / `-shimmer-gradient` (the header is the same label in
> both shapes now). `--thinking-trace-chevron-color` was absorbed into the existing
> `--thinking-indicator-arrow-color`. `--thinking-trace-header-gap` was superseded by the new
> `--thinking-indicator-header-gap` / `--thinking-indicator-arrow-gap` pair. The leading star icon
> (`--thinking-trace-star-color` / `-star-settled-color`) was dropped — the trace header is now the
> same avatar slot (default `Loader`, or a host `avatar` snippet) as every other `ThinkingIndicator`
> shape, rather than a second, indicator-specific icon.

## Web component

```html
<sui-thinking-indicator label="Thinking" busy kind="steps"></sui-thinking-indicator>
<script>
  const indicator = document.querySelector('sui-thinking-indicator');
  indicator.rows = [
    { primary: 'Scanning weekly sales', secondary: '6 flavors' },
    { primary: 'Comparing to last month' }
  ];
</script>
```

`rows`, `expanded`, `selected`, `collapseDelayMs` and the callbacks (`onToggle`, `onrowselect`,
`onsettled`) are property-only — set them from script. `label`, `variant`, `kind` reflect as
attributes; `detail`, `showElapsed`/`show-elapsed`, `testId`/`test-id`, `toggleTestId`/
`toggle-test-id`, `detailTestId`/`detail-test-id`, `labelTestId`/`label-test-id`, `classes`, `busy`,
`query`, `moreLabel`/`more-label` and `selectable` can all be set as attributes.

## Accessibility

The disclosure toggle is a real `<button>` (via the library `Button`) with `aria-expanded`. Coding
rows render as `aria-pressed` toggle buttons only when `selectable` is set — without it they're
plain, non-interactive rows. Search rows render as links only when they carry `href` — a row
without one renders as plain text, not a link. While the disclosure is collapsed, its body
(the `detail` paragraph or the trace rows) is `inert`, removing it from the tab order and from
assistive-tech traversal until it reopens — this holds for both the plain-detail shape and the
trace shape. Under `prefers-reduced-motion` every entrance animation, the label shimmer, and the
frontier spinner are disabled; the label falls back to static ink and the chevron/connector
transitions are near-instant.
