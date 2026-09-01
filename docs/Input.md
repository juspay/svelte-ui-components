# Input

A text input field with built-in validation for email, phone (tel), password, and text patterns. Validates automatically using `validationPattern` and `inProgressPattern` RegExp props, plus optional custom validator functions. Shows error messages when validation fails and info messages below the input. For `tel` dataType, automatically strips non-digit characters and enforces `maxLength`. Supports text transformers that modify the raw input value and view presentation transformers that format the displayed value (e.g., adding spaces to a card number). The validation state (`Valid` / `InProgress` / `Invalid`) is computed reactively and reported via `onStateChange`. Can render as a `<textarea>` when `useTextArea` is true, with multi-line options: `rows`, auto-resize (`autoResize` / `minRows` / `maxRows`), a `resize` handle, and a `showCount` character counter.

## Usage

```svelte
<script>
  import { Input } from '@juspay/svelte-ui-components';
</script>

<Input value={'...'} />
```

### Multi-line (textarea)

Set `useTextArea` to render a `<textarea>`. It supports the same label/validation/error
machinery as the single-line input, plus textarea-specific options: `rows`, `autoResize`
(`minRows`/`maxRows`), a `resize` handle, and a `showCount` character counter.

```svelte
<script>
  let notes = $state('');
</script>

<!-- Fixed height -->
<Input bind:value={notes} useTextArea label="Notes" rows={4} />

<!-- Auto-grow between 2 and 8 rows -->
<Input bind:value={notes} useTextArea autoResize minRows={2} maxRows={8} />

<!-- Character counter -->
<Input bind:value={notes} useTextArea showCount maxLength={140} label="Bio" />

<!-- User-resizable -->
<Input bind:value={notes} useTextArea resize="vertical" />
```

## Props

