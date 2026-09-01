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

| Prop         | Type                                                       | Required | Default     | Description                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text         | `string`                                                   | Yes      | -           | The text content displayed inside the tooltip bubble.                                                                                                                                                 |
| position     | `TooltipPosition = 'top' \| 'bottom' \| 'left' \| 'right'` | No       | `'top'`     | Where the tooltip bubble appears relative to the trigger element.                                                                                                                                     |
| delay        | `number`                                                   | No       | `0`         | Time in milliseconds to wait before showing the tooltip after hover/focus. A value of 0 shows the tooltip immediately.                                                                                |
| testId       | `string \| null`                                           | No       | `-`         | Value for data-pw on the tooltip container element for Playwright testing.                                                                                                                            |
| classes      | `string`                                                   | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                |
| usePortal    | `boolean`                                                  | No       | `false`     | When true, mounts the tooltip bubble directly on `document.body` using `position: fixed` coordinates. Prevents clipping inside `overflow: hidden` or stacking-context ancestors (e.g. toolbar items). |
| iconPosition | `'leading' \| 'trailing'`                                  | No       | `'leading'` | Which side of `children` the `icon` snippet renders on.                                                                                                                                               |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                                                               |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children | `Snippet` | The trigger element(s) that the tooltip wraps. The tooltip appears when hovering or focusing this content.                                                |
| icon     | `Snippet` | Optional icon rendered in the trigger wrapper beside `children` — before it by default, after it when `iconPosition="trailing"`. No default glyph is provided — consumers supply their own SVG or icon component. |
| content  | `Snippet` | Optional bubble body. When provided, replaces the plain `text` string inside the tooltip bubble. Use for rich multi-line or interactive bubble content.   |

## Events

This component does not emit any events.

## CSS Variables

Override these custom properties to theme the component.

| Variable                      | Default                              | CSS Property          | Description                                                                                                           |
| ----------------------------- | ------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--tooltip-container-display` | `inline-flex`                        | display               | Display mode of the wrapper element around the trigger and tooltip.                                                   |
| `--tooltip-z-index`           | `1000`                               | z-index               | Stacking order of the tooltip bubble.                                                                                 |
| `--tooltip-max-width`         | `200px`                              | max-width             | Maximum width of the tooltip bubble before text wraps.                                                                |
| `--tooltip-background`        | `#333333`                            | background            | Background color of the tooltip bubble.                                                                               |
| `--tooltip-color`             | `#ffffff`                            | color                 | Text color inside the tooltip bubble.                                                                                 |
| `--tooltip-font-size`         | `12px`                               | font-size             | Font size of the tooltip text.                                                                                        |
| `--tooltip-font-weight`       | `400`                                | font-weight           | Font weight of the tooltip text.                                                                                      |
| `--tooltip-font-family`       | `-`                                  | font-family           | Font family of the tooltip text.                                                                                      |
| `--tooltip-padding`           | `6px 10px`                           | padding               | Inner padding of the tooltip bubble.                                                                                  |
| `--tooltip-border-radius`     | `4px`                                | border-radius         | Corner rounding of the tooltip bubble.                                                                                |
| `--tooltip-border`            | `none`                               | border                | Border of the tooltip bubble.                                                                                         |
| `--tooltip-box-shadow`        | `0 2px 6px rgba(0, 0, 0, 0.15)`      | box-shadow            | Shadow effect around the tooltip bubble.                                                                              |
| `--tooltip-opacity-duration`  | `0.15s`                              | transition duration   | Duration of the tooltip opacity fade transition.                                                                      |
| `--tooltip-offset`            | `8px`                                | calc offset           | Distance between the tooltip bubble and the trigger element.                                                          |
| `--tooltip-arrow-size`        | `5px`                                | border-width          | Size of the directional arrow pointing from the tooltip toward the trigger.                                           |
| `--tooltip-arrow-color`       | `var(--tooltip-background, #333333)` | border-color          | Color of the directional arrow. Defaults to match the tooltip background.                                             |
| `--tooltip-icon-color`        | `currentColor`                       | color                 | Color of the icon snippet rendered in the trigger wrapper via the `icon` slot.                                        |
| `--tooltip-shift`             | `0px`                                | transform (translate) | Fine-tune offset shifting the bubble along its trigger-parallel axis, on top of the automatic viewport-edge clamping. |

