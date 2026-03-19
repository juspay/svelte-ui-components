# LoadingDots

Animated dot sequence for inline loading indication. Three dots animate in sequence to indicate background activity. Displays inline so it works naturally within text, buttons, or any other container.

## Usage

```svelte
<script>
  import { LoadingDots } from '@juspay/svelte-ui-components';
</script>

<LoadingDots />
```

## Props

| Prop      | Type                  | Required | Default    | Description                                                                                                                                                            |
| --------- | --------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dots      | `number`              | No       | `3`        | Number of dots to display. Values are rounded to the nearest integer and clamped to a minimum of 1.                                                                    |
| animation | `'bounce' \| 'pulse'` | No       | `'bounce'` | The animation style applied to the dots. Bounce moves dots vertically using translateY. Pulse fades dots in and out using opacity.                                     |
| testId    | `string`              | No       | `-`        | Value for the data-pw attribute on the root element, used for end-to-end testing selectors.                                                                            |
| classes   | `string`              | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                           | Default        | CSS Property       | Description                                                                                                                 |
| ---------------------------------- | -------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `--loading-dots-color`             | `currentColor` | background-color   | Color of the dots. Inherits from the parent text color by default, so it automatically matches surrounding content.         |
| `--loading-dots-size`              | `6px`          | width, height      | Diameter of each dot.                                                                                                       |
| `--loading-dots-gap`               | `3px`          | gap                | Horizontal spacing between dots.                                                                                            |
| `--loading-dots-border-radius`     | `50%`          | border-radius      | Corner rounding of each dot. Default of 50% creates circles; set to 0 for squares.                                          |
| `--loading-dots-duration`          | `1.4s`         | animation-duration | Total duration of one animation cycle.                                                                                      |
| `--loading-dots-stagger`           | `0.16s`        | animation-delay    | Delay between each successive dot's animation start, creating the sequential wave effect.                                   |
| `--loading-dots-bounce-height`     | `-6px`         | translateY         | How far the dots travel upward during the bounce animation. Negative values move up. Only applies when animation is bounce. |
| `--loading-dots-pulse-min-opacity` | `0.2`          | opacity            | The minimum opacity a dot fades to during the pulse animation. Only applies when animation is pulse.                        |

## Web Component

Tag: `<sui-loading-dots>`

```html
<sui-loading-dots size="md" animation="bounce"></sui-loading-dots>
```
