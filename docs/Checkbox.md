# Checkbox

A customizable checkbox control with optional label text. Supports checked, unchecked, indeterminate, and disabled states. The `checked` prop is bindable and the `onclick` event fires with the new state after toggling. All visual aspects are controlled via CSS custom properties.

## Usage

```svelte
<script>
  import { Checkbox } from '@juspay/svelte-ui-components';
</script>

<Checkbox text="Accept terms" />
```

## Props

| Prop          | Type      | Required | Default     | Description                                                                                                                                                            |
| ------------- | --------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text          | `string`  | Yes      | -           | Label text displayed next to the checkbox.                                                                                                                             |
| checked       | `boolean` | No       | `false`     | The current checked state of the checkbox. Bindable.                                                                                                                   |
| disabled      | `boolean` | No       | `false`     | When true, the checkbox is non-interactive and visually dimmed.                                                                                                        |
| indeterminate | `boolean` | No       | `false`     | When true, displays an indeterminate (dash) state instead of a checkmark. Typically used for "select all" patterns where only some children are selected.              |
| testId        | `string`  | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes       | `string`  | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event   | Type                         | Description                                                                                                                                                      |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(checked: boolean) => void` | Fires after the checkbox state changes. Receives the new boolean checked value (true = checked, false = unchecked). Does not fire when the checkbox is disabled. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                              | Default                             | CSS Property       | Description                                                           |
| ------------------------------------- | ----------------------------------- | ------------------ | --------------------------------------------------------------------- |
| `--checkbox-container-display`        | `inline-flex`                       | display            | Display mode of the checkbox container.                               |
| `--checkbox-container-align-items`    | `center`                            | align-items        | Vertical alignment of checkbox and label.                             |
| `--checkbox-container-gap`            | `8px`                               | gap                | Gap between the checkbox and label text.                              |
| `--checkbox-container-cursor`         | `pointer`                           | cursor             | Cursor when hovering the checkbox container.                          |
| `--checkbox-size`                     | `20px`                              | width, height      | Width and height of the checkbox box.                                 |
| `--checkbox-border`                   | `2px solid #757575`                 | border             | Border of the checkbox box in its unchecked state.                    |
| `--checkbox-border-radius`            | `3px`                               | border-radius      | Corner rounding of the checkbox box.                                  |
| `--checkbox-background`               | `transparent`                       | background-color   | Background color of the checkbox box when unchecked.                  |
| `--checkbox-checked-background`       | `#2196f3`                           | background-color   | Background color of the checkbox box when checked.                    |
| `--checkbox-checked-border`           | `2px solid #2196f3`                 | border             | Border of the checkbox box when checked.                              |
| `--checkbox-indeterminate-background` | `#2196f3`                           | background-color   | Background color of the checkbox box when in the indeterminate state. |
| `--checkbox-indeterminate-border`     | `2px solid #2196f3`                 | border             | Border of the checkbox box when in the indeterminate state.           |
| `--checkbox-disabled-opacity`         | `0.4`                               | opacity            | Opacity of the entire checkbox when disabled.                         |
| `--checkbox-disabled-cursor`          | `not-allowed`                       | cursor             | Cursor when hovering a disabled checkbox.                             |
| `--checkbox-hover-border-color`       | `#212121`                           | border-color       | Border color of the checkbox box on hover (unchecked state only).     |
| `--checkbox-focus-ring`               | `0 0 0 3px rgba(33, 150, 243, 0.3)` | box-shadow         | Focus ring shown when the checkbox receives keyboard focus.           |
| `--checkbox-transition`               | `0.2s`                              | transition         | Transition duration for background and border changes.                |
| `--checkbox-checkmark-color`          | `white`                             | color (SVG stroke) | Color of the checkmark icon when checked.                             |
| `--checkbox-dash-color`               | `white`                             | color (SVG stroke) | Color of the dash icon when in the indeterminate state.               |
| `--checkbox-icon-size`                | `14px`                              | width, height      | Size of the checkmark/dash icon inside the checkbox.                  |
| `--checkbox-label-font-size`          | `14px`                              | font-size          | Font size of the label text.                                          |
| `--checkbox-label-font-weight`        | `400`                               | font-weight        | Font weight of the label text.                                        |
| `--checkbox-label-color`              | `#212121`                           | color              | Color of the label text.                                              |
