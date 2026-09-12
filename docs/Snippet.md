# Snippet

A copyable command-line code snippet with a prompt prefix symbol and an inline copy-to-clipboard button. Displays a single-line command or code string in a monospace container. After copying, briefly shows "Copied!" feedback (customizable via `copiedLabel`) before reverting to the copy icon after `copyResetMs` milliseconds (default 2000). The reset timer is cleared on unmount, so navigating away mid-flash never sets state on a destroyed component. A clipboard write that fails -- denied permission, a non-secure context -- or a Clipboard API that is entirely absent (SSR, a sandboxed iframe) is reported through `onerror` rather than swallowed; the copied/success affordance never shows for that attempt, and `oncopy` does not fire. Ideal for CLI commands, install instructions, or any text the user needs to copy.

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

| Prop           | Type      | Required | Default   | Description                                                                                                                                                            |
| -------------- | --------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text           | `string`  | Yes      | `-`       | The code or command string displayed in the snippet. This is the value copied to the clipboard.                                                                        |
| prompt         | `string`  | No       | `$`       | The prefix symbol shown before the text (e.g. '$', '>', '#'). Visually indicates a terminal prompt.                                                                    |
| showCopyButton | `boolean` | No       | `true`    | Whether to show the copy-to-clipboard button on the right side. Set to false for display-only snippets.                                                                |
| testId         | `string`  | No       | `-`       | Test identifier applied as `data-pw` attribute on the container for Playwright selectors.                                                                              |
| copiedLabel    | `string`  | No       | `Copied!` | Text shown in place of the copy icon after a successful copy.                                                                                                          |
| copyResetMs    | `number`  | No       | `2000`    | Milliseconds before the copied feedback reverts to the copy icon.                                                                                                      |
| classes        | `string`  | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## The copy affordance on its own — `createCopyState`

`Snippet` couples two separable things: the copy-and-flash behaviour, and the `<code>` box with its `$`-style prompt. When you want the first without the second — a copy control beside a hostname in a settings row, a token, a URL — import the state machine directly instead of hand-rolling a lookalike:

```svelte
<script>
  import { onDestroy } from 'svelte';
  import { createCopyState, Button } from '@juspay/svelte-ui-components';

  const host = 'ssh://runner-04.internal.example.com:2222';
  const copy = createCopyState({ copyResetMs: 1500 });
  onDestroy(copy.destroy);
</script>

<code class="host">{host}</code>
<Button onclick={() => void copy.copy(host)}>
  {copy.copied ? 'Copied!' : 'Copy'}
</Button>
<span class="copy-status" role="status" aria-live="polite">
  {copy.copied ? 'Copied to clipboard' : ''}
</span>

<style>
  .copy-status {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
```

Why the example is shaped that way, since you own the presentation here and `Snippet`'s own markup is not doing it for you:

- **No `ariaLabel`.** It would override the visible text, leaving a screen-reader user hearing the label while the button reads "Copied!" (WCAG 2.5.3, Label in Name). Let the visible text be the accessible name; reach for `ariaLabel` only when the control has no visible text at all.
- **Provide a polite live region, and render it before the change.** A live region only announces when it is already in the DOM and its _text_ changes; inserting the element and its text together is what many screen-reader/browser pairs miss. Keep the visible label swapping inside the button, and put a separate, visually hidden `role="status"` sibling **outside** it that is always rendered and holds `{copy.copied ? 'Copied to clipboard' : ''}`. This is exactly what `Snippet` itself does. `createCopyState` injects no DOM: the caller owns the announcement markup.

This is the exact state machine `Snippet` itself runs on, so the single-pending-timer guarantee and the unmount cleanup come with it rather than needing to be rebuilt — which is the failure mode it exists to prevent, since a hand-rolled duplicate typically ships a bare `setTimeout` that nothing clears.

| Member       | Type                                 | Description                                                                                                                                                                  |
| ------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copied`     | `boolean` (readonly)                 | `true` from a successful copy until the reset delay elapses. Reactive — read it directly in the template.                                                                    |
| `copy(text)` | `(text: string) => Promise<boolean>` | Writes to the clipboard. Resolves `true` on success, `false` if the clipboard was unavailable or refused. **Never rejects**, so no `try`/`catch` is needed at the call site. |
| `destroy()`  | `() => void`                         | Cancels a pending reset. Call from `onDestroy`.                                                                                                                              |

| Option        | Type         | Default | Description                                                                                                                                                               |
| ------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copyResetMs` | `number`     | `2000`  | Milliseconds before `copied` reverts. A value that is not a finite number ≥ 0 — or a getter that throws — falls back to the default rather than arming an unusable timer. |
| `oncopy`      | `() => void` | `-`     | Called once per **successful** copy. Never called when the write fails.                                                                                                   |
| `onerror`     | `(reason: unknown) => void` | `-` | Called **instead of** `oncopy` when the write cannot complete — a rejection, or a Clipboard API that is absent entirely. Receives the rejection reason, or an `Error` when the API is missing. A throwing reporter is contained, exactly as `oncopy` is. |

Options are read at copy time rather than captured at creation, so a caller with reactive values passes getters — which is how `Snippet` forwards its own props:

```ts
const copy = createCopyState({
  get copyResetMs() {
    return copyResetMs;
  }
});
```

A failed write does not start or extend feedback and does not fire `oncopy` — it reports through `onerror` instead; an earlier successful copy's feedback can remain until its existing deadline. Overlapping writes are acknowledged in completion order, and each successful completion restarts the single timer. `destroy()` permanently disables the helper: later calls and pending completions return `false`, without notifications or new timers. Exceptions from `oncopy` are contained because they cannot undo a successful clipboard write.

The factory is safe to create during SSR; clipboard writes require a browser. Import it from the package's main entry. The `./wc` entry registers custom elements and exports no utilities; it does not re-export this factory. This is the existing entry-point contract, not a missing custom-element registration.

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                           |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| copyIcon | `Snippet` | Custom icon for the copy button. Defaults to a built-in copy SVG. Replaced by "Copied!" text after a successful copy. |

## Events

| Event   | Type                        | Description                                                                                                                                                                                                          |
| ------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| oncopy  | `() => void`                | Fires after the text has been successfully copied to the clipboard. Use this to show custom notifications or track copy events.                                                                                      |
| onerror | `(reason: unknown) => void` | Fires when a clipboard write fails, or when the Clipboard API is unavailable (SSR, non-secure context, sandboxed iframe), instead of `oncopy`. Receives the rejection reason, or an `Error` when the API is missing. |

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
<sui-snippet
  id="install-snippet"
  text="npm install @juspay/svelte-ui-components"
  show-copy-button
  copied-label="Copied to clipboard"
  copy-reset-ms="1500"
>
  <svg slot="copy-icon">...</svg>
</sui-snippet>
```

`oncopy` and `onerror` are callback props, not serialisable as HTML attributes -- attach them as JS properties on the element.

```js
const snippet = document.getElementById('install-snippet');
snippet.oncopy = () => console.log('copied');
snippet.onerror = (reason) => console.warn('copy failed', reason);
```

### Slots

| Slot Name   | Maps to Snippet | Description                      |
| ----------- | --------------- | -------------------------------- |
| `copy-icon` | `copyIcon`      | Custom icon for the copy button. |
