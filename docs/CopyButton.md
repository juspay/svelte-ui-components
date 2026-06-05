# CopyButton

An icon button that copies a string to the clipboard and shows a transient confirmation. On click it writes `textToCopy` to the clipboard (using the async Clipboard API, falling back to `document.execCommand('copy')` in insecure contexts), swaps its icon to a checkmark for `feedbackDuration` ms, announces the result via an `aria-live` region, and fires `onCopy`. The default copy and checkmark icons inherit the current text color (`currentColor`) and can be overridden via the `icon` and `copiedIcon` snippets. Theme it with the `--copy-button-*` CSS variables.

## Usage

```svelte
<script>
  import { CopyButton } from '@juspay/svelte-ui-components';
</script>

<!-- Minimal: copy a value -->
<CopyButton textToCopy="order_12345" />

<!-- With a callback and custom labels -->
<CopyButton
  textToCopy={order.id}
  copiedLabel="Order ID copied"
  testId="copy-order-id"
  onCopy={(text, success) => console.log(success ? 'copied' : 'failed', text)}
/>
```

### Custom icon

```svelte
<CopyButton textToCopy={value}>
  {#snippet icon()}
    <MyCopyGlyph />
  {/snippet}
</CopyButton>
```

## Props

| Prop             | Type      | Required | Default               | Description                                                                                    |
| ---------------- | --------- | -------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| textToCopy       | `string`  | No       | `''`                  | The text written to the clipboard when the button is clicked.                                  |
| copiedLabel      | `string`  | No       | `'Copied'`            | Announced (and available to a `copiedIcon`) after a successful copy.                           |
| failedLabel      | `string`  | No       | `'Copy failed'`       | Announced after a failed copy.                                                                 |
| ariaLabel        | `string`  | No       | `'Copy to clipboard'` | `aria-label` for the button in its idle state.                                                 |
| feedbackDuration | `number`  | No       | `2000`                | How long (ms) the copied/failed state is shown before reverting to idle.                       |
| disabled         | `boolean` | No       | `false`               | Disables the button.                                                                           |
| icon             | `Snippet` | No       | built-in copy icon    | Overrides the default copy icon.                                                               |
| copiedIcon       | `Snippet` | No       | built-in checkmark    | Overrides the default success (checkmark) icon.                                                |
| testId           | `string`  | No       | -                     | Value for the `data-pw` attribute on the button, used for end-to-end testing selectors.        |
| classes          | `string`  | No       | -                     | CSS class string appended to the button. Useful for theming via CSS-variable-defining classes. |

## Events

| Event  | Type                                       | Description                                                                |
| ------ | ------------------------------------------ | -------------------------------------------------------------------------- |
| onCopy | `(text: string, success: boolean) => void` | Fires after every copy attempt with the copied text and whether it worked. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default               | CSS Property       | Description                           |
| --------------------------------- | --------------------- | ------------------ | ------------------------------------- |
| --copy-button-padding             | `4px`                 | padding            | Padding around the icon.              |
| --copy-button-border              | `none`                | border             | Button border.                        |
| --copy-button-border-radius       | `6px`                 | border-radius      | Corner radius.                        |
| --copy-button-background          | `transparent`         | background         | Idle background.                      |
| --copy-button-hover-background    | `rgba(0, 0, 0, 0.06)` | background (hover) | Hover background (non-disabled).      |
| --copy-button-color               | `currentColor`        | color              | Idle icon color.                      |
| --copy-button-copied-color        | `currentColor`        | color (copied)     | Icon color in the copied state.       |
| --copy-button-failed-color        | `currentColor`        | color (failed)     | Icon color in the failed state.       |
| --copy-button-icon-size           | `16px`                | width / height     | Icon box size.                        |
| --copy-button-disabled-opacity    | `0.5`                 | opacity (disabled) | Opacity when disabled.                |
| --copy-button-transition-duration | `0.15s`               | transition         | Background/color transition duration. |
