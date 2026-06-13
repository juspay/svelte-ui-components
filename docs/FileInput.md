# FileInput

A primitive file-input region that wires drag-and-drop, keyboard access, MIME/extension filtering, and size validation. All visual content is supplied by the consumer through the `trigger` snippet — the component owns only behaviour, not appearance.

## Usage

```svelte
<script>
  import { FileInput } from '@juspay/svelte-ui-components';
</script>

<FileInput
  accept=".pdf,.docx"
  multiple
  maxSizeBytes={5_242_880}
  onfiles={(files) => console.log(files)}
  onerror={(msg) => console.error(msg)}
>
  {#snippet trigger({ openFilePicker, dragOver, disabled })}
    <!-- build whatever UI you need here -->
    <button onclick={openFilePicker} {disabled}>Upload</button>
  {/snippet}
</FileInput>
```

## Consumer Presets

The single primitive expresses both a compact button-style and an expanded dropzone-style entirely through `classes` + CSS variables — no `variant` prop needed.

### Compact button-style

```svelte
<script>
  import { FileInput, Button } from '@juspay/svelte-ui-components';
</script>

<FileInput accept="image/*" onfiles={handleFiles} classes="file-input-btn">
  {#snippet trigger({ openFilePicker, disabled })}
    <Button onclick={openFilePicker} {disabled} text="Choose file" />
  {/snippet}
</FileInput>

<style>
  .file-input-btn {
    /* Remove the drop-region shape entirely — let the Button be the only touch target */
    --file-input-display: contents;
  }
</style>
```

### Expanded dropzone-style

```svelte
<script>
  import { FileInput } from '@juspay/svelte-ui-components';
</script>

<FileInput
  accept=".pdf,.png,.jpg"
  multiple
  maxSizeBytes={10_485_760}
  onfiles={handleFiles}
  onerror={handleError}
  classes="my-dropzone"
>
  {#snippet trigger({ openFilePicker, dragOver, disabled })}
    <span class="dropzone-icon">{dragOver ? '📂' : '📁'}</span>
    <span>{dragOver ? 'Drop files here' : 'Drag & drop or click to upload'}</span>
    <span class="dropzone-hint">PDF, PNG or JPG · max 10 MB</span>
  {/snippet}
</FileInput>

<style>
  .my-dropzone {
    --file-input-padding: 32px 24px;
    --file-input-border: 2px dashed currentColor;
    --file-input-radius: 8px;
    --file-input-background: transparent;
    --file-input-dragover-background: color-mix(in srgb, currentColor 8%, transparent);
    --file-input-transition: background 0.15s ease, border-color 0.15s ease;
    --file-input-gap: 8px;
  }
</style>
```

## Props

| Prop         | Type                                                                              | Required | Default | Description                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| trigger      | `Snippet<[{ openFilePicker: () => void; dragOver: boolean; disabled: boolean }]>` | Yes      | —       | Content snippet. Receives the current drag-over state, disabled state, and an `openFilePicker` function to open the file-picker dialog. |
| accept       | `string`                                                                          | No       | —       | Comma-separated list of accepted file types (MIME types or extensions, e.g. `"image/*,.pdf"`). Validated client-side on drop and input. |
| multiple     | `boolean`                                                                         | No       | `false` | Allow selecting more than one file at a time.                                                                                           |
| maxSizeBytes | `number`                                                                          | No       | —       | Maximum allowed file size in bytes. Files exceeding this limit are rejected and reported via `onerror`.                                 |
| disabled     | `boolean`                                                                         | No       | `false` | Disables all interaction. The region becomes non-focusable and drops/clicks are ignored.                                                |
| testId       | `string`                                                                          | No       | —       | Sets `data-pw` on the root element. The hidden `<input>` gets `data-pw="${testId}-input"`.                                              |
| classes      | `string`                                                                          | No       | —       | CSS class string applied to the root element. Use to set `--file-input-*` CSS variables for theming.                                    |
| onfiles      | `(files: File[]) => void`                                                         | No       | —       | Called with the accepted `File[]` after validation.                                                                                     |
| onerror      | `(message: string) => void`                                                       | No       | —       | Called with a human-readable error string when one or more files are rejected.                                                          |

## CSS Variables

Override these custom properties (e.g. via the `classes` prop) to style the drop region.

| Variable                             | Default        | CSS Property    | Description                                             |
| ------------------------------------ | -------------- | --------------- | ------------------------------------------------------- |
| `--file-input-display`               | `inline-flex`  | display         | Display mode of the root element.                       |
| `--file-input-flex-direction`        | `column`       | flex-direction  | Flex direction.                                         |
| `--file-input-align-items`           | `center`       | align-items     | Alignment of children.                                  |
| `--file-input-justify-content`       | `center`       | justify-content | Justification of children.                              |
| `--file-input-padding`               | unset          | padding         | Inner spacing of the drop region.                       |
| `--file-input-border`                | unset          | border          | Border shorthand.                                       |
| `--file-input-radius`                | unset          | border-radius   | Corner rounding.                                        |
| `--file-input-background`            | unset          | background      | Background of the drop region.                          |
| `--file-input-gap`                   | unset          | gap             | Gap between child elements.                             |
| `--file-input-text-align`            | `center`       | text-align      | Text alignment inside the region.                       |
| `--file-input-transition`            | unset          | transition      | CSS transition applied to the root.                     |
| `--file-input-focus-outline`         | unset          | outline         | Outline when focused via keyboard.                      |
| `--file-input-focus-outline-offset`  | unset          | outline-offset  | Offset of the focus outline.                            |
| `--file-input-dragover-background`   | unset          | background      | Background when a file is dragged over.                 |
| `--file-input-dragover-border-color` | unset          | border-color    | Border colour when a file is dragged over.              |
| `--file-input-disabled-opacity`      | `0.5`          | opacity         | Opacity when disabled.                                  |
| `--file-input-disabled-cursor`       | `not-allowed`  | cursor          | Cursor when disabled.                                   |

## Web Component

Tag: `<sui-file-input>`

Because `trigger` is a Snippet prop (not serialisable as an HTML attribute), the web component exposes it as a named slot. Attach event handlers via `addEventListener` to react to accepted or rejected files.

```html
<sui-file-input id="fi" accept="image/*" multiple></sui-file-input>
<script>
  const fi = document.getElementById('fi');
  fi.onfiles = (files) => console.log('accepted', files);
  fi.onerror = (msg) => console.warn('rejected', msg);
</script>
```

### Slots

| Slot Name | Maps to Snippet | Description                                                   |
| --------- | --------------- | ------------------------------------------------------------- |
| `trigger` | `trigger`       | Drop zone or button content rendered inside the container.    |
