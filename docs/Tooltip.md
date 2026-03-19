# Tooltip

A floating tooltip that appears on hover or focus of a trigger element. The tooltip displays informational text positioned relative to its trigger (top, bottom, left, or right). Supports a configurable show delay and is fully themeable via CSS custom properties. The tooltip includes a directional arrow pointing toward the trigger element.

## Usage

```svelte
<script>
  import { Tooltip } from '@juspay/svelte-ui-components';
</script>

<Tooltip text="This is helpful info" position="top">
  <button>Hover me</button>
</Tooltip>
```

## Props

| Prop     | Type                                                       | Required | Default | Description                                                                                                                                                            |
| -------- | ---------------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text     | `string`                                                   | Yes      | -       | The text content displayed inside the tooltip bubble.                                                                                                                  |
| position | `TooltipPosition = 'top' \| 'bottom' \| 'left' \| 'right'` | No       | `'top'` | Where the tooltip bubble appears relative to the trigger element.                                                                                                      |
| delay    | `number`                                                   | No       | `0`     | Time in milliseconds to wait before showing the tooltip after hover/focus. A value of 0 shows the tooltip immediately.                                                 |
| testId   | `string \| null`                                           | No       | `-`     | Value for data-pw on the tooltip container element for Playwright testing.                                                                                             |
| classes  | `string`                                                   | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| children | `Snippet` | The trigger element(s) that the tooltip wraps. The tooltip appears when hovering or focusing this content. |

## Events

This component does not emit any events.

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default                              | CSS Property        | Description                                                                 |
| ----------------------------- | ------------------------------------ | ------------------- | --------------------------------------------------------------------------- |
| `--tooltip-container-display` | `inline-flex`                        | display             | Display mode of the wrapper element around the trigger and tooltip.         |
| `--tooltip-z-index`           | `1000`                               | z-index             | Stacking order of the tooltip bubble.                                       |
| `--tooltip-max-width`         | `200px`                              | max-width           | Maximum width of the tooltip bubble before text wraps.                      |
| `--tooltip-background`        | `#333333`                            | background          | Background color of the tooltip bubble.                                     |
| `--tooltip-color`             | `#ffffff`                            | color               | Text color inside the tooltip bubble.                                       |
| `--tooltip-font-size`         | `12px`                               | font-size           | Font size of the tooltip text.                                              |
| `--tooltip-font-weight`       | `400`                                | font-weight         | Font weight of the tooltip text.                                            |
| `--tooltip-font-family`       | `-`                                  | font-family         | Font family of the tooltip text.                                            |
| `--tooltip-padding`           | `6px 10px`                           | padding             | Inner padding of the tooltip bubble.                                        |
| `--tooltip-border-radius`     | `4px`                                | border-radius       | Corner rounding of the tooltip bubble.                                      |
| `--tooltip-border`            | `none`                               | border              | Border of the tooltip bubble.                                               |
| `--tooltip-box-shadow`        | `0 2px 6px rgba(0, 0, 0, 0.15)`      | box-shadow          | Shadow effect around the tooltip bubble.                                    |
| `--tooltip-opacity-duration`  | `0.15s`                              | transition duration | Duration of the tooltip opacity fade transition.                            |
| `--tooltip-offset`            | `8px`                                | calc offset         | Distance between the tooltip bubble and the trigger element.                |
| `--tooltip-arrow-size`        | `5px`                                | border-width        | Size of the directional arrow pointing from the tooltip toward the trigger. |
| `--tooltip-arrow-color`       | `var(--tooltip-background, #333333)` | border-color        | Color of the directional arrow. Defaults to match the tooltip background.   |

## Type Reference

Custom types used by this component's props and events:

### TooltipPosition

```typescript
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
```

## Web Component

Tag: `<sui-tooltip>`

```html
<sui-tooltip text="More info" position="top">
  <button>Hover me</button>
</sui-tooltip>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                          |
| ----------- | --------------- | ---------------------------------------------------- |
| _(default)_ | `children`      | The trigger element that shows the tooltip on hover. |
