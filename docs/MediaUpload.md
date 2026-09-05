# MediaUpload

A file picker that renders a grid of thumbnail cards for staged files plus a drop tile,
with drag-and-drop, per-file validation (type/size/count), and a bindable `files` array.
Image files get a lazy-loaded data-URL thumbnail (via `Img`, with a `Shimmer` placeholder
while the `FileReader` runs); non-image files get a generic file icon. Each card has a
hover-revealed remove button (`Button`). Rejections don't clear already-staged files —
only the offending selection is dropped, with a single summary error message.

## Usage

```svelte
<script>
  import { MediaUpload } from '@juspay/svelte-ui-components';

  let files = $state([]);
</script>

<MediaUpload
  bind:files
  label="Attachments"
  addText="Add files"
  hintText="PNG, JPG up to 5MB"
  accept="image/*"
  maxFileSize={5 * 1024 * 1024}
  maxLength={5}
  multiple
/>
```

## Props

| Prop          | Type                       | Required | Default     | Description                                                                 |
| ------------- | -------------------------- | -------- | ----------- | --------------------------------------------------------------------------- |
| label         | `string`                   | No       | `-`         | Header label.                                                               |
| description   | `string`                   | No       | `-`         | Helper text under the header.                                               |
| addText       | `string`                   | No       | `-`         | Primary text on the drop tile.                                              |
| hintText      | `string`                   | No       | `-`         | Secondary text on the drop tile (e.g. accepted types/size).                 |
| maxLength     | `number`                   | No       | `3`         | Maximum number of files.                                                    |
| accept        | `string`                   | No       | `'image/*'` | `<input accept>` syntax — MIME types, `.ext`, or `type/*`, comma-separated. |
| maxFileSize   | `number`                   | No       | `0`         | Max bytes per file. `0` = no limit.                                         |
| multiple      | `boolean`                  | No       | `false`     | Allow selecting/dropping more than one file at a time.                      |
| dragAndDrop   | `boolean`                  | No       | `true`      | Enable the drop-tile drag-and-drop target (picker button always works).     |
| disabled      | `boolean`                  | No       | `false`     | Hide the drop tile and remove buttons.                                      |
| showCounter   | `boolean`                  | No       | `true`      | Show the `N / maxLength` counter in the header.                             |
| showFileName  | `boolean`                  | No       | `true`      | Show each file's name on its card.                                          |
| showFileSize  | `boolean`                  | No       | `true`      | Show each file's formatted size on its card.                                |
| addIcon       | `Snippet`                  | No       | `-`         | Custom drop-tile icon. Falls back to the built-in asset.                    |
| removeIcon    | `Snippet`                  | No       | `-`         | Custom remove-button icon. Falls back to the built-in asset.                |
| fileIcon      | `Snippet`                  | No       | `-`         | Custom non-image file icon. Falls back to the built-in asset.               |
| errorMessages | `MediaUploadErrorMessages` | No       | `-`         | Override the default message per rejection reason (`type`/`size`/`max`).    |
| files         | `File[]`                   | No       | `[]`        | Bindable. The current staged file list.                                     |
| testId        | `string`                   | No       | `-`         | `data-pw` on the root element.                                              |
| classes       | `string`                   | No       | `-`         | Class string on the root element.                                           |

## Events

| Event         | Type                                           | Description                                                       |
| ------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| onchange | `(files: File[]) => void`                      | Fires whenever the staged file list changes (add or remove).      |
| onremove      | `(file: File) => void`                         | Fires when a single file is removed via its card's remove button. |
| onerror    | `(rejections: MediaUploadRejection[]) => void` | Fires when one or more files in a selection/drop fail validation. |

Named `onchange`/`onremove`/`onerror`, not `onchange`/`onremove`/`onerror`: none
of the three relay a native event object (they carry `File[]`, a single `File`, and a
custom rejection list respectively), so per `DESIGN_PRINCIPLES.md` they're synthesized
events and use camelCase — `onchange`/`onerror` in particular would have implied native
`Event`/`ErrorEvent` payloads they don't actually carry.

## Accessibility

The drop tile is a `<label>` wrapping a visually-hidden native `<input type="file">`, so
it's keyboard-operable and screen-reader-announced via the platform's own file-picker
semantics — no custom ARIA needed for the picker itself. Each remove button is a real
`Button` with a `Remove {filename}` `ariaLabel`, focusable and keyboard-operable
independent of hover. Rejections surface as `role="alert"` so assistive tech announces
them immediately.

## Type Reference

```ts
type MediaUploadItem = { file: File; src: string; name: string; size: number; isImage: boolean };
type MediaUploadRejectionReason = 'type' | 'size' | 'max';
type MediaUploadRejection = { file: File; reason: MediaUploadRejectionReason };
type MediaUploadErrorMessages = { type?: string; size?: string; max?: string };
```

