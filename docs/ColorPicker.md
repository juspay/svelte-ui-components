# ColorPicker

A color picker component that lets the user select a color using a saturation/brightness panel, a hue slider, and direct input fields. The `value` prop is bindable and holds the selected color as a HEX string (e.g. `#ff0000`). A trigger button displays the current color as a swatch, and optionally a text input shows the HEX value inline. Clicking the swatch opens a popover with a 2D saturation/brightness panel, a hue gradient slider (powered by the Slider component), a live preview swatch, and switchable input fields supporting HEX, RGB, and HSL modes. Supports `disabled` to prevent interaction.

## Usage

```svelte
<script>
  import { ColorPicker } from '@juspay/svelte-ui-components';
</script>

<ColorPicker value="#3b82f6" />
```

## Props

| Prop      | Type      | Required | Default     | Description                                                                                                                                                                      |
| --------- | --------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `string`  | Yes      | `'#000000'` | Bindable. The current color as a 7-character HEX string (e.g. `#3b82f6`). Two-way bound so parent components can read and write the selected color.                              |
| label     | `string`  | No       | `-`         | Optional text label rendered above the trigger row. When provided, a `<span>` with the label text appears above the swatch button.                                               |
| disabled  | `boolean` | No       | `false`     | Whether the color picker is disabled. When true, the trigger button cannot be clicked, the popover cannot open, and the component is visually dimmed.                            |
| showValue | `boolean` | No       | `false`     | Whether to display a text input beside the swatch showing the current HEX value. When true, the user can type a HEX value directly into the inline input.                        |
| testId    | `string`  | No       | `-`         | Value for the `data-pw` attribute on the container element, used for end-to-end testing selectors.                                                                               |
| classes   | `string`  | No       | `-`         | CSS class string applied to the component's top-level container element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event    | Type                      | Description                                                                                                                                                                                                           |
| -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| oninput  | `(value: string) => void` | Fires when the color changes during interaction — as the user drags on the saturation panel, moves the hue slider, or types into an input field. Receives the new HEX string. Use this for live preview updates.      |
| onchange | `(value: string) => void` | Fires alongside `oninput` whenever the color value is committed — after a saturation panel drag, hue slider adjustment, or valid input field entry. Receives the final HEX string. Use this for persisting the value. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                     | Default                                                            | CSS Property   | Description                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------- |
| `--color-picker-gap`                         | `8px`                                                              | gap            | Vertical gap between the label and the trigger row.                                     |
| `--color-picker-width`                       | `fit-content`                                                      | width          | Width of the top-level container element.                                               |
| `--color-picker-disabled-opacity`            | `0.5`                                                              | opacity        | Opacity of the entire component when disabled.                                          |
| `--color-picker-label-font-size`             | `13px`                                                             | font-size      | Font size of the label text above the trigger.                                          |
| `--color-picker-label-font-weight`           | `500`                                                              | font-weight    | Font weight of the label text.                                                          |
| `--color-picker-label-color`                 | `#374151`                                                          | color          | Text color of the label.                                                                |
| `--color-picker-label-letter-spacing`        | `0.01em`                                                           | letter-spacing | Letter spacing of the label text.                                                       |
| `--color-picker-row-gap`                     | `0px`                                                              | gap            | Horizontal gap between the swatch button and the inline hex input in the trigger row.   |
| `--color-picker-swatch-btn-background`       | `#f9fafb`                                                          | background     | Background color of the swatch trigger button.                                          |
| `--color-picker-swatch-btn-border`           | `1px solid #d1d5db`                                                | border         | Border of the swatch trigger button.                                                    |
| `--color-picker-swatch-btn-border-radius`    | `10px 0 0 10px` (or `10px` when `showValue` is false)              | border-radius  | Border radius of the swatch trigger button. Rounded on all sides when standalone.       |
| `--color-picker-swatch-btn-hover-background` | `#f3f4f6`                                                          | background     | Background color of the swatch trigger button on hover.                                 |
| `--color-picker-swatch-padding`              | `5px`                                                              | padding        | Padding inside the swatch trigger button around the color swatch.                       |
| `--color-picker-swatch-size`                 | `26px`                                                             | width, height  | Width and height of the color swatch square inside the trigger button.                  |
| `--color-picker-swatch-border-radius`        | `5px`                                                              | border-radius  | Border radius of the color swatch square.                                               |
| `--color-picker-swatch-inner-shadow`         | `inset 0 0 0 1px rgba(0, 0, 0, 0.08)`                              | box-shadow     | Inner shadow on the color swatch to provide contrast against similar background colors. |
| `--color-picker-mono-font`                   | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | font-family    | Monospace font family used for the inline hex input and popover input fields.           |
| `--color-picker-popover-z-index`             | `50`                                                               | z-index        | Z-index of the popover panel, controlling its stacking order.                           |
| `--color-picker-popover-width`               | `280px`                                                            | width          | Width of the popover panel.                                                             |
| `--color-picker-popover-padding`             | `12px`                                                             | padding        | Padding inside the popover panel.                                                       |
| `--color-picker-popover-background`          | `#ffffff`                                                          | background     | Background color of the popover panel.                                                  |
| `--color-picker-popover-border`              | `1px solid #e5e7eb`                                                | border         | Border of the popover panel.                                                            |
| `--color-picker-popover-border-radius`       | `12px`                                                             | border-radius  | Border radius of the popover panel.                                                     |
| `--color-picker-popover-shadow`              | `0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)`    | box-shadow     | Box shadow of the popover panel for elevation effect.                                   |
| `--color-picker-panel-border-radius`         | `8px`                                                              | border-radius  | Border radius of the saturation/brightness panel inside the popover.                    |
| `--color-picker-field-border`                | `#d1d5db`                                                          | border-color   | Border color of the HEX/RGB/HSL input fields in the popover.                            |
| `--color-picker-field-color`                 | `#374151`                                                          | color          | Text color inside the popover input fields.                                             |
| `--color-picker-field-background`            | `#ffffff`                                                          | background     | Background color of the popover input fields and the mode toggle button.                |
| `--color-picker-field-focus-border`          | `#3b82f6`                                                          | border-color   | Border color of the popover input fields when focused.                                  |
| `--color-picker-field-label-color`           | `#9ca3af`                                                          | color          | Text color of the field labels (HEX, R, G, B, H, S, L) and the mode toggle button icon. |

## Internal Dependencies

- **Button** — used for the swatch trigger button and the color mode toggle button.
- **Input** — used for the inline HEX text input (when `showValue` is true) and the HEX/RGB/HSL input fields in the popover.
- **Slider** — used for the hue gradient slider in the popover.
- **swap-vertical.svg** — SVG icon used inside the mode toggle button to indicate cycling between HEX, RGB, and HSL input modes.
