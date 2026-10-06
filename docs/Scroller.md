# Scroller

Overflowing horizontal or vertical item list with scroll controls. Shows navigation arrows when content overflows, with gradient fade edges to hint at more content. Supports drag-to-scroll, snap-to-item, and scroll position tracking. When no arrow buttons are rendered and nothing inside the content is focusable, the scroll region itself becomes a named Tab stop while it overflows, so keyboard users can still scroll it (see Keyboard access).

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
| `ariaLabel`         | `string`                     | `-`                   | Accessible name for the scroll region. While the region is the keyboard route (see Keyboard access) it is named `Scrollable content` unless this is set; a region given a name keeps it whether or not it is currently a Tab stop. Prefer a name that says what scrolls, such as `Release timeline`. Through `<sui-scroller>` the attribute is `aria-label`. |

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

### Keyboard access

Where arrow buttons are rendered they are the keyboard route: Tab reaches them and Enter or Space scrolls by one page. Arrows are not rendered when `showArrows` is `false`, or on a touch-capable device while `hideArrowsOnTouch` is on. If the content then holds nothing focusable, there would be no way to scroll it from a keyboard, so the scroll region becomes one:

- it joins the Tab order (`tabindex="0"`) **only while** the content overflows, no arrows are rendered and nothing inside is focusable. It follows the content as it changes: items added, removed or swapped, content that resizes or the region being resized, a control hidden or shown through `hidden`, `disabled`, `inert`, `class` or `style` (`display: none` and `visibility: hidden` both count as hidden), and a stylesheet rule or media query that hides or shows a control, including a class toggled on an ancestor outside the Scroller. (The one change that cannot be seen is a stylesheet toggling only `visibility` on a control from outside the content: no box changes and nothing in the content is written. Hide with `display`, or write the attribute or class on the control itself.) It leaves the Tab order again when the content fits or a control becomes reachable;
- it is a `role="region"` named by `ariaLabel`, or `Scrollable content` when none is given;
- it shows a focus ring (`--scroller-focus-outline`);
- while it holds focus, the arrow keys on its own axis scroll it: Left/Right when horizontal, Up/Down when vertical, 40px per press (one `scrollAmount`, or one page, when `snapToItem` is on). Tab and Shift+Tab move on as usual.

Content that already holds a focusable control gets no extra Tab stop: moving focus to a control scrolls it into view by itself, and keys pressed inside the content stay with the content.

```svelte
<Scroller showArrows={false} ariaLabel="Release timeline">
  <div style="width: 1600px; flex-shrink: 0;">…</div>
</Scroller>
```

Give the content `flex-shrink: 0` (or a fixed-width child) so it keeps its size: the scroll container is a flex row, and a flex child that is allowed to shrink fits instead of overflowing.

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

### Themed Scrollbar

A visible scrollbar (`hideScrollbar={false}`) takes its width and colors from tokens, so it can be themed through a class on the root instead of a rule that reaches into `.scroll-container`. A plain `scrollbar-width` on that class never reached the scroll container, because the property is not inherited; the width token does, because custom properties are.

```svelte
<Scroller hideScrollbar={false} classes="slim-scroller">
  {#each items as item}
    <div class="card">{item.name}</div>
  {/each}
</Scroller>

<style>
  :global(.slim-scroller) {
    --scroller-scrollbar-width: thin;
    --scroller-scrollbar-color: #888888 transparent;
  }
</style>
```

Leave both unset and nothing changes, including any `::-webkit-scrollbar` rules, inherited `scrollbar-color` or `scrollbar-width` rule you already have. The tokens apply in a cascade layer, so your own CSS can still beat a set token: a rule outside any layer that matches `.scroll-container` (including `*`) wins, a rule in a layer that first appears after the library's CSS wins, and so does any `!important` rule. A set token wins over a rule inside an earlier layer. Setting the width token turns off `::-webkit-scrollbar` styling in Chromium and WebKit; setting the color token does so in Chromium only, because WebKit has no `scrollbar-color`. Neither applies while `hideScrollbar` is `true`.

### Aligning Items

Items start at the leading edge of the Scroller, because the scroll container is a flex row (a flex column for `direction="vertical"`). `--scroller-justify-content` sets the scroll container's `justify-content`, which places the items along the scrolling axis, so a short row can sit at the end or in the middle from a class on the root instead of a rule that reaches into `.scroll-container`.

