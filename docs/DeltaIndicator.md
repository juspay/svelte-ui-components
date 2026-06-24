# DeltaIndicator

A compact inline indicator that conveys change direction and magnitude using a directional arrow and formatted text. Positive values are rendered in green, negative in red, and values within the neutral threshold in muted gray. Supports inverted color semantics for lower-is-better metrics (e.g. bounce rate, RTO), an optional arrow-hide mode for text-only display, a configurable neutral threshold, and a custom format function for full control over the displayed text.

## Usage

```svelte
<script>
  import { DeltaIndicator } from '@juspay/svelte-ui-components';
</script>

<DeltaIndicator value={12.5} />
```

### Negative and Neutral

```svelte
<DeltaIndicator value={-7.3} />
<DeltaIndicator value={0} />
```

### Neutral Threshold

Values whose absolute magnitude is at or below `neutralThreshold` are treated as neutral and rendered in the muted color without an arrow.

```svelte
<!-- 0.4 is within ±0.5 — treated as neutral -->
<DeltaIndicator value={0.4} neutralThreshold={0.5} />
```

### Inverted Colors

Use `invertColors` for lower-is-better metrics where a decrease is "good" (green) and an increase is "bad" (red).

```svelte
<!-- Bounce rate dropped 5.2% — good, renders green -->
<DeltaIndicator value={-5.2} invertColors />

<!-- Bounce rate rose 3.8% — bad, renders red -->
<DeltaIndicator value={3.8} invertColors />
```

### Hide Arrow

```svelte
<DeltaIndicator value={18} hideArrow />
```

### Custom Format

Pass a `format` function `(value: number) => string` to control the displayed text. The raw (signed) value is passed; use `Math.abs` inside if you want to suppress the sign.

```svelte
<script>
  const currencyFormat = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
</script>

<DeltaIndicator value={42.5} format={currencyFormat} />
```

### Theming with Classes

Define a class in your CSS that sets DeltaIndicator CSS variables and pass it via `classes`:

```css
/* app.css */
.delta-large {
  --delta-indicator-font-size: 18px;
  --delta-indicator-arrow-size: 14px;
  --delta-indicator-gap: 5px;
}
```

```svelte
<DeltaIndicator value={9.1} classes="delta-large" />
```

## Props

| Prop             | Type                       | Required | Default                        | Description                                                                                                                                       |
| ---------------- | -------------------------- | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| value            | `number`                   | Yes      | `-`                            | The change amount. Its sign determines direction: positive → up, negative → down. When the absolute value is ≤ `neutralThreshold`, direction is neutral. |
| format           | `(value: number) => string` | No       | `v => Math.round(Math.abs(v)) + '%'` | Custom formatter for the displayed text. Receives the raw signed value. Default shows the rounded absolute value followed by a percent sign.      |
| invertColors     | `boolean`                  | No       | `false`                        | Swaps the up/down color tone for lower-is-better metrics. When `true`, an upward change renders in red and a downward change renders in green.    |
| hideArrow        | `boolean`                  | No       | `false`                        | Hides the directional triangle arrow, rendering only the formatted text string.                                                                   |
| neutralThreshold | `number`                   | No       | `0`                            | Absolute values at or below this threshold are classified as neutral (muted color, no arrow). Useful for suppressing noise on near-zero changes.  |
| testId           | `string`                   | No       | `-`                            | Value for the `data-pw` attribute on the root element, used for end-to-end testing selectors.                                                    |
| classes          | `string`                   | No       | `-`                            | CSS class string applied to the root element. Useful for theming via class-scoped CSS variable overrides.                                        |

## CSS Variables

Override these custom properties to theme the component.

| Variable                           | Default    | CSS Property | Description                                                                 |
| ---------------------------------- | ---------- | ------------ | --------------------------------------------------------------------------- |
| `--delta-indicator-gap`            | `2px`      | gap          | Space between the arrow icon and the text label.                            |
| `--delta-indicator-font-size`      | `13px`     | font-size    | Font size of the indicator text.                                            |
| `--delta-indicator-font-weight`    | `600`      | font-weight  | Font weight of the indicator text.                                          |
| `--delta-indicator-positive-color` | `#1a9d6f`  | color        | Color used when the tone is positive (value up, or value down + invertColors). |
| `--delta-indicator-negative-color` | `#e5484d`  | color        | Color used when the tone is negative (value down, or value up + invertColors). |
| `--delta-indicator-neutral-color`  | `#8a8a8a`  | color        | Color used when the value is within the neutral threshold.                  |
| `--delta-indicator-arrow-size`     | `9px`      | width, height | Size of the directional triangle arrow SVG.                               |

## Web Component

Tag: `<sui-delta-indicator>`

```html
<sui-delta-indicator value="12.5"></sui-delta-indicator>
<sui-delta-indicator value="-7.3" invert-colors></sui-delta-indicator>
<sui-delta-indicator value="18" hide-arrow></sui-delta-indicator>
<sui-delta-indicator value="0.4" neutral-threshold="0.5"></sui-delta-indicator>
```

Passing a custom `format` function via the web component requires setting the property programmatically:

```js
const el = document.querySelector('sui-delta-indicator');
el.format = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} bps`;
```
