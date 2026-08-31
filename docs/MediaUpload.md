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

| Prop          | Type                      | Required | Default    | Description                                                                |
| ------------- | -------------------------- | -------- | ---------- | ---------------------------------------------------------------------------|
| label         | `string`                  | No       | `-`        | Header label.                                                              |
| description   | `string`                  | No       | `-`        | Helper text under the header.                                             |
| addText       | `string`                  | No       | `-`        | Primary text on the drop tile.                                            |
| hintText      | `string`                  | No       | `-`        | Secondary text on the drop tile (e.g. accepted types/size).                |
| maxLength     | `number`                  | No       | `3`        | Maximum number of files.                                                  |
| accept        | `string`                  | No       | `'image/*'`| `<input accept>` syntax — MIME types, `.ext`, or `type/*`, comma-separated.|
| maxFileSize   | `number`                  | No       | `0`        | Max bytes per file. `0` = no limit.                                       |
| multiple      | `boolean`                 | No       | `false`    | Allow selecting/dropping more than one file at a time.                    |
| dragAndDrop   | `boolean`                 | No       | `true`     | Enable the drop-tile drag-and-drop target (picker button always works).   |
| disabled      | `boolean`                 | No       | `false`    | Hide the drop tile and remove buttons.                                    |
| showCounter   | `boolean`                 | No       | `true`     | Show the `N / maxLength` counter in the header.                           |
| showFileName  | `boolean`                 | No       | `true`     | Show each file's name on its card.                                        |
| showFileSize  | `boolean`                 | No       | `true`     | Show each file's formatted size on its card.                              |
| addIcon       | `Snippet`                 | No       | `-`        | Custom drop-tile icon. Falls back to the built-in asset.                  |
| removeIcon    | `Snippet`                 | No       | `-`        | Custom remove-button icon. Falls back to the built-in asset.              |
| fileIcon      | `Snippet`                 | No       | `-`        | Custom non-image file icon. Falls back to the built-in asset.             |
| errorMessages | `MediaUploadErrorMessages`| No       | `-`        | Override the default message per rejection reason (`type`/`size`/`max`).  |
| files         | `File[]`                  | No       | `[]`       | Bindable. The current staged file list.                                   |
| testId        | `string`                  | No       | `-`        | `data-pw` on the root element.                                            |
| classes       | `string`                  | No       | `-`        | Class string on the root element.                                        |

## Events

| Event         | Type                                        | Description                                                    |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------|
| onFilesChange | `(files: File[]) => void`                   | Fires whenever the staged file list changes (add or remove).   |
| onRemove      | `(file: File) => void`                      | Fires when a single file is removed via its card's remove button. |
| onRejected    | `(rejections: MediaUploadRejection[]) => void` | Fires when one or more files in a selection/drop fail validation. |

Named `onFilesChange`/`onRemove`/`onRejected`, not `onchange`/`onremove`/`onerror`: none
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

Namespaced `--media-upload-*`, covering layout (`width`, `gap`, item `height`/`width`/
`border-radius`), the label/counter/description text, per-card appearance (`border`,
`background-color`, `box-shadow`, hover state), the metadata overlay, the remove button
(bridged to `Button`'s own `--button-*` variables), the drop tile (idle/hover/dragging
states), and the error message. See `MediaUpload.svelte`'s `<style>` block for the full,
exhaustive list with defaults.

## Web Component

Tag: `<sui-media-upload>`

```html
<sui-media-upload label="Attachments" max-length="5" multiple></sui-media-upload>
```
