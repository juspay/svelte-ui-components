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
| segments  | `number`  | No       | `-`     | When set to a positive integer N, renders the bar as N discrete segments instead of a continuous fill; the first `value` segments are filled. Ideal for count-based progress like "3 of 12 installments paid". When unset or `0`, the continuous bar is used. A negative `value` (indeterminate) is ignored in segmented mode. |

## Segmented mode

Set `segments` to a positive integer to render the bar as that many discrete segments instead of a single continuous fill. The first `value` segments are filled, which makes it ideal for count-based progress such as "3 of 12 installments paid". `max` is still used to compute the optional percentage label.

```svelte
<Progress value={3} max={12} segments={12} />
```

When `segments` is unset or `0`, the component renders the original continuous bar — existing usage is unchanged. A negative `value` activates the indeterminate animation only in continuous mode; in segmented mode it simply renders zero filled segments. Segment appearance is controlled by the `--progress-segment-*` variables documented below.

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
| `--progress-segments-gap`              | `2px`                                    | gap           | Gap between segments in segmented mode. Set to `0` for a fused bar.            |
| `--progress-segment-radius`            | `0`                                      | border-radius | Corner rounding of the middle segments.                                       |
| `--progress-segment-radius-end`        | `4px`                                    | border-radius | Corner rounding on the outer edges (left of the first, right of the last segment). |
| `--progress-segment-filled-background` | `var(--progress-bar-background, #2196f3)` | background    | Background of filled segments. Inherits the continuous bar colour by default. |
| `--progress-segment-empty-background`  | `var(--progress-track-background, #e0e0e0)` | background  | Background of empty segments. Inherits the continuous track colour by default. |
| `--progress-segment-transition`        | `background 0.2s ease`                   | transition    | Transition applied when a segment changes fill state.                         |

## Web Component

Tag: `<sui-progress>`

```html
<sui-progress value="60" max="100" show-label></sui-progress>
```

Segmented mode is available on the web component too via the `segments` attribute:

```html
<sui-progress value="3" max="12" segments="12"></sui-progress>
```
