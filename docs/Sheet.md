# Sheet

A panel component that slides in from any edge of the screen (left, right, top, or bottom), or floats as a fixed-size dialog centered in the viewport (`side="center"`). Designed for navigation menus, settings panels, detail views, notification trays, or confirmation dialogs. Left/right sheets span the full viewport height; top/bottom sheets span the full viewport width; a centered sheet fades in at a fixed size and does not touch any edge. Includes a structured layout with a header (title and close button), scrollable content area, and an optional footer. The `open` prop is bindable for two-way state control. Body scroll is locked while the sheet is open, and focus is trapped within the panel for accessibility. The header title renders as a plain `<span>` by default, or a real `<h1>`-`<h6>` heading via `headingLevel`.

## Usage

```svelte
<script>
  import { Sheet } from '@juspay/svelte-ui-components';

  let sheetOpen = $state(false);
</script>

<button onclick={() => (sheetOpen = true)}>Open Sheet</button>

<Sheet bind:open={sheetOpen} title="Settings" side="right" onclose={() => console.log('closed')}>
  {#snippet content()}
    <p>Sheet content goes here</p>
  {/snippet}
  {#snippet footer()}
    <button onclick={() => (sheetOpen = false)}>Done</button>
  {/snippet}
</Sheet>
```

A centered confirmation dialog, with the title rendered as a real `<h2>`:

```svelte
<Sheet bind:open={confirmOpen} side="center" title="Delete project?" headingLevel={2}>
  {#snippet content()}
    <p>This can't be undone.</p>
  {/snippet}
  {#snippet footer()}
    <button onclick={() => (confirmOpen = false)}>Cancel</button>
    <button onclick={deleteProject}>Delete</button>
  {/snippet}
</Sheet>
```

A bottom sheet that becomes a centred, width-capped card above phone widths — the shape most mobile-first "launch" or "action" sheets actually use. `side` is a plain reactive prop, so a media query can still swap it for `center` or a side panel at larger breakpoints:

```svelte
<Sheet bind:open={launchOpen} side="bottom" title="Launch" classes="launch-sheet">
  {#snippet content()}
    <p>Pick a machine to start.</p>
  {/snippet}
</Sheet>

<style>
  :global(.launch-sheet) {
    --sheet-band-width: min(560px, 100vw);
    --sheet-band-box-sizing: border-box;
    --sheet-band-border: 1px solid #d4d4d8;
  }
</style>
```

Without the band variables the panel keeps its existing full-bleed, content-box layout. The responsive recipe explicitly sets `--sheet-band-box-sizing: border-box` so all four borders fit inside `min(560px, 100vw)`, including on narrow phones. If using horizontal insets, subtract them from the available width or use `width: auto` with `--sheet-band-max-width` instead.

## Props

