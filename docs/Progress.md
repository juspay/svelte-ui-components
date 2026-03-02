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
| value     | `number`  | Yes      | `-`     | Current progress value (0 to max). Values are clamped to the 0-max range. A negative value activates the indeterminate animation for unknown-duration tasks.           |
| max       | `number`  | No       | `100`   | The maximum value representing 100% completion. The filled percentage is calculated as (value / max) \* 100.                                                           |
| showLabel | `boolean` | No       | `false` | Whether to display the rounded percentage text next to the progress bar. Hidden during indeterminate mode.                                                             |
| testId    | `string`  | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                |
| classes   | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

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
