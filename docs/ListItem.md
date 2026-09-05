# ListItem

A multi-section list row with left image (with fallback), center label (supports HTML), right image, and optional text on the right. Supports an accordion-expandable bottom section. Each section (left image, right image, center text, top section, whole item) has its own click handler. Shows a loading overlay and optional right-side circular loader spinner. The `preventFocus` prop removes focus outlines for non-keyboard navigation contexts. Has no selection/checkbox concept at all — for a checkbox-driven selectable row, use `CheckListItem` instead.

## Usage

```svelte
<script>
  import { ListItem } from '@juspay/svelte-ui-components';
</script>

<ListItem />
```

## Props

| Prop                    | Type                      | Required | Default    | Description                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| leftImageUrl            | `string \| null`          | No       | `-`        | URL for the left-side image. Rendered using the Img component with fallback support.                                                                                                                                                        |
| leftImageFallbackUrl    | `string \| null`          | No       | `-`        | Fallback image URL if leftImageUrl fails to load.                                                                                                                                                                                           |
| rightImageUrl           | `string \| null`          | No       | `-`        | URL for the right-side image (e.g., an arrow or action icon).                                                                                                                                                                               |
| transformSvg            | `(svg: string) => string` | No       | `-`        | Rewrites either image's SVG markup before it is inlined. Providing it enables SVG inlining for both image URLs.                                                                                                                             |
| label                   | `string \| null`          | No       | `-`        | Center text content. Supports HTML (rendered via {@html}). Used for the main list item label.                                                                                                                                               |
| useAccordion            | `boolean`                 | No       | `false`    | When true, wraps the bottomContent in an Accordion component for expand/collapse animation.                                                                                                                                                 |
| rightContentText        | `string \| null`          | No       | `-`        | Text displayed on the right side of the list item (e.g., a price or status).                                                                                                                                                                |
| testId                  | `string`                  | No       | `-`        | Value for data-pw on the outer item container.                                                                                                                                                                                              |
| topSectionTestId        | `string`                  | No       | `-`        | Value for data-pw on the top section (left + center + right).                                                                                                                                                                               |
| rightImageTestId        | `string`                  | No       | `-`        | Value for data-pw on the right image wrapper.                                                                                                                                                                                               |
| leftImageTestId         | `string`                  | No       | `-`        | Value for data-pw on the left image wrapper.                                                                                                                                                                                                |
| centerTextTestId        | `string`                  | No       | `-`        | Value for data-pw on the center text element.                                                                                                                                                                                               |
| showLoader              | `boolean`                 | No       | `false`    | When true, shows a semi-transparent animated overlay that fills across the item (progress bar animation).                                                                                                                                   |
| showRightContentLoader  | `boolean`                 | No       | `false`    | When true, shows a circular Loader spinner in the right content area.                                                                                                                                                                       |
| expand                  | `boolean`                 | No       | `false`    | Bindable. Controls whether the accordion bottom section is expanded or collapsed.                                                                                                                                                           |
| preventFocus            | `boolean`                 | No       | `false`    | When true, removes the focus outline from interactive elements. Useful when the list item is used in a non-keyboard context.                                                                                                                |
| suppressRoleAndTabindex | `boolean`                 | No       | `false`    | Explicit opt-in that removes ListItem's synthetic `role` and `tabindex` attributes from the item and its clickable subregions. Mouse click handlers remain active. Use when the consumer owns the semantic interactive control.             |
| classes                 | `string`                  | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                      |
| role                    | `string`                  | No       | `'button'` | ARIA role for the outer item container. Set to `'option'` when using ListItem inside a `role="listbox"` container (e.g., autocomplete dropdowns). When `'option'`, tabindex is automatically set to -1 for proper listbox focus management. |
| ariaSelected            | `boolean`                 | No       | `-`        | Sets `aria-selected` on the item container. Use when the ListItem represents a selectable option (e.g., the currently highlighted item in a listbox).                                                                                       |
| id                      | `string`                  | No       | `-`        | Sets the `id` attribute on the item container. Needed for `aria-activedescendant` references from a parent combobox input.                                                                                                                  |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet       | Type      | Description                                                                                                                                                                     |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| leftContent   | `Snippet` | A Svelte 5 Snippet for custom content in the left area (beside or replacing the left image).                                                                                    |
| centerContent | `Snippet` | A Svelte 5 Snippet for custom content in the center area (beside or replacing the label).                                                                                       |
| rightContent  | `Snippet` | A Svelte 5 Snippet for custom content in the right area (beside the right image).                                                                                               |
| bottomContent | `Snippet` | A Svelte 5 Snippet for content below the main row. Only renders when `useAccordion` is `true`; displayed inside an Accordion that expands/collapses based on the `expand` prop. |

