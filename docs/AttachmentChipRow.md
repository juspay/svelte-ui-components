# AttachmentChipRow

The pending-attachment strip above a chat composer: image thumbnails and file tiles, each with a floating remove button, scrolling horizontally through the library `Scroller` when they overflow. Renders nothing while there are no attachments.

## Usage

```svelte
<script>
  import { AttachmentChipRow } from '@juspay/svelte-ui-components';
</script>

<AttachmentChipRow
  {images}
  {files}
  imageTooltip={(image) => image.filename ?? ''}
  onremoveimage={(id) => removeImage(id)}
  onremovefile={(id) => removeFile(id)}
/>
```

## Props

| Prop          | Type                                     | Required | Default | Description                                                                                                |
| ------------- | ---------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| images        | `AttachmentChipImage[]`                  | No       | `[]`    | `{ id, thumbnailData, filename? }` — thumbnailData is the img src.                                         |
| files         | `AttachmentChipFile[]`                   | No       | `[]`    | `{ id, filename }`.                                                                                        |
| videos        | `AttachmentChipVideo[]`                  | No       | `[]`    | `{ id, thumbnailData?, filename? }` — a poster tile with a play badge; a plain dark tile without a poster. |
| onremoveimage | `(id: string) => void`                   | No       | `-`     | Fires with the chip's id. Omit for a read-only row (no remove buttons).                                    |
| onremovefile  | `(id: string) => void`                   | No       | `-`     | Fires with the chip's id. Omit for a read-only row.                                                        |
| onremovevideo | `(id: string) => void`                   | No       | `-`     | Fires with the chip's id. Omit for a read-only row.                                                        |
| onopenimage   | `(image: AttachmentChipImage) => void`   | No       | `-`     | Makes the image tile a real button; fires on click (e.g. open a lightbox).                                 |
| onopenvideo   | `(video: AttachmentChipVideo) => void`   | No       | `-`     | Makes the video tile a real button; fires on click (e.g. play the video).                                  |
| onopenfile    | `(file: AttachmentChipFile) => void`     | No       | `-`     | Makes the file tile a real button; fires on click.                                                         |
| imageTooltip  | `(image: AttachmentChipImage) => string` | No       | `-`     | Tooltip text for an image chip.                                                                            |
| videoTooltip  | `(video: AttachmentChipVideo) => string` | No       | `-`     | Tooltip text for a video chip.                                                                             |
| removeIcon    | `Snippet`                                | No       | `-`     | Glyph inside the remove button. Built-in cross when omitted.                                               |
| fileIcon      | `Snippet`                                | No       | `-`     | Glyph on a file tile. Built-in document when omitted.                                                      |
| testId        | `string`                                 | No       | `-`     | On the Scroller; chips get `-image-<id>` / `-file-<id>`.                                                   |
| classes       | `string`                                 | No       | `-`     | Class string passed through to the Scroller.                                                               |

## CSS Variables