## CSS Variables

Override these custom properties to theme the component.

| Variable                                       | Default                                                                  | CSS Property     | Description                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------- |
| `--media-upload-width`                         | `fit-content`                                                            | width            | Width of the root container.                                          |
| `--media-upload-font-family`                   | `inherit`                                                                | font-family      | Font family for the root container.                                   |
| `--media-upload-color`                         | `inherit`                                                                | color            | Base text color for the root container.                               |
| `--media-upload-disabled-opacity`              | `0.55`                                                                   | opacity          | Opacity of the whole component when `disabled` is true.               |
| `--media-upload-header-gap`                    | `12px`                                                                   | gap              | Gap between the label and the counter in the header row.              |
| `--media-upload-label-margin`                  | `0 0 4px 0`                                                              | margin           | Margin below the header row.                                          |
| `--media-upload-label-font-size`               | `14px`                                                                   | font-size        | Font size of the `label` text.                                        |
| `--media-upload-label-font-weight`             | `600`                                                                    | font-weight      | Font weight of the `label` text.                                      |
| `--media-upload-label-color`                   | `#242833`                                                                | color            | Color of the `label` text.                                            |
| `--media-upload-counter-font-size`             | `12px`                                                                   | font-size        | Font size of the `N / maxLength` counter.                             |
| `--media-upload-counter-font-weight`           | `500`                                                                    | font-weight      | Font weight of the counter.                                           |
| `--media-upload-counter-color`                 | `#8a8f98`                                                                | color            | Color of the counter text.                                            |
| `--media-upload-description-font-size`         | `12px`                                                                   | font-size        | Font size of the `description` text.                                  |
| `--media-upload-description-color`             | `#656565`                                                                | color            | Color of the `description` text.                                      |
| `--media-upload-description-margin`            | `0`                                                                      | margin           | Margin around the `description` text.                                 |
| `--media-upload-gap`                           | `12px`                                                                   | gap              | Gap between file cards and the drop tile in the grid.                 |
| `--media-upload-content-margin`                | `12px 0 0 0`                                                             | margin           | Margin above the grid, below the header/description.                  |
| `--media-upload-item-height`                   | `110px`                                                                  | height           | Height of every file card and the drop tile.                          |
| `--media-upload-item-width`                    | `110px`                                                                  | width            | Width of every file card and the drop tile.                           |
| `--media-upload-item-border-radius`            | `14px`                                                                   | border-radius    | Corner rounding of every file card and the drop tile.                 |
| `--media-upload-item-border`                   | `1px solid #e4e4e7`                                                      | border           | Border of a file card.                                                |
| `--media-upload-item-background-color`         | `#fafafa`                                                                | background-color | Background color of a file card.                                      |
| `--media-upload-item-box-shadow`               | `0 1px 2px rgba(0, 0, 0, 0.06)`                                          | box-shadow       | Box shadow of a file card at rest.                                    |
| `--media-upload-item-transition`               | `box-shadow 0.2s ease, transform 0.2s ease`                              | transition       | Transition for a file card's hover box-shadow and transform.          |
| `--media-upload-item-hover-box-shadow`         | `0 6px 18px rgba(0, 0, 0, 0.14)`                                         | box-shadow       | Box shadow of a file card on hover.                                   |
| `--media-upload-item-hover-transform`          | `translateY(-2px)`                                                       | transform        | Transform of a file card on hover (the lift effect).                  |
| `--media-upload-item-object-fit`               | `cover`                                                                  | object-fit       | How an image thumbnail (via `Img`) fits its card.                     |
| `--media-upload-file-icon-color`               | `#8a8f98`                                                                | color            | Color of the generic file icon shown for non-image files.             |
| `--media-upload-file-icon-size`                | `36px`                                                                   | height / width   | Size of the generic file icon.                                        |
| `--media-upload-meta-padding`                  | `6px 8px`                                                                | padding          | Padding of the filename/size overlay strip.                           |
| `--media-upload-meta-background`               | `linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0))`         | background       | Background of the filename/size overlay on an image card.             |
| `--media-upload-meta-color`                    | `#ffffff`                                                                | color            | Text color of the filename/size overlay on an image card.             |
| `--media-upload-file-meta-background`          | `transparent`                                                            | background       | Background of the filename/size row on a non-image (file) card.       |
| `--media-upload-file-meta-color`               | `#52525b`                                                                | color            | Text color of the filename/size row on a non-image (file) card.       |
| `--media-upload-meta-name-font-size`           | `11px`                                                                   | font-size        | Font size of the filename text.                                       |
| `--media-upload-meta-name-font-weight`         | `500`                                                                    | font-weight      | Font weight of the filename text.                                     |
| `--media-upload-meta-size-font-size`           | `10px`                                                                   | font-size        | Font size of the file-size text.                                      |
| `--media-upload-meta-size-opacity`             | `0.85`                                                                   | opacity          | Opacity of the file-size text.                                        |
| `--media-upload-remove-inset`                  | `6px`                                                                    | top / right      | Distance of the remove button from the card's top-right corner.       |
| `--media-upload-remove-opacity`                | `0`                                                                      | opacity          | Opacity of the remove button at rest (revealed on hover/focus).       |
| `--media-upload-remove-transition`             | `opacity 0.18s ease`                                                     | transition       | Transition for the remove button's opacity reveal.                    |
| `--media-upload-remove-size`                   | `24px`                                                                   | width / height   | Diameter of the circular remove button (bridged to `Button`).         |
| `--media-upload-remove-padding`                | `4px`                                                                    | padding          | Inner padding of the remove button (bridged to `Button`).             |
| `--media-upload-remove-border`                 | `none`                                                                   | border           | Border of the remove button (bridged to `Button`).                    |
| `--media-upload-remove-border-radius`          | `50%`                                                                    | border-radius    | Corner rounding of the remove button — circular by default.           |
| `--media-upload-remove-background-color`       | `rgba(0, 0, 0, 0.55)`                                                    | background       | Background color of the remove button.                                |
| `--media-upload-remove-color`                  | `#ffffff`                                                                | color            | Icon color of the remove button.                                      |
| `--media-upload-remove-hover-background-color` | `rgba(0, 0, 0, 0.78)`                                                    | background       | Background color of the remove button on hover.                       |
| `--media-upload-remove-hover-color`            | `var(--media-upload-remove-color, #ffffff)`                              | color            | Icon color of the remove button on hover.                             |
| `--media-upload-remove-icon-size`              | `100%`                                                                   | height / width   | Size of the icon rendered inside the remove button.                   |
| `--media-upload-add-gap`                       | `6px`                                                                    | gap              | Gap between the icon, `addText`, and `hintText` inside the drop tile. |
| `--media-upload-add-padding`                   | `12px`                                                                   | padding          | Inner padding of the drop tile.                                       |
| `--media-upload-add-background-color`          | `#fafafa`                                                                | background-color | Background color of the drop tile at rest.                            |
| `--media-upload-add-border`                    | `1.5px dashed #c8ccd2`                                                   | border           | Border of the drop tile at rest.                                      |
| `--media-upload-add-color`                     | `#6b7280`                                                                | color            | Text/icon color of the drop tile at rest.                             |
| `--media-upload-add-transition`                | `border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease` | transition       | Transition for the drop tile's hover/dragging state changes.          |
| `--media-upload-add-hover-background-color`    | `#f1f5ff`                                                                | background-color | Background color of the drop tile on hover.                           |
| `--media-upload-add-hover-border`              | `1.5px dashed #6d8eff`                                                   | border           | Border of the drop tile on hover.                                     |
| `--media-upload-add-hover-color`               | `#3b5bdb`                                                                | color            | Text/icon color of the drop tile on hover.                            |
| `--media-upload-add-dragging-background-color` | `#e7efff`                                                                | background-color | Background color of the drop tile while a file is dragged over it.    |
| `--media-upload-add-dragging-border`           | `1.5px solid #3b5bdb`                                                    | border           | Border of the drop tile while a file is dragged over it.              |
| `--media-upload-add-dragging-color`            | `#3b5bdb`                                                                | color            | Text/icon color of the drop tile while a file is dragged over it.     |
| `--media-upload-add-icon-size`                 | `22px`                                                                   | height / width   | Size of the add icon rendered inside the drop tile.                   |
| `--media-upload-add-text-font-size`            | `11px`                                                                   | font-size        | Font size of the drop tile's `addText` label.                         |
| `--media-upload-add-text-line-height`          | `1.3`                                                                    | line-height      | Line height of the drop tile's `addText` label.                       |
| `--media-upload-add-hint-font-size`            | `10px`                                                                   | font-size        | Font size of the drop tile's `hintText`.                              |
| `--media-upload-add-hint-color`                | `#9aa0a8`                                                                | color            | Color of the drop tile's `hintText`.                                  |
| `--media-upload-error-font-size`               | `12px`                                                                   | font-size        | Font size of the error message.                                       |
| `--media-upload-error-color`                   | `#e0334b`                                                                | color            | Color of the error message.                                           |
| `--media-upload-error-margin`                  | `8px 0 0 0`                                                              | margin           | Margin above the error message.                                       |

## Web Component

Tag: `<sui-media-upload>`

```html
<sui-media-upload label="Attachments" max-length="5" multiple></sui-media-upload>
```