## Tooltip Action

The `tooltip` Svelte action is a renderless alternative to the `<Tooltip>` component. It attaches hover and focus listeners directly to the host element without injecting a wrapper `<div>`, so it does not affect flex-child sizing inside toolbars and icon rows. The bubble is always mounted on `document.body` with `position: fixed` coordinates, so it is never clipped by `overflow: hidden` ancestors. The bubble is measured after mounting, clamped so it never crosses the viewport edge (8px margin), and flipped to the opposite side when the preferred side has no room; the arrow stays anchored over the trigger even when the bubble shifts.

```svelte
<script>
  import { tooltip } from '@juspay/svelte-ui-components';
</script>

<button use:tooltip={{ text: 'Save document', position: 'top' }}>💾</button>
<button use:tooltip={{ text: 'Delete item', position: 'bottom', delay: 300 }}>🗑️</button>
```

### TooltipActionOptions

| Field    | Type              | Required | Default | Description                                                                         |
| -------- | ----------------- | -------- | ------- | ----------------------------------------------------------------------------------- |
| text     | `string`          | Yes      | -       | Tooltip text displayed in the bubble.                                               |
| position | `TooltipPosition` | No       | `'top'` | Where the bubble appears relative to the host element.                              |
| delay    | `number`          | No       | `0`     | Milliseconds to wait before showing the tooltip. A value of 0 shows it immediately. |
| classes  | `string`          | No       | `-`     | CSS class string forwarded to the bubble element for theming.                       |

The action exposes an `update` lifecycle method — when the bound options object changes, the tooltip text (and other options) update reactively without tearing down event listeners:

```svelte
<script>
  import { tooltip } from '@juspay/svelte-ui-components';
  let count = $state(0);
</script>

<button use:tooltip={{ text: `Clicked ${count} times`, position: 'top' }} onclick={() => count++}>
  Increment
</button>
```

A `destroy` method removes all event listeners and cleans up any open bubble when the host element is removed from the DOM.

## Type Reference

Custom types used by this component's props and events:

### TooltipPosition

```typescript
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
```

### TooltipActionOptions

```typescript
type TooltipActionOptions = {
  text: string;
  position?: TooltipPosition;
  delay?: number;
  classes?: string;
};
```

## Web Component

Tag: `<sui-tooltip>`

```html
<sui-tooltip text="More info" position="top">
  <button>Hover me</button>
</sui-tooltip>
```

### Attributes

| Attribute    | Prop        | Type      | Default | Description                                                                                                                       |
| ------------ | ----------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `text`       | `text`      | `String`  | -       | Tooltip text shown in the bubble.                                                                                                 |
| `position`   | `position`  | `String`  | `'top'` | Bubble position relative to the trigger: `top`, `bottom`, `left`, or `right`.                                                     |
| `delay`      | `delay`     | `Number`  | `0`     | Milliseconds before showing the tooltip.                                                                                          |
| `test-id`    | `testId`    | `String`  | -       | Value for `data-pw` on the container element.                                                                                     |
| `classes`    | `classes`   | `String`  | -       | CSS class string applied to the tooltip container.                                                                                |
| `use-portal` | `usePortal` | `Boolean` | `false` | When present, mounts the bubble on `document.body` with `position: fixed`. Prevents clipping inside `overflow: hidden` ancestors. |

### Slots

| Slot Name   | Maps to Snippet | Description                                                                             |
| ----------- | --------------- | --------------------------------------------------------------------------------------- |
| _(default)_ | `children`      | The trigger element that shows the tooltip on hover.                                    |
| `icon`      | `icon`          | Optional leading icon in the trigger wrapper. No default — consumers provide their own. |
| `content`   | `content`       | Optional rich bubble body. Replaces the plain `text` string when provided.              |