| Variable                                         | Default                                   | Description                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--attachment-chip-row-gap`                      | `0.5rem`                                  | Gap between chips.                                                                                                                                         |
| `--attachment-chip-row-chip-size`                | `4.5rem`                                  | Chip width and height.                                                                                                                                     |
| `--attachment-chip-row-chip-border-radius`       | `0.5rem`                                  | Chip corner rounding.                                                                                                                                      |
| `--attachment-chip-row-chip-background`          | `#ffffff`                                 | Chip background.                                                                                                                                           |
| `--attachment-chip-row-chip-padding-top`         | `0.25rem`                                 | Headroom for the remove button.                                                                                                                            |
| `--attachment-chip-row-remove-size`              | `1.25rem` (`1.125rem` <768px)             | Remove button size.                                                                                                                                        |
| `--attachment-chip-row-remove-offset`            | `0`                                       | Remove button inset from the chip's padded corner — the chip's own top/right padding hosts the straddle, so a clipping ancestor never cuts the button off. |
| `--attachment-chip-row-chip-padding-right`       | `0.25rem`                                 | Right padding the remove button straddles into.                                                                                                            |
| `--attachment-chip-row-remove-background`        | `#18181b`                                 | Remove button disc color (self-contained — readable on both themes).                                                                                       |
| `--attachment-chip-row-remove-color`             | `#ffffff`                                 | Remove glyph color.                                                                                                                                        |
| `--attachment-chip-row-remove-hover-background`  | `#3f3f46`                                 | Remove button hover disc.                                                                                                                                  |
| `--attachment-chip-row-thumb-img-width`          | `100%`                                    | Width of an image chip's thumbnail `<img>`.                                                                                                                |
| `--attachment-chip-row-thumb-img-height`         | `100%`                                    | Height of an image chip's thumbnail `<img>`.                                                                                                               |
| `--attachment-chip-row-thumb-img-fit`            | `cover`                                   | `object-fit` of an image chip's thumbnail `<img>`.                                                                                                         |
| `--attachment-chip-row-file-tile-gap`            | `0.25rem`                                 | Gap between the glyph and filename inside a file tile.                                                                                                     |
| `--attachment-chip-row-file-tile-padding`        | `0.25rem 2px`                             | Padding inside a file tile.                                                                                                                                |
| `--attachment-chip-row-file-tile-box-shadow`     | `0 2px 0.25rem rgb(0 0 0 / 10%)`          | Box shadow on a file tile.                                                                                                                                 |
| `--attachment-chip-row-file-name-font-weight`    | `400`                                     | Font weight of a file chip's filename text.                                                                                                                |
| `--attachment-chip-row-file-name-letter-spacing` | `normal`                                  | Letter spacing of a file chip's filename text.                                                                                                             |
| `--attachment-chip-row-file-name-line-height`    | `1.25rem`                                 | Line height of a file chip's filename text.                                                                                                                |
| `--attachment-chip-row-remove-ring`              | `1.5px solid #ffffff`                     | Ring separating the disc from the thumbnail beneath.                                                                                                       |
| `--attachment-chip-row-remove-box-shadow`        | `0 1px 3px rgb(0 0 0 / 30%)`              | Remove button shadow.                                                                                                                                      |
| `--attachment-chip-row-video-tile-background`    | `#18181b`                                 | Video tile ground (behind/without a poster).                                                                                                               |
| `--attachment-chip-row-play-glyph-size`          | `1.25rem`                                 | Play badge glyph size.                                                                                                                                     |
| `--attachment-chip-row-play-glyph-color`         | `#ffffff`                                 | Play badge glyph color.                                                                                                                                    |
| `--attachment-chip-row-play-glyph-shadow`        | `drop-shadow(0 1px 2px rgb(0 0 0 / 45%))` | Play badge legibility shadow over bright posters.                                                                                                          |
| `--attachment-chip-row-remove-border-radius`     | `999px`                                   | Remove button rounding.                                                                                                                                    |
| `--attachment-chip-row-remove-glyph-size`        | `0.625rem`                                | Built-in cross size.                                                                                                                                       |
| `--attachment-chip-row-file-tile-background`     | `#ededed`                                 | File tile background.                                                                                                                                      |
| `--attachment-chip-row-file-tile-border`         | `1px solid #e1e1e1`                       | File tile border.                                                                                                                                          |
| `--attachment-chip-row-file-glyph-size`          | `1.5rem`                                  | Built-in document glyph size.                                                                                                                              |
| `--attachment-chip-row-file-glyph-color`         | `#858585`                                 | Built-in document glyph color.                                                                                                                             |
| `--attachment-chip-row-file-glyph-fold-color`    | `#ffffff`                                 | Built-in document glyph fold (page-corner) color.                                                                                                          |
| `--attachment-chip-row-file-name-font-size`      | `0.75rem`                                 | Filename font size.                                                                                                                                        |
| `--attachment-chip-row-file-name-color`          | `#52525b`                                 | Filename color.                                                                                                                                            |
