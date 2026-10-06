# FileInput

A primitive file-input region that wires drag-and-drop, keyboard access, MIME/extension filtering, and size validation. All visual content is supplied by the consumer through the `trigger` snippet — the component owns only behaviour, not appearance.

## One control per upload action

The drop region **is** the control. It is a single `role="button"` Tab stop, named from the text of your `trigger` content, and Enter, Space or a click anywhere inside it opens the file chooser. Put plain content in the snippet — text, an icon, a card — **not** a `<button>`, a link or an input. A button inside the region is a second Tab stop and a second "button" announcement for the same action (screen readers read the name twice), because a button's role does not hide its children.

The region draws its own focus ring, because it is the only thing a keyboard user can see focus on: by default `2px solid currentColor` offset by `2px`. `currentColor` follows the surrounding text colour, so the ring keeps its contrast on a light or a dark surface and in forced-colors mode, and `:focus-visible` keeps it off pointer clicks. Restyle it with `--file-input-focus-outline` and `--file-input-focus-outline-offset`; if you override it, keep at least 3:1 contrast against the surface behind the region. Under `activation="trigger"` the region takes no focus, so the control you supply is responsible for its own ring.

If you do want a real control inside — a `Button` with its own loading state, a split button — hand ownership to it with `activation="trigger"`: the region then becomes a passive drag-and-drop target with no role, no Tab stop and no click or key handling, and your control is the one Tab stop. See [Owning the action with your own control](#owning-the-action-with-your-own-control).

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
  {#snippet trigger({ dragOver })}
    <!-- Plain content. The region around it opens the chooser on click, Enter and Space. -->
    <span>{dragOver ? 'Drop files here' : 'Upload'}</span>
  {/snippet}
</FileInput>
```

## Consumer Presets

The single primitive expresses both a compact button-style and an expanded dropzone-style entirely through `classes` + CSS variables — no `variant` prop needed.

### Compact button-style

The region draws the button; the snippet is only its label. The region stays the single Tab stop.

```svelte
<script>
  import { FileInput } from '@juspay/svelte-ui-components';
</script>

<FileInput accept="image/*" onfiles={handleFiles} classes="file-input-btn">
  {#snippet trigger()}
    <span>Choose file</span>
  {/snippet}
</FileInput>

<style>
  .file-input-btn {
    --file-input-padding: 8px 14px;
    --file-input-border: 1px solid #cbd5e1;
    --file-input-radius: 6px;
    --file-input-background: #ffffff;
    --file-input-focus-outline: 2px solid #2563eb;
    --file-input-focus-outline-offset: 2px;
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
  {#snippet trigger({ dragOver })}
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

## Owning the action with your own control

Set `activation="trigger"` when the control inside `trigger` should be the single interactive element. The snippet receives `openFilePicker` to call and `describedBy` (the ids of the rendered error and info messages) to put on that control, because the region no longer carries `aria-describedby` itself. Drag and drop on the region keeps working, and the hidden native file input is unchanged.

```svelte
<script>
  import { FileInput, Button } from '@juspay/svelte-ui-components';
</script>

<FileInput activation="trigger" accept="image/*" onfiles={handleFiles}>
  {#snippet trigger({ openFilePicker, disabled })}
    <Button onclick={openFilePicker} {disabled} text="Choose file" />
  {/snippet}
</FileInput>
```

`FileDropzoneTrigger` follows the same rule automatically. Inside a default `FileInput` it renders the same surface as plain content (no inner `<button>`); it renders a real `Button` only when it is given an `onclick` and nothing around it already owns the action.

## Validity messaging

`errorMessage` and `infoMessage` are referenced by `aria-describedby` on the drop region, composed
from whichever of the two is actually rendered so the attribute never points at an id that is not
in the DOM. Unlike most fields, FileInput does **not** set `aria-invalid` — ARIA does not define
that attribute on `role="button"`, and an unsupported attribute is not a harmless extra. The error
text is instead announced through `role="alert"` on the message element itself.

```svelte
<FileInput
  errorMessage={rejectionReason}
  infoMessage="PNG or JPG, up to 5 MB."
  onerror={(msg) => (rejectionReason = msg)}
>
  {#snippet trigger()}
    <span>Upload</span>
  {/snippet}
</FileInput>
```

## Props

| Prop         | Type                                                                                                           | Required | Default    | Description                                                                                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| trigger      | `Snippet<[{ openFilePicker: () => void; dragOver: boolean; disabled: boolean; describedBy: string \| null }]>` | Yes      | —          | Content snippet. Receives the drag-over state, the disabled state, an `openFilePicker` function, and `describedBy` (the rendered message ids). Under the default `activation="region"` it must be non-interactive — the region is already the control.                          |
| activation   | `'region' \| 'trigger'`                                                                                        | No       | `'region'` | Who owns the single interactive control. `'region'`: the drop region (role button, one Tab stop, Enter/Space/click open the chooser). `'trigger'`: the control you render inside `trigger` is the one Tab stop and calls `openFilePicker`; the region is a passive drop target. |
| accept       | `string`                                                                                                       | No       | —          | Comma-separated list of accepted file types (MIME types or extensions, e.g. `"image/*,.pdf"`). Validated client-side on drop and input.                                                                                                                                         |
| multiple     | `boolean`                                                                                                      | No       | `false`    | Allow selecting more than one file at a time.                                                                                                                                                                                                                                   |
| maxSizeBytes | `number`                                                                                                       | No       | —          | Maximum allowed file size in bytes. Files exceeding this limit are rejected and reported via `onerror`.                                                                                                                                                                         |
| disabled     | `boolean`                                                                                                      | No       | `false`    | Disables all interaction. The region becomes non-focusable and drops/clicks are ignored.                                                                                                                                                                                        |
| testId       | `string`                                                                                                       | No       | —          | Sets `data-pw` on the root element. The hidden `<input>` gets `data-pw="${testId}-input"`.                                                                                                                                                                                      |
| classes      | `string`                                                                                                       | No       | —          | CSS class string applied to the root element. Use to set `--file-input-*` CSS variables for theming.                                                                                                                                                                            |
| onfiles      | `(files: File[]) => void`                                                                                      | No       | —          | Called with the accepted `File[]` after validation.                                                                                                                                                                                                                             |
| onerror      | `(message: string) => void`                                                                                    | No       | —          | Called with a human-readable error string when one or more files are rejected.                                                                                                                                                                                                  |
| errorMessage | `string \| null`                                                                                               | No       | —          | Text shown, and announced through `role="alert"`, when the control is in error. Referenced by `aria-describedby` on the drop region — see Validity messaging above.                                                                                                             |
| infoMessage  | `string \| null`                                                                                               | No       | —          | Persistent helper text describing the control. Referenced the same way, so it is read before a user trips an error rather than only after.                                                                                                                                      |
| invalid      | `boolean`                                                                                                      | No       | —          | Marks the control invalid without supplying a message. Has no visible effect on its own, since FileInput deliberately never sets `aria-invalid` — see Validity messaging above.                                                                                                 |

## CSS Variables

Override these custom properties (e.g. via the `classes` prop) to style the drop region.

| Variable                             | Default                  | CSS Property    | Description                                           |
| ------------------------------------ | ------------------------ | --------------- | ----------------------------------------------------- |
| `--file-input-display`               | `inline-flex`            | display         | Display mode of the root element.                     |
| `--file-input-flex-direction`        | `column`                 | flex-direction  | Flex direction.                                       |
| `--file-input-align-items`           | `center`                 | align-items     | Alignment of children.                                |
| `--file-input-justify-content`       | `center`                 | justify-content | Justification of children.                            |
| `--file-input-padding`               | unset                    | padding         | Inner spacing of the drop region.                     |
| `--file-input-border`                | unset                    | border          | Border shorthand.                                     |
| `--file-input-radius`                | unset                    | border-radius   | Corner rounding.                                      |
| `--file-input-background`            | unset                    | background      | Background of the drop region.                        |
| `--file-input-gap`                   | unset                    | gap             | Gap between child elements.                           |
| `--file-input-text-align`            | `center`                 | text-align      | Text alignment inside the region.                     |
| `--file-input-transition`            | unset                    | transition      | CSS transition applied to the root.                   |
| `--file-input-focus-outline`         | `2px solid currentColor` | outline         | Outline when focused via keyboard (`:focus-visible`). |
| `--file-input-focus-outline-offset`  | `2px`                    | outline-offset  | Offset of the focus outline.                          |
| `--file-input-dragover-background`   | unset                    | background      | Background when a file is dragged over.               |
| `--file-input-dragover-border-color` | unset                    | border-color    | Border colour when a file is dragged over.            |
| `--file-input-disabled-opacity`      | `0.5`                    | opacity         | Opacity when disabled.                                |
| `--file-input-disabled-cursor`       | `not-allowed`            | cursor          | Cursor when disabled.                                 |

## Web Component

Tag: `<sui-file-input>`

Because `trigger` is a Snippet prop (not serialisable as an HTML attribute), the web component exposes it as a named slot. Assigning `onfiles` and `onerror` as plain properties, as below, still works to react to accepted or rejected files. `onfiles` also dispatches a `files` DOM event with `detail` set to the same `File[]` array — `fi.addEventListener('files', (e) => console.log('accepted', e.detail))` fires too. `onerror` does not: it collides with the native `HTMLElement.onerror` handler, so it stays a callback-only property — `fi.addEventListener('error', ...)` registers without error but the handler is never called.

```html
<sui-file-input id="fi" accept="image/*" multiple></sui-file-input>
<script>
  const fi = document.getElementById('fi');
  fi.onfiles = (files) => console.log('accepted', files);
  fi.onerror = (msg) => console.warn('rejected', msg);
</script>
```

### Slots

| Slot Name | Maps to Snippet | Description                                                                                                                                                   |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger` | `trigger`       | Content rendered inside the drop region. Keep it non-interactive (text, icon, card): the region is the single control. Fallback: a plain "Choose file" label. |

The `activation` attribute also exists on the element, but slotted content cannot receive `openFilePicker` (see the note below), so `activation="trigger"` is only useful there with the fallback: leave the slot empty and the fallback becomes a real "Choose file" `<button>` that opens the picker. For your own control, use the Svelte component.

> **Svelte-only:** `trigger` (receives `FileInputSnippetProps`) takes argument, so it cannot be expressed as a named slot: a Web Component `<slot>` projects markup, it does not forward Svelte snippet parameters, so the argument above would be silently dropped. Use the Svelte component directly when you need this.
