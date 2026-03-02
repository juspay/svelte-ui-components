# Gauge

A circular visual indicator for displaying percentages. Uses an SVG ring where the filled arc represents the current value. The `value` prop controls the filled portion (0-100) and an optional centered label displays the rounded percentage. The fill arc animates smoothly when the value changes.

## Usage

```svelte
<script>
  import { Gauge } from '@juspay/svelte-ui-components';
</script>

<Gauge value={75} />
```

## Props

| Prop        | Type      | Required | Default | Description                                                                                                                                                            |
| ----------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value       | `number`  | Yes      | `-`     | Current percentage value (0-100). Values are clamped to the 0-100 range. Controls how much of the circular arc is filled.                                              |
| size        | `number`  | No       | `120`   | Diameter of the gauge in pixels. Sets both the SVG dimensions and the container size.                                                                                  |
| strokeWidth | `number`  | No       | `8`     | Width of the circular track and fill arc in pixels. The ring radius is calculated as (size - strokeWidth) / 2.                                                         |
| showLabel   | `boolean` | No       | `true`  | Whether to display the rounded percentage text centered inside the gauge ring.                                                                                         |
| testId      | `string`  | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                |
| classes     | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default   | CSS Property        | Description                                                                               |
| ----------------------------- | --------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `--gauge-container-size`      | -         | width, height       | Overrides the container dimensions. By default the container is sized by the `size` prop. |
| `--gauge-track-color`         | `#e0e0e0` | stroke              | Color of the background ring (unfilled portion of the circle).                            |
| `--gauge-bar-color`           | `#2196f3` | stroke              | Color of the filled arc that represents the current value.                                |
| `--gauge-transition-duration` | `0.3s`    | transition-duration | Duration of the animation when the filled arc changes.                                    |
| `--gauge-label-font-size`     | `24px`    | font-size           | Font size of the centered percentage label.                                               |
| `--gauge-label-font-weight`   | `600`     | font-weight         | Font weight of the centered percentage label.                                             |
| `--gauge-label-font-family`   | `inherit` | font-family         | Font family of the centered percentage label.                                             |
| `--gauge-label-color`         | `#333`    | color               | Text color of the centered percentage label.                                              |
