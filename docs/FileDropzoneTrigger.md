# FileDropzoneTrigger

The visual body for a `FileInput` trigger snippet — an icon plus heading and optional caption, built on the library's own `Img` (and, where it owns the action, `Button`). It owns appearance only; it does not talk to the file system itself. Pair it with `FileInput`'s `trigger` snippet to get a ready-made dropzone or an inline compact picker without hand-rolling the icon/heading/caption markup at every call site.

**One control per upload action.** Inside a default `FileInput` the drop region is the control (one Tab stop; Enter, Space and a click open the chooser), so the trigger renders as plain content there — the same button-styled surface, no inner `<button>`. A real `Button` is rendered only when this trigger is given an `onclick` and no `FileInput` region already owns the action: standalone, or under `<FileInput activation="trigger">`. Because the region is the control, it is also what shows keyboard focus: `FileInput` draws the ring around the whole dropzone (`--file-input-focus-outline`), so this trigger needs no focus styling of its own there.

## Usage

Non-compact, paired with `FileInput` inside its `trigger` snippet. The region around it opens the chooser, so there is nothing to wire:

```svelte
<script>
  import { FileInput, FileDropzoneTrigger } from '@juspay/svelte-ui-components';
  import uploadIcon from './upload-icon.svg';
</script>

<FileInput accept=".webp,.png,.jpg" onfiles={(files) => console.log(files)}>
  {#snippet trigger()}
    <FileDropzoneTrigger
      icon={uploadIcon}
      heading="Update logo"
      caption=".webp"
      testId="update-logo"
    />
  {/snippet}
</FileInput>
```

The trigger owning the action instead, with a real button (`FileInput` hands ownership over, so its region is not a second control):

```svelte
<FileInput activation="trigger" accept=".webp,.png,.jpg" onfiles={(files) => console.log(files)}>
  {#snippet trigger({ openFilePicker })}
    <FileDropzoneTrigger
      icon={uploadIcon}
      heading="Update logo"
      caption=".webp"
      onclick={openFilePicker}
    />
  {/snippet}
</FileInput>
```

Compact, for inline/dense placements (never a button — it relies on `FileInput`'s own whole-area click/drop handling):

```svelte
<script>
  import { FileInput, FileDropzoneTrigger } from '@juspay/svelte-ui-components';
  import uploadIcon from './upload-icon.svg';
</script>

<FileInput accept="image/*" onfiles={(files) => console.log(files)}>
  {#snippet trigger()}
    <FileDropzoneTrigger
      icon={uploadIcon}
      heading="Choose image"
      compact
      testId="jsonform-file-trigger-image"
    />
  {/snippet}
</FileInput>
```

## Props

| Prop    | Type         | Required | Default | Description                                                                                                                                                                                                                                                                                                         |
| ------- | ------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon    | `string`     | Yes      | —       | Upload icon asset, rendered through the library `Img` component.                                                                                                                                                                                                                                                    |
| heading | `string`     | Yes      | —       | Primary call-to-action text (static copy, or a dynamic file name once selected).                                                                                                                                                                                                                                    |
| caption | `string`     | No       | —       | Secondary line below the heading (accepted file type / size limit). Non-compact only — ignored in the compact layout.                                                                                                                                                                                               |
| compact | `boolean`    | No       | `false` | Renders a bare icon-sm + heading with no `Button` wrapper or caption, for inline/dense trigger placements.                                                                                                                                                                                                          |
| onclick | `() => void` | No       | —       | Makes the non-compact trigger a real `Button` that owns the action — standalone, or under `<FileInput activation="trigger">` with `onclick={openFilePicker}`. Inside a default `FileInput` the region owns the action, the trigger renders as plain content and this is not called. Compact never renders a button. |
| testId  | `string`     | No       | —       | Non-compact: forwarded to the `Button` when one is rendered, otherwise set on the non-interactive surface (emits `data-pw` + `testID`). Compact: applied to the heading `<span>` (emits `data-pw` + `testID`).                                                                                                      |
| classes | `string`     | No       | —       | CSS class applied to the root element — the `Button` or the non-interactive surface in non-compact, the icon+heading wrapper in compact. Use to set the CSS variables below.                                                                                                                                        |

## CSS Variables

Override these custom properties (e.g. via the `classes` prop) to theme the trigger.

| Variable                                         | Default   | CSS Property   | Description                                                                       |
| ------------------------------------------------ | --------- | -------------- | --------------------------------------------------------------------------------- |
| `--file-dropzone-trigger-compact-flex-direction` | `row`     | flex-direction | Layout direction of the compact icon+heading row.                                 |
| `--file-dropzone-trigger-compact-align-items`    | `center`  | align-items    | Cross-axis alignment of the compact row.                                          |
| `--file-dropzone-trigger-compact-gap`            | `8px`     | gap            | Gap between the icon and heading in the compact row.                              |
| `--file-dropzone-trigger-icon-sm-size`           | `16px`    | width, height  | Icon size in the compact variant.                                                 |
| `--file-dropzone-trigger-icon-size`              | `24px`    | width, height  | Icon size in the non-compact variant.                                             |
| `--file-dropzone-trigger-icon-color`             | `inherit` | color          | Colour of the icon, in both variants.                                             |
| `--file-dropzone-trigger-heading-color`          | `inherit` | color          | Heading text color, both variants.                                                |
| `--file-dropzone-trigger-heading-font-weight`    | `600`     | font-weight    | Heading font weight, both variants.                                               |
| `--file-dropzone-trigger-heading-margin`         | `0`       | margin         | Margin on the heading's wrapping `<p>` (non-compact only).                        |
| `--file-dropzone-trigger-caption-margin`         | `0`       | margin         | Margin on the caption `<p>`.                                                      |
| `--file-dropzone-trigger-caption-color`          | `#64748b` | color          | Caption text color — set this to mute/tint the caption instead of a boolean prop. |
| `--file-dropzone-trigger-caption-font-size`      | `0.85em`  | font-size      | Caption font size, relative to the heading.                                       |

### Muted caption recipe

There is no `mutedCaption` boolean — pure appearance concerns are exposed as CSS variables instead. To mute the caption to a tertiary tone:

```svelte
<FileDropzoneTrigger
  icon={uploadIcon}
  heading="Click to upload or drag and drop"
  caption="CSV (max. 10MB)"
  classes="upload-trigger-muted"
/>

<style>
  :global(.upload-trigger-muted) {
    --file-dropzone-trigger-caption-color: var(--text-color-tertiary, #64748b);
  }
</style>
```

## Web Component

Tag: `<sui-file-dropzone-trigger>` — attributes `icon`, `heading`, `caption`, `compact`, `test-id` and `classes`. Put it inside `<sui-file-input>` with `slot="trigger"` and the drop region owns the action. The element cannot see the region's Svelte context, but without an `onclick` it renders the non-interactive surface anyway, so there is still one Tab stop. `onclick` collides with the native `HTMLElement.onclick`, so it stays a callback-only property; assigning one makes the element a real `Button` that owns the action, which is only what you want standalone.