## Events

| Event             | Type                             | Description                                                                                        |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| onleftimageclick  | `(event: MouseEvent) => void`    | Fires when the left image is clicked.                                                              |
| onrightimageclick | `(event: MouseEvent) => void`    | Fires when the right image is clicked.                                                             |
| oncentertextclick | `(event: MouseEvent) => void`    | Fires when the center text/label area is clicked.                                                  |
| onitemclick       | `(event: MouseEvent) => void`    | Fires when the entire list item container is clicked (including all sub-areas).                    |
| ontopsectionclick | `(event: MouseEvent) => void`    | Fires when the top section (left + center + right row, excluding the accordion bottom) is clicked. |
| onkeydown         | `(event: KeyboardEvent) => void` | Fires when a key is pressed while any focusable section of the list item has focus.                |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                         | Default                                   | CSS Property             | Description                                              |
| ------------------------------------------------ | ----------------------------------------- | ------------------------ | -------------------------------------------------------- |
| `--list-item-loader-foreground`                  | `#86898d`                                 | --loader-foreground      | Color of the Loader spinner foreground.                  |
| `--list-item-loader-background`                  | `#ffffff`                                 | --loader-background      | Color of the Loader spinner background/center.           |
| `--list-item-loader-foreground-end`              | `#ffffff`                                 | --loader-foreground-end  | End color of the Loader spinner gradient.                |
| `--list-item-loader-background-color`            | `#00000030`                               | background               | Background overlay color when showLoader is true.        |
| `--list-item-background-color`                   | `transparent`                             | background-color         | Background color of the list item.                       |
| `--list-item-cursor`                             | `pointer`                                 | cursor                   | Cursor style when hovering the list item.                |
| `--list-item-box-shadow`                         | `none`                                    | box-shadow               | Box shadow of the list item.                             |
| `--list-item-box-width`                          | `-`                                       | width                    | Width of the list item.                                  |
| `--list-item-border-radius`                      | `0px`                                     | border-radius            | Corner rounding of the list item.                        |
| `--list-item-margin`                             | `-`                                       | margin                   | Outer margin of the list item.                           |
| `--list-item-padding`                            | `-`                                       | padding                  | Inner padding of the list item.                          |
| `--list-item-border`                             | `-`                                       | border                   | Border of the list item.                                 |
| `--list-item-transition`                         | `-`                                       | transition               | Transition animation for the list item (e.g., on hover). |
| `--list-item-hover-background-color`             | `var(--list-item-background-color)`       | background-color         | Background color on hover.                               |
| `--list-item-hover-border`                       | `var(--list-item-border)`                 | border                   | Border on hover.                                         |
| `--list-item-top-section-align-items`            | `-`                                       | align-items              | Vertical alignment for the top content row.              |
| `--list-item-top-section-gap`                    | `-`                                       | gap                      | Gap between top row content areas.                       |
| `--list-item-left-content-display`               | `flex`                                    | display                  |                                                          |
| `--list-item-left-image-height`                  | `24px`                                    | --image-height           | Height of the left image.                                |
| `--list-item-left-image-width`                   | `24px`                                    | --image-width            | Width of the left image.                                 |
| `--list-item-left-image-padding`                 | `0px`                                     | --image-padding          | Padding around the left image.                           |
| `--list-item-left-image-border-radius`           | `0px`                                     | --image-border-radius    | Corner rounding of the left image.                       |
| `--list-item-left-image-margin`                  | `0px`                                     | --image-margin           | Margin around the left image.                            |
| `--list-item-left-image-filter`                  | `none`                                    | --image-filter           | CSS filter applied to the left image.                    |
| `--list-item-left-image-background`              | `-`                                       | --image-background       | Background behind the left image.                        |
| `--list-item-left-image-border`                  | `-`                                       | --image-border           | Border of the left image.                                |
| `--list-item-left-image-hover-background`        | `var(--list-item-left-image-background)`  | background               | Background color of left image on hover.                 |
| `--list-item-left-image-hover-border`            | `var(--list-item-left-image-border)`      | border                   | Border of left image on hover.                           |
| `--list-item-left-image-object-fit`              | `-`                                       | --image-object-fit       | Object-fit of the left image.                            |
| `--list-item-center-text-justify-content`        | `flex-start`                              | justify-content          | Vertical alignment of center text.                       |
| `--list-item-center-text-padding`                | `0px 20px`                                | padding                  | Padding around the center text.                          |
| `--list-item-center-text-color`                  | `#2f3841`                                 | color                    | Color of the center text.                                |
| `--list-item-center-text-font-size`              | `12px`                                    | font-size                | Font size of the center text.                            |
| `--list-item-center-text-font-weight`            | `300`                                     | font-weight              | Font weight of the center text.                          |
| `--list-item-center-text-vertical-align`         | `-`                                       | align-items              | Vertical alignment inside the center text.               |
| `--list-item-center-text-margin`                 | `-`                                       | margin                   | Margin around the center text.                           |
| `--list-item-center-text-border`                 | `-`                                       | border                   | Border around the center text.                           |
| `--list-item-center-text-cursor`                 | `pointer`                                 | cursor                   | Cursor for the center text.                              |
| `--list-item-center-text-font-family`            | `-`                                       | font-family              | Font family of the center text.                          |
| `--list-item-right-content-display`              | `flex`                                    | display                  | Display mode of the right content area.                  |
| `--list-item-right-content-flex`                 | `-`                                       | flex                     | Flex sizing for the right content area.                  |
| `--list-item-right-content-loader-margin`        | `-`                                       | margin                   |                                                          |
| `--list-item-right-image-height`                 | `18px`                                    | --image-height           | Height of the right image.                               |
| `--list-item-right-image-width`                  | `18px`                                    | --image-width            | Width of the right image.                                |
| `--list-item-right-image-padding`                | `0px`                                     | --image-padding          | Padding around the right image.                          |
| `--list-item-right-image-border-radius`          | `0px`                                     | --image-border-radius    | Corner rounding of the right image.                      |
| `--list-item-right-image-margin`                 | `0px`                                     | --image-margin           | Margin around the right image.                           |
| `--list-item-right-image-filter`                 | `-`                                       | --image-filter           | CSS filter applied to the right image.                   |
| `--list-item-right-image-background`             | `-`                                       | --image-background       | Background behind the right image.                       |
| `--list-item-right-image-border`                 | `-`                                       | --image-border           | Border of the right image.                               |
| `--list-item-right-image-hover-background`       | `var(--list-item-right-image-background)` | --image-hover-background | Background color of right image on hover.                |
| `--list-item-right-image-hover-border`           | `var(--list-item-right-image-border)`     | --image-hover-border     | Border of right image on hover.                          |
| `--list-item-right-content-text-color`           | `#2f3841`                                 | color                    | Color of the right side text.                            |
| `--list-item-right-content-text-font-size`       | `12px`                                    | font-size                | Font size of the right side text.                        |
| `--list-item-right-content-text-font-weight`     | `300`                                     | font-weight              | Font weight of the right side text.                      |
| `--list-item-right-content-text-vertical-align`  | `-`                                       | align-items              |                                                          |
| `--list-item-right-content-text-padding`         | `0px`                                     | padding                  |                                                          |
| `--list-item-right-content-text-margin`          | `0px`                                     | margin                   |                                                          |
| `--list-item-right-content-text-border`          | `-`                                       | border                   |                                                          |
| `--list-item-right-content-text-cursor`          | `pointer`                                 | cursor                   |                                                          |
| `--list-item-right-content-text-font-family`     | `-`                                       | font-family              |                                                          |
| `--list-item-right-content-text-justify-content` | `-`                                       | justify-content          |                                                          |
| `--list-item-loader-duration`                    | `8s`                                      | animation                | Duration of the loading progress bar animation.          |