| Prop                 | Type                                                                   | Required | Default             | Description                                                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value                | `string`                                                               | Yes      | `''`                | Bindable. The current input value. Two-way bound to the underlying `<input>` or `<textarea>` element.                                                                                                                                                                                           |
| placeholder          | `string \| null`                                                       | No       | `''`                | Placeholder text shown when the input is empty.                                                                                                                                                                                                                                                 |
| dataType             | `InputDataType = 'text' \| 'tel' \| 'password' \| 'email' \| 'number'` | No       | `'text'`            | The type of input data. Controls the HTML input type and validation behavior. 'tel' strips non-digits and applies textTransformers; 'email' uses RFC 5322 validation; 'password' and 'text' use pattern-based validation.                                                                       |
| label                | `string \| null`                                                       | No       | `''`                | Label text shown above the input field. Hidden when actionInput is true.                                                                                                                                                                                                                        |
| onErrorMessage       | `string \| null`                                                       | No       | `''`                | Error message text displayed below the input when validation state is 'Invalid'. Hidden when actionInput is true.                                                                                                                                                                               |
| infoMessage          | `string \| null`                                                       | No       | `''`                | Informational text displayed below the input regardless of validation state. Hidden when actionInput is true.                                                                                                                                                                                   |
| validators           | `CustomValidator[]`                                                    | No       | `[]`                | Array of custom validator functions. Each receives the input value and current validation state, and returns a new ValidationState. Validators run after the built-in validation.                                                                                                               |
| disable              | `boolean`                                                              | No       | `false`             | Whether the input is disabled (greyed out and non-interactive).                                                                                                                                                                                                                                 |
| readonly             | `boolean`                                                              | No       | `false`             | Renders the field read-only: the value can be focused, selected and copied but not edited. Deliberately distinct from `disable`, which also removes the element from the focus order and so cannot serve a select-all-to-copy affordance.                                                       |
| spellcheck           | `boolean \| null`                                                      | No       | `null`              | Native `spellcheck`. `null` renders as attribute-absent, so the browser default is unchanged for existing consumers. Pass `false` for fields holding code, JSON, or identifiers, where red squiggles are noise.                                                                                 |
| validationPattern    | `RegExp \| null`                                                       | No       | `null`              | RegExp that the input value must match to be considered 'Valid'. If null, no pattern validation is applied.                                                                                                                                                                                     |
| inProgressPattern    | `RegExp \| null`                                                       | No       | `null`              | RegExp that matches partial/incomplete input. If the value matches this pattern (but not validationPattern), the state is 'InProgress' instead of 'Invalid'.                                                                                                                                    |
| addFocusColor        | `boolean`                                                              | No       | `false`             | When true, adds a 1px focus border to the input. Used with actionInput mode.                                                                                                                                                                                                                    |
| maxLength            | `number`                                                               | No       | `1000`              | Maximum number of characters allowed. For dataType='tel', this limits the digit count (excess digits are trimmed from the start).                                                                                                                                                               |
| minLength            | `number`                                                               | No       | `0`                 | Minimum number of characters required (HTML minlength attribute).                                                                                                                                                                                                                               |
| min                  | `number`                                                               | No       | `-`                 | Minimum value for numeric inputs (HTML min attribute). Only applies to `<input>`, not `<textarea>`.                                                                                                                                                                                             |
| max                  | `number`                                                               | No       | `-`                 | Maximum value for numeric inputs (HTML max attribute). Only applies to `<input>`, not `<textarea>`.                                                                                                                                                                                             |
| actionInput          | `boolean`                                                              | No       | `false`             | When true, hides the label, error message, and info message, and adjusts border-radius/shadow for seamless integration inside InputButton.                                                                                                                                                      |
| useTextArea          | `boolean`                                                              | No       | `false`             | When true, renders a `<textarea>` instead of an `<input>`. Useful for multi-line text entry.                                                                                                                                                                                                    |
| rows                 | `number`                                                               | No       | `-`                 | Initial visible rows for the textarea (only applies when `useTextArea`).                                                                                                                                                                                                                        |
| autoResize           | `boolean`                                                              | No       | `false`             | When `useTextArea`, grows/shrinks the textarea to fit its content between `minRows` and `maxRows`; disables manual resizing while active.                                                                                                                                                       |
| minRows              | `number`                                                               | No       | `rows`              | Lower bound (in rows) when `autoResize` is on.                                                                                                                                                                                                                                                  |
| maxRows              | `number`                                                               | No       | `-`                 | Upper bound (in rows) when `autoResize` is on; beyond this the textarea scrolls.                                                                                                                                                                                                                |
| resize               | `'none' \| 'vertical' \| 'horizontal' \| 'both'`                       | No       | `'none'`            | Manual resize-handle behaviour for the textarea. Forced to `'none'` when `autoResize` is on.                                                                                                                                                                                                    |
| showCount            | `boolean`                                                              | No       | `false`             | When `useTextArea`, shows a live `current / maxLength` character counter beneath the field.                                                                                                                                                                                                     |
| autoComplete         | `HTMLInputAttributes['autocomplete']`                                  | No       | `'on'`              | The HTML autocomplete attribute value. Controls browser autofill behavior. Accepts any string for non-standard values (e.g., `'off'`, `'new-password'`).                                                                                                                                        |
| inputMode            | `HTMLInputAttributes['inputmode']`                                     | No       | `-`                 | Virtual-keyboard hint rendered as the native `inputmode` attribute (e.g. `'numeric'` for OTP/PIN fields). Left off by default.                                                                                                                                                                  |
| name                 | `string`                                                               | No       | `''`                | The HTML name attribute for the input. Used for form submission and label association.                                                                                                                                                                                                          |
| id                   | `string`                                                               | No       | `-`                 | Explicit id for the underlying `<input>`/`<textarea>`, and the value the label's `for` points at. Wins over the auto-derived id. Optional: the fallback appends a per-instance `$props.id()` suffix, so fields sharing a `name` still get unique ids. Names the field, not the wrapper `<div>`. |
| textTransformers     | `TextTransformer[]`                                                    | No       | `[]`                | Array of functions applied to the raw input value before digit extraction (tel mode only). Use for stripping country codes or formatting.                                                                                                                                                       |
| textViewPresentation | `TextTransformer[]`                                                    | No       | `[]`                | Array of functions applied to the value for display purposes. The underlying value stays clean but the displayed text is transformed (e.g., adding spaces every 4 digits for card numbers).                                                                                                     |
| testId               | `string`                                                               | No       | `''`                | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                                                                                                                                         |
| classes              | `string`                                                               | No       | `-`                 | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                          |
| role                 | `string`                                                               | No       | `-`                 | Sets the ARIA `role` attribute on the underlying `<input>`/`<textarea>`. Use `'combobox'` when building autocomplete patterns.                                                                                                                                                                  |
| ariaLabel            | `string \| null`                                                       | No       | `-`                 | Accessible name applied as `aria-label` on the underlying `<input>`/`<textarea>`. Use whenever the field has no visible `label` (e.g. inline table cells, icon-only search fields). Ignored when a visible `label` is rendered, so the visible text is never overridden (WCAG 2.5.3).           |
| ariaExpanded         | `boolean`                                                              | No       | `-`                 | Sets `aria-expanded` on the input element. Use when the input controls a dropdown or listbox that can be open or closed.                                                                                                                                                                        |
| ariaAutocomplete     | `'none' \| 'inline' \| 'list' \| 'both'`                               | No       | `-`                 | Sets `aria-autocomplete` on the input element. Indicates whether the input provides autocomplete suggestions inline, as a list, both, or neither.                                                                                                                                               |
| ariaControls         | `string \| null`                                                       | No       | `-`                 | Sets `aria-controls` on the input element. Should reference the `id` of the listbox/dropdown element that this input controls.                                                                                                                                                                  |
| ariaActivedescendant | `string \| null`                                                       | No       | `-`                 | Sets `aria-activedescendant` on the input element. Should reference the `id` of the currently focused option in the controlled listbox, enabling screen readers to announce the active option without moving DOM focus.                                                                         |
| leftIcon             | `Snippet`                                                              | No       | `-`                 | Passive or clickable icon rendered inside the field on the leading edge (e.g. a search icon). Renders inside the field border; non-icon consumers keep the original DOM unchanged.                                                                                                              |
| rightIcon            | `Snippet`                                                              | No       | `-`                 | Passive or clickable icon rendered inside the field on the trailing edge (e.g. a clear button).                                                                                                                                                                                                 |
| onLeftIconClick      | `() => void`                                                           | No       | `-`                 | When set, `leftIcon` renders as a focusable `<button>` invoking this handler (search / clear-on-click pattern); otherwise the icon is a passive `<span>`.                                                                                                                                       |
| onRightIconClick     | `() => void`                                                           | No       | `-`                 | When set, `rightIcon` renders as a focusable `<button>` invoking this handler.                                                                                                                                                                                                                  |
| leftIconLabel        | `string`                                                               | No       | `'Leading action'`  | Accessible `aria-label` for the clickable `leftIcon` button.                                                                                                                                                                                                                                    |
| rightIconLabel       | `string`                                                               | No       | `'Trailing action'` | Accessible `aria-label` for the clickable `rightIcon` button.                                                                                                                                                                                                                                   |
| mandatory            | `boolean`                                                              | No       | `false`             | Appends a required asterisk beside the label and sets both `aria-required` and the native `required` attribute on the input/textarea, enabling native form validation alongside assistive-technology support.                                                                                   |
| forceError           | `boolean`                                                              | No       | `false`             | Forces the error state (red border and error message text when `onErrorMessage` is set) independent of `validationPattern` — for server/runtime-driven errors. Combines with the existing client-side validation error state.                                                                   |

