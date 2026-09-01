# ChatComposer

An auto-growing message input with a send button (the `Button` component). Enter submits and Shift+Enter inserts a newline (configurable via `submitOnEnter`); the send button is disabled until there is non-whitespace text or an attachment. The input clears on submit. All of the extra controls are **opt-in** — wiring a callback enables the matching button:

- `onattach` → a paperclip button that opens a file picker; picked files appear as removable chips (`Pill`) above the input and are bindable via `attachments`.
- `onvoice` → a mic button for voice input (`recording` toggles its active styling).
- `streaming` + `onstop` → the send button becomes a **stop** button while a reply streams.

Every icon falls back to a built-in asset and can be replaced with a snippet.

## Usage

```svelte
<script>
  import { ChatComposer } from '@juspay/svelte-ui-components';

  let value = $state('');
</script>

<ChatComposer bind:value placeholder="Type a message…" onsubmit={(text) => console.log(text)} />
```

### Rich attachments — built-in, opt-in

The composer renders attachments three ways, in precedence order: the `attachmentsPreview`
snippet replaces the strip entirely; otherwise non-empty `richImages`/`richVideos`/`richFiles` render the
built-in rich strip (an `AttachmentChipRow` — thumbnail tiles, per-chip remove, read-only when
no removal callback is given); otherwise raw `attachments` (`File[]`) keep the original
dismissible pill strip. Both existing paths are unchanged — the rich strip only appears when
its lists are fed:

```svelte
<ChatComposer
  bind:value
  richImages={images}
  richVideos={videos}
  richFiles={files}
  onremoverichimage={(id) => (images = images.filter((image) => image.id !== id))}
  onremoverichvideo={(id) => (videos = videos.filter((video) => video.id !== id))}
  onremoverichfile={(id) => (files = files.filter((file) => file.id !== id))}
  onsubmit={handleSend}
/>
```

## Props

