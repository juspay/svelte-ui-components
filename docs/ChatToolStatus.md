# ChatToolStatus

> **Deprecated.** `ThinkingIndicator`'s `chip` variant (`<ThinkingIndicator variant="chip" ... />`)
> is a superset of this component — same pill layout and static-by-default label, plus optional
> expandable reasoning, an elapsed-time counter, and reasoning traces if you ever need them. `Chat`
> itself now renders `ThinkingIndicator variant="chip"` for its built-in tool-status row instead of
> this component. `ChatToolStatus` still works and isn't going away outright (this is a published
> package — removing the export is its own breaking-change decision), but new code should reach for
> `ThinkingIndicator` instead.

A compact status pill that shows what the assistant is doing — "Searching the catalog…", "Calling a tool…", "Thinking…". It pairs a spinner (the `Loader` component) with a label, and the leading indicator can be replaced with a snippet. Render it above the composer or floating over the conversation while `toolStatus` is non-null.

## Usage

```svelte
<script>
  import { ChatToolStatus } from '@juspay/svelte-ui-components';
</script>

<ChatToolStatus label="Searching the catalog…" />
```

## Props

| Prop    | Type      | Required | Default | Description                                                  |
| ------- | --------- | -------- | ------- | ----------------------------------------------------------- |
| label   | `string`  | Yes      | `-`     | Status text.                                                |
| icon    | `Snippet` | No       | `-`     | Leading indicator. Falls back to the built-in spinner.      |
| testId  | `string`  | No       | `-`     | `data-pw` on the root element.                              |
| classes | `string`  | No       | `-`     | Class string on the root element.                          |

## CSS Variables

| Variable                              | Default                    | CSS Property   | Description                  |
| ------------------------------------- | -------------------------- | -------------- | ---------------------------- |
| `--chat-tool-status-gap`              | `8px`                      | gap            | Gap between spinner and label.|
| `--chat-tool-status-padding`          | `8px 14px`                 | padding        | Pill padding.                |
| `--chat-tool-status-background`       | `#ffffff`                  | background     | Pill background.             |
| `--chat-tool-status-border`           | `1px solid #e4e4e7`        | border         | Pill border.                 |
| `--chat-tool-status-border-radius`    | `999px`                    | border-radius  | Pill corner rounding.        |
| `--chat-tool-status-box-shadow`       | `0 6px 20px rgba(0,0,0,0.08)` | box-shadow  | Pill shadow.                 |
| `--chat-tool-status-color`            | `#52525b`                  | color          | Label color.                 |
| `--chat-tool-status-font-size`        | `0.85rem`                  | font-size      | Label font size.             |
| `--chat-tool-status-font-weight`      | `500`                      | font-weight    | Label weight.                |
| `--chat-tool-status-max-width`        | `100%`                     | max-width      | Max pill width.              |
| `--chat-tool-status-indicator-color`  | `currentColor`             | color          | Spinner color.               |
| `--chat-tool-status-spinner-size`     | `14px`                     | height/width   | Spinner size.                |
| `--chat-tool-status-spinner-color`    | `currentColor`             | background     | Spinner arc color (`--loader-foreground`).  |
| `--chat-tool-status-spinner-color-end`| `transparent`              | background     | Spinner arc fade-out color (`--loader-foreground-end`). |

## Web Component

Tag: `<sui-chat-tool-status>`

```html
<sui-chat-tool-status label="Searching…"></sui-chat-tool-status>
```
