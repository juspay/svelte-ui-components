# InputButton

A composite component that combines an Input field with optional left, right, and bottom Button components. The right and bottom buttons are automatically disabled until the input validation state becomes `Valid`. Pressing Enter in the input triggers the right button's `onkeyup` handler when validation passes. The input label and error/info messages are rendered outside the input-button group. Internally uses the Input component with `actionInput=true` for seamless visual integration.

## Usage

```svelte
<script>
  import { InputButton } from '@juspay/svelte-ui-components';
</script>

<InputButton />
```

## Props

| Prop                   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required | Default | Description                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value                  | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Yes      | `''`    | Bindable. The current input value. Passed through to the internal Input component.                                                                                     |
| inputProperties        | `OptionalInputProperties = { placeholder?: string \| null; dataType?: InputDataType; label?: string \| null; onErrorMessage?: string \| null; infoMessage?: string \| null; validators?: CustomValidator[]; disable?: boolean; validationPattern?: RegExp \| null; inProgressPattern?: RegExp \| null; addFocusColor?: boolean; maxLength?: number; minLength?: number; actionInput?: boolean; useTextArea?: boolean; autoComplete?: AutoCompleteType; name?: string; textTransformers?: TextTransformer[]; textViewPresentation?: TextTransformer[]; testId?: string }` | Yes      | `-`     | Configuration for the internal Input component. Accepts all optional Input props (placeholder, dataType, label, validators, etc.).                                     |
| rightButtonProperties  | `OptionalButtonProperties \| null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No       | `-`     | Configuration for the right-side Button. Pass text, icon, loaderType, etc. The button is auto-disabled when input validation is not 'Valid'. Set to null to hide.      |
| leftButtonProperties   | `OptionalButtonProperties \| null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No       | `-`     | Configuration for the left-side Button. Pass text, icon, etc. Set to null to hide.                                                                                     |
| bottomButtonProperties | `OptionalButtonProperties \| null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No       | `-`     | Configuration for the bottom Button (rendered below the input row). Auto-disabled when input validation is not 'Valid'. Set to null to hide.                           |
| classes                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Methods

Exported methods that can be called via `bind:this` on the component instance.

| Method    | Signature    | Description                                                       |
| --------- | ------------ | ----------------------------------------------------------------- |
| `focus()` | `() => void` | Programmatically focuses the underlying input element.            |
| `blur()`  | `() => void` | Programmatically removes focus from the underlying input element. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet   | Type      | Description                                                     |
| --------- | --------- | --------------------------------------------------------------- |
| leftIcon  | `Snippet` | A Svelte 5 Snippet passed as the icon prop to the left Button.  |
| rightIcon | `Snippet` | A Svelte 5 Snippet passed as the icon prop to the right Button. |

## Events

| Event                       | Type                                                                                                                                                                                                                                                                                                                                          | Description                                                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| inputEventProperties        | `InputEventProperties = { onInput?: (value: string, event: Event) => void; onFocus?: (event: FocusEvent) => void; onFocusout?: (event: FocusEvent) => void; onPaste?: (event: ClipboardEvent) => void; onClick?: (event: MouseEvent) => void; onStateChange?: (state: ValidationState) => void; onKeyDown?: (event: KeyboardEvent) => void }` | Event handlers passed to the internal Input. The onStateChange callback will receive validation state changes. Note: internally the component intercepts onStateChange to update button enable states before forwarding to your handler. |
| rightButtonEventProperties  | `ButtonEventProperties \| null`                                                                                                                                                                                                                                                                                                               | Event handlers for the right Button. The onclick handler is only called when the input validation state is 'Valid'. The onkeyup is triggered when Enter is pressed in the input with valid state.                                        |
| leftButtonEventProperties   | `ButtonEventProperties \| null`                                                                                                                                                                                                                                                                                                               | Event handlers for the left Button. These are passed directly to the Button component.                                                                                                                                                   |
| bottomButtonEventProperties | `ButtonEventProperties \| null`                                                                                                                                                                                                                                                                                                               | Event handlers for the bottom Button. The onclick handler is only called when the input validation state is 'Valid'.                                                                                                                     |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default                                              | CSS Property                    | Description                                                                 |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `--input-button-container-margin`       | `-`                                                  | margin                          | Outer margin of the entire InputButton container.                           |
| `--input-height`                        | `fit-content`                                        | height                          |                                                                             |
| `--input-font-size`                     | `16px`                                               | font-size                       |                                                                             |
| `--input-button-margin`                 | `-`                                                  | margin                          | Margin of the inner input-button row.                                       |
| `--input-button-radius`                 | `4px`                                                | border-radius                   | Corner rounding of the input-button row.                                    |
| `--input-button-container-border`       | `-`                                                  | border                          | Border of the outer container.                                              |
| `--input-button-container-background`   | `-`                                                  | background                      | Background of the outer container.                                          |
| `--input-button-container-padding`      | `-`                                                  | padding                         | Padding inside the outer container.                                         |
| `--input-button-border`                 | `-`                                                  | border                          | Border of the inner input-button row.                                       |
| `--input-button-box-shadow`             | `0px 1px 8px #2f537733`                              | box-shadow                      | Box shadow of the input-button row.                                         |
| `--input-button-background`             | `-`                                                  | background                      | Background of the input-button row.                                         |
| `--input-button-focus-border`           | `-`                                                  | border                          | Border applied to the container when any child has focus.                   |
| `--input-bottom-btn-padding`            | `10px 0px`                                           | padding                         | Padding around the bottom button.                                           |
| `--bottom-button-cursor`                | `-`                                                  | --cursor                        | Cursor of the bottom button.                                                |
| `--bottom-button-color`                 | `-`                                                  | --button-color                  | Background color of the bottom button.                                      |
| `--bottom-button-text-color`            | `-`                                                  | --button-text-color             | Text color of the bottom button.                                            |
| `--bottom-button-font-family`           | `-`                                                  | --button-font-family            | Font family of the bottom button.                                           |
| `--bottom-button-font-weight`           | `-`                                                  | --button-font-weight            | Font weight of the bottom button.                                           |
| `--bottom-button-font-size`             | `-`                                                  | --button-font-size              | Font size of the bottom button.                                             |
| `--bottom-button-height`                | `54px`                                               | --button-height                 | Height of the bottom button.                                                |
| `--bottom-button-padding`               | `-`                                                  | --button-padding                | Padding inside the bottom button.                                           |
| `--bottom-button-border-radius`         | `-`                                                  | --button-border-radius          | Corner rounding of the bottom button.                                       |
| `--bottom-button-width`                 | `-`                                                  | --button-width                  | Width of the bottom button.                                                 |
| `--input-label-msg-text-weight`         | `400`                                                | font-weight                     |                                                                             |
| `--input-label-msg-text-size`           | `12px`                                               | font-size                       |                                                                             |
| `--input-label-msg-text-color`          | `#637c95`                                            | color                           |                                                                             |
| `--input-label-msg-text-line-height`    | `-`                                                  | line-height                     |                                                                             |
| `--input-label-msg-text-margin`         | `0px 0px 6px 0px`                                    | margin                          |                                                                             |
| `--invalid-outline`                     | `1px solid var(--input-field-error-stroke, #e11900)` | outline                         | Outline applied to the input-button row when validation state is 'Invalid'. |
| `--input-error-msg-text-weight`         | `400`                                                | font-weight                     |                                                                             |
| `--input-error-msg-text-size`           | `12px`                                               | font-size                       |                                                                             |
| `--input-error-msg-text-color`          | `#fa1405`                                            | color                           |                                                                             |
| `--input-btn-error-msg-margin`          | `12px 0px 0px 0px`                                   | margin                          | Margin around the error message.                                            |
| `--input-info-msg-text-weight`          | `400`                                                | font-weight                     |                                                                             |
| `--input-info-msg-text-size`            | `12px`                                               | font-size                       |                                                                             |
| `--input-info-msg-text-color`           | `#fa1405`                                            | color                           |                                                                             |
| `--input-btn-info-msg-margin`           | `12px 0px 0px 0px`                                   | margin                          | Margin around the info message.                                             |
| `--left-button-color`                   | `-`                                                  | --button-color                  | Background color of the left button.                                        |
| `--left-button-text-color`              | `-`                                                  | --button-text-color             | Text color of the left button.                                              |
| `--left-button-font-family`             | `-`                                                  | --button-font-family            | Font family of the left button.                                             |
| `--left-button-font-weight`             | `-`                                                  | --button-font-weight            | Font weight of the left button.                                             |
| `--left-button-font-size`               | `-`                                                  | --button-font-size              | Font size of the left button.                                               |
| `--left-button-height`                  | `54px`                                               | --button-height                 | Height of the left button.                                                  |
| `--left-button-padding`                 | `-`                                                  | --button-padding                | Padding inside the left button.                                             |
| `--left-button-border-radius`           | `-`                                                  | --button-border-radius          | Corner rounding of the left button.                                         |
| `--left-button-width`                   | `-`                                                  | --button-width                  | Width of the left button.                                                   |
| `--left-button-cursor`                  | `-`                                                  | --cursor                        | Cursor of the left button.                                                  |
| `--left-button-opacity`                 | `-`                                                  | --opacity                       | Opacity of the left button.                                                 |
| `--left-button-border`                  | `-`                                                  | --button-border                 | Border of the left button.                                                  |
| `--left-button-content-gap`             | `-`                                                  | --button-content-gap            | Gap between icon/text in the left button.                                   |
| `--left-button-content-flex-direction`  | `row`                                                | --button-content-flex-direction | Layout direction of the left button content.                                |
| `--left-button-icon-order`              | `-`                                                  | --button-icon-order             | Flex order of the icon in the left button.                                  |
| `--left-button-icon-display`            | `-`                                                  | --button-icon-display           | Display of the icon in the left button.                                     |
| `--left-button-text-order`              | `-`                                                  | --button-text-order             | Flex order of the text in the left button.                                  |
| `--left-button-disabled-cursor`         | `-`                                                  | --disabled-cursor               | Cursor of the left button when disabled.                                    |
| `--left-button-disabled-opacity`        | `-`                                                  | --disabled-opacity              | Opacity of the left button when disabled.                                   |
| `--right-button-flex`                   | `1`                                                  | flex                            | Flex value of the right button container.                                   |
| `--right-button-min-width`              | `0px`                                                | min-width                       | Minimum width of the right button.                                          |
| `--right-button-color`                  | `-`                                                  | --button-color                  | Background color of the right button.                                       |
| `--right-button-text-color`             | `-`                                                  | --button-text-color             | Text color of the right button.                                             |
| `--right-button-font-family`            | `-`                                                  | --button-font-family            | Font family of the right button.                                            |
| `--right-button-font-weight`            | `-`                                                  | --button-font-weight            | Font weight of the right button.                                            |
| `--right-button-font-size`              | `-`                                                  | --button-font-size              | Font size of the right button.                                              |
| `--right-button-height`                 | `54px`                                               | --button-height                 | Height of the right button.                                                 |
| `--right-button-padding`                | `-`                                                  | --button-padding                | Padding inside the right button.                                            |
| `--right-button-border-radius`          | `0px 4px 4px 0px`                                    | --button-border-radius          | Corner rounding of the right button.                                        |
| `--right-button-width`                  | `100%`                                               | --button-width                  | Width of the right button.                                                  |
| `--right-button-cursor`                 | `-`                                                  | --cursor                        | Cursor of the right button.                                                 |
| `--right-button-opacity`                | `-`                                                  | --opacity                       | Opacity of the right button.                                                |
| `--right-button-border`                 | `-`                                                  | --button-border                 | Border of the right button.                                                 |
| `--right-button-content-gap`            | `-`                                                  | --button-content-gap            | Gap between icon/text in the right button.                                  |
| `--right-button-visibility`             | `visible`                                            | --button-visibility             | Visibility of the right button.                                             |
| `--right-button-content-flex-direction` | `row`                                                | --button-content-flex-direction | Layout direction of the right button content.                               |
| `--right-button-icon-order`             | `-`                                                  | --button-icon-order             | Flex order of the icon in the right button.                                 |
| `--right-button-icon-display`           | `-`                                                  | --button-icon-display           | Display of the icon in the right button.                                    |
| `--right-button-text-order`             | `-`                                                  | --button-text-order             | Flex order of the text in the right button.                                 |
| `--right-button-disabled-cursor`        | `-`                                                  | --disabled-cursor               | Cursor of the right button when disabled.                                   |
| `--right-button-disabled-opacity`       | `-`                                                  | --disabled-opacity              | Opacity of the right button when disabled.                                  |

