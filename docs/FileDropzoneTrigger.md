# FileDropzoneTrigger

The visual body for a `FileInput` trigger snippet — an icon plus heading and optional caption, built on the library's own `Img` and `Button`. It owns appearance only; it does not talk to the file system itself. Pair it with `FileInput`'s `trigger` snippet to get a ready-made dropzone or an inline compact picker without hand-rolling the icon/heading/caption markup at every call site.

## Usage

Non-compact, paired with `FileInput` inside its `trigger` snippet — `onclick` wires to `openFilePicker`:

```svelte
<script>
  import { FileInput, FileDropzoneTrigger } from '@juspay/svelte-ui-components';
  import uploadIcon from './upload-icon.svg';
</script>

<FileInput accept=".webp,.png,.jpg" onfiles={(files) => console.log(files)}>
  {#snippet trigger({ openFilePicker })}
    <FileDropzoneTrigger
      icon={uploadIcon}
      heading="Update logo"
      caption=".webp"
      testId="update-logo"
      onclick={openFilePicker}
    />
  {/snippet}
</FileInput>
```

Compact, for inline/dense placements (relies on `FileInput`'s own whole-area click/drop handling, so no `onclick` is wired):

```svelte
<script>
  import { FileInput, FileDropzoneTrigger } from '@juspay/svelte-ui-components';
  import uploadIcon from './upload-icon.svg';
</script>

<FileInput accept="image/*" onfiles={(files) => console.log(files)}>
  {#snippet trigger()}
    <FileDropzoneTrigger icon={uploadIcon} heading="Choose image" compact testId="jsonform-file-trigger-image" />
  {/snippet}
</FileInput>
```

## Props

| Prop    | Type         | Required | Default | Description                                                                                                                                       |
| ------- | ------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| icon    | `string`     | Yes      | —       | Upload icon asset, rendered through the library `Img` component.                                                                                 |
| heading | `string`     | Yes      | —       | Primary call-to-action text (static copy, or a dynamic file name once selected).                                                                |
| caption | `string`     | No       | —       | Secondary line below the heading (accepted file type / size limit). Non-compact only — ignored in the compact layout.                           |
| compact | `boolean`    | No       | `false` | Renders a bare icon-sm + heading with no `Button` wrapper or caption, for inline/dense trigger placements.                                       |
| onclick | `() => void` | No       | —       | Wire to `FileInput`'s `openFilePicker`. Non-compact only — compact relies on `FileInput`'s own whole-area click/drop handling.                   |
| testId  | `string`     | No       | —       | Non-compact: forwarded to the inner `Button` (emits `data-pw` + `testID`). Compact: applied to the heading `<span>` (emits `data-pw` + `testID`). |
| classes | `string`     | No       | —       | CSS class applied to the root element — the inner `Button` in non-compact, the icon+heading wrapper in compact. Use to set the CSS variables below. |

## CSS Variables

Override these custom properties (e.g. via the `classes` prop) to theme the trigger.

| Variable                                        | Default  | CSS Property   | Description                                                                    |
| ------------------------------------------------ | -------- | -------------- | -------------------------------------------------------------------------------- |
| `--file-dropzone-trigger-compact-flex-direction` | `row`    | flex-direction | Layout direction of the compact icon+heading row.                                |
| `--file-dropzone-trigger-compact-align-items`    | `center` | align-items    | Cross-axis alignment of the compact row.                                         |
| `--file-dropzone-trigger-compact-gap`            | `8px`    | gap            | Gap between the icon and heading in the compact row.                             |
| `--file-dropzone-trigger-icon-sm-size`           | `16px`   | width, height  | Icon size in the compact variant.                                                |
| `--file-dropzone-trigger-icon-size`              | `24px`   | width, height  | Icon size in the non-compact variant.                                            |
| `--file-dropzone-trigger-heading-color`          | `inherit`| color          | Heading text color, both variants.                                               |
| `--file-dropzone-trigger-heading-font-weight`    | `600`    | font-weight    | Heading font weight, both variants.                                              |
| `--file-dropzone-trigger-heading-margin`         | `0`      | margin         | Margin on the heading's wrapping `<p>` (non-compact only).                       |
| `--file-dropzone-trigger-caption-margin`         | `0`      | margin         | Margin on the caption `<p>`.                                                     |
| `--file-dropzone-trigger-caption-color`          | `#64748b`| color          | Caption text color — set this to mute/tint the caption instead of a boolean prop. |
| `--file-dropzone-trigger-caption-font-size`      | `0.85em` | font-size      | Caption font size, relative to the heading.                                      |

### Muted caption recipe

There is no `mutedCaption` boolean — pure appearance concerns are exposed as CSS variables instead. To mute the caption to a tertiary tone:

```svelte
<FileDropzoneTrigger
  icon={uploadIcon}
  heading="Click to upload or drag and drop"
  caption="CSV (max. 10MB)"
  onclick={openFilePicker}
  classes="upload-trigger-muted"
/>

<style>
  :global(.upload-trigger-muted) {
    --file-dropzone-trigger-caption-color: var(--text-color-tertiary, #64748b);
  }
</style>
```

## Web Component

None. Like `SplitInput` and `ChipInput`, this is a simple presentational component consumed directly from Svelte — it is designed to compose inside `FileInput`'s `trigger` Snippet prop, which is itself not serialisable across the Web Component boundary. Use the Svelte component directly; there is no `sui-file-dropzone-trigger` custom element.
