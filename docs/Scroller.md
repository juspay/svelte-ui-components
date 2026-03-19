# Scroller

Overflowing horizontal or vertical item list with scroll controls. Shows navigation arrows when content overflows, with gradient fade edges to hint at more content. Supports drag-to-scroll, snap-to-item, and scroll position tracking.

## Import

```svelte
import {Scroller} from '@juspay/svelte-ui-components';
```

## Properties

### Mandatory Properties

| Property   | Type      | Description                                                                                                       |
| ---------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `children` | `Snippet` | The scrollable content rendered inside the scroll container. Each direct child element becomes a scrollable item. |

### Optional Properties

| Property            | Type                         | Default               | Description                                                                                                                                                             |
| ------------------- | ---------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction`         | `'horizontal' \| 'vertical'` | `'horizontal'`        | Controls the scroll axis. When `'horizontal'`, content scrolls left/right. When `'vertical'`, content scrolls up/down.                                                  |
| `scrollAmount`      | `number`                     | Container client size | The number of pixels to scroll when an arrow is clicked. Defaults to one full page width (horizontal) or height (vertical) of the visible container.                    |
| `showArrows`        | `boolean`                    | `true`                | Whether to show navigation arrow buttons when content overflows. Arrows auto-hide when scrolled to the start or end.                                                    |
| `showGradient`      | `boolean`                    | `true`                | Whether to show gradient fade overlays at the edges of the scroll container to visually hint at more content.                                                           |
| `dragToScroll`      | `boolean`                    | `false`               | Enables click-and-drag scrolling with the mouse. When active, the cursor changes to a grabbing hand during drag.                                                        |
| `snapToItem`        | `boolean`                    | `false`               | Enables CSS scroll snapping so the scroll position aligns to child item boundaries. Child items should have `scroll-snap-align` set (e.g., `scroll-snap-align: start`). |
| `hideScrollbar`     | `boolean`                    | `true`                | Whether to hide the native browser scrollbar. When `true`, the scrollbar is hidden via CSS while maintaining scroll functionality.                                      |
| `hideArrowsOnTouch` | `boolean`                    | `true`                | Whether to auto-hide navigation arrows on touch-capable devices where swiping is the natural scroll interaction.                                                        |
| `smoothScroll`      | `boolean`                    | `true`                | Whether arrow-click scrolling uses smooth animated transitions or jumps instantly.                                                                                      |
| `testId`            | `string`                     | `undefined`           | Sets `data-pw` on the root element. Arrow buttons get `{testId}-prev` and `{testId}-next`.                                                                              |
| `arrowPrevious`     | `Snippet`                    | Built-in chevron SVG  | Custom snippet to render inside the previous/back arrow button, replacing the default chevron icon.                                                                     |
| `arrowNext`         | `Snippet`                    | Built-in chevron SVG  | Custom snippet to render inside the next/forward arrow button, replacing the default chevron icon.                                                                      |
| `classes`           | `string`                     | `-`                   | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.  |

### Event Properties

| Property           | Type                                 | Description                                                                                                                                                               |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onscrollposition` | `(position: ScrollPosition) => void` | Called whenever the scroll position changes (on scroll, resize, or content change). Receives a `ScrollPosition` object with current scroll metrics and progress (0 to 1). |

## Usage

### Basic Horizontal Scroller

```svelte
<Scroller>
  {#each items as item}
    <div class="card">{item.name}</div>
  {/each}
</Scroller>
```

### Vertical Scroller

```svelte
<Scroller direction="vertical">
  {#each items as item}
    <div class="row">{item.name}</div>
  {/each}
</Scroller>
```

### With Drag-to-Scroll and Snap

```svelte
<Scroller dragToScroll snapToItem>
  {#each items as item}
    <div class="snap-card" style="scroll-snap-align: start;">
      {item.name}
    </div>
  {/each}
</Scroller>
```

### Custom Arrow Icons

```svelte
<Scroller>
  {#snippet arrowPrevious()}
    <span>←</span>
  {/snippet}
  {#snippet arrowNext()}
    <span>→</span>
  {/snippet}
  {#each items as item}
    <div>{item.name}</div>
  {/each}
</Scroller>
```

