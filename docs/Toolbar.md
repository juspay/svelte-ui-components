# Toolbar

A header bar with a back button (left), center title text, and customizable left/center/right content areas via Snippet slots. It defaults to a **fixed** chrome bar, but every positioning and row-layout axis is a CSS
variable, so the same component also serves an **in-flow page header** — see "Page-header
shape" below. The `additionalContent` snippet renders a second row below the main toolbar
content. If `leftContent` snippet is provided, it replaces the default back button. If `centerContent` snippet is provided, it replaces the `text` prop.

## Usage

```svelte
<script>
  import { Toolbar } from '@juspay/svelte-ui-components';
</script>

<Toolbar />
```

> **3.0.0 — the default back control changed.** With no `backIcon`, Toolbar used to render
> `<div role="button"><img src="https://sdk.breeze.in/gallery/icons/back.svg"></div>`; it now renders
> `<button aria-label="Back"><svg></svg></button>` with an inline `currentColor` chevron and no network
> request. Anything that selected `.back img`, asserted the old `src`, or themed the image needs updating:
> size it with the unchanged `--toolbar-back-image-height` / `-width` tokens (they apply to the `svg` too),
> colour it with `--toolbar-back-icon-color`, and pass your own `backIcon` URL if you need the image back.
> `backIcon={null}` still renders no control at all.

## Props

| Prop           | Type             | Required | Default                                              | Description                                                                                                                                                                               |
| -------------- | ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| showBackButton | `boolean`        | No       | `true`                                               | Whether to show the default back button on the left side. Only shown when leftContent snippet is not provided.                                                                            |
| text           | `string \| null` | No       | `-`                                                  | Title text displayed in the center of the toolbar. Only shown when centerContent snippet is not provided.                                                                                 |
| backIcon       | `string \| null` | No       | _none_ — an inline chevron drawn with `currentColor` | Custom image URL for the back button. Omit it for the built-in inline icon; pass `null` (or `''`) to render no back control at all. The component ships no network dependency of its own. |
| backLabel      | `string`         | No       | `'Back'`                                             | Accessible name of the back button (`aria-label`). The icon itself is decorative; an empty or whitespace-only value falls back to `'Back'`.                                               |
| classes        | `string`         | No       | `-`                                                  | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                    |
| testId         | `string`         | No       | `-`                                                  | `data-pw` attribute on the toolbar's root element for Playwright selectors.                                                                                                               |
| headingTestId  | `string`         | No       | `-`                                                  | `data-pw` attribute on the heading text element for Playwright selectors.                                                                                                                 |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet           | Type      | Description                                                                                         |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------- |
| leftContent       | `Snippet` | A Svelte 5 Snippet that replaces the default back button with custom left-side content.             |
| centerContent     | `Snippet` | A Svelte 5 Snippet that replaces the text prop with custom center content.                          |
| rightContent      | `Snippet` | A Svelte 5 Snippet for right-side content (e.g., action icons).                                     |
| additionalContent | `Snippet` | A Svelte 5 Snippet for a second row of content below the main toolbar row (e.g., search bar, tabs). |

## Events

