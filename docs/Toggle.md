# Toggle

A labeled on/off switch with sliding ball animation. The `checked` prop controls the toggle state and the `onclick` event returns the new boolean state after toggling. The text label can be positioned relative to the switch using CSS order.

## Usage

```svelte
<script>
  import { Toggle } from '@juspay/svelte-ui-components';
</script>

<Toggle />
```

## Props

| Prop    | Type      | Required | Default | Description                                                                                                                                                            |
| ------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| checked | `boolean` | No       | `false` | The current on/off state of the toggle switch.                                                                                                                         |
| text    | `string`  | Yes      | `''`    | Label text displayed next to the toggle switch.                                                                                                                        |
| classes | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event   | Type                         | Description                                                                                            |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| onclick | `(checked: boolean) => void` | Fires after the toggle state changes. Receives the new boolean checked value (true = on, false = off). |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                  | Default           | CSS Property       | Description                                                  |
| ----------------------------------------- | ----------------- | ------------------ | ------------------------------------------------------------ |
| `--toggle-container-display`              | `flex`            | display            | Display mode of the toggle container.                        |
| `--toggle-container-align-items`          | `center`          | align-items        | Vertical alignment of switch and label.                      |
| `--toggle-container-gap`                  | `8px`             | gap                | Gap between the switch and label text.                       |
| `--toggle-text-font-size`                 | `14px`            | font-size          | Font size of the label text.                                 |
| `--toggle-text-font-weight`               | `400`             | font-weight        | Font weight of the label text.                               |
| `--toggle-text-color`                     | `#4a4a4a`         | color              | Color of the label text.                                     |
| `--toggle-text-margin`                    | `0px 8px 0px 0px` | margin             | Margin around the label text.                                |
| `--toggle-text-order`                     | `0`               | order              | Flex order of the label (0 = before switch, higher = after). |
| `--toggle-switch-width`                   | `46px`            | width              | Width of the toggle switch track.                            |
| `--toggle-switch-height`                  | `25px`            | height             | Height of the toggle switch track.                           |
| `--toggle-slider-top`                     | `0`               | top                | Top position of the slider track.                            |
| `--toggle-slider-left`                    | `0`               | left               | Left position of the slider track.                           |
| `--toggle-slider-right`                   | `0`               | right              | Right position of the slider track.                          |
| `--toggle-slider-bottom`                  | `0`               | bottom             | Bottom position of the slider track.                         |
| `--slider-unchecked-color`                | `#ccc`            | background-color   | Background color of the track when unchecked (off).          |
| `--toggle-slider-transition`              | `0.4s`            | -webkit-transition | Transition duration for the sliding animation.               |
| `--toggle-ball-height`                    | `23px`            | height             | Height of the sliding ball/thumb.                            |
| `--toggle-ball-width`                     | `23px`            | width              | Width of the sliding ball/thumb.                             |
| `--toggle-slider-before-left`             | `2px`             | left               | Left position of the ball when unchecked.                    |
| `--toggle-slider-before-bottom`           | `1px`             | bottom             | Bottom position of the ball.                                 |
| `--toggle-slider-before-top`              | `1px`             | top                | Top position of the ball.                                    |
| `--toggle-slider-before-background-color` | `white`           | background-color   | Background color of the ball/thumb.                          |
| `--slider-checked-color`                  | `#2196f3`         | background-color   | Background color of the track when checked (on).             |
| `--slider-border-radius`                  | `23px`            | border-radius      | Corner rounding of the slider track.                         |
| `--slider-border-radius-before`           | `50%`             | border-radius      | Corner rounding of the ball/thumb.                           |

## Web Component

Tag: `<sui-toggle>`

```html
<sui-toggle text="Dark mode" checked></sui-toggle>
```