## Type Reference

Custom types used by this component's props and events:

### OptionalInputProperties

```typescript
type OptionalInputProperties = {
  placeholder?: string | null;
  dataType?: InputDataType;
  label?: string | null;
  onErrorMessage?: string | null;
  infoMessage?: string | null;
  validators?: CustomValidator[];
  disable?: boolean;
  validationPattern?: RegExp | null;
  inProgressPattern?: RegExp | null;
  addFocusColor?: boolean;
  maxLength?: number;
  minLength?: number;
  actionInput?: boolean;
  useTextArea?: boolean;
  autoComplete?: AutoCompleteType;
  name?: string;
  textTransformers?: TextTransformer[];
  textViewPresentation?: TextTransformer[];
  testId?: string;
  classes?: string;
};
```

### ButtonProperties

```typescript
type ButtonProperties = {
  text?: string;
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: 'Circular' | 'ProgressBar';
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  disabled?: boolean;
  classes?: string;
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
```

### InputEventProperties

```typescript
type InputEventProperties = {
  onInput?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onFocusout?: (event: FocusEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onStateChange?: (state: ValidationState) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
};
```

### ButtonEventProperties

```typescript
type ButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
```

## Internal Dependencies

This component uses the following library components internally:

- Button
- Input

## Web Component

Tag: `<sui-input-button>`

```html
<sui-input-button value="Search...">
  <svg slot="left-icon">...</svg>
  <svg slot="right-icon">...</svg>
</sui-input-button>
```

### Slots

| Slot Name    | Maps to Snippet | Description                                   |
| ------------ | --------------- | --------------------------------------------- |
| `left-icon`  | `leftIcon`      | Icon rendered on the left side of the input.  |
| `right-icon` | `rightIcon`     | Icon rendered on the right side of the input. |