| Prop                                             | Type              | Required | Default | Description                                                                                                                                                                   |
| ------------------------------------------------ | ----------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value                                            | `string`          | No       | `''`    | Bindable. The draft text.                                                                                                                                                     |
| placeholder                                      | `string`          | No       | `''`    | Input placeholder.                                                                                                                                                            |
| disabled                                         | `boolean`         | No       | `false` | Disable input and buttons.                                                                                                                                                    |
| submitOnEnter                                    | `boolean`         | No       | `true`  | Submit on Enter (Shift+Enter inserts a newline).                                                                                                                              |
| maxLength                                        | `number`          | No       | `0`     | Character cap; `0` disables the limit.                                                                                                                                        |
| streaming                                        | `boolean`         | No       | `false` | When true, the send button becomes a stop button.                                                                                                                             |
| recording                                        | `boolean`         | No       | `false` | Visual active state for the voice button.                                                                                                                                     |
| attachments                                      | `File[]`          | No       | `[]`    | Bindable. Pending attachments, shown as removable chips.                                                                                                                      |
| attachmentsPreview                               | `Snippet`         | No       | `-`     | Replaces the built-in pill strip — render a richer preview (e.g. `AttachmentChipRow`) driven by your own attachment model.                                                    |
| richImages                                       | `AttachmentChipImage[]` | No | `[]`    | Opt-in: processed image attachments for the built-in rich strip — when either rich list is non-empty the composer renders an `AttachmentChipRow` instead of the pill strip and counts the chips toward "can send". |
| richFiles                                        | `AttachmentChipFile[]`  | No | `[]`    | Processed file attachments for the built-in rich strip — see `richImages`.  |
| richVideos                                       | `AttachmentChipVideo[]` | No | `[]`    | Processed video attachments for the built-in rich strip — poster tiles with a play badge. |
| richImageTooltip                                 | `(image) => string`     | No | `-`     | Tooltip text for a rich image chip.                                         |
| richVideoTooltip                                 | `(video) => string`     | No | `-`     | Tooltip text for a rich video chip.                                         |
| richRemoveIcon                                   | `Snippet`               | No | `-`     | Glyph inside the rich chips' remove buttons.                                |
| richFileIcon                                     | `Snippet`               | No | `-`     | Glyph on a rich file chip.                                                  |
| sendable                                         | `boolean \| null` | No       | `null`  | Overrides the internal can-send calculation (text or `attachments` present); use for attachment-only sends when the model lives outside `attachments`. `disabled` still wins. |
| accept                                           | `string`          | No       | `''`    | Accepted file types for the attach button.                                                                                                                                    |
| multiple                                         | `boolean`         | No       | `false` | Allow multiple files per pick.                                                                                                                                                |
| sendLabel / stopLabel / voiceLabel / attachLabel | `string`          | No       | `…`     | Aria-labels for the buttons.                                                                                                                                                  |
| sendIcon / stopIcon / voiceIcon / attachIcon     | `Snippet`         | No       | `-`     | Custom icons; each falls back to a built-in asset.                                                                                                                            |
| actionIcon                                       | `Snippet`         | No       | `-`     | Icon for the idle action button (see `onaction`). Falls back to a built-in asset.                                                                                             |
| actionLabel                                      | `string`          | No       | `'Voice conversation'` | Aria-label for the idle action button.                                                                                                                           |
| inputAriaLabel                                   | `string`          | No       | `-`     | Aria-label on the textarea, for apps with existing accessibility contracts.                                                                                                   |
| inputTestId / sendTestId / sendSlotTestId / stopTestId / voiceTestId / attachTestId / actionTestId | `string` | No | `-` | Per-control `data-pw` overrides, for apps with existing spec contracts.                                                                       |
| leading                                          | `Snippet`         | No       | `-`     | Content before the input.                                                                                                                                                     |
| testId                                           | `string`          | No       | `-`     | `data-pw` on the root element.                                                                                                                                                |
| classes                                          | `string`          | No       | `-`     | Class string on the root element.                                                                                                                                             |

## Events

| Event     | Type                                           | Description                                               |
| --------- | ---------------------------------------------- | --------------------------------------------------------- |
| onsubmit  | `(value: string, attachments: File[]) => void` | Fires on submit with the value and pending attachments.   |
| oninput   | `(value: string, event: Event) => void`        | Fires on every input change.                              |
| onkeydown | `(event: KeyboardEvent) => void`               | Fires on key down in the input.                           |
| onstop    | `() => void`                                   | Enables the stop button. Fires when stop is pressed.      |
| onvoice   | `() => void`                                   | Enables the voice button. Fires when the mic is pressed.  |
| onattach  | `(files: File[]) => void`                      | Enables the attach button. Fires with newly picked files. |
| onattachclick | `() => void`                               | Replaces the built-in picker: the attach button fires this instead of opening a file dialog (e.g. to open your own chooser modal). |
| onremoverichimage | `(id: string) => void`                 | Remove callback for a rich image chip. Omit both rich removal callbacks to render the rich strip read-only. |
| onremoverichfile | `(id: string) => void`                  | Remove callback for a rich file chip.                                       |
| onremoverichvideo | `(id: string) => void`                 | Remove callback for a rich video chip.                                      |
| onopenrichimage | `(image) => void`                        | Makes a rich image tile clickable; fires with the attachment (lightbox seam). |
| onopenrichvideo | `(video) => void`                        | Makes a rich video tile clickable; fires with the attachment (playback seam). |
| onopenrichfile | `(file) => void`                          | Makes a rich file tile clickable; fires with the attachment.                |
| onpaste   | `(event: ClipboardEvent) => void`              | Fires on paste into the input — the paste-to-attach seam.  |
| onaction  | `() => void`                                   | Enables the idle action button, shown in the send slot while there is nothing to send, stop, or record. |

## CSS Variables

