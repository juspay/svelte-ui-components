# Status

A full-screen status display with a centered icon image, title text, description text (supports HTML), and an optional action Button. Uses backdrop-filter blur for visual effect. Ideal for order success/failure screens.

## Usage

```svelte
<script>
  import { Status } from '@juspay/svelte-ui-components';
</script>

<Status />
```

## Props

| Prop              | Type                                                                                                                                                                                                                                                                                        | Required | Default                          | Description                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| statusIcon        | `string`                                                                                                                                                                                                                                                                                    | No       | `'icons/order-success-icon.svg'` | URL of the status icon image displayed at the center (e.g., success checkmark, error cross).                                                                           |
| statusText        | `string`                                                                                                                                                                                                                                                                                    | No       | `''`                             | Main status title text (e.g., 'Order Successful', 'Payment Failed').                                                                                                   |
| statusDescription | `string`                                                                                                                                                                                                                                                                                    | No       | `''`                             | Description text below the title. Supports HTML content (rendered via {@html}).                                                                                        |
| buttonProperties  | `ButtonProperties` | No       | `-`                              | Optional ButtonProperties object for an action button below the description (e.g., 'Try Again', 'Go Home').                                                            |
| classes           | `string`                                                                                                                                                                                                                                                                                    | No       | `-`                              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event         | Type         | Description                                                                |
| ------------- | ------------ | -------------------------------------------------------------------------- |
| onbuttonClick | `() => void` | Fires when the action button (configured via buttonProperties) is clicked. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default               | CSS Property | Description                                                                                                                          |
| --------------------------------- | --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--status-font-weight`            | `600`                 | font-weight  | Font weight of the status title text. Used with different fallbacks: `600` on status text and `400` on description.                  |
| `--status-description-font-color` | `#2f3841`             | color        | Color of the description text. Used with different fallbacks: `#2f3841` on status text and `#436484cc` on the description paragraph. |
| `--order-font`                    | `'Euclid Circular A'` | font-family  | Font family for the status text.                                                                                                     |
| `--order-font-size`               | `14px`                | font-size    | Font size for the status text.                                                                                                       |

## Type Reference

Custom types used by this component's props and events:

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

## Internal Dependencies

This component uses the following library components internally:

- Button (for the action button)
- Img (for the status icon)

## Web Component

Tag: `<sui-status>`

```html
<sui-status
  status-icon="/icon.svg"
  status-text="Success"
  status-description="Operation completed."
></sui-status>
```