## Methods

Exported methods that can be called via `bind:this` on the component instance.

| Method          | Signature                                               | Description                                                                                                            |
| --------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `focus()`       | `() => void`                                            | Programmatically focuses the underlying `<input>` or `<textarea>` element.                                             |
| `blur()`        | `() => void`                                            | Programmatically removes focus from the underlying `<input>` or `<textarea>` element.                                  |
| `getInputRef()` | `() => HTMLInputElement \| HTMLTextAreaElement \| null` | Returns a reference to the underlying DOM element. Use for custom focus management or third-party library integration. |

## Events

| Event         | Type                                    | Description                                                                                                                                                                                           |
| ------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onInput       | `(value: string, event: Event) => void` | Fires on every input change. Receives the current input value (after any text transformer processing for tel type) and the original DOM Event.                                                        |
| onFocus       | `(event: FocusEvent) => void`           | Fires when the input element gains focus.                                                                                                                                                             |
| onFocusout    | `(event: FocusEvent) => void`           | Fires when the input element loses focus. Internally, if the validation state is 'InProgress' and the value is non-empty, the state transitions to 'Invalid' on blur.                                 |
| onBlur        | `(event: FocusEvent) => void`           | Fires when the input element loses focus, alongside `onFocusout`. Provided as a convenience alias for consumers who prefer the `blur` event naming convention.                                        |
| onPaste       | `(event: ClipboardEvent) => void`       | Fires when content is pasted into the input. For dataType='tel', the pasted text is filtered to digits only and trimmed to maxLength.                                                                 |
| onClick       | `(event: MouseEvent) => void`           | Fires when the input element is clicked.                                                                                                                                                              |
| onStateChange | `(state: ValidationState) => void`      | Fires whenever the validation state changes. Receives the new ValidationState ('Valid', 'InProgress', or 'Invalid'). Runs as a reactive $effect so it fires on initial render and every state change. |
| onKeyDown     | `(event: KeyboardEvent) => void`        | Fires when a key is pressed while the input has focus.                                                                                                                                                |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default                                                | CSS Property     | Description                                                                                    |
| ----------------------------------- | ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------- |
| `--input-box-sizing`                | `border-box`                                           | box-sizing       | Box sizing model for the input element.                                                        |
| `--input-height`                    | `fit-content`                                          | height           | Height of the input element.                                                                   |
| `--input-background`                | `white`                                                | background-color | Background color of the input.                                                                 |
| `--input-font-size`                 | `16px`                                                 | font-size        | Font size of the input text.                                                                   |
| `--input-font-family`               | `inherit`                                              | font-family      | Font family of the input text.                                                                 |
| `--input-radius`                    | `4px`                                                  | border-radius    | Corner rounding of the input.                                                                  |
| `--input-padding`                   | `16px`                                                 | padding          | Inner padding of the input.                                                                    |
| `--input-font-weight`               | `500`                                                  | font-weight      | Font weight of the input text.                                                                 |
| `--input-width`                     | `fit-content`                                          | width            | Width of the input element.                                                                    |
| `--input-margin`                    | `0px 0px 12px 0px`                                     | margin           | Outer margin of the input element.                                                             |
| `--input-box-shadow`                | `0px 1px 8px #2f537733`                                | box-shadow       | Box shadow around the input.                                                                   |
| `--input-border`                    | `1px solid transparent`                                | border           | Border of the input in its normal state.                                                       |
| `--input-visibility`                | `visible`                                              | visibility       | Controls input visibility (visible/hidden).                                                    |
| `--input-text-align`                | `left`                                                 | text-align       | Text alignment inside the input.                                                               |
| `--input-text-transform`            | `none`                                                 | text-transform   | Text transform for the input value (e.g. `uppercase`).                                         |
| `--input-text-color`                | `-`                                                    | color            | Color of the input text.                                                                       |
| `--input-focus-border`              | `1px solid transparent`                                | border           | Border of the input when focused.                                                              |
| `--input-container-margin`          | `-`                                                    | margin           | Outer margin of the input container.                                                           |
| `--input-container-padding`         | `-`                                                    | padding          | Inner padding of the input container.                                                          |
| `--input-container-width`           | `-`                                                    | width            | Width of the input container.                                                                  |
| `--input-label-msg-text-weight`     | `400`                                                  | font-weight      | Font weight of the label text.                                                                 |
| `--input-label-msg-text-size`       | `12px`                                                 | font-size        | Font size of the label text.                                                                   |
| `--input-label-msg-text-color`      | `#637c95`                                              | color            | Color of the label text.                                                                       |
| `--input-label-msg-margin`          | `0px 0px 6px 0px`                                      | margin           | Margin around the label.                                                                       |
| `--input-label-msg-padding`         | `-`                                                    | padding          | Padding inside the label.                                                                      |
| `--input-error-msg-text-weight`     | `400`                                                  | font-weight      | Font weight of the error message.                                                              |
| `--input-error-msg-text-size`       | `12px`                                                 | font-size        | Font size of the error message.                                                                |
| `--input-error-msg-text-color`      | `#c5120a`                                              | color            | Color used for the error border and error message text (6.06:1 on white, AA).                  |
| `--input-mandatory-color`           | `var(--input-error-msg-text-color, #c5120a)`           | color            | Color of the mandatory asterisk.                                                               |
| `--input-mandatory-gap`             | `2px`                                                  | margin-left      | Gap between the label text and the mandatory asterisk.                                         |
| `--input-icon-size`                 | `20px`                                                 | width / height   | Box size of the leftIcon / rightIcon.                                                          |
| `--input-icon-gap`                  | `12px`                                                 | left / right     | Icon inset from the field edge (also drives the field's icon-side padding).                    |
| `--input-icon-color`                | `inherit`                                              | color            | Color of both rendered icons unless the leading icon has its own override.                     |
| `--input-left-icon-color`           | `var(--input-icon-color, inherit)`                     | color            | Leading-icon-only colour override; takes precedence over `--input-icon-color`.                 |
| `--input-icon-focus-outline`        | `2px solid var(--input-focus-border-color, #005fcc)`   | outline          | Outline shown on icon buttons when focused via keyboard (`:focus-visible`).                    |
| `--input-icon-focus-outline-offset` | `2px`                                                  | outline-offset   | Offset of the focus outline from the icon button edge.                                         |
| `--input-icon-focus-radius`         | `2px`                                                  | border-radius    | Border-radius of the focus outline on icon buttons.                                            |
| `--input-error-msg-margin`          | `-`                                                    | margin           | Margin around the error message.                                                               |
| `--input-error-msg-padding`         | `-`                                                    | padding          | Padding inside the error message.                                                              |
| `--input-info-msg-text-weight`      | `400`                                                  | font-weight      | Font weight of the info message.                                                               |
| `--input-info-msg-text-size`        | `12px`                                                 | font-size        | Font size of the info message.                                                                 |
| `--input-info-msg-text-color`       | `#52525b`                                              | color            | Color of the info message text. Deliberately neutral, not the error color — see Accessibility. |
| `--input-info-msg-margin`           | `-`                                                    | margin           | Margin around the info message.                                                                |
| `--input-info-msg-padding`          | `-`                                                    | padding          | Padding inside the info message.                                                               |
| `--input-placeholder-color`         | `-`                                                    | color            | Color of placeholder text.                                                                     |
| `--input-error-border`              | `1px solid var(--input-error-msg-text-color, #c5120a)` | border           | Border of the input when in error state.                                                       |
| `--input-char-count-size`           | `12px`                                                 | font-size        | Font size of the textarea character counter.                                                   |
| `--input-char-count-color`          | `#98a2b3`                                              | color            | Color of the character counter.                                                                |
| `--input-char-count-limit-color`    | `#c5120a`                                              | color            | Counter color when the value reaches `maxLength`.                                              |
| `--input-char-count-margin`         | `4px 0 0`                                              | margin           | Margin around the character counter.                                                           |

## Accessibility

- The error message is a `role="alert"` live region, and both it and `infoMessage` are referenced by the field's `aria-describedby` (error first, then helper text) — a screen-reader user hears the same description a sighted user sees, in the same order.
- `infoMessage` renders in a neutral color (`--input-info-msg-text-color`), distinct from the error message's red (`--input-error-msg-text-color`). They used to share the same default, so helper text with no error present visually read as a failed field — color was the only thing telling them apart, which is what WCAG 1.4.1 (Use of Color) exists to prevent. Consumers who want helper text to look red can still set `--input-info-msg-text-color` themselves.
- Both message colors default to values that clear WCAG AA contrast (4.5:1) against a white background at their 12px size.

## Type Reference

Custom types used by this component's props and events:

### InputDataType

```typescript
type InputDataType = 'text' | 'tel' | 'password' | 'email' | 'number';
```

### CustomValidator

```typescript
type CustomValidator = (
  inputValue: string,
  currentValidationState: ValidationState
) => ValidationState;
```

### TextTransformer

```typescript
type TextTransformer = (text: string) => string;
```

### ValidationState

```typescript
type ValidationState = 'Valid' | 'InProgress' | 'Invalid';
```

## Web Component

Tag: `<sui-input>`

```html
<sui-input placeholder="Enter email" data-type="email" label="Email"></sui-input>
```

### Validation errors are announced

When a field is invalid, `Input` marks it `aria-invalid="true"` and links it to its message with
`aria-describedby`; the message element is a `role="alert"` live region, so assistive technology
speaks it as it appears instead of leaving it as pixels on screen. Both attributes are absent
while the field is valid, so a healthy form does not announce every field as broken.

```svelte
<Input
  bind:value={email}
  label="Work email"
  forceError={serverRejected}
  onErrorMessage="Enter a valid email address"
/>
```

`forceError` drives this from server-side or runtime validation; `validationPattern` drives it
from the field's own contents. Either route produces the same announced message.

`infoMessage` is treated the same way: helper text is part of the field's description, so it
is referenced by `aria-describedby` whether or not the field is currently invalid. When both
are shown the field references them in reading order — the error first, then the advice —
since `aria-describedby` takes a space-separated id list and assistive technology announces
them in the order given.
