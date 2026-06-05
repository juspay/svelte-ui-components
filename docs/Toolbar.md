# Toolbar

A fixed-position header bar with a back button (left), center title text, and customizable left/center/right content areas via Snippet slots. The `additionalContent` snippet renders a second row below the main toolbar content. If `leftContent` snippet is provided, it replaces the default back button. If `centerContent` snippet is provided, it replaces the `text` prop.

## Usage

```svelte
<script>
  import { Toolbar } from '@juspay/svelte-ui-components';
</script>

<Toolbar />
```

## Props

| Prop             | Type             | Required | Default                                          | Description                                                                                                                                                            |
| ---------------- | ---------------- | -------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| showBackButton   | `boolean`        | No       | `true`                                           | Whether to show the default back button on the left side. Only shown when leftContent snippet is not provided.                                                         |
| text             | `string \| null` | No       | `-`                                              | Title text displayed in the center of the toolbar. Only shown when centerContent snippet is not provided.                                                              |
| subheading       | `string`         | No       | `-`                                              | Optional secondary line of text displayed below the main `text` heading. Only rendered when `text` is also present and this string is non-empty.                      |
| backIcon         | `string \| null` | No       | `'https://sdk.breeze.in/gallery/icons/back.svg'` | URL for the back button icon image. Defaults to a back-arrow SVG from sdk.breeze.in.                                                                                   |
| classes          | `string`         | No       | `-`                                              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| testId           | `string`         | No       | `-`                                              | Test identifier applied as `data-pw` attribute on the toolbar's root element for Playwright selectors.                                                                 |
| headingTestId    | `string`         | No       | `-`                                              | Test identifier applied as `data-pw` attribute on the heading text element.                                                                                            |
| subheadingTestId | `string`         | No       | `-`                                              | Test identifier applied as `data-pw` attribute on the subheading element.                                                                                              |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet           | Type      | Description                                                                                         |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------- |
| leftContent       | `Snippet` | A Svelte 5 Snippet that replaces the default back button with custom left-side content.             |
| centerContent     | `Snippet` | A Svelte 5 Snippet that replaces the text prop with custom center content.                          |
| rightContent      | `Snippet` | A Svelte 5 Snippet for right-side content (e.g., action icons).                                     |
| additionalContent | `Snippet` | A Svelte 5 Snippet for a second row of content below the main toolbar row (e.g., search bar, tabs). |

## Events

| Event       | Type                             | Description                                                                                                                       |
| ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| onbackClick | `() => void`                     | Fires when the default back button is clicked. Only relevant when showBackButton is true and leftContent snippet is not provided. |
| onkeydown   | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the back button has focus.                                                                      |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                  | Default                  | CSS Property    | Description                                          |
| ----------------------------------------- | ------------------------ | --------------- | ---------------------------------------------------- |
| `--toolbar-padding`                       | `0px`                    | padding         | Inner padding of the toolbar container.              |
| `--toolbar-height`                        | `fit-content`            | height          | Height of the toolbar.                               |
| `--toolbar-width`                         | `100vw`                  | width           | Width of the toolbar.                                |
| `--toolbar-position`                      | `fixed`                  | position        | CSS position (fixed by default, sticks to viewport). |
| `--toolbar-top`                           | `0`                      | top             | Top position of the toolbar.                         |
| `--toolbar-left`                          | `0`                      | left            | Left position of the toolbar.                        |
| `--toolbar-right`                         | `0`                      | right           | Right position of the toolbar.                       |
| `--toolbar-background`                    | `#ffffff`                | background      | Background color of the toolbar.                     |
| `--toolbar-box-shadow`                    | `0px 2px 12px #55687c1a` | box-shadow      | Box shadow of the toolbar.                           |
| `--toolbar-z-index`                       | `10`                     | z-index         | Z-index stacking order of the toolbar.               |
| `--toolbar-border-radius`                 | `0px`                    | border-radius   | Corner rounding of the toolbar.                      |
| `--toolbar-content-padding`               | `0px`                    | padding         | Padding inside the main content row.                 |
| `--toolbar-justify-content`               | `normal`                 | justify-content | Horizontal alignment of toolbar content.             |
| `--toolbar-content-visibility`            | `visible`                | visibility      | Visibility of the main content row.                  |
| `--toolbar-additional-content-padding`    | `0px`                    | padding         | Padding inside the additional content row.           |
| `--toolbar-additional-content-height`     | `fit-content`            | height          | Height of the additional content row.                |
| `--toolbar-justify-additional-content`    | `normal`                 | justify-content | Horizontal alignment of additional content.          |
| `--toolbar-additional-content-visibility` | `visible`                | visibility      | Visibility of the additional content row.            |
| `--toolbar-back-button-height`            | `20px`                   | height          | Height of the back button container.                 |
| `--toolbar-back-button-width`             | `20px`                   | width           | Width of the back button container.                  |
| `--toolbar-back-button-padding`           | `20px 14px`              | padding         | Padding around the back button.                      |
| `--toolbar-back-button-cursor`            | `pointer`                | cursor          | Cursor style for the back button.                    |
| `--toolbar-back-image-height`             | `16px`                   | height          | Height of the back button icon image.                |
| `--toolbar-back-image-width`              | `16px`                   | width           | Width of the back button icon image.                 |
| `--toolbar-text-flex`                     | `1`                      | flex            | Flex grow/shrink value of the text block container.  |
| `--toolbar-subheading-color`              | `inherit`                | color           | Text color of the subheading line.                   |
| `--toolbar-subheading-font-size`          | `inherit`                | font-size       | Font size of the subheading line.                    |

## Web Component

Tag: `<sui-toolbar>`

```html
<sui-toolbar
  text="Order Details"
  subheading="Placed on 5 Jun 2026"
  show-back-button
  test-id="toolbar-root"
  heading-test-id="toolbar-heading"
  subheading-test-id="toolbar-subheading"
>
  <button slot="right-content">Settings</button>
  <div slot="additional-content">Breadcrumbs</div>
</sui-toolbar>
```

### Slots

| Slot Name            | Maps to Snippet     | Description                                    |
| -------------------- | ------------------- | ---------------------------------------------- |
| `left-content`       | `leftContent`       | Content on the left side of the toolbar.       |
| `center-content`     | `centerContent`     | Content in the center of the toolbar.          |
| `right-content`      | `rightContent`      | Content on the right side of the toolbar.      |
| `additional-content` | `additionalContent` | Additional content below the main toolbar row. |