```svelte
<Scroller classes="end-aligned">
  {#each items as item}
    <div class="card">{item.name}</div>
  {/each}
</Scroller>

<style>
  :global(.end-aligned) {
    --scroller-justify-content: safe flex-end;
  }
</style>
```

Write `safe flex-end` (or `safe center`) rather than `flex-end` (or `center`) when the content can outgrow the Scroller. A plain `flex-end` puts the overflow before the start edge, where a scroll container has no scrollable range, so the first items are cut off and cannot be scrolled to. `safe` falls back to start alignment once the content overflows, and the whole row stays reachable.

Leave it unset and nothing changes, including any `justify-content` rule you already have on `.scroll-container`. The token applies in a cascade layer, so your own CSS can still beat a set token: a rule outside any layer that matches `.scroll-container` (including `*`) wins. A set token wins over a rule inside an earlier layer.

## CSS Custom Properties

### Container

| Variable                     | Default          | Description                                                                                          |
| ---------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `--scroller-width`           | `100%`           | Width of the entire scroller component including arrows.                                             |
| `--scroller-height`          | `fit-content`    | Height of the entire scroller component. Useful for vertical scrollers with fixed height.            |
| `--scroller-gap`             | `0px`            | Gap between child items inside the scroll container.                                                 |
| `--scroller-padding`         | `0px`            | Padding inside the scroll container around the child items.                                          |
| `--scroller-scroll-behavior` | `smooth`         | CSS scroll-behavior for the scroll container. Controls transition style.                             |
| `--scroller-justify-content` | Unset (`normal`) | CSS `justify-content` of the scroll container, along the scrolling axis. Unset, no value is applied. |

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

### Focus

| Variable                         | Default           | Description                                                                                                                                                                      |
| -------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scroller-focus-outline`       | `2px solid #2563eb` | Focus ring drawn on the scroll region while it holds keyboard focus (`:focus-visible`). Set to `none` only if the host supplies an equally visible indicator of its own.        |
| `--scroller-focus-outline-offset` | `-2px`           | Offset of that ring. Negative keeps it inside the region so an `overflow: hidden` ancestor cannot clip it.                                                                      |

### Snap

| Variable               | Default                       | Description                                                                          |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `--scroller-snap-type` | `x mandatory` / `y mandatory` | CSS scroll-snap-type value. Automatically adapts to direction but can be overridden. |

### Scrollbar

Applied to the scroll container only while the scrollbar is shown (`hideScrollbar={false}`).

| Variable                     | Default                     | Description                                                                                                                                                                    |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scroller-scrollbar-width` | Unset (browser `auto`)      | CSS `scrollbar-width` of the scroll container: `auto`, `thin` or `none` (`none` hides the scrollbar). Unset, no width is applied.                                              |
| `--scroller-scrollbar-color` | Unset (inherits from above) | CSS `scrollbar-color` of the scroll container, as `<thumb> <track>` (for example `#888888 transparent`). It is inherited, so scrollable areas inside the items pick it up too. |

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

The keyboard route works through the slot: slotted content, including a control inside a nested custom element's shadow root, counts as focusable content, and slotted content that changes after mount updates the route. Name the region with the `aria-label` attribute (`<sui-scroller aria-label="Release timeline">`). To hide the arrows, assign the property: `el.showArrows = false`. The `show-arrows` attribute is a presence flag, so a missing attribute leaves the default (arrows on) and `show-arrows="false"` still means on.

### Web Component Tokens

The CSS custom properties above are inherited, so set them on the `<sui-scroller>` element itself; a class in the page's stylesheet cannot reach the `classes` of the Scroller inside its shadow root.

```html
<sui-scroller style="--scroller-justify-content: safe flex-end">
  <div>Scrollable content</div>
</sui-scroller>
```

### Web Component Events

`onscrollposition` is available as a JS property, and the same update also dispatches a
`scrollposition` DOM custom event (bubbles, composed) with `detail` set to the
`ScrollPosition` object, for a consumer who only calls `addEventListener`:

```js
const scroller = document.querySelector('sui-scroller');
scroller.addEventListener('scrollposition', (e) => console.log(e.detail.progress));
```

### Slots

| Slot Name        | Maps to Snippet | Description                                                   |
| ---------------- | --------------- | ------------------------------------------------------------- |
| _(default)_      | `children`      | Scrollable content.                                           |
| `arrow-previous` | `arrowPrevious` | Custom previous/left arrow; defaults to the built-in chevron. |
| `arrow-next`     | `arrowNext`     | Custom next/right arrow; defaults to the built-in chevron.    |
