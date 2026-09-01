# Gallery

An image gallery with grid or list layout and an optional full-screen lightbox.
Clicking an item opens the lightbox (when `enableLightbox`) with previous/next
navigation, a counter, and a caption — fully keyboard-operable (arrow keys, Home/End,
Escape, focus-trapped Tab). Optional per-item edit/delete actions appear only when their
corresponding event handler is provided. `open` and `activeIndex` are bindable, so the
lightbox can be driven externally too. Grid items can render fully custom content per
image via the `itemFooter` snippet (e.g. a caption bar, action row) instead of the
built-in list-view text block.

## Usage

```svelte
<script>
  import { Gallery } from '@juspay/svelte-ui-components';

  const images = [
    {
      src: '/photos/1-full.jpg',
      thumbnail: '/photos/1-thumb.jpg',
      alt: 'Sunset',
      caption: 'Golden hour'
    },
    { src: '/photos/2-full.jpg', thumbnail: '/photos/2-thumb.jpg', alt: 'Mountains' }
  ];
</script>

<Gallery {images} view="grid" />

<!-- With edit/delete actions -->
<Gallery
  {images}
  onEditClick={(index) => editImage(index)}
  onDeleteClick={(index) => removeImage(index)}
/>
```

## Props

| Prop           | Type                              | Required | Default  | Description                                                                                   |
| -------------- | --------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| images         | `GalleryImage[]`                  | Yes      | `-`      | The images to display.                                                                        |
| view           | `'grid'\|'list'`                  | No       | `'grid'` | Layout mode.                                                                                  |
| open           | `boolean`                         | No       | `false`  | Bindable. Whether the lightbox is open.                                                       |
| activeIndex    | `number`                          | No       | `0`      | Bindable. Index of the lightbox's current image.                                              |
| enableLightbox | `boolean`                         | No       | `true`   | Whether clicking an item opens the lightbox.                                                  |
| loop           | `boolean`                         | No       | `false`  | Wrap previous/next navigation around at the ends.                                             |
| showCounter    | `boolean`                         | No       | `true`   | Show the `N / total` counter in the lightbox.                                                 |
| showCaption    | `boolean`                         | No       | `true`   | Show `image.caption` under the lightbox image, when present.                                  |
| previousIcon   | `Snippet`                         | No       | `-`      | Custom previous-control icon.                                                                 |
| nextIcon       | `Snippet`                         | No       | `-`      | Custom next-control icon.                                                                     |
| closeIcon      | `Snippet`                         | No       | `-`      | Custom close-control icon.                                                                    |
| editIcon       | `Snippet`                         | No       | `-`      | Custom edit-action icon.                                                                      |
| deleteIcon     | `Snippet`                         | No       | `-`      | Custom delete-action icon.                                                                    |
| itemFooter     | `Snippet<[GalleryImage, number]>` | No       | `-`      | Grid-only. Replaces the default item content entirely with custom markup below the thumbnail. |
| testId         | `string`                          | No       | `-`      | `data-pw` on the root element.                                                                |
| classes        | `string`                          | No       | `-`      | Class string on both the grid/list root and the lightbox root.                                |

Edit/delete actions are opt-in by presence: pass `onEditClick`/`onDeleteClick` to show
that action; omit either (or both) to hide it, no separate `show*` prop needed.

## Events

| Event         | Type                                         | Description                                                                   |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| onImageClick  | `(index: number, event: MouseEvent) => void` | Fires on every item click, before the lightbox opens (if enabled).            |
| onEditClick   | `(index: number, event: MouseEvent) => void` | Fires when an item's edit action is clicked. Presence shows the action.       |
| onDeleteClick | `(index: number, event: MouseEvent) => void` | Fires when an item's delete action is clicked. Presence shows the action.     |
| onOpen        | `(index: number) => void`                    | Fires when the lightbox opens.                                                |
| onDismiss     | `() => void`                                 | Fires when the lightbox closes (Escape, backdrop click, or the close button). |
| onIndexChange | `(index: number) => void`                    | Fires whenever the active lightbox image changes.                             |
| onkeydown     | `(event: KeyboardEvent) => void`             | Relays the lightbox's own keydown, before Gallery's built-in shortcuts run.   |

`onkeydown` stays lowercase per `DESIGN_PRINCIPLES.md` — it relays the real
`KeyboardEvent` from the lightbox. The rest are synthesized (index numbers, or no
payload at all) and use camelCase; `onDismiss` specifically avoids the name `onClose`
because nothing here is a native `<dialog>` element, so a lowercase `onclose` would
have implied a native-event relay this doesn't do.

## Keyboard Interactions (lightbox open)

| Key                 | Action                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `Escape`            | Close the lightbox.                                                                                 |
| `Arrow Left`        | Previous image (wraps if `loop`).                                                                   |
| `Arrow Right`       | Next image (wraps if `loop`).                                                                       |
| `Home` / `End`      | Jump to the first / last image.                                                                     |
| `Tab` / `Shift+Tab` | Cycles only through the lightbox's own controls (focus trap) — never escapes to the page behind it. |

## Accessibility