| Event       | Type                             | Description                                                                                                                                                      |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onbackclick | `() => void`                     | Fires when the default back button is clicked. Only relevant when showBackButton is true and leftContent snippet is not provided.                                |
| onkeydown   | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the back button has focus. The control is a native `<button>`, so Enter and Space already activate `onbackclick` without this. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                     | Default                  | CSS Property    | Description                                                                                                                           |
| -------------------------------------------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--toolbar-padding`                          | `0px`                    | padding         | Inner padding of the toolbar container.                                                                                               |
| `--toolbar-height`                           | `fit-content`            | height          | Height of the toolbar.                                                                                                                |
| `--toolbar-width`                            | `100vw`                  | width           | Width of the toolbar.                                                                                                                 |
| `--toolbar-position`                         | `fixed`                  | position        | CSS position (fixed by default, sticks to viewport).                                                                                  |
| `--toolbar-top`                              | `0`                      | top             | Top position of the toolbar.                                                                                                          |
| `--toolbar-left`                             | `0`                      | left            | Left position of the toolbar.                                                                                                         |
| `--toolbar-right`                            | `0`                      | right           | Right position of the toolbar.                                                                                                        |
| `--toolbar-background`                       | `#ffffff`                | background      | Background color of the toolbar.                                                                                                      |
| `--toolbar-box-shadow`                       | `0px 2px 12px #55687c1a` | box-shadow      | Box shadow of the toolbar.                                                                                                            |
| `--toolbar-z-index`                          | `10`                     | z-index         | Z-index stacking order of the toolbar.                                                                                                |
| `--toolbar-border-radius`                    | `0px`                    | border-radius   | Corner rounding of the toolbar.                                                                                                       |
| `--toolbar-content-padding`                  | `0px`                    | padding         | Padding inside the main content row.                                                                                                  |
| `--toolbar-justify-content`                  | `normal`                 | justify-content | Horizontal alignment of toolbar content.                                                                                              |
| `--toolbar-content-visibility`               | `visible`                | visibility      | Visibility of the main content row.                                                                                                   |
| `--toolbar-content-width`                    | `auto`                   | width           | Width of the main content row.                                                                                                        |
| `--toolbar-content-height`                   | `auto`                   | height          | Height of the main content row. Set to `100%` to vertically fill a fixed-height toolbar.                                              |
| `--toolbar-content-max-width`                | `none`                   | max-width       | Maximum width of the main content row. Combine with `--toolbar-content-margin: 0 auto` to clamp and center content on wide viewports. |
| `--toolbar-content-margin`                   | `0`                      | margin          | Margin around the main content row.                                                                                                   |
| `--toolbar-text-font-size`                   | `18px`                   | font-size       | Font size of the default `text` title (when `centerContent` is not provided).                                                         |
| `--toolbar-text-font-weight`                 | `normal`                 | font-weight     | Font weight of the default `text` title.                                                                                              |
| `--toolbar-text-color`                       | `-`                      | color           | Text color of the default `text` title.                                                                                               |
| `--toolbar-text-padding`                     | `0px`                    | padding         | Padding around the default `text` title.                                                                                              |
| `--toolbar-text-margin`                      | `0px`                    | margin          | Margin around the default `text` title.                                                                                               |
| `--toolbar-text-flex`                        | `1`                      | flex            | Flex value of the default `text` title within the content row.                                                                        |
| `--toolbar-additional-content-padding`       | `0px`                    | padding         | Padding inside the additional content row.                                                                                            |
| `--toolbar-additional-content-height`        | `fit-content`            | height          | Height of the additional content row.                                                                                                 |
| `--toolbar-justify-additional-content`       | `normal`                 | justify-content | Horizontal alignment of additional content.                                                                                           |
| `--toolbar-additional-content-visibility`    | `visible`                | visibility      | Visibility of the additional content row.                                                                                             |
| `--toolbar-back-button-height`               | `20px`                   | height          | Height of the back button container.                                                                                                  |
| `--toolbar-back-button-width`                | `20px`                   | width           | Width of the back button container.                                                                                                   |
| `--toolbar-back-button-padding`              | `20px 14px`              | padding         | Padding around the back button.                                                                                                       |
| `--toolbar-back-button-cursor`               | `pointer`                | cursor          | Cursor style for the back button.                                                                                                     |
| `--toolbar-back-image-height`                | `16px`                   | height          | Height of the back button icon image.                                                                                                 |
| `--toolbar-back-image-width`                 | `16px`                   | width           | Width of the back button icon image.                                                                                                  |
| `--toolbar-back-icon-color`                  | `inherit`                | color           | Colour of the built-in inline icon (it is drawn with `currentColor`).                                                                 |
| `--toolbar-back-button-focus-outline`        | `2px solid currentColor` | outline         | Focus ring of the back button, shown for keyboard focus only.                                                                         |
| `--toolbar-back-button-focus-outline-offset` | `-2px`                   | outline-offset  | Inset of that focus ring.                                                                                                             |

## Web Component

Tag: `<sui-toolbar>`

```html
<sui-toolbar
  text="Page Title"
  show-back-button
  back-label="Back"
  test-id="toolbar-root"
  heading-test-id="toolbar-heading"
>
  <button slot="right-content">Settings</button>
  <div slot="additional-content">Breadcrumbs</div>
</sui-toolbar>
```

### Subheading (consumer recipe)

