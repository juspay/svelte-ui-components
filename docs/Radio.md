# Radio

A single radio button within a group. Multiple Radio components sharing the same `name` form a mutually exclusive group where only one can be selected at a time. Uses a hidden native `<input type="radio">` for accessibility with a fully customizable visual indicator. The `selectedValue` prop is bindable so that all radios in a group stay synchronized.

## Usage

```svelte
<script>
  import { Radio } from '@juspay/svelte-ui-components';

  let selectedPayment = $state('upi');
</script>

<Radio name="payment" value="upi" bind:selectedValue={selectedPayment} text="UPI" />
<Radio name="payment" value="card" bind:selectedValue={selectedPayment} text="Card" />
<Radio name="payment" value="netbanking" bind:selectedValue={selectedPayment} text="Net Banking" />
```

## Props

| Prop          | Type      | Required | Default     | Description                                                                                                                                                            |
| ------------- | --------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name          | `string`  | Yes      | —           | The group name shared by all radio buttons in the same group. Maps to the native input's `name` attribute.                                                             |
| value         | `string`  | Yes      | —           | The value this radio button represents. When selected, `selectedValue` becomes this value.                                                                             |
| selectedValue | `string`  | No       | `''`        | The currently selected value in the group. Bindable. When this matches `value`, the radio appears selected.                                                            |
| text          | `string`  | No       | `''`        | Label text displayed next to the radio indicator. Hidden when empty.                                                                                                   |
| disabled      | `boolean` | No       | `false`     | When true, the radio button cannot be interacted with and appears in a disabled visual state.                                                                          |
| testId        | `string`  | No       | `undefined` | Test identifier applied as `data-pw` attribute on the container for Playwright test selectors.                                                                         |
| classes       | `string`  | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event    | Type                      | Description                                                                                                                                                               |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(value: string) => void` | Fires when this radio button is selected. Receives the `value` of the newly selected radio. Does not fire when the radio is deselected by selecting another in the group. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                        | Default                             | CSS Property     | Description                                                      |
| ------------------------------- | ----------------------------------- | ---------------- | ---------------------------------------------------------------- |
| `--radio-container-display`     | `inline-flex`                       | display          | Display mode of the radio container.                             |
| `--radio-container-align-items` | `center`                            | align-items      | Vertical alignment of the indicator and label.                   |
| `--radio-container-gap`         | `8px`                               | gap              | Space between the radio indicator and label text.                |
| `--radio-container-cursor`      | `pointer`                           | cursor           | Cursor style when hovering over the radio.                       |
| `--radio-container-opacity`     | `1`                                 | opacity          | Opacity of the entire radio component.                           |
| `--radio-size`                  | `20px`                              | width, height    | Size of the outer radio circle.                                  |
| `--radio-border`                | `2px solid #9e9e9e`                 | border           | Border of the radio circle when unselected.                      |
| `--radio-border-radius`         | `50%`                               | border-radius    | Border radius of the outer circle (50% for a perfect circle).    |
| `--radio-background`            | `#ffffff`                           | background-color | Background color of the radio circle when unselected.            |
| `--radio-selected-border`       | `2px solid #2196f3`                 | border           | Border of the radio circle when selected.                        |
| `--radio-selected-background`   | `#ffffff`                           | background-color | Background color of the radio circle when selected.              |
| `--radio-disabled-border`       | `2px solid #cccccc`                 | border           | Border of the radio circle when disabled.                        |
| `--radio-disabled-background`   | `#f5f5f5`                           | background-color | Background color of the radio circle when disabled.              |
| `--radio-dot-size`              | `10px`                              | width, height    | Size of the inner dot that appears when selected.                |
| `--radio-dot-color`             | `#2196f3`                           | background-color | Color of the inner dot when selected.                            |
| `--radio-dot-border-radius`     | `50%`                               | border-radius    | Border radius of the inner dot (50% for a perfect circle).       |
| `--radio-disabled-dot-color`    | `#cccccc`                           | background-color | Color of the inner dot when selected and disabled.               |
| `--radio-hover-border`          | `2px solid #2196f3`                 | border           | Border of the radio circle on hover (when not disabled).         |
| `--radio-focus-shadow`          | `0 0 0 3px rgba(33, 150, 243, 0.3)` | box-shadow       | Focus ring shadow shown when the radio receives keyboard focus.  |
| `--radio-transition`            | `0.2s`                              | transition       | Transition duration for state changes (border, background, dot). |
| `--radio-text-font-size`        | `14px`                              | font-size        | Font size of the label text.                                     |
| `--radio-text-font-weight`      | `400`                               | font-weight      | Font weight of the label text.                                   |
| `--radio-text-color`            | `#333333`                           | color            | Color of the label text.                                         |
| `--radio-disabled-text-color`   | `#999999`                           | color            | Color of the label text when disabled.                           |

## Web Component

Tag: `<sui-radio>`

```html
<sui-radio name="color" value="red" text="Red"></sui-radio>
<sui-radio name="color" value="blue" text="Blue"></sui-radio>
```
