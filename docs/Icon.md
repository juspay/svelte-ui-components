# Icon

A clickable icon component that displays an image with an optional text label below. The entire container is a button for accessibility. Layout direction (row or column) is controlled via CSS variable `--icon-container-direction`.

## Usage

```svelte
<script>
  import { Icon } from '@juspay/svelte-ui-components';
</script>

<Icon icon={'...'} />
```

## Props

| Prop    | Type             | Required | Default | Description                                                                                                                                                            |
| ------- | ---------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon    | `string`         | Yes      | `-`     | URL of the icon image to display.                                                                                                                                      |
| text    | `string \| null` | No       | `-`     | Optional text label displayed below the icon.                                                                                                                          |
| classes | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event     | Type                             | Description                                                     |
| --------- | -------------------------------- | --------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void`    | Fires when the icon container is clicked.                       |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the icon container has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                     | Default  | CSS Property   | Description                                                                |
| ---------------------------- | -------- | -------------- | -------------------------------------------------------------------------- |
| `--icon-container-paddding`  | `4px`    | padding        | Inner padding of the icon container.                                       |
| `--icon-container-direction` | `column` | flex-direction | Layout direction of icon + text (column for vertical, row for horizontal). |
| `--icon-height`              | `20px`   | height         | Height of the icon image.                                                  |
| `--icon-width`               | `20px`   | width          | Width of the icon image.                                                   |
| `--icon-padding`             | `4px`    | padding        | Padding around the icon image.                                             |
| `--icon-text-padding`        | `4px`    | padding        | Padding around the text label.                                             |
| `--icon-text-direction`      | `column` | flex-direction | Layout direction of the text area.                                         |
| `--icon-text-font-size`      | `12px`   | font-size      | Font size of the text label.                                               |

## Web Component

Tag: `<sui-icon>`

```html
<sui-icon icon="<svg>...</svg>"></sui-icon>
```