| Prop                  | Type               | Required | Default               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------ | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content               | `Snippet`          | Yes      | -                     | Snippet rendered inside the scrollable content area of the sheet panel. This is the main body of the sheet.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| open                  | `boolean`          | No       | `false`               | Bindable. Controls whether the sheet is visible. When true, the sheet panel slides in from the configured side and the overlay is shown. Supports two-way binding via `bind:open`.                                                                                                                                                                                                                                                                                                                                                              |
| side                  | `SheetSide`        | No       | `'right'`             | The edge of the screen from which the sheet slides in, or `'center'`. `'left'` and `'right'` panels span the full viewport height with configurable width. `'top'` and `'bottom'` panels span the full viewport width with configurable height, and can be width-capped and centred with `--sheet-band-width`/`--sheet-band-max-width`. `'center'` renders a fixed-size dialog centered in the viewport that fades in rather than sliding from an edge, sized by `--sheet-center-width`/`--sheet-center-max-width`/`--sheet-center-max-height`. |
| title                 | `string`           | No       | `-`                   | Text displayed in the sheet header. When provided, a header bar is rendered at the top of the panel with this title.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| showOverlay           | `boolean`          | No       | `true`                | When true, shows a dark semi-transparent overlay behind the sheet panel. When false, the overlay is transparent with pointer-events disabled on the backdrop.                                                                                                                                                                                                                                                                                                                                                                                   |
| dismissOnOutsideClick | `boolean`          | No       | mirrors `showOverlay` | Whether clicking outside the panel dismisses the sheet, independent of `showOverlay`'s visual tint. Defaults to mirroring `showOverlay`. Set `true` alongside `showOverlay={false}` for a dismissible sheet with no dimming backdrop — e.g. an anchored dropdown-style panel.                                                                                                                                                                                                                                                                   |
| overlayAriaLabel      | `string`           | No       | `'Close sheet'`       | Accessible name (rendered as `aria-label`) for the overlay's `role="button"` wrapper. Only meaningful when `dismissOnOutsideClick` is true — that's the only state in which the overlay is announced as a button at all. An empty or whitespace-only value falls back to the default rather than being forwarded, since an unannounceable name is worse than none. See Accessibility below.                                                                                                                                                     |
| showCloseButton       | `boolean`          | No       | `true`                | When true, renders a close button (X) in the sheet header. Clicking it closes the sheet and fires the onclose event.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| headingLevel          | `1\|2\|3\|4\|5\|6` | No       | `-`                   | Renders `title` through a real `<h1>`-`<h6>` element instead of the default `<span>`. Omit to keep the existing `<span>` markup. Pick the level that is correct for the surrounding document outline.                                                                                                                                                                                                                                                                                                                                           |
| testId                | `string`           | No       | `-`                   | Value for data-pw on the overlay container element. The close button gets `{testId}-close` as its data-pw value. Used for Playwright test selectors.                                                                                                                                                                                                                                                                                                                                                                                            |
| classes               | `string`           | No       | `-`                   | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                                                                                                                                                                                                                          |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet | Type      | Description                                                                                                                                                                   |
| ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content | `Snippet` | Required. The main body content rendered inside the scrollable area of the sheet panel.                                                                                       |
| footer  | `Snippet` | Optional. Content rendered in a fixed footer area at the bottom of the sheet panel, separated from the content by a border. Useful for action buttons or summary information. |

## Events

