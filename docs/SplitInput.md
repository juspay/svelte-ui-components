# SplitInput

A generic segmented input component for capturing structured multi-field values such as OTP/PIN codes, RGB/HSL color channels, or IP addresses. Each segment is an independent `Input` instance with its own validation, data type, and constraints configured via `FieldConfig`. The `values` prop is a bindable `string[]` where each element corresponds to one field. When `autoAdvance` is enabled the cursor automatically moves to the next field after a character is entered, enabling rapid single-character entry (e.g., OTP). Supports paste distribution across fields, keyboard navigation with arrow keys and Tab, and optional separators and per-field labels. Validation is fully delegated to the underlying Input component.

## Usage

```svelte
<script>
  import { SplitInput } from '@juspay/svelte-ui-components';

  let otpValues = $state(['', '', '', '', '', '']);
  let rgbValues = $state(['', '', '']);
  let ipValues = $state(['', '', '', '']);
</script>

<!-- OTP / PIN entry (6 digits, auto-advance) -->
<SplitInput bind:values={otpValues} length={6} autoAdvance />

<!-- RGB color channels with labels and separator -->
<SplitInput
  bind:values={rgbValues}
  separator=","
  fields={[
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0', label: 'R' },
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0', label: 'G' },
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0', label: 'B' }
  ]}
/>

<!-- IP address with dot separators -->
<SplitInput
  bind:values={ipValues}
  separator="."
  fields={[
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0' },
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0' },
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0' },
    { dataType: 'number', maxLength: 3, min: 0, max: 255, placeholder: '0' }
  ]}
/>
```

## Props

| Prop        | Type            | Required | Default | Description                                                                                                                                                                                                                                                                                                         |
| ----------- | --------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| values      | `string[]`      | Yes      | `[]`    | Bindable. Array of current field values where each element corresponds to one input segment. The array length matches `fieldCount` (derived from `fields.length` or `length`).                                                                                                                                      |
| fields      | `FieldConfig[]` | No       | `-`     | Array of per-field configuration objects. When provided, `fields.length` determines the number of segments and each entry controls that field's data type, constraints, placeholder, validation, and label. When omitted, the component creates `length` fields defaulting to `dataType: 'tel'` and `maxLength: 1`. |
| length      | `number`        | No       | `4`     | Number of input fields to render when `fields` is not provided. Ignored when `fields` is supplied since the array length takes precedence.                                                                                                                                                                          |
| disabled    | `boolean`       | No       | `false` | Whether all fields are disabled. When true, no field accepts input or fires events.                                                                                                                                                                                                                                 |
| autoAdvance | `boolean`       | No       | `false` | When true and a field's `maxLength` is 1, focus automatically moves to the next field after a character is entered. Also enables paste distribution where pasted text is spread one character per field starting from the focused field.                                                                            |
| separator   | `string`        | No       | `-`     | A string rendered between each pair of adjacent fields as a visual separator (e.g., `"."` for IP addresses, `","` for RGB, `"-"` for formatted codes).                                                                                                                                                              |
| testId      | `string`        | No       | `-`     | Value for the `data-pw` attribute on the top-level container element, used for end-to-end testing selectors.                                                                                                                                                                                                        |
| classes     | `string`        | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming -- define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                             |

## Methods

| Method  | Signature    | Description                                                                                                                   |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| clear() | `() => void` | Clears all field values to empty strings, fires `oninput` and `onchange` with the cleared array, and focuses the first field. |
| focus() | `() => void` | Moves focus to the first input field.                                                                                         |

## Events

