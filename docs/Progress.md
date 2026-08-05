# Progress

A linear progress bar showing task completion or usage. The `value` prop controls the filled portion relative to `max`. When `showLabel` is true, a percentage text is displayed next to the bar. Setting `value` to a negative number activates an indeterminate sliding animation for unknown-duration tasks.

## Usage

```svelte
<script>
  import { Progress } from '@juspay/svelte-ui-components';
</script>

<Progress value={60} />
```

## Props

| Prop      | Type      | Required | Default | Description                                                                                                                                                            |
| --------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `number`  | Yes      | `-`     | Current progress value (0 to max). Values are clamped to the 0-max range. A negative value activates the indeterminate animation for unknown-duration tasks. A non-finite value (e.g. `NaN`) is treated as an invalid range -- see `max` below.       |
| max       | `number`  | No       | `100`   | The maximum value representing 100% completion. The filled percentage is calculated as (value / max) \* 100. `max` must be finite and positive; a zero, negative, or non-finite `max` (or a non-finite `value`) is an invalid range and renders the bar at 0% instead of `NaN`. |
| showLabel | `boolean` | No       | `false` | Whether to display the rounded percentage text next to the progress bar. Hidden during indeterminate mode.                                                             |
| ariaLabel | `string`  | No       | `-`     | Accessible name for the progress bar. Falls back to the same percentage text as `showLabel` (e.g. `"75%"`) when determinate, or `"Loading"` when indeterminate.        |
| testId    | `string`  | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                |
| classes   | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Accessibility

The root element sets `role="progressbar"` with `aria-valuemin="0"` and `aria-valuemax="100"` — these two are constant regardless of the raw `value`/`max` domain, so assistive technology always hears a plain 0-100 scale (matching the convention `Gauge` already uses). `aria-valuenow` itself is only well-defined for a *valid* range, i.e. a finite `value` and a finite, positive `max`; when it is, `aria-valuenow` is rounded to 2 decimal places rather than the nearest whole number, so it stays effectively in step with the bar's raw fractional width instead of drifting from what's visually shown (matching `Gauge`'s convention of tying `aria-valuenow` to the raw computed value rather than the rounded display text); the separate `showLabel` text still rounds to the nearest whole percent, since that's the right precision for a human-readable label. For an invalid range (zero, negative, or non-finite `max`, or a non-finite `value`) the component does not propagate `NaN` into `aria-valuenow` or the label -- it falls back to a 0% determinate bar (`aria-valuenow="0"`, label `"0%"`) instead.

In indeterminate mode (`value < 0`) `aria-valuenow` is omitted entirely per the WAI-ARIA progressbar pattern, and `aria-valuetext="indeterminate"` plus `aria-busy="true"` are set instead, so assistive technology announces the unknown-duration state rather than reading it as stuck at a fixed value. `aria-valuemin`/`aria-valuemax` are kept in both modes — the 0-100 scale itself isn't unknown, only the current position within it is.

Use the `ariaLabel` prop to give the bar an accessible name describing what it measures (e.g. `"File upload progress"`). When omitted, it falls back to the same percentage text `showLabel` displays (or `"Loading"` while indeterminate, matching the `aria-label` `LoadingDots` already uses for its own loading state), so assistive technology always announces a name even if you forget to set one explicitly.

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default           | CSS Property       | Description                                                   |
| ----------------------------------- | ----------------- | ------------------ | ------------------------------------------------------------- |
| `--progress-container-width`        | `100%`            | width              | Width of the outer container holding the track and label.     |
| `--progress-container-padding`      | `0`               | padding            | Padding around the progress container.                        |
| `--progress-container-gap`          | `8px`             | gap                | Gap between the track and the percentage label.               |
| `--progress-track-height`           | `8px`             | height             | Height of the background track.                               |
| `--progress-track-background`       | `#e0e0e0`         | background         | Background color of the unfilled track.                       |
| `--progress-track-border-radius`    | `4px`             | border-radius      | Corner rounding of the track.                                 |
| `--progress-bar-background`         | `#2196f3`         | background         | Background color of the filled bar.                           |
| `--progress-bar-border-radius`      | `4px`             | border-radius      | Corner rounding of the filled bar.                            |
| `--progress-bar-transition`         | `width 0.3s ease` | transition         | Transition applied when the bar width changes.                |
| `--progress-indeterminate-duration` | `1.5s`            | animation-duration | Duration of one cycle of the indeterminate sliding animation. |
| `--progress-label-font-size`        | `14px`            | font-size          | Font size of the percentage label.                            |
| `--progress-label-font-weight`      | `500`             | font-weight        | Font weight of the percentage label.                          |
| `--progress-label-color`            | `#333`            | color              | Text color of the percentage label.                           |
| `--progress-label-font-family`      | `inherit`         | font-family        | Font family of the percentage label.                          |
| `--progress-label-margin`           | `0`               | margin             | Margin around the percentage label.                           |

## Web Component

Tag: `<sui-progress>`

```html
<sui-progress value="60" max="100" show-label></sui-progress>
```