| Event        | Type         | Description                                                                                                                                                                                            |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onclose      | `() => void` | Fires when the sheet is dismissed by clicking the overlay backdrop, pressing the Escape key, or clicking the close button. The `open` prop is automatically set to `false` before this callback fires. |
| onafteropen  | `() => void` | Fires once after the open (intro) transition has fully completed. Useful for triggering animations or focusing elements that should only activate once the sheet is fully visible.                     |
| onafterclose | `() => void` | Fires once after the close (outro) transition has fully completed. Useful for cleanup tasks that should only run after the sheet has fully left the screen.                                            |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default                          | CSS Property     | Description                                                                                                                                                                                                                                                                     |
| --------------------------------------- | -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--sheet-overlay-z-index`               | `15`                             | z-index          | Z-index stacking order of the overlay backdrop.                                                                                                                                                                                                                                 |
| `--sheet-overlay-background`            | `#00000066`                      | background-color | Background color of the semi-transparent overlay behind the sheet.                                                                                                                                                                                                              |
| `--sheet-width`                         | `400px`                          | width            | Width of the sheet panel (applies to left/right sides only).                                                                                                                                                                                                                    |
| `--sheet-max-width`                     | `100vw`                          | max-width        | Maximum width of the sheet panel (left/right sides), prevents it from exceeding viewport width on small screens.                                                                                                                                                                |
| `--sheet-height`                        | `300px`                          | height           | Height of the sheet panel (applies to top/bottom sides only).                                                                                                                                                                                                                   |
| `--sheet-max-height`                    | `100vh`                          | max-height       | Maximum height of the sheet panel (top/bottom sides), prevents it from exceeding viewport height.                                                                                                                                                                               |
| `--sheet-band-width`                    | `auto`                           | width            | Caps the width of a `top`/`bottom` panel and centres it between `--sheet-left` and `--sheet-right`. Defaults to `auto`, which keeps the panel edge-to-edge exactly as before. Independent of `--sheet-width` so an existing left/right theme cannot reshape a top/bottom sheet. |
| `--sheet-band-max-width`                | `none`                           | max-width        | Upper bound on a `top`/`bottom` panel's width, for capping responsively without fixing the width outright (e.g. `min(560px, 100vw)` behaviour).                                                                                                                                 |
| `--sheet-band-box-sizing`               | `content-box`                    | box-sizing       | Set to `border-box` to include borders in the requested band width; opt-in to preserve existing dimensions.                                                                                                                                                                     |
| `--sheet-band-border`                   | `none`                           | border           | Border on **all four** edges of a `top`/`bottom` panel, which a width-capped floating card needs and an edge-to-edge band does not. When unset, only the entering edge is drawn, via `--sheet-border`.                                                                          |
| `--sheet-center-width`                  | `480px`                          | width            | Width of the sheet panel when `side="center"`. Independent of `--sheet-width` so an existing left/right theme is unaffected by adding a centered sheet.                                                                                                                         |
| `--sheet-center-max-width`              | `calc(100vw - 32px)`             | max-width        | Maximum width of a `side="center"` panel, keeping a small viewport gutter on narrow screens.                                                                                                                                                                                    |
| `--sheet-center-max-height`             | `90vh`                           | max-height       | Maximum height of a `side="center"` panel before its content area scrolls.                                                                                                                                                                                                      |
| `--sheet-background`                    | `#ffffff`                        | background-color | Background color of the sheet panel.                                                                                                                                                                                                                                            |
| `--sheet-box-shadow`                    | `-2px 0 8px rgba(0, 0, 0, 0.15)` | box-shadow       | Shadow cast by the sheet panel.                                                                                                                                                                                                                                                 |
| `--sheet-z-index`                       | `16`                             | z-index          | Z-index stacking order of the sheet panel itself.                                                                                                                                                                                                                               |
| `--sheet-top`                           | `0`                              | top              | Top offset of the panel (left/right/top sides). Override to clear a fixed header, or turn a top sheet into an anchored floating panel.                                                                                                                                          |
| `--sheet-bottom`                        | `0`                              | bottom           | Bottom offset of the panel (left/right/bottom sides). Override (e.g. to `auto`) to size a bottom sheet to its content instead of edge-to-edge.                                                                                                                                  |
| `--sheet-left`                          | `0`                              | left             | Left offset of the panel (left/top/bottom sides).                                                                                                                                                                                                                               |
| `--sheet-right`                         | `0`                              | right            | Right offset of the panel (right/top/bottom sides).                                                                                                                                                                                                                             |
| `--sheet-border`                        | `none`                           | border           | Border on the edge of the sheet panel facing the page content. Applied as border-left (right side), border-right (left side), border-bottom (top side), or border-top (bottom side).                                                                                            |
| `--sheet-header-padding`                | `16px 20px`                      | padding          | Inner padding of the header area.                                                                                                                                                                                                                                               |
| `--sheet-header-background`             | `inherit`                        | background-color | Background color of the header area.                                                                                                                                                                                                                                            |
| `--sheet-header-border-bottom`          | `1px solid #e0e0e0`              | border-bottom    | Bottom border of the header, visually separating it from the content area.                                                                                                                                                                                                      |
| `--sheet-title-font-size`               | `18px`                           | font-size        | Font size of the title text in the header.                                                                                                                                                                                                                                      |
| `--sheet-title-font-weight`             | `600`                            | font-weight      | Font weight of the title text in the header.                                                                                                                                                                                                                                    |
| `--sheet-title-font-family`             | `inherit`                        | font-family      | Font family of the title text in the header.                                                                                                                                                                                                                                    |
| `--sheet-title-color`                   | `#1a1a1a`                        | color            | Text color of the title in the header.                                                                                                                                                                                                                                          |
| `--sheet-title-line-height`             | `1.4`                            | line-height      | Line height of the title text in the header.                                                                                                                                                                                                                                    |
| `--sheet-close-button-size`             | `32px`                           | width, height    | Width and height of the close button in the header.                                                                                                                                                                                                                             |
| `--sheet-close-button-border-radius`    | `4px`                            | border-radius    | Border radius of the close button.                                                                                                                                                                                                                                              |
| `--sheet-close-button-background`       | `transparent`                    | background-color | Background color of the close button in its default state.                                                                                                                                                                                                                      |
| `--sheet-close-button-color`            | `#666666`                        | color            | Color of the close button icon.                                                                                                                                                                                                                                                 |
| `--sheet-close-button-font-size`        | `16px`                           | font-size        | Font size of the close button icon.                                                                                                                                                                                                                                             |
| `--sheet-close-button-hover-background` | `#f0f0f0`                        | background-color | Background color of the close button when hovered.                                                                                                                                                                                                                              |
| `--sheet-content-overflow-y`            | `auto`                           | overflow-y       | Vertical overflow behavior of the scrollable content area.                                                                                                                                                                                                                      |
| `--sheet-content-padding`               | `20px`                           | padding          | Inner padding of the content area.                                                                                                                                                                                                                                              |
| `--sheet-scrollbar-width`               | `none`                           | scrollbar-width  | Controls the visibility of the scrollbar in the content area. Set to `auto` or `thin` to show scrollbar.                                                                                                                                                                        |
| `--sheet-footer-padding`                | `16px 20px`                      | padding          | Inner padding of the footer area.                                                                                                                                                                                                                                               |
| `--sheet-footer-background`             | `inherit`                        | background-color | Background color of the footer area.                                                                                                                                                                                                                                            |
| `--sheet-footer-border-top`             | `1px solid #e0e0e0`              | border-top       | Top border of the footer, visually separating it from the content area.                                                                                                                                                                                                         |
| `--sheet-panel-focus-outline`           | `2px solid #2563eb`              | outline          | Focus ring drawn on the panel when it (not one of its children) holds keyboard/programmatic focus — e.g. immediately on open, or on the "Raw" variant with no focusable content.                                                                                                |
| `--sheet-panel-focus-outline-offset`    | `-2px`                           | outline-offset   | Offset of that ring. Negative (inset) by default so it stays visible on edge-anchored sides, which sit flush against the viewport edge.                                                                                                                                         |

