# DiffViewer

Renders a unified diff for one file: a header showing its path, an added/removed line count,
and the hunks themselves with gutters for the old and new line numbers. Small diffs render
open; large ones start collapsed behind a "N lines — show" control, so a page listing many
changed files does not paint thousands of diff lines it will never be scrolled to.

The header doubles as an `Accordion` trigger — clicking the path collapses or reopens the
body the same way the bottom "show" control does.

## Usage

```svelte
<script lang="ts">
  import { DiffViewer } from '@juspay/svelte-ui-components';

  const hunks = [
    {
      header: '@@ -12,3 +12,4 @@',
      lines: [
        { kind: 'context', oldLine: 12, newLine: 12, text: 'function greet() {' },
        { kind: 'remove', oldLine: 13, text: '  console.log("hi");' },
        { kind: 'add', newLine: 13, text: '  console.log("hello");' },
        { kind: 'add', newLine: 14, text: '  console.log("!");' },
        { kind: 'context', oldLine: 14, newLine: 15, text: '}' }
      ]
    }
  ];
</script>

<DiffViewer path="src/greet.ts" {hunks} additions={2} deletions={1} />
```

## Props

| Prop              | Type                | Required | Default | Description                                                                                     |
| ----------------- | ------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| path              | `string`            | Yes      | -       | The file path shown in the header. Only the final segment is styled as the filename; the rest renders as a dimmer directory prefix. |
| hunks             | `DiffViewerHunk[]`  | Yes      | -       | The diff's hunks, in order. Each hunk is `{ header?: string; lines: DiffViewerLine[] }`; `header` is the `@@ ... @@` line shown above the hunk (a `⋯` separator renders in its place when a hunk after the first omits one). |
| additions         | `number`            | Yes      | -       | Count shown in the header, e.g. `+3`. Not derived from `hunks` — pass the real total when a diff has been truncated. |
| deletions         | `number`            | Yes      | -       | Count shown in the header, e.g. `−1`. Same truncation note as `additions`. |
| created           | `boolean`           | No       | `false` | Shows a "new" badge beside the path for a newly created file. |
| collapseThreshold | `number`            | No       | `40`    | Diffs with more total lines (summed across all hunks) than this start collapsed. Changing `additions`/`deletions`'s underlying line total resets any manual toggle back to this rule; toggling the same diff open or closed by hand is preserved across re-renders until the total or the threshold itself changes. |
| classes           | `string`            | No       | -       | CSS classes for the wrapper element. |
| testId            | `string`            | No       | -       | Value for `data-pw` on the trigger/header (forwarded to the internal `Accordion`'s own root). |

`DiffViewerLine` is `{ kind: 'add' | 'remove' | 'context'; oldLine?: number; newLine?: number; text: string }`. `oldLine`/`newLine` are independently optional — an added line has no `oldLine`, a removed line has no `newLine` — and each gutter renders blank when its side is absent.

## Accessibility

- The header is `Accordion`'s own trigger button, so it is a real, keyboard-reachable `<button>` with `aria-expanded` — not a `click` handler on a plain `<div>`.
- The collapsed body is `inert` (via `Accordion`), so its line numbers and text are not reachable by Tab or exposed to a screen reader while hidden, and browser find-in-page will not match text inside it. Expand the diff (or raise `collapseThreshold`) for a diff whose content must be findable on the page.
- Line numbers are decorative gutters, not table cells — they render as plain `<span>`s beside the line text, in visual reading order.

## CSS Variables

| Variable                        | Default                       | Description                                                        |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `--diff-font-family`             | `ui-monospace, monospace`      | Font for the whole component.                                      |
| `--diff-font-size`               | `13px`                         | Base font size (header uses `--diff-header-font-size` instead).    |
| `--diff-line-height`             | `1.4`                          | Line height for diff rows.                                         |
| `--diff-background`              | `#ffffff`                      | Body background.                                                    |
| `--diff-border`                  | `1px solid #d1d5db`            | Outer border, and the rule under the header/hunk separators.       |
| `--diff-border-radius`           | `4px`                          | Outer corner radius.                                                |
| `--diff-color`                   | `#374151`                      | Header text color and context-line text color.                     |
| `--diff-gap`                     | `12px`                         | Gap between the path and the +/− counts in the header.             |
| `--diff-small-gap`               | `8px`                          | Gap used by the "new" badge's margin and between the +/− counts.   |
| `--diff-trigger-padding`         | `8px 12px`                     | Header padding.                                                     |
| `--diff-header-background`       | `#f9fafb`                      | Header and hunk-separator background, and the show-button's hover color. |
| `--diff-header-font-size`        | `12px`                         | Header, badge and hunk-separator font size.                        |
| `--diff-filename-color`          | `#111827`                      | The path's final segment, and the show-button's hover text color.  |
| `--diff-gutter-color`            | `#6b7280`                      | Directory prefix, chevron, and both line-number gutters.           |
| `--diff-chevron-transition`      | `120ms ease`                   | The header chevron's rotate transition.                            |
| `--diff-add-color`               | `#166534`                      | Added-line text and the header's `+N` count.                       |
| `--diff-remove-color`            | `#991b1b`                      | Removed-line text and the header's `−N` count.                     |
| `--diff-add-background`          | `#f0fdf4`                      | Added-line row background.                                          |
| `--diff-remove-background`       | `#fef2f2`                      | Removed-line row background.                                        |
| `--diff-hunk-padding`            | `4px 12px`                     | Hunk-separator row padding.                                         |
| `--diff-gutter-width`            | `44px`                         | Width of each line-number column (there are two, old and new).     |
| `--diff-gutter-padding`          | `0 8px`                        | Padding inside each line-number cell.                              |
| `--diff-content-padding`         | `0 12px`                       | Padding inside the line-text cell.                                  |
| `--diff-created-background`      | `#dcfce7`                      | "New" badge background.                                             |
| `--diff-created-color`           | `#166534`                      | "New" badge text color.                                             |
| `--diff-created-padding`         | `2px 8px`                      | "New" badge padding.                                                |
| `--diff-created-font-weight`     | `500`                          | "New" badge font weight.                                            |
| `--diff-created-letter-spacing`  | `0.04em`                       | "New" badge letter spacing.                                         |
| `--diff-created-text-transform`  | `uppercase`                    | "New" badge text transform.                                         |
| `--diff-show-padding`            | `12px`                         | Padding of the bottom "N lines — show" button.                     |

## Web Component

None yet. `hunks` is a nested array of objects, so a wrapper would need to accept it as a JS
property assignment (`el.hunks = [...]`) rather than an HTML attribute, the same way `<sui-table>`
takes `columns`. Use the Svelte component directly until one exists.
