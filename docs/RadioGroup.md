# RadioGroup

A managed group of radio buttons that handles keyboard navigation, mutual exclusion, and WAI-ARIA `radiogroup` semantics. Pass an `options` array describing each radio choice; the `value` prop is bindable and stays in sync when the user selects a different item. Arrow keys cycle through enabled options; the `disabled` prop disables the whole group at once.

## Usage

```svelte
<script>
  import { RadioGroup } from '@juspay/svelte-ui-components';

  let selectedPayment = $state('upi');
</script>

<RadioGroup
  name="payment-method"
  bind:value={selectedPayment}
  ariaLabel="Payment method"
  options={[
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'netbanking', label: 'Net Banking', subtitle: 'All major banks supported' },
    { value: 'cod', label: 'Cash on Delivery', disabled: true }
  ]}
/>
```

## Props

| Prop           | Type                  | Required | Default     | Description                                                                                                                                                            |
| -------------- | --------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options        | `RadioGroupOption[]`  | Yes      | —           | Array of option objects, each with a `value`, `label`, and optional `subtitle`, `disabled`, and `testId` fields.                                                       |
| value          | `string`              | Yes      | —           | The currently selected option value. Bindable — updates when the user selects a different radio.                                                                       |
| name           | `string`              | Yes      | —           | The `name` attribute shared across all rendered radio inputs. Required for native radio-group behaviour in forms.                                                       |
| ariaLabel      | `string`              | No       | `undefined` | Accessible label for the `radiogroup` role. Use when there is no visible heading labelling the group.                                                                   |
| ariaLabelledBy | `string`              | No       | `undefined` | ID of an existing element that labels the group. Use instead of `ariaLabel` when a visible heading is already present.                                                  |
| disabled       | `boolean`             | No       | `false`     | When true, all options in the group are disabled regardless of their individual `disabled` flag.                                                                        |
| testId         | `string`              | No       | `undefined` | Test identifier applied as `data-pw` attribute on the group container for Playwright test selectors.                                                                    |
| classes        | `string`              | No       | `undefined` | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.  |

### RadioGroupOption

| Field    | Type      | Required | Description                                                                                |
| -------- | --------- | -------- | ------------------------------------------------------------------------------------------ |
| value    | `string`  | Yes      | Unique value for this option.                                                              |
| label    | `string`  | Yes      | Display label rendered next to the radio indicator.                                        |
| subtitle | `string`  | No       | Optional secondary text rendered below the label.                                          |
| disabled | `boolean` | No       | When true, this individual option is disabled (pointer events blocked, visually dimmed).   |
| testId   | `string`  | No       | Test identifier applied as `data-pw` on the option wrapper element.                        |

## Events

| Event    | Type                      | Description                                                                             |
| -------- | ------------------------- | --------------------------------------------------------------------------------------- |
| onchange | `(value: string) => void` | Fires when the selected option changes. Receives the `value` of the newly selected item. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                   | Default       | CSS Property     | Description                                              |
| -------------------------- | ------------- | ---------------- | -------------------------------------------------------- |
| `--radio-group-direction`  | `column`      | flex-direction   | Layout direction of the radio items (`column` or `row`). |
| `--radio-group-gap`        | `0`           | gap              | Space between individual radio items.                    |
| `--radio-group-padding`    | `0`           | padding          | Padding inside the group container.                      |
| `--radio-group-background` | `transparent` | background       | Background color of the group container.                 |
| `--radio-group-radius`     | `0`           | border-radius    | Border radius of the group container.                    |

Individual radio items inside the group also respond to all `--radio-*` CSS variables defined on the [Radio](/components/radio) component.

## Web Component

Tag: `<sui-radio-group>`

```html
<sui-radio-group
  name="payment-method"
  value="upi"
  aria-label="Payment method"
></sui-radio-group>

<script>
  const group = document.querySelector('sui-radio-group');
  group.options = [
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'netbanking', label: 'Net Banking' }
  ];
  group.onchange = (value) => console.log('Selected:', value);
</script>
```
