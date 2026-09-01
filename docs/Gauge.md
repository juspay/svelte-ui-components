# Gauge

A circular visual indicator for displaying values against a configurable maximum. Uses an SVG ring where the filled arc represents the current value divided by `max`. The `value` prop is a raw number; the filled percentage is computed as `(value / max) * 100`. An optional centered label displays the rounded percentage (or a custom string via `labelFormatter`). The fill arc animates smoothly when the value changes. Has no indeterminate/unknown-duration mode — for a linear bar with that capability, use `Progress` instead.

## Usage

```svelte
<script>
  import { Gauge } from '@juspay/svelte-ui-components';
</script>

<Gauge value={75} />
<Gauge value={150} max={600} />
<Gauge value={50} max={200} labelFormatter={(v, m) => `${v} / ${m}`} />
```

## Props

| Prop           | Type                                     | Required | Default        | Description                                                                                                                                                                                           |
| -------------- | ---------------------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value          | `number`                                 | Yes      | `-`            | Raw value divided by `max` to compute the fill percentage. For example, `value=50` with `max=200` fills the gauge to 25%. Values that produce a percentage outside 0–100 are clamped.                 |
| max            | `number`                                 | No       | `100`          | Maximum value of the gauge. Defaults to 100 so that `value` acts as a direct percentage when `max` is omitted. When `max` is 0 or negative the gauge renders empty (0%) to avoid division by zero.    |
| showLabel      | `boolean`                                | No       | `true`         | Whether to display the label centered inside the gauge ring.                                                                                                                                          |
| labelFormatter | `(value: number, max: number) => string` | No       | `-`            | Custom label renderer. Receives the raw `value` and `max` and returns a display string. Defaults to the computed percentage string (e.g. `"25%"`).                                                    |
| ariaLabel      | `string`                                 | No       | computed label | Accessible name for the gauge element (`role="progressbar"`). Falls back to the computed label text (e.g. `"75%"`) when omitted, so assistive technology announces the current percentage by default. |
| testId         | `string`                                 | No       | `-`            | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                                               |
| classes        | `string`                                 | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                |

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default   | CSS Property        | Description                                                    |
| ----------------------------- | --------- | ------------------- | -------------------------------------------------------------- |
| `--gauge-size`                | `120px`   | width, height       | Diameter of the gauge container.                               |
| `--gauge-stroke-width`        | `8`       | stroke-width        | Width of the circular track and fill arc.                      |
| `--gauge-track-color`         | `#e0e0e0` | stroke              | Color of the background ring (unfilled portion of the circle). |
| `--gauge-bar-color`           | `#2196f3` | stroke              | Color of the filled arc that represents the current value.     |
| `--gauge-transition-duration` | `0.3s`    | transition-duration | Duration of the animation when the filled arc changes.         |
| `--gauge-label-font-size`     | `24px`    | font-size           | Font size of the centered label.                               |
| `--gauge-label-font-weight`   | `600`     | font-weight         | Font weight of the centered label.                             |
| `--gauge-label-font-family`   | `inherit` | font-family         | Font family of the centered label.                             |
| `--gauge-label-color`         | `#333`    | color               | Text color of the centered label.                              |

## Web Component

Tag: `<sui-gauge>`

```html
<sui-gauge value="75" show-label></sui-gauge> <sui-gauge value="150" max="600"></sui-gauge>
```