## Accessibility

- The sheet panel has `role="dialog"` and `aria-modal="true"` for screen reader support.
- Focus is automatically moved to the sheet panel when it opens, and shows a visible focus ring (`--sheet-panel-focus-outline`) when that focus is keyboard/programmatic rather than from a mouse click.
- Focus is trapped within the sheet panel using Tab/Shift+Tab cycling.
- Pressing the Escape key closes the sheet.
- The close button has `aria-label="Close"` for screen reader identification.
- The overlay carries `role="button"` and an accessible name (`overlayAriaLabel`, default `"Close sheet"`) only while `dismissOnOutsideClick` is true — clicking it is a no-op otherwise, so it is left out of the accessibility tree entirely rather than announced as a button that does nothing (the same rule Modal's overlay follows).
- While it carries that role, the overlay answers Enter and Space as well as click, as WCAG 2.1 SC 2.1.1 requires of anything announced as a button. It stays out of the Tab sequence (`tabindex="-1"`); the focus trap and browse-mode assistive tech are what reach it.

## Type Reference

Custom types used by this component's props and events:

### SheetSide

```typescript
type SheetSide = 'left' | 'right' | 'top' | 'bottom' | 'center';
```

## Internal Dependencies

This component uses the following library components internally:

- Button (for the close button)

## Web Component

Tag: `<sui-sheet>`

```html
<sui-sheet open side="right" title="Settings">
  <p>Sheet body content</p>
  <div slot="footer">
    <button>Save</button>
  </div>
</sui-sheet>
```

A centered dialog with a real heading (`heading-level`, reflecting `headingLevel`):

```html
<sui-sheet open side="center" title="Delete project?" heading-level="2">
  <p>This can't be undone.</p>
</sui-sheet>
```

A dismissible sheet with a localized overlay label (`overlay-aria-label`, reflecting `overlayAriaLabel`):

```html
<sui-sheet open dismiss-on-outside-click overlay-aria-label="Fermer">
  <p>Sheet body content</p>
</sui-sheet>
```

### Slots

| Slot Name   | Maps to Snippet | Description                           |
| ----------- | --------------- | ------------------------------------- |
| _(default)_ | `content`       | The main body content of the sheet.   |
| `footer`    | `footer`        | Content rendered in the sheet footer. |
