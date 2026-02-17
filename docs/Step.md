# Step

An individual step within a Stepper. Displays either a numbered circle or an icon image, a text label, and a dashed separator line. When clicked, fires the `onclick` event with `{ selectedIndex }`. The separator is hidden for the last step via CSS `--separator-display: none`.

## Usage

```svelte
<script>
  import { Step } from '@juspay/svelte-ui-components';
</script>

<Step />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| stepIndex | `number` | No | `-` | The 1-based step number displayed inside the circle (when no icon is provided). |
| label | `string` | No | `-` | Text label displayed next to the step circle. |
| icon | `string` | No | `-` | Optional URL of an icon image that replaces the step number circle. |

## Events

| Event | Type | Description |
|-------|------|-------------|
| onclick | `(event: { selectedIndex: number }) => void` | Fires when the step is clicked. Receives { selectedIndex: number } with the step's index. |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the step has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--step-flex-direction` | `row` | flex-direction | Layout direction of the step (row for horizontal layout). |
| `--step-index-container-height` | `30px` | height | Height of the step number circle. |
| `--step-index-container-width` | `30px` | width | Width of the step number circle. |
| `--step-index-container-radius` | `50%` | border-radius | Corner rounding of the step number circle. |
| `--step-index-container-background-color` | `#798fa5cc` | background-color | Background color of the step number circle. |
| `--separator-display` | `block` | display | Display mode of the separator line (set 'none' to hide for last step). |
| `--separator-height` | `1px` | height | Height (thickness) of the separator line. |
| `--separator-width` | `50px` | width | Width of the separator line. |
| `--separator-margin` | `0px 12px 0px 12px` | margin | Margin around the separator line. |
| `--step-text-margin` | `0px 0px 0px 12px` | margin | Margin around the step label text. |
| `--step-text-font-size` | `12px` | font-size | Font size of the step label text. |
| `--step-text-color` | `#798fa5cc` | color | Color of the step label text. |
| `--step-index-font-size` | `14px` | font-size | Font size of the step number inside the circle. |
| `--step-index-color` | `white` | color | Color of the step number text. |