The library Toolbar intentionally does not offer a `subheading` prop — string props that carry presentational structure are rejected in favour of Snippets. To render a secondary line beneath the heading, use `centerContent`:

```svelte
<Toolbar testId="my-toolbar">
  {#snippet centerContent()}
    <div style="display: flex; flex-direction: column; flex: 1;">
      <span data-pw="toolbar-heading">Order Details</span>
      <span data-pw="toolbar-subheading">Placed on 5 Jun 2026</span>
    </div>
  {/snippet}
</Toolbar>
```

### Slots

| Slot Name            | Maps to Snippet     | Description                                    |
| -------------------- | ------------------- | ---------------------------------------------- |
| `left-content`       | `leftContent`       | Content on the left side of the toolbar.       |
| `center-content`     | `centerContent`     | Content in the center of the toolbar.          |
| `right-content`      | `rightContent`      | Content on the right side of the toolbar.      |
| `additional-content` | `additionalContent` | Additional content below the main toolbar row. |

## Page-header shape

The defaults describe a fixed chrome bar. The same component renders an in-flow page header
with **no additional props** — only CSS variables and the snippets it already has:

```svelte
<Toolbar showBackButton onbackclick={goBack}>
  {#snippet centerContent()}
    <div class="heading-block">
      <h2>Shipping profiles</h2>
      <p>Set delivery rates and zones for this store</p>
    </div>
  {/snippet}
  {#snippet rightContent()}
    <div class="actions">…</div>
  {/snippet}
</Toolbar>
```

```css
.page-header {
  --toolbar-position: relative;
  --toolbar-width: 100%;
  --toolbar-background: transparent;
  --toolbar-box-shadow: none;

  /* Top-align the row so the back control sits on the title's first line rather than
     centred against the whole two-line block. */
  --toolbar-content-align-items: flex-start;
  --toolbar-content-column-gap: 16px;

  /* The title side yields and ellipsizes; the actions stay whole. */
  --toolbar-center-flex: 1 1 auto;
  --toolbar-center-min-width: 0;
  --toolbar-right-flex-shrink: 0;
}
```

Note what is **not** here. There is no `subheading`, `headingLevel` or `headingClasses` prop:
the title block is the consumer's own markup in `centerContent`, so it keeps its semantic tags
and its design system's type classes without the library restating them. That follows the same
reasoning as "Subheading (consumer recipe)" above — presentational structure belongs in a
Snippet, and how a title _looks_ is reachable with ordinary CSS on the consumer's own elements.

Responsive behaviour is the consumer's too. The component ships **no media queries** — it
exposes the mechanism and the app picks the breakpoints, because "wrap the actions below 1024px"
and "hide the subheading on a phone" are design decisions the library cannot make for everyone.

### Additional CSS variables

| Variable                                              | Default                  | Description                                                                                                                              |
| ----------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--toolbar-content-align-items`                       | `center`                 | Cross-axis alignment of the main row. `flex-start` top-aligns a title that has a subline under it.                                       |
| `--toolbar-content-min-height`                        | `auto`                   | Floor for the main row's height — a fixed-height bar sets it here, not on the outer column.                                              |
| `--toolbar-content-flex-wrap`                         | `nowrap`                 | Lets the action side drop to its own line on a narrow viewport.                                                                          |
| `--toolbar-content-row-gap` / `-column-gap`           | `0`                      | Gaps between the row's regions, and between wrapped lines.                                                                               |
| `--toolbar-center-flex`                               | `1`                      | `1 1 auto` lets the centre region grow from its CONTENT width, so a deficit is shared with the actions rather than collapsing the title. |
| `--toolbar-center-min-width`                          | `auto`                   | Set `0` so a long title can shrink and ellipsize.                                                                                        |
| `--toolbar-right-flex-shrink`                         | `1`                      | Set `0` so actions never get crushed by a long title.                                                                                    |
| `--toolbar-right-min-width` / `-max-width` / `-width` | `auto` / `none` / `auto` | Action-region sizing as a flex item. Its INNER layout stays the snippet's own markup.                                                    |
| `--toolbar-right-display`                             | `block`                  | Set `flex` only if you want the region itself to be the flex container.                                                                  |

Every default above resolves to the value the component already rendered, so adding them
changes nothing for an existing consumer.
