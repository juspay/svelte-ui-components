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
    { src: '/photos/1-full.jpg', thumbnail: '/photos/1-thumb.jpg', alt: 'Sunset', caption: 'Golden hour' },
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

| Prop            | Type                          | Required | Default  | Description                                                                    |
| ---------------- | ------------------------------ | -------- | -------- | -------------------------------------------------------------------------------|
| images           | `GalleryImage[]`              | Yes      | `-`      | The images to display.                                                        |
| view             | `'grid'\|'list'`               | No       | `'grid'` | Layout mode.                                                                   |
| open             | `boolean`                     | No       | `false`  | Bindable. Whether the lightbox is open.                                       |
| activeIndex      | `number`                      | No       | `0`      | Bindable. Index of the lightbox's current image.                              |
| enableLightbox   | `boolean`                     | No       | `true`   | Whether clicking an item opens the lightbox.                                  |
| loop             | `boolean`                     | No       | `false`  | Wrap previous/next navigation around at the ends.                             |
| showCounter      | `boolean`                     | No       | `true`   | Show the `N / total` counter in the lightbox.                                 |
| showCaption      | `boolean`                     | No       | `true`   | Show `image.caption` under the lightbox image, when present.                  |
| previousIcon     | `Snippet`                     | No       | `-`      | Custom previous-control icon.                                                 |
| nextIcon         | `Snippet`                     | No       | `-`      | Custom next-control icon.                                                     |
| closeIcon        | `Snippet`                     | No       | `-`      | Custom close-control icon.                                                    |
| editIcon         | `Snippet`                     | No       | `-`      | Custom edit-action icon.                                                      |
| deleteIcon       | `Snippet`                     | No       | `-`      | Custom delete-action icon.                                                    |
| itemFooter       | `Snippet<[GalleryImage, number]>` | No   | `-`      | Grid-only. Replaces the default item content entirely with custom markup below the thumbnail. |
| testId           | `string`                      | No       | `-`      | `data-pw` on the root element.                                                |
| classes          | `string`                      | No       | `-`      | Class string on both the grid/list root and the lightbox root.                |

Edit/delete actions are opt-in by presence: pass `onEditClick`/`onDeleteClick` to show
that action; omit either (or both) to hide it, no separate `show*` prop needed.

## Events

| Event         | Type                                            | Description                                                  |
| ------------- | -------------------------------------------------| ---------------------------------------------------------------|
| onImageClick  | `(index: number, event: MouseEvent) => void`    | Fires on every item click, before the lightbox opens (if enabled). |
| onEditClick   | `(index: number, event: MouseEvent) => void`    | Fires when an item's edit action is clicked. Presence shows the action. |
| onDeleteClick | `(index: number, event: MouseEvent) => void`    | Fires when an item's delete action is clicked. Presence shows the action. |
| onOpen        | `(index: number) => void`                       | Fires when the lightbox opens.                                |
| onDismiss     | `() => void`                                    | Fires when the lightbox closes (Escape, backdrop click, or the close button). |
| onIndexChange | `(index: number) => void`                       | Fires whenever the active lightbox image changes.             |
| onkeydown     | `(event: KeyboardEvent) => void`                | Relays the lightbox's own keydown, before Gallery's built-in shortcuts run. |

`onkeydown` stays lowercase per `DESIGN_PRINCIPLES.md` — it relays the real
`KeyboardEvent` from the lightbox. The rest are synthesized (index numbers, or no
payload at all) and use camelCase; `onDismiss` specifically avoids the name `onClose`
because nothing here is a native `<dialog>` element, so a lowercase `onclose` would
have implied a native-event relay this doesn't do.

## Keyboard Interactions (lightbox open)

| Key                     | Action                                    |
| ------------------------ | ------------------------------------------|
| `Escape`                | Close the lightbox.                       |
| `Arrow Left`            | Previous image (wraps if `loop`).         |
| `Arrow Right`           | Next image (wraps if `loop`).             |
| `Home` / `End`          | Jump to the first / last image.           |
| `Tab` / `Shift+Tab`     | Cycles only through the lightbox's own controls (focus trap) — never escapes to the page behind it. |

## Accessibility

Grid/list root is `role="list"`, each item `role="listitem"`. An interactive item is a
real `<button>` with an `aria-label` describing its position and alt text. The lightbox
is `role="dialog"` `aria-modal="true"`, traps focus, restores focus to whatever opened
it on close, and locks page scroll while open. The counter is `aria-live="polite"` so
screen readers announce navigation.

## Type Reference

```ts
type GalleryView = 'grid' | 'list';
type GalleryImage = { src: string; alt: string; thumbnail?: string; fallback?: string; caption?: string };
```

## CSS Variables

Namespaced `--gallery-*`, covering the grid (`--gallery-columns`, `--gallery-gap`,
per-item aspect ratio/border-radius/fit), the list layout (thumbnail size, text
colors/sizes), item hover/focus states, the edit/delete action buttons, and the entire
lightbox (background, image sizing, caption, counter, and the close/previous/next
controls, bridged to `Button`'s own `--button-*`/`Icon`'s `--icon-*` variables). See
`Gallery.svelte`'s `<style>` block for the full, exhaustive list with defaults.

## Web Component

Tag: `<sui-gallery>`

```html
<sui-gallery view="grid" enable-lightbox></sui-gallery>
```

Set `.images` and any event handlers via JavaScript.