Grid/list root is `role="list"`, each item `role="listitem"`. An interactive item is a
real `<button>` with an `aria-label` describing its position and alt text. The lightbox
is `role="dialog"` `aria-modal="true"`, traps focus, restores focus to whatever opened
it on close, and locks page scroll while open. The counter is `aria-live="polite"` so
screen readers announce navigation.

## Type Reference

```ts
type GalleryView = 'grid' | 'list';
type GalleryImage = {
  src: string;
  alt: string;
  thumbnail?: string;
  fallback?: string;
  caption?: string;
};
```

## CSS Variables

Override these custom properties to theme the component. The lightbox's close/previous/next
controls and each grid/list action button are internally themed `Button` + `Icon` instances —
the variables below set their `--button-*`/`--icon-*` tokens for you, so there's nothing extra
to configure on those.

| Variable                                      | Default                                   | CSS Property                                       | Description                                                                            |
| --------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `--gallery-width`                             | `100%`                                    | width                                              | Width of the gallery root.                                                             |
| `--gallery-padding`                           | `0px`                                     | padding                                            | Padding of the gallery root.                                                           |
| `--gallery-margin`                            | `0px`                                     | margin                                             | Margin of the gallery root.                                                            |
| `--gallery-background`                        | `transparent`                             | background                                         | Background of the gallery root.                                                        |
| `--gallery-columns`                           | `3`                                       | —                                                  | Number of grid columns. Ignored if `--gallery-grid-template-columns` is set.           |
| `--gallery-grid-template-columns`             | `repeat(var(--gallery-columns, 3), 1fr)`  | grid-template-columns                              | Full override of the grid's column template.                                           |
| `--gallery-gap`                               | `8px`                                     | gap                                                | Gap between items, in both grid and list view.                                         |
| `--gallery-item-aspect-ratio`                 | `1`                                       | aspect-ratio                                       | Aspect ratio of each grid tile (ignored when an `itemFooter` snippet is used).         |
| `--gallery-item-border-radius`                | `0px`                                     | border-radius                                      | Corner rounding of each grid tile and its image.                                       |
| `--gallery-item-image-fit`                    | `cover`                                   | object-fit                                         | `object-fit` of the image inside each grid tile.                                       |
| `--gallery-item-image-transition`             | `-`                                       | transition                                         | Transition on the grid tile's image.                                                   |
| `--gallery-item-border`                       | `none`                                    | border                                             | Border on each item's clickable content.                                               |
| `--gallery-item-cursor`                       | `pointer`                                 | cursor                                             | Cursor over a clickable item (one with a click handler).                               |
| `--gallery-item-transition`                   | `-`                                       | transition                                         | Transition on a clickable item's content.                                              |
| `--gallery-item-hover-opacity`                | `1`                                       | opacity                                            | Opacity of a grid item's content on hover.                                             |
| `--gallery-item-hover-transform`              | `-`                                       | transform                                          | Transform on a grid item's content on hover.                                           |
| `--gallery-item-focus-outline`                | `2px solid currentColor`                  | outline                                            | Focus outline on a keyboard-focused item.                                              |
| `--gallery-item-focus-outline-offset`         | `2px`                                     | outline-offset                                     | Offset of the focus outline from the item.                                             |
| `--gallery-item-actions-gap`                  | `4px`                                     | gap                                                | Gap between the edit/delete action buttons.                                            |
| `--gallery-item-actions-top`                  | `8px`                                     | top                                                | Top offset of the action buttons (grid view).                                          |
| `--gallery-item-actions-right`                | `8px`                                     | right                                              | Right offset of the action buttons (grid view); right padding before them (list view). |
| `--gallery-item-action-border-radius`         | `8px`                                     | border-radius                                      | Corner rounding of each action button.                                                 |
| `--gallery-item-action-padding`               | `6px`                                     | padding                                            | Inner padding of each action button.                                                   |
| `--gallery-item-action-icon-size`             | `16px`                                    | width, height                                      | Size of each action button's icon.                                                     |
| `--gallery-item-action-background`            | `#00000066` (grid) / `transparent` (list) | background                                         | Background of an action button at rest.                                                |
| `--gallery-item-action-hover-background`      | `#00000099` (grid) / `#80808026` (list)   | background                                         | Background of an action button on hover.                                               |
| `--gallery-item-action-color`                 | `#ffffff` (grid) / `currentColor` (list)  | color                                              | Icon/text colour of an action button.                                                  |
| `--gallery-item-action-backdrop-filter`       | `blur(8px)`                               | backdrop-filter                                    | Backdrop filter behind the action buttons (grid view only).                            |
| `--gallery-list-item-border-radius`           | `0px`                                     | border-radius                                      | Corner rounding of each list row.                                                      |
| `--gallery-list-item-background`              | `transparent`                             | background                                         | Background of a list row at rest.                                                      |
| `--gallery-list-item-hover-background`        | `transparent`                             | background                                         | Background of a list row on hover (only when the row is clickable).                    |
| `--gallery-list-item-gap`                     | `12px`                                    | gap                                                | Gap between a list row's thumbnail and its text.                                       |
| `--gallery-list-item-padding`                 | `8px`                                     | padding                                            | Inner padding of a list row's clickable content.                                       |
| `--gallery-list-thumbnail-width`              | `56px`                                    | width                                              | Width of the list-row thumbnail.                                                       |
| `--gallery-list-thumbnail-height`             | `56px`                                    | height                                             | Height of the list-row thumbnail.                                                      |
| `--gallery-list-thumbnail-fit`                | `cover`                                   | object-fit                                         | `object-fit` of the list-row thumbnail.                                                |
| `--gallery-list-thumbnail-border-radius`      | `0px`                                     | border-radius                                      | Corner rounding of the list-row thumbnail.                                             |
| `--gallery-list-text-gap`                     | `2px`                                     | gap                                                | Gap between a list row's title and caption.                                            |
| `--gallery-list-title-color`                  | `inherit`                                 | color                                              | Colour of a list row's title.                                                          |
| `--gallery-list-title-font-size`              | `14px`                                    | font-size                                          | Font size of a list row's title.                                                       |
| `--gallery-list-title-font-weight`            | `500`                                     | font-weight                                        | Font weight of a list row's title.                                                     |
| `--gallery-list-title-font-family`            | `-`                                       | font-family                                        | Font family of a list row's title.                                                     |
| `--gallery-list-caption-color`                | `inherit`                                 | color                                              | Colour of a list row's caption.                                                        |
| `--gallery-list-caption-font-size`            | `12px`                                    | font-size                                          | Font size of a list row's caption.                                                     |
| `--gallery-list-caption-font-family`          | `-`                                       | font-family                                        | Font family of a list row's caption.                                                   |
| `--gallery-lightbox-z-index`                  | `15`                                      | z-index                                            | Stacking order of the lightbox overlay.                                                |
| `--gallery-lightbox-background`               | `#000000e6`                               | background                                         | Background of the lightbox overlay.                                                    |
| `--gallery-lightbox-image-width`              | `85vw`                                    | width                                              | Width of the lightbox image (and max-width of its caption).                            |
| `--gallery-lightbox-image-height`             | `75vh`                                    | height                                             | Height of the lightbox image.                                                          |
| `--gallery-lightbox-image-fit`                | `contain`                                 | object-fit                                         | `object-fit` of the lightbox image.                                                    |
| `--gallery-lightbox-image-border-radius`      | `0px`                                     | border-radius                                      | Corner rounding of the lightbox image.                                                 |
| `--gallery-lightbox-caption-gap`              | `12px`                                    | gap                                                | Gap between the lightbox image and its caption.                                        |
| `--gallery-lightbox-caption-color`            | `#ffffff`                                 | color                                              | Colour of the lightbox caption text.                                                   |
| `--gallery-lightbox-caption-font-size`        | `14px`                                    | font-size                                          | Font size of the lightbox caption text.                                                |
| `--gallery-lightbox-caption-font-family`      | `-`                                       | font-family                                        | Font family of the lightbox caption text.                                              |
| `--gallery-lightbox-counter-bottom`           | `16px`                                    | bottom                                             | Bottom offset of the "N / total" counter.                                              |
| `--gallery-lightbox-counter-color`            | `#ffffff`                                 | color                                              | Colour of the counter text.                                                            |
| `--gallery-lightbox-counter-font-size`        | `13px`                                    | font-size                                          | Font size of the counter text.                                                         |
| `--gallery-lightbox-counter-font-family`      | `-`                                       | font-family                                        | Font family of the counter text.                                                       |
| `--gallery-lightbox-control-background`       | `transparent`                             | color (via `--button-color`)                       | Background of the close/previous/next buttons at rest.                                 |
| `--gallery-lightbox-control-color`            | `#ffffff`                                 | color (via `--button-text-color`)                  | Icon colour of the close/previous/next buttons.                                        |
| `--gallery-lightbox-control-hover-background` | `#ffffff1f`                               | color (via `--button-hover-color`)                 | Background of the close/previous/next buttons on hover.                                |
| `--gallery-lightbox-control-padding`          | `8px`                                     | padding (via `--button-padding`)                   | Padding of the close/previous/next buttons.                                            |
| `--gallery-lightbox-control-border-radius`    | `50%`                                     | border-radius (via `--button-border-radius`)       | Corner rounding of the close/previous/next buttons.                                    |
| `--gallery-lightbox-control-icon-size`        | `24px`                                    | width, height (via `--icon-width`/`--icon-height`) | Icon size of the close/previous/next buttons.                                          |
| `--gallery-lightbox-close-top`                | `16px`                                    | top                                                | Top offset of the close button.                                                        |
| `--gallery-lightbox-close-right`              | `16px`                                    | right                                              | Right offset of the close button.                                                      |
| `--gallery-lightbox-nav-inset`                | `16px`                                    | left / right                                       | Left offset of the previous button; right offset of the next button.                   |

## Web Component

Tag: `<sui-gallery>`

```html
<sui-gallery view="grid" enable-lightbox></sui-gallery>
```

Set `.images` and any event handlers via JavaScript.
