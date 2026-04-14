# Slider

A range slider input for selecting a numeric value within min/max bounds. The `value` prop is bindable and represents the current position of the slider thumb. The track fills with an active color from the left edge to the thumb position. An optional value label displays the current numeric value beside the slider. Supports `step` for snapping to intervals and `disabled` to prevent interaction.

## Usage

```svelte
<script>
  import { Slider } from '@juspay/svelte-ui-components';
</script>

<Slider value={50} />
```

## Props

| Prop      | Type      | Required | Default | Description                                                                                                                                                            |
| --------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `number`  | No       | `0`     | Bindable. The current numeric value of the slider. Must be between `min` and `max`. Two-way bound to the underlying range input.                                       |
| min       | `number`  | No       | `0`     | The minimum allowed value. Defines the left edge of the slider track.                                                                                                  |
| max       | `number`  | No       | `100`   | The maximum allowed value. Defines the right edge of the slider track.                                                                                                 |
| step      | `number`  | No       | `1`     | The increment between selectable values. The slider snaps to multiples of this value between min and max.                                                              |
| disabled  | `boolean` | No       | `false` | Whether the slider is disabled. When true, the slider is visually dimmed, the thumb cannot be dragged, and no events fire.                                             |
| showValue | `boolean` | No       | `false` | Whether to display the current numeric value as a label next to the slider track.                                                                                      |
| testId    | `string`  | No       | `-`     | Value for the data-pw attribute on the range input, used for end-to-end testing selectors.                                                                             |
| classes   | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event    | Type                      | Description                                                                                                                                                                                                        |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| oninput  | `(value: number) => void` | Fires continuously as the user drags the slider thumb. Receives the current numeric value at each position during the drag. Use this for live preview updates.                                                     |
| onchange | `(value: number) => void` | Fires when the user releases the slider thumb after dragging, or when a discrete value change completes (e.g., keyboard arrow keys). Receives the final selected numeric value. Use this for committing the value. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                       | Default                        | CSS Property       | Description                                                                                                                                                                                            |
| ------------------------------ | ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--slider-track`               | (two-stop fill gradient)       | background         | Overrides the entire track background. Use for custom gradients (e.g., a rainbow hue gradient for color pickers). When set, `--slider-track-active-color` and `--slider-track-background` are ignored. |
| `--slider-container-width`     | `100%`                         | width              | Width of the slider container element.                                                                                                                                                                 |
| `--slider-container-padding`   | `4px 0`                        | padding            | Padding around the slider container.                                                                                                                                                                   |
| `--slider-track-height`        | `6px`                          | height             | Height (thickness) of the slider track.                                                                                                                                                                |
| `--slider-track-background`    | `#e0e0e0`                      | background         | Background color of the unfilled portion of the track (right of thumb).                                                                                                                                |
| `--slider-track-border-radius` | `3px`                          | border-radius      | Corner rounding of the slider track.                                                                                                                                                                   |
| `--slider-track-active-color`  | `#2196f3`                      | background         | Color of the filled portion of the track (left of thumb).                                                                                                                                              |
| `--slider-thumb-size`          | `20px`                         | width, height      | Width and height of the draggable thumb.                                                                                                                                                               |
| `--slider-thumb-background`    | `#ffffff`                      | background         | Background color of the thumb.                                                                                                                                                                         |
| `--slider-thumb-border`        | `2px solid #2196f3`            | border             | Border of the thumb.                                                                                                                                                                                   |
| `--slider-thumb-border-radius` | `50%`                          | border-radius      | Corner rounding of the thumb. Use 50% for a circle.                                                                                                                                                    |
| `--slider-thumb-shadow`        | `0 1px 3px rgba(0, 0, 0, 0.2)` | box-shadow         | Box shadow around the thumb for depth.                                                                                                                                                                 |
| `--slider-thumb-hover-scale`   | `1.15`                         | transform: scale() | Scale factor applied to the thumb on hover for visual feedback.                                                                                                                                        |
| `--slider-focus-ring`          | `2px solid #2196f3`            | outline            | Outline shown around the thumb when it receives keyboard focus (focus-visible).                                                                                                                        |
| `--slider-disabled-opacity`    | `0.5`                          | opacity            | Opacity of the entire slider when disabled.                                                                                                                                                            |
| `--slider-disabled-cursor`     | `not-allowed`                  | cursor             | Cursor shown when hovering the disabled slider.                                                                                                                                                        |
| `--slider-value-font-size`     | `14px`                         | font-size          | Font size of the value label text.                                                                                                                                                                     |
| `--slider-value-color`         | `#333333`                      | color              | Color of the value label text.                                                                                                                                                                         |
| `--slider-value-font-weight`   | `500`                          | font-weight        | Font weight of the value label text.                                                                                                                                                                   |
| `--slider-transition`          | `background 0.2s ease`         | transition         | Transition applied to the track background for smooth fill changes.                                                                                                                                    |

## Web Component

Tag: `<sui-slider>`

```html
<sui-slider value="50" min="0" max="100" step="1" show-value></sui-slider>
```