### Tracking Scroll Position

```svelte
<script>
  function handleScroll(position) {
    console.log(`Progress: ${(position.progress * 100).toFixed(0)}%`);
  }
</script>

<Scroller onscrollposition={handleScroll}>
  {#each items as item}
    <div>{item.name}</div>
  {/each}
</Scroller>
```

## CSS Custom Properties

### Container

| Variable                     | Default       | Description                                                                               |
| ---------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `--scroller-width`           | `100%`        | Width of the entire scroller component including arrows.                                  |
| `--scroller-height`          | `fit-content` | Height of the entire scroller component. Useful for vertical scrollers with fixed height. |
| `--scroller-gap`             | `0px`         | Gap between child items inside the scroll container.                                      |
| `--scroller-padding`         | `0px`         | Padding inside the scroll container around the child items.                               |
| `--scroller-scroll-behavior` | `smooth`      | CSS scroll-behavior for the scroll container. Controls transition style.                  |

### Arrows

| Variable                            | Default                           | Description                                                            |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `--scroller-arrow-size`             | `32px`                            | Width and height of the circular arrow buttons.                        |
| `--scroller-arrow-border-radius`    | `50%`                             | Border radius of arrow buttons. `50%` makes them circular.             |
| `--scroller-arrow-background`       | `#ffffff`                         | Background color of arrow buttons in their default state.              |
| `--scroller-arrow-border`           | `1px solid #e0e0e0`               | Border of arrow buttons.                                               |
| `--scroller-arrow-color`            | `#333333`                         | Icon/text color inside arrow buttons.                                  |
| `--scroller-arrow-padding`          | `4px`                             | Internal padding of arrow buttons.                                     |
| `--scroller-arrow-box-shadow`       | `0 1px 3px rgba(0,0,0,0.12)`      | Box shadow applied to arrow buttons for depth.                         |
| `--scroller-arrow-margin`           | `0px`                             | Margin around each arrow button for spacing from the scroll area.      |
| `--scroller-arrow-hover-background` | `#f5f5f5`                         | Background color of arrow buttons on hover.                            |
| `--scroller-arrow-hover-color`      | Inherits `--scroller-arrow-color` | Icon/text color of arrow buttons on hover.                             |
| `--scroller-arrow-icon-size`        | `16px`                            | Width and height of the default chevron SVG icon inside arrow buttons. |

### Gradients

| Variable                    | Default                       | Description                                                           |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `--scroller-gradient-size`  | `80px`                        | Width (horizontal) or height (vertical) of the gradient fade overlay. |
| `--scroller-gradient-start` | White-to-transparent gradient | Custom gradient for the start (left/top) fade edge.                   |
| `--scroller-gradient-end`   | White-to-transparent gradient | Custom gradient for the end (right/bottom) fade edge.                 |

### Snap

| Variable               | Default                       | Description                                                                          |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `--scroller-snap-type` | `x mandatory` / `y mandatory` | CSS scroll-snap-type value. Automatically adapts to direction but can be overridden. |

## Type Reference

### ScrollDirection

```typescript
type ScrollDirection = 'horizontal' | 'vertical';
```

### ScrollPosition

```typescript
type ScrollPosition = {
  scrollOffset: number; // Current scroll offset in pixels
  scrollSize: number; // Total scrollable content size in pixels
  clientSize: number; // Visible container size in pixels
  progress: number; // Scroll progress from 0 (start) to 1 (end)
};
```

### ScrollerProperties

```typescript
type ScrollerProperties = OptionalScrollerProperties &
  ScrollerEventProperties &
  MandatoryScrollerProperties;
```

## Web Component

Tag: `<sui-scroller>`

```html
<sui-scroller direction="horizontal" show-arrows>
  <div>Scrollable content</div>
</sui-scroller>
```

### Slots

| Slot Name        | Maps to Snippet | Description                 |
| ---------------- | --------------- | --------------------------- |
| _(default)_      | `children`      | Scrollable content.         |
| `arrow-previous` | `arrowPrevious` | Custom previous/left arrow. |
| `arrow-next`     | `arrowNext`     | Custom next/right arrow.    |