| Variable                                           | Default             | CSS Property  | Description                                     |
| -------------------------------------------------- | ------------------- | ------------- | ----------------------------------------------- |
| `--chat-composer-width`                            | `100%`              | width         | Width of the composer.                          |
| `--chat-composer-gap`                              | `8px`               | gap           | Gap between leading/input/send.                 |
| `--chat-composer-padding`                          | `8px`               | padding       | Outer padding.                                  |
| `--chat-composer-background`                       | `#ffffff`           | background    | Composer background.                            |
| `--chat-composer-border`                           | `1px solid #e4e4e7` | border        | Composer border.                                |
| `--chat-composer-border-radius`                    | `24px`              | border-radius | Composer corner rounding.                       |
| `--chat-composer-box-shadow`                       | `none`              | box-shadow    | Composer shadow.                                |
| `--chat-composer-disabled-opacity`                 | `0.6`               | opacity       | Opacity when disabled.                          |
| `--chat-composer-font-family`                      | `inherit`           | font-family   | Input font family.                              |
| `--chat-composer-font-size`                        | `0.9375rem`         | font-size     | Input font size.                                |
| `--chat-composer-font-weight`                      | `inherit`           | font-weight   | Input font weight.                              |
| `--chat-composer-line-height`                      | `1.5`               | line-height   | Input line height.                              |
| `--chat-composer-color`                            | `#18181b`           | color         | Input text color.                               |
| `--chat-composer-placeholder-color`                | `#a1a1aa`           | color         | Placeholder color.                              |
| `--chat-composer-input-padding`                    | `6px 4px`           | padding       | Input padding.                                  |
| `--chat-composer-max-height`                       | `160px`             | max-height    | Max input height before scrolling.              |
| `--chat-composer-send-size`                        | `40px`              | height/width  | Send button size.                               |
| `--chat-composer-send-padding`                     | `8px`               | padding       | Send button padding.                            |
| `--chat-composer-send-border-radius`               | `50%`               | border-radius | Send button corner rounding.                    |
| `--chat-composer-send-background-color`            | `#18181b`           | background    | Send button background.                         |
| `--chat-composer-send-color`                       | `#ffffff`           | color         | Send icon color.                                |
| `--chat-composer-send-hover-background-color`      | `#27272a`           | background    | Send button hover background.                   |
| `--chat-composer-stack-gap`                        | `8px`               | gap           | Gap between attachment chips and the input row. |
| `--chat-composer-attachments-gap`                  | `6px`               | gap           | Gap between attachment chips.                   |
| `--chat-composer-attachments-padding`              | `2px 4px 0`         | padding       | Padding around the attachment chip strip.       |
| `--chat-composer-action-size`                      | `36px`              | height/width  | Size of the attach/voice buttons.               |
| `--chat-composer-action-padding`                   | `8px`               | padding       | Padding of the attach/voice buttons.            |
| `--chat-composer-action-background-color`          | `transparent`       | background    | Resting background of the attach/voice buttons. |
| `--chat-composer-action-border-radius`             | `50%`               | border-radius | Corner rounding of the attach/voice buttons.    |
| `--chat-composer-action-color`                     | `#52525b`           | color         | Icon color of the attach/voice buttons.         |
| `--chat-composer-action-hover-background-color`    | `#f4f4f5`           | background    | Attach/voice hover background.                  |
| `--chat-composer-voice-recording-background-color` | `#fee2e2`           | background    | Voice button background while recording.        |
| `--chat-composer-voice-recording-color`            | `#dc2626`           | color         | Voice icon color while recording.               |
| `--chat-composer-stop-background-color`            | `#18181b`           | background    | Stop button background.                         |
| `--chat-composer-stop-color`                       | `#ffffff`           | color         | Stop icon color.                                |

## Web Component

Tag: `<sui-chat-composer>`

```html
<sui-chat-composer placeholder="Type a message…"></sui-chat-composer>
```
