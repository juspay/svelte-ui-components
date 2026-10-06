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

### In a form

```svelte
<form onsubmit={handleSubmit}>
  <Radio name="payment" value="card" text="Card" required bind:selectedValue />
  <Radio name="payment" value="upi" text="UPI" required bind:selectedValue />
  <button type="submit">Pay</button>
</form>
```

The input carries `data-state="checked | unchecked"`, `data-disabled` and, while the radio is in error,
`data-invalid` for styling.

## Validity messaging

`errorMessage` and `infoMessage` are referenced by `aria-describedby` on the radio's input, composed
from whichever of the two is actually rendered so the attribute never points at an id that is not
in the DOM. The error text is announced through `role="alert"` on the message element itself, so it
is read when it appears and again as the input's description. `invalid` marks the radio invalid
without a message.

`Radio` does **not** put `aria-invalid` on the input: WAI-ARIA 1.2 does not define it for
`role="radio"` (it is supported on `radiogroup`, `checkbox`, `textbox` and a few other roles), and an
unsupported attribute is not a harmless extra. The invalid state is exposed as `data-invalid`
instead. A set of radios is invalid as a whole, so announce that on the element that groups them: give
it `role="radiogroup"`, a name, `aria-invalid="true"` and a reference to the message.

```svelte
<div role="radiogroup" aria-labelledby="pay-label" aria-invalid="true" aria-describedby="pay-error">
  <span id="pay-label">Payment method</span>
  <Radio name="pay" value="card" bind:selectedValue={method} text="Card" />
  <Radio name="pay" value="upi" bind:selectedValue={method} text="UPI" />
  <div id="pay-error" role="alert">Choose a payment method to continue.</div>
</div>
```

Each radio keeps its own name from its label and the arrow-key behaviour of the native group; the
wrapper adds the group name and the invalid state, and `aria-describedby` on it reads the message
once for the group rather than once per radio.

## Props

| Prop          | Type             | Required | Default     | Description                                                                                                                                                                                                              |
| ------------- | ---------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name          | `string`         | Yes      | —           | The group name shared by all radio buttons in the same group. Maps to the native input's `name` attribute.                                                                                                               |
| value         | `string`         | Yes      | —           | The value this radio button represents. When selected, `selectedValue` becomes this value.                                                                                                                               |
| selectedValue | `string`         | No       | `''`        | The currently selected value in the group. Bindable. When this matches `value`, the radio appears selected.                                                                                                              |
| text          | `string`         | No       | `''`        | Label text displayed next to the radio indicator. Hidden when empty.                                                                                                                                                     |
| disabled      | `boolean`        | No       | `false`     | When true, the radio button cannot be interacted with and appears in a disabled visual state.                                                                                                                            |
| testId        | `string`         | No       | `undefined` | Test identifier applied as `data-pw` attribute on the container for Playwright test selectors.                                                                                                                           |
| classes       | `string`         | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                   |
| required      | `boolean`        | No       | `false`     | Blocks submission until a member of the group is selected. Set it on every member, as the native control expects.                                                                                                        |
| form          | `string`         | No       | `undefined` | `id` of a form elsewhere in the same document. Unavailable through `<sui-radio>`, whose input sits in a shadow root.                                                                                                     |
| errorMessage  | `string \| null` | No       | `undefined` | Text shown, and announced, when the control is in error. Referenced by `aria-describedby` on the input and rendered in a `role="alert"` element; the input carries `data-invalid` while present. See Validity messaging. |
| infoMessage   | `string \| null` | No       | `undefined` | Persistent helper text describing the control, referenced by `aria-describedby` so it is read before an error appears.                                                                                                   |
| invalid       | `boolean`        | No       | `false`     | Marks the control invalid without supplying a message (`data-invalid` on the input). The announced state belongs on the wrapping `role="radiogroup"`'s `aria-invalid`.                                                   |

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

Attributes: `error-message`, `info-message` and `invalid` mirror the props above. Group the elements in
your own `role="radiogroup"` to announce an invalid group; its `aria-labelledby`/`aria-describedby` resolve
in the light DOM, where the message lives:

```html
<div role="radiogroup" aria-labelledby="pay-label" aria-invalid="true" aria-describedby="pay-error">
  <span id="pay-label">Payment method</span>
  <sui-radio name="pay" value="card" text="Card"></sui-radio>
  <sui-radio name="pay" value="upi" text="UPI"></sui-radio>
  <div id="pay-error" role="alert">Choose a payment method to continue.</div>
</div>
```

Each `<sui-radio>` renders its native input inside its own shadow root, so the
platform's by-`name` grouping -- which only ever looks within one DOM tree --
cannot see across them on its own. The wrapper coordinates same-`name`
elements explicitly instead, so a group of `<sui-radio>` behaves like a native
radio group despite the separate shadow roots: exactly one stays checked,
exactly one `FormData` entry is contributed, and `ArrowDown`/`ArrowRight`,
`ArrowUp`/`ArrowLeft`, `Home`, and `End` move focus and selection together
between enabled members, wrapping at the ends. A group is scoped to its owning
`<form>` when one exists, matching how the platform scopes native radio
groups.

`onchange` is a JS-property callback only (`el.onchange = (value) => ...`) and does not dispatch a
DOM event: `change` is already `HTMLElement`'s own native event, so
`el.addEventListener('change', ...)` registers without error but is never called by this
component — assign the property instead.
