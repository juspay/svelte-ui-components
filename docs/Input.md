# Input

A text input field with built-in validation for email, phone (tel), password, and text patterns. Validates automatically using `validationPattern` and `inProgressPattern` RegExp props, plus optional custom validator functions. Shows error messages when validation fails and info messages below the input. For `tel` dataType, automatically strips non-digit characters and enforces `maxLength`. Supports text transformers that modify the raw input value and view presentation transformers that format the displayed value (e.g., adding spaces to a card number). The validation state (`Valid` / `InProgress` / `Invalid`) is computed reactively and reported via `onStateChange`. Can render as a `<textarea>` when `useTextArea` is true.

## Usage

```svelte
<script>
  import { Input } from '@juspay/svelte-ui-components';
</script>

<Input
  value={"..."}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | `string` | Yes | `''` | Bindable. The current input value. Two-way bound to the underlying `<input>` or `<textarea>` element. |
| placeholder | `string \| null` | No | `''` | Placeholder text shown when the input is empty. |
| dataType | `InputDataType = 'text' \| 'tel' \| 'password' \| 'email' \| 'number'` | No | `'text'` | The type of input data. Controls the HTML input type and validation behavior. 'tel' strips non-digits and applies textTransformers; 'email' uses RFC 5322 validation; 'password' and 'text' use pattern-based validation. |
| label | `string \| null` | No | `''` | Label text shown above the input field. Hidden when actionInput is true. |
| onErrorMessage | `string \| null` | No | `''` | Error message text displayed below the input when validation state is 'Invalid'. Hidden when actionInput is true. |
| infoMessage | `string \| null` | No | `''` | Informational text displayed below the input regardless of validation state. Hidden when actionInput is true. |
| validators | `CustomValidator[]` | No | `[]` | Array of custom validator functions. Each receives the input value and current validation state, and returns a new ValidationState. Validators run after the built-in validation. |
| disable | `boolean` | No | `false` | Whether the input is disabled (greyed out and non-interactive). |
| validationPattern | `RegExp \| null` | No | `null` | RegExp that the input value must match to be considered 'Valid'. If null, no pattern validation is applied. |
| inProgressPattern | `RegExp \| null` | No | `null` | RegExp that matches partial/incomplete input. If the value matches this pattern (but not validationPattern), the state is 'InProgress' instead of 'Invalid'. |
| addFocusColor | `boolean` | No | `false` | When true, adds a 1px focus border to the input. Used with actionInput mode. |
| maxLength | `number` | No | `1000` | Maximum number of characters allowed. For dataType='tel', this limits the digit count (excess digits are trimmed from the start). |
| minLength | `number` | No | `0` | Minimum number of characters required (HTML minlength attribute). |
| actionInput | `boolean` | No | `false` | When true, hides the label, error message, and info message, and adjusts border-radius/shadow for seamless integration inside InputButton. |
| useTextArea | `boolean` | No | `false` | When true, renders a `<textarea>` instead of an `<input>`. Useful for multi-line text entry. |
| autoComplete | `AutoCompleteType = 'tel' \| 'name' \| 'email' \| 'one-time-code' \| 'postal-code' \| 'street-address' \| 'on' \| 'address-level1'` | No | `'on'` | The HTML autocomplete attribute value. Controls browser autofill behavior. |
| name | `string` | No | `''` | The HTML name attribute for the input. Used for form submission and label association. |
| textTransformers | `TextTransformer[]` | No | `[]` | Array of functions applied to the raw input value before digit extraction (tel mode only). Use for stripping country codes or formatting. |
| textViewPresentation | `TextTransformer[]` | No | `[]` | Array of functions applied to the value for display purposes. The underlying value stays clean but the displayed text is transformed (e.g., adding spaces every 4 digits for card numbers). |
| testId | `string` | No | `''` | Value for the data-pw attribute, used for end-to-end testing selectors. |

## Events

| Event | Type | Description |
|-------|------|-------------|
| onInput | `(value: string, event: Event) => void` | Fires on every input change. Receives the current input value (after any text transformer processing for tel type) and the original DOM Event. |
| onFocus | `(event: FocusEvent) => void` | Fires when the input element gains focus. |
| onFocusout | `(event: FocusEvent) => void` | Fires when the input element loses focus. Internally, if the validation state is 'InProgress' and the value is non-empty, the state transitions to 'Invalid' on blur. |
| onPaste | `(event: ClipboardEvent) => void` | Fires when content is pasted into the input. For dataType='tel', the pasted text is filtered to digits only and trimmed to maxLength. |
| onClick | `(event: MouseEvent) => void` | Fires when the input element is clicked. |
| onStateChange | `(state: ValidationState) => void` | Fires whenever the validation state changes. Receives the new ValidationState ('Valid', 'InProgress', or 'Invalid'). Runs as a reactive $effect so it fires on initial render and every state change. |
| onKeyDown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the input has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--input-box-sizing` | `border-box` | box-sizing | Box sizing model for the input element. |
| `--input-height` | `fit-content` | height | Height of the input element. |
| `--input-background` | `white` | background-color | Background color of the input. |
| `--input-font-size` | `16px` | font-size | Font size of the input text. |
| `--input-font-family` | `Euclid Circular A` | font-family | Font family of the input text. |
| `--input-radius` | `4px` | border-radius | Corner rounding of the input. |
| `--input-padding` | `16px` | padding | Inner padding of the input. |
| `--input-font-weight` | `500` | font-weight | Font weight of the input text. |
| `--input-width` | `fit-content` | width | Width of the input element. |
| `--input-margin` | `0px 0px 12px 0px` | margin | Outer margin of the input element. |
| `--input-box-shadow` | `0px 1px 8px #2f537733` | box-shadow | Box shadow around the input. |
| `--input-border` | `1px solid transparent` | border | Border of the input in its normal state. |
| `--input-visibility` | `visible` | visibility | Controls input visibility (visible/hidden). |
| `--input-text-align` | `left` | text-align | Text alignment inside the input. |
| `--input-text-color` | `-` | color | Color of the input text. |
| `--input-focus-border` | `1px solid transparent` | border | Border of the input when focused. |
| `--input-container-margin` | `-` | margin | Outer margin of the input container. |
| `--input-container-padding` | `-` | padding | Inner padding of the input container. |
| `--input-container-width` | `-` | width | Width of the input container. |
| `--input-label-msg-text-weight` | `400` | font-weight | Font weight of the label text. |
| `--input-label-msg-text-size` | `12px` | font-size | Font size of the label text. |
| `--input-label-msg-text-color` | `#637c95` | color | Color of the label text. |
| `--input-label-msg-margin` | `0px 0px 6px 0px` | margin | Margin around the label. |
| `--input-label-msg-padding` | `-` | padding | Padding inside the label. |
| `--input-error-msg-text-weight` | `400` | font-weight | Font weight of the error message. |
| `--input-error-msg-text-size` | `12px` | font-size | Font size of the error message. |
| `--input-error-msg-text-color` | `#fa1405` | color | Color used for the error border and error message text. |
| `--input-error-msg-margin` | `-` | margin | Margin around the error message. |
| `--input-error-msg-padding` | `-` | padding | Padding inside the error message. |
| `--input-info-msg-text-weight` | `400` | font-weight | Font weight of the info message. |
| `--input-info-msg-text-size` | `12px` | font-size | Font size of the info message. |
| `--input-info-msg-text-color` | `#fa1405` | color | Color of the info message text. |
| `--input-info-msg-margin` | `-` | margin | Margin around the info message. |
| `--input-info-msg-padding` | `-` | padding | Padding inside the info message. |
| `--input-placeholder-color` | `-` | color | Color of placeholder text. |

## Type Reference

Custom types used by this component's props and events:

### InputDataType

```typescript
type InputDataType = 'text' | 'tel' | 'password' | 'email' | 'number';
```

### CustomValidator

```typescript
type CustomValidator = (inputValue: string, currentValidationState: ValidationState) => ValidationState;
```

### AutoCompleteType

```typescript
type AutoCompleteType = 'tel' | 'name' | 'email' | 'one-time-code' | 'postal-code' | 'street-address' | 'on' | 'address-level1';
```

### TextTransformer

```typescript
type TextTransformer = (text: string) => string;
```

### ValidationState

```typescript
type ValidationState = 'Valid' | 'InProgress' | 'Invalid';
```