## Internal Dependencies

This component uses the following library components internally:

- Accordion
- Loader
- Img

## Web Component

Tag: `<sui-list-item>`

```html
<sui-list-item label="Item Title">
  <img slot="left-content" src="/avatar.jpg" />
  <span slot="center-content">Description</span>
  <span slot="right-content">$10.00</span>
  <div slot="bottom-content">Extra info</div>
</sui-list-item>
```

### Slots

| Slot Name        | Maps to Snippet | Description                                      |
| ---------------- | --------------- | ------------------------------------------------ |
| `left-content`   | `leftContent`   | Content on the left side (e.g., avatar, icon).   |
| `center-content` | `centerContent` | Center area content (e.g., description).         |
| `right-content`  | `rightContent`  | Content on the right side (e.g., price, action). |
| `bottom-content` | `bottomContent` | Content below the main row.                      |

## SVG transformation

Pass `transformSvg` to rewrite left and right SVG image markup before it is inlined. This is useful when an app needs SVG paths to inherit its surface colour.

```svelte
<ListItem
  leftImageUrl="/icons/status.svg"
  rightImageUrl="/icons/chevron.svg"
  transformSvg={(svg) => svg.replaceAll('#000000', 'currentColor')}
/>
```

## Consumer-owned semantics

`ListItem` renders synthetic button roles and tab stops by default. When a surrounding consumer supplies the interactive semantics, set `suppressRoleAndTabindex` to remove those paired attributes without changing click handlers.

```svelte
<ListItem suppressRoleAndTabindex onitemclick={handleItemClick} />
```
