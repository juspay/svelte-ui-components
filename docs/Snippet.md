# Snippet

A copyable command-line code snippet with a prompt prefix symbol and an inline copy-to-clipboard button. Displays a single-line command or code string in a monospace container. After copying, briefly shows "Copied!" feedback before reverting to the copy icon. Clipboard errors are silently caught (handles non-secure contexts and iframe restrictions). Ideal for CLI commands, install instructions, or any text the user needs to copy.

## Usage

```svelte
<script>
  import { Snippet } from '@juspay/svelte-ui-components';
</script>

<Snippet text="npm install @juspay/svelte-ui-components" />
```

### With Custom Copy Icon

```svelte
<Snippet text="pnpm dev">
  {#snippet copyIcon()}
    <svg>...</svg>
  {/snippet}
</Snippet>
```

## Props

| Prop           | Type      | Required | Default | Description                                                                                                                                                            |
| -------------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text           | `string`  | Yes      | `-`     | The code or command string displayed in the snippet. This is the value copied to the clipboard.                                                                        |
| prompt         | `string`  | No       | `$`     | The prefix symbol shown before the text (e.g. '$', '>', '#'). Visually indicates a terminal prompt.                                                                    |
| showCopyButton | `boolean` | No       | `true`  | Whether to show the copy-to-clipboard button on the right side. Set to false for display-only snippets.                                                                |
| testId         | `string`  | No       | `-`     | Test identifier applied as `data-pw` attribute on the container for Playwright selectors.                                                                              |
| classes        | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                           |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| copyIcon | `Snippet` | Custom icon for the copy button. Defaults to a built-in copy SVG. Replaced by "Copied!" text after a successful copy. |

## Events

| Event  | Type         | Description                                                                                                                     |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| oncopy | `() => void` | Fires after the text has been successfully copied to the clipboard. Use this to show custom notifications or track copy events. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default          | CSS Property  | Description                                                           |
| --------------------------------- | ---------------- | ------------- | --------------------------------------------------------------------- |
| `--snippet-gap`                   | `8px`            | gap           | Gap between the code text and the copy button.                        |
| `--snippet-background`            | `#1e1e1e`        | background    | Background color of the snippet container.                            |
| `--snippet-border`                | `1px solid #333` | border        | Border of the snippet container.                                      |
| `--snippet-border-radius`         | `6px`            | border-radius | Corner rounding of the snippet container.                             |
| `--snippet-padding`               | `12px 16px`      | padding       | Inner padding of the snippet container.                               |
| `--snippet-font-family`           | `monospace`      | font-family   | Font family for the overall snippet (prompt and text inherit this).   |
| `--snippet-font-size`             | `14px`           | font-size     | Font size for the snippet text.                                       |
| `--snippet-color`                 | `#e0e0e0`        | color         | Default text color for the snippet container.                         |
| `--snippet-margin`                | `0`              | margin        | Outer margin of the snippet container.                                |
| `--snippet-prompt-color`          | `#888`           | color         | Color of the prompt prefix symbol (e.g. '$').                         |
| `--snippet-prompt-margin-right`   | `8px`            | margin-right  | Space between the prompt symbol and the command text.                 |
| `--snippet-text-color`            | `#e0e0e0`        | color         | Color of the command/code text.                                       |
| `--snippet-text-font-family`      | `inherit`        | font-family   | Font family of the command text (inherits from container by default). |
| `--snippet-copy-background`       | `transparent`    | background    | Background color of the copy button.                                  |
| `--snippet-copy-color`            | `#888`           | color         | Icon/text color of the copy button.                                   |
| `--snippet-copy-border`           | `none`           | border        | Border of the copy button.                                            |
| `--snippet-copy-padding`          | `4px`            | padding       | Inner padding of the copy button.                                     |
| `--snippet-copy-border-radius`    | `4px`            | border-radius | Corner rounding of the copy button.                                   |
| `--snippet-copy-cursor`           | `pointer`        | cursor        | Cursor style when hovering the copy button.                           |
| `--snippet-copy-hover-background` | `#333`           | background    | Background color of the copy button on hover.                         |
| `--snippet-copy-size`             | `16px`           | width, height | Width and height of the copy icon SVG.                                |
| `--snippet-copied-color`          | `#4caf50`        | color         | Text color of the "Copied!" feedback message.                         |
| `--snippet-copied-font-size`      | `12px`           | font-size     | Font size of the "Copied!" feedback message.                          |

## Internal Dependencies

This component uses the following library components internally:

- Button (for the copy button)

## Web Component

Tag: `<sui-snippet>`

```html
<sui-snippet text="npm install @juspay/svelte-ui-components" show-copy-button>
  <svg slot="copy-icon">...</svg>
</sui-snippet>
```

### Slots

| Slot Name   | Maps to Snippet | Description                      |
| ----------- | --------------- | -------------------------------- |
| `copy-icon` | `copyIcon`      | Custom icon for the copy button. |
