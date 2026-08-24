# ThinkingIndicator

The assistant's "working on it" line: a shimmering status label with a leading indicator, optionally expandable to reveal the reasoning behind it. Three shapes from one component — a live status row, a disclosure ("Thought for 6 seconds" → the steps), and a bare label for inside a chat bubble.

## Usage

```svelte
<script>
  import { ThinkingIndicator } from '@juspay/svelte-ui-components';
</script>

<!-- Live status line -->
<ThinkingIndicator label="Working on your refund summary…" />

<!-- Expandable reasoning -->
<ThinkingIndicator
  label="Thought for 6 seconds"
  detail="Looked up the last 30 days…"
  bind:expanded
/>

<!-- Inside a chat bubble: label only -->
<ThinkingIndicator label="Analyzing…" variant="bare" />
```

## Props

| Prop         | Type                  | Required | Default     | Description                                                             |
| ------------ | --------------------- | -------- | ----------- | ----------------------------------------------------------------------- |
| label        | `string`              | Yes      | `-`         | Status text.                                                            |
| detail       | `string`              | No       | `-`         | Reasoning text. Providing one turns the indicator into a disclosure.    |
| expanded     | `boolean` (bindable)  | No       | `false`     | Disclosure state; meaningful only with `detail`.                        |
| variant      | `'default' \| 'bare'` | No       | `'default'` | `bare` renders only the shimmering label — no avatar, no disclosure.    |
| onToggle     | `() => void`          | No       | `-`         | Fires after each toggle.                                                |
| avatar       | `Snippet`             | No       | `-`         | Leading indicator. Falls back to the built-in `Loader` spinner.         |
| toggleIcon   | `Snippet`             | No       | `-`         | Overrides the built-in chevron on the disclosure toggle.                |
| testId       | `string`              | No       | `-`         | `data-pw` on the root; the toggle gets `-toggle`, the detail `-detail`. |
| toggleTestId | `string`              | No       | derived     | Override the toggle's test id — for apps with existing spec contracts.  |
| detailTestId | `string`              | No       | derived     | Override the detail text's test id.                                     |
| labelTestId  | `string`              | No       | `-`         | Test id on the status label itself.                                     |
| classes      | `string`              | No       | `-`         | Class string on the root element.                                       |

## CSS Variables

| Variable                                  | Default                                             | Description                          |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| `--thinking-indicator-font-size`          | `0.75rem`                                           | Label font size.                     |
| `--thinking-indicator-line-height`        | `1.25rem`                                           | Label line height.                   |
| `--thinking-indicator-label-color`        | `#858585`                                           | Label color (static / fill).         |
| `--thinking-indicator-shimmer-gradient`   | `linear-gradient(90deg, #858585, #bebebe, #858585)` | Shimmer sweep gradient.              |
| `--thinking-indicator-shimmer-duration`   | `2s`                                                | Shimmer sweep duration.              |
| `--thinking-indicator-gap`                | `0.25rem`                                           | Gap between avatar and label.        |
| `--thinking-indicator-avatar-size`        | `1.5rem`                                            | Avatar box size.                     |
| `--thinking-indicator-avatar-loader-size` | `1rem`                                              | Built-in spinner size.               |
| `--thinking-indicator-border-bottom`      | `1px solid #e4e4e7`                                 | Expandable variant separator.        |
| `--thinking-indicator-padding-block`      | `0.5rem`                                            | Expandable variant vertical padding. |
| `--thinking-indicator-margin-bottom`      | `1rem`                                              | Expandable variant bottom margin.    |
| `--thinking-indicator-arrow-size`         | `1rem`                                              | Chevron box size.                    |
| `--thinking-indicator-arrow-color`        | `#7a7a7a`                                           | Chevron color.                       |
| `--thinking-indicator-arrow-transition`   | `transform 0.2s ease-in-out`                        | Chevron rotate transition.           |
| `--thinking-indicator-detail-font-size`   | `0.875rem`                                          | Detail text font size.               |
| `--thinking-indicator-detail-line-height` | `1.5`                                               | Detail text line height.             |
| `--thinking-indicator-detail-color`       | `#bebebe`                                           | Detail text color.                   |
| `--thinking-indicator-detail-padding-top` | `0.5rem`                                            | Space above the detail text.         |

## Notes

- The expandable summary label holds still; only live status lines shimmer.
- The disclosure uses the library `Accordion` and `Button` under the hood; the toggle carries `aria-expanded`.