| Event      | Type                         | Description                                                                                                                                                                                         |
| ---------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| oninput    | `(values: string[]) => void` | Fires on every value change as the user types, pastes, or clears. Receives a copy of the current `values` array. Use this for live preview updates.                                                 |
| onchange   | `(values: string[]) => void` | Fires alongside `oninput` on every value change. Receives a copy of the current `values` array. Use this for committing values or triggering side effects.                                          |
| oncomplete | `(values: string[]) => void` | Fires when every field contains a non-empty value (i.e., all segments are filled). Receives a copy of the completed `values` array. Use this to trigger submission or validation of the full input. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default             | CSS Property  | Description                                                                                  |
| ----------------------------------- | ------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `--field-group-gap`                 | `8px`               | gap           | Horizontal spacing between field segments (and separators).                                  |
| `--field-group-width`               | `fit-content`       | width         | Width of the overall field group container.                                                  |
| `--field-group-label-gap`           | `3px`               | gap           | Vertical spacing between a field input and its label below.                                  |
| `--field-group-border`              | `1px solid #d1d5db` | border        | Border applied to each individual input field.                                               |
| `--field-group-border-radius`       | `6px`               | border-radius | Corner rounding of each individual input field.                                              |
| `--field-group-focus-border`        | `1px solid #3b82f6` | border        | Border applied to a field when it receives focus.                                            |
| `--field-group-input-width`         | `100%`              | width         | Width of each individual input field.                                                        |
| `--field-group-input-height`        | `36px`              | height        | Height of each individual input field. Also sets the height of separator elements.           |
| `--field-group-text-align`          | `center`            | text-align    | Text alignment within each input field.                                                      |
| `--field-group-font-size`           | `14px`              | font-size     | Font size of input text within each field.                                                   |
| `--field-group-font-weight`         | `500`               | font-weight   | Font weight of input text within each field.                                                 |
| `--field-group-font-family`         | (inherited)         | font-family   | Font family of input text within each field. Falls through to the Input component's default. |
| `--field-group-input-padding`       | `0 6px`             | padding       | Padding inside each individual input field.                                                  |
| `--field-group-label-font-size`     | `10px`              | font-size     | Font size of per-field labels displayed below each input.                                    |
| `--field-group-label-font-weight`   | `500`               | font-weight   | Font weight of per-field labels.                                                             |
| `--field-group-label-color`         | `#9ca3af`           | color         | Text color of per-field labels.                                                              |
| `--field-group-separator-font-size` | `16px`              | font-size     | Font size of separator characters rendered between fields.                                   |
| `--field-group-separator-color`     | `#9ca3af`           | color         | Text color of separator characters.                                                          |

## Internal Dependencies

- `Input` -- each field segment is rendered as an Input component instance with validation, data type, and constraint props delegated from the corresponding `FieldConfig`.

## Type Reference

### FieldConfig

Per-field configuration object. Picked from `OptionalInputProperties`.

```typescript
type FieldConfig = {
  dataType?: 'text' | 'tel' | 'password' | 'email' | 'number';
  maxLength?: number;
  min?: number;
  max?: number;
  placeholder?: string | null;
  validationPattern?: RegExp | null;
  validators?: CustomValidator[];
  label?: string | null;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  inputMode?: HTMLInputAttributes['inputmode'];
};
```

- `dataType` -- The HTML input type for the field. Controls keyboard behavior on mobile (e.g., `'tel'` shows numeric pad). Defaults to `'text'`; when `fields` is omitted, auto-generated configs use `'tel'`.
- `maxLength` -- Maximum number of characters allowed in the field. Defaults to `1000`; when `fields` is omitted, auto-generated configs use `1`.
- `min` -- Minimum numeric value (only effective when `dataType` is `'number'`).
- `max` -- Maximum numeric value (only effective when `dataType` is `'number'`).
- `placeholder` -- Placeholder text shown when the field is empty.
- `validationPattern` -- A `RegExp` used by the underlying Input to validate the field value. Defaults to `null` (no pattern validation).
- `validators` -- Array of `CustomValidator` functions for custom validation logic. Each receives the input value and current validation state and returns a new `ValidationState`.
- `label` -- Text label displayed below the field (e.g., `'R'`, `'G'`, `'B'` for color channels).
- `autoComplete` -- Native `autocomplete` hint for the field. Set to `'one-time-code'` on OTP segments to enable WebOTP / SMS autofill. Defaults to `'on'`.
- `inputMode` -- Native `inputmode` hint controlling the mobile virtual keyboard (e.g., `'numeric'` for a numeric keypad). Left off by default.

### CustomValidator

```typescript
type CustomValidator = (
  inputValue: string,
  currentValidationState: ValidationState
) => ValidationState;
```

### ValidationState

```typescript
type ValidationState = 'Valid' | 'InProgress' | 'Invalid';
```
