# ChatComposer

An auto-growing message input with a send button (the `Button` component). Enter submits and Shift+Enter inserts a newline (configurable via `submitOnEnter`); the send button is disabled until there is non-whitespace text or an attachment. The input clears on submit. All of the extra controls are **opt-in** — wiring a callback enables the matching button:

- `onattach` → a paperclip button that opens a file picker; picked files appear as removable chips (`Pill`) above the input and are bindable via `attachments`.
- `onvoice` → a mic button for voice input (`recording` drives its tri-state styling — see [Dictation](#dictation-tri-state-recording-escape-to-cancel-caller-supplied-status)).
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

### Stacked text and control row (Svelte)

`layout?: 'row' | 'stacked'` defaults to `'row'`, preserving the original inline
textarea and controls. Opt into `'stacked'` for a full-width textarea above a
separate control row: attach and `leading` content on the left, voice and
send/stop/idle action on the right. DOM and keyboard order follow the visible
order, with text first. Attachment previews stay above both rows.

The existing accessible-name props work in both layouts: `inputAriaLabel` for the
textarea and `sendLabel`, `stopLabel`, `voiceLabel`, `attachLabel`, `actionLabel`
for buttons. The textarea still falls back to the placeholder, then `'Message'`.
Use an explicit name when the placeholder is just a suggestion.

```svelte
<script lang="ts">
  import { ChatComposer } from '@juspay/svelte-ui-components';

  let value = $state('');
  let attachments = $state<File[]>([]);
</script>

<ChatComposer
  layout="stacked"
  bind:value
  bind:attachments
  placeholder="Investigate payment declines…"
  inputAriaLabel="Ask Automatic"
  sendLabel="Send to Automatic"
  attachLabel="Add context files"
  onattach={(files) => console.log('Picked context:', files)}
  onsubmit={(text, files) => {
    console.log('Submit:', text, files);
    return false; // Keep the draft until the caller accepts the send.
  }}
>
  {#snippet leading()}<span>Automatic</span>{/snippet}
</ChatComposer>
```

The same existing submit, attachment, dictation and stop behavior applies to both
layouts, including rejected promises retaining drafts and accepted async sends
preserving newer edits. `--chat-composer-stack-gap` spaces the stacked text/control
rows; `--chat-composer-gap` spaces controls. The Web Component also accepts `layout="stacked"` or a `layout` JS property.

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

### Async submit — keep the draft on a rejected send

`onsubmit` may return `boolean | Promise<boolean>` instead of only `void`. The composer clears
`value` and `attachments` after every submit **unless** the return value — synchronous or
resolved — is exactly `false`, in which case the draft is left exactly as it was so the caller
can retry. A rejected promise is treated the same as a resolved `false`. This is fully
backward compatible: a `void`-returning handler returns `undefined`, which is not `false`, so it
keeps clearing on every submit exactly as before.

```svelte
<ChatComposer
  bind:value
  onsubmit={async (text, attachments) => {
    const ok = await send(text, attachments);
    return ok; // `false` restores `text`/`attachments` instead of clearing them
  }}
/>
```

While the promise is pending the composer does not disable itself — the user can keep typing.
If they do, the eventual clear is skipped even on a truthy result, so it never wipes out text
typed after the send was fired. Pair with `sendDisabled` (or `sendable`) if a second submit
should be blocked until the first one settles; the composer does not infer that on its own,
the same way `disabled` never has.

### Dictation: tri-state `recording`, Escape to cancel, caller-supplied status

`recording` accepts `'idle' | 'recording' | 'busy'` (as well as the legacy `boolean`, see below).
`'busy'` is not cosmetic — it means the control is transcribing, so the voice button disables
itself while busy regardless of `voiceDisabled`/`disabled`, the same way `disabled` itself is not
something a specific per-control flag can override back on. Use it for the gap between "the mic
stopped listening" and "the transcript is back":

```svelte
<ChatComposer
  bind:value
  recording={dictationState}
  onvoice={startOrStopDictation}
  oncanceldictation={cancelDictation}
  placeholder={dictationState === 'busy' ? 'Transcribing…' : 'Type a message…'}
/>
```

Pressing **Escape** cancels dictation — it fires `oncanceldictation` — only while `recording` is
`'recording'` (or the legacy `true`). It has no effect while idle (nothing to cancel) or busy
(transcribing is already past the point Escape can interrupt).

An optional sr-only status region (`role="status" aria-live="polite"`) narrates state changes for
assistive technology. It renders only when `statusText` is set — an explicit empty string still
renders an emptied region, distinct from omitting the prop, so a caller can clear it without
unmounting it. The library owns only the region, its role and its politeness; **the sentence is
always caller-supplied** — never hardcoded in the library, since the wording is product voice:

```svelte
<ChatComposer
  recording={dictationState}
  statusText={dictationState === 'recording'
    ? 'Recording. Press Escape to stop and transcribe.'
    : dictationState === 'busy'
      ? 'Transcribing…'
      : ''}
/>
```

**Backward compatibility:** the boolean `recording` keeps working unchanged for one minor cycle —
`true` reads as `'recording'`, `false` (the default) reads as `'idle'`, the only two states a
boolean caller could ever express. A caller who never touches `recording` beyond `true`/`false`
sees no behaviour change at all: the voice button still only ever shows its resting or "recording"
style, since `'busy'` is unreachable without opting into the tri-state string.

### Independent per-control disable

`disabled` still disables the textarea, the voice button and the send button together, as
before. `textDisabled`, `voiceDisabled` and `sendDisabled` each override one control on its own
— useful for e.g. freezing the send button mid-request while dictation stays live. Any of the
three left unset falls back to `disabled`, so a caller that never passes them keeps today's
single-`disabled` behaviour exactly:

`disabled={true}` always dims the whole composer (`--chat-composer-disabled-opacity`)
regardless of what the three per-control props are set to — the dimming reads the root
`disabled` prop only, not the resolved per-control state. A caller who wants the visual dim to
track only some controls should compute their own root class via `classes` rather than relying
on `disabled` for that.

```svelte
<ChatComposer bind:value sendDisabled={sending} onsubmit={handleSend} onvoice={toggleDictation} />
```

## Props

| Prop                                                                                               | Type                                           | Required | Default                                             | Description                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value                                                                                              | `string`                                       | No       | `''`                                                | Bindable. The draft text.                                                                                                                                                                                                                                                                                             |
| placeholder                                                                                        | `string`                                       | No       | `''`                                                | Input placeholder.                                                                                                                                                                                                                                                                                                    |
| disabled                                                                                           | `boolean`                                      | No       | `false`                                             | Disable input and buttons.                                                                                                                                                                                                                                                                                            |
| textDisabled                                                                                       | `boolean \| null`                              | No       | `null`                                              | Disable only the textarea. Falls back to `disabled` when unset.                                                                                                                                                                                                                                                       |
| voiceDisabled                                                                                      | `boolean \| null`                              | No       | `null`                                              | Disable only the voice button. Falls back to `disabled` when unset.                                                                                                                                                                                                                                                   |
| sendDisabled                                                                                       | `boolean \| null`                              | No       | `null`                                              | Disable only the send (and idle-action) button, independent of `sendable`. Falls back to `disabled` when unset.                                                                                                                                                                                                       |
| submitOnEnter                                                                                      | `boolean`                                      | No       | `true`                                              | Submit on Enter (Shift+Enter inserts a newline).                                                                                                                                                                                                                                                                      |
| maxLength                                                                                          | `number`                                       | No       | `0`                                                 | Character cap; `0` disables the limit.                                                                                                                                                                                                                                                                                |
| streaming                                                                                          | `boolean`                                      | No       | `false`                                             | When true, the send button becomes a stop button.                                                                                                                                                                                                                                                                     |
| recording                                                                                          | `boolean \| 'idle' \| 'recording' \| 'busy'`   | No       | `false`                                             | Dictation state. `'busy'` also disables the voice button, regardless of `voiceDisabled`/`disabled`. The `boolean` is kept working, unchanged, as an alias (`true` → `'recording'`, `false` → `'idle'`) for one minor cycle — see [Dictation](#dictation-tri-state-recording-escape-to-cancel-caller-supplied-status). |
| attachments                                                                                        | `File[]`                                       | No       | `[]`                                                | Bindable. Pending attachments, shown as removable chips.                                                                                                                                                                                                                                                              |
| attachmentsPreview                                                                                 | `Snippet`                                      | No       | `-`                                                 | Replaces the built-in pill strip — render a richer preview (e.g. `AttachmentChipRow`) driven by your own attachment model.                                                                                                                                                                                            |
| richImages                                                                                         | `AttachmentChipImage[]`                        | No       | `[]`                                                | Opt-in: processed image attachments for the built-in rich strip — when either rich list is non-empty the composer renders an `AttachmentChipRow` instead of the pill strip and counts the chips toward "can send".                                                                                                    |
| richFiles                                                                                          | `AttachmentChipFile[]`                         | No       | `[]`                                                | Processed file attachments for the built-in rich strip — see `richImages`.                                                                                                                                                                                                                                            |
| richVideos                                                                                         | `AttachmentChipVideo[]`                        | No       | `[]`                                                | Processed video attachments for the built-in rich strip — poster tiles with a play badge.                                                                                                                                                                                                                             |
| richImageTooltip                                                                                   | `(image) => string`                            | No       | `-`                                                 | Tooltip text for a rich image chip.                                                                                                                                                                                                                                                                                   |
| richVideoTooltip                                                                                   | `(video) => string`                            | No       | `-`                                                 | Tooltip text for a rich video chip.                                                                                                                                                                                                                                                                                   |
| richRemoveIcon                                                                                     | `Snippet`                                      | No       | `-`                                                 | Glyph inside the rich chips' remove buttons.                                                                                                                                                                                                                                                                          |
| richFileIcon                                                                                       | `Snippet`                                      | No       | `-`                                                 | Glyph on a rich file chip.                                                                                                                                                                                                                                                                                            |
| sendable                                                                                           | `boolean \| null`                              | No       | `null`                                              | Overrides the internal can-send calculation (text or `attachments` present); use for attachment-only sends when the model lives outside `attachments`. `disabled` still wins.                                                                                                                                         |
| accept                                                                                             | `string`                                       | No       | `''`                                                | Accepted file types for the attach button.                                                                                                                                                                                                                                                                            |
| multiple                                                                                           | `boolean`                                      | No       | `false`                                             | Allow multiple files per pick.                                                                                                                                                                                                                                                                                        |
| sendLabel / stopLabel / voiceLabel / attachLabel                                                   | `string`                                       | No       | `…`                                                 | Aria-labels for the buttons.                                                                                                                                                                                                                                                                                          |
| sendIcon / stopIcon / voiceIcon / attachIcon                                                       | `Snippet`                                      | No       | `-`                                                 | Custom icons; each falls back to a built-in asset.                                                                                                                                                                                                                                                                    |
| actionIcon                                                                                         | `Snippet`                                      | No       | `-`                                                 | Icon for the idle action button (see `onaction`). Falls back to a built-in asset.                                                                                                                                                                                                                                     |
| actionLabel                                                                                        | `string`                                       | No       | `'Voice conversation'`                              | Aria-label for the idle action button.                                                                                                                                                                                                                                                                                |
| inputAriaLabel                                                                                     | `string`                                       | No       | `-`                                                 | Aria-label on the textarea, for apps with existing accessibility contracts.                                                                                                                                                                                                                                           |
| inputTestId / sendTestId / sendSlotTestId / stopTestId / voiceTestId / attachTestId / actionTestId | `string`                                       | No       | `-`                                                 | Per-control `data-pw` overrides, for apps with existing spec contracts.                                                                                                                                                                                                                                               |
| leading                                                                                            | `Snippet`                                      | No       | `-`                                                 | Content before the input.                                                                                                                                                                                                                                                                                             |
| statusText                                                                                         | `string`                                       | No       | `-`                                                 | Opt-in sr-only status region text (`role="status" aria-live="polite"`). Rendered only when set; caller-supplied, never hardcoded -- see [Dictation](#dictation-tri-state-recording-escape-to-cancel-caller-supplied-status).                                                                                          |
| statusTestId                                                                                       | `string`                                       | No       | `-`                                                 | `data-pw` on the status region (see `statusText`).                                                                                                                                                                                                                                                                    |
| slashCommands                                                                                      | `ChatComposerSlashCommand[] \| null`           | No       | `null`                                              | Opt-in slash-command menu: typing "/" lists matching commands (arrows move, Tab completes, Enter picks or submits a complete match, Escape dismisses via the dismissible stack); a command with `choices` lists them as a second stage. `null` turns it off.                                                          |
| slashMenuAriaLabel                                                                                 | `string`                                       | No       | `'slash commands'`                                  | Accessible name of the slash-command listbox.                                                                                                                                                                                                                                                                         |
| slashMenuHint                                                                                      | `string`                                       | No       | `'↑↓ move · tab complete · ↵ select · esc dismiss'` | Key-hint line under the list.                                                                                                                                                                                                                                                                                         |
| slashMenuClasses                                                                                   | `string`                                       | No       | `-`                                                 | Class(es) on the slash-command panel.                                                                                                                                                                                                                                                                                 |
| slashItemClasses                                                                                   | `string`                                       | No       | `-`                                                 | Class(es) on every row's Button.                                                                                                                                                                                                                                                                                      |
| slashSelectedItemClasses                                                                           | `string`                                       | No       | `-`                                                 | Class(es) added to the highlighted row's Button.                                                                                                                                                                                                                                                                      |
| slashItem                                                                                          | `Snippet<[ChatComposerSlashCommand, boolean]>` | No       | `-`                                                 | Row content (command, highlighted); default: name, argument hint, description, badge.                                                                                                                                                                                                                                 |
| testId                                                                                             | `string`                                       | No       | `-`                                                 | `data-pw` on the root element.                                                                                                                                                                                                                                                                                        |
| classes                                                                                            | `string`                                       | No       | `-`                                                 | Class string on the root element.                                                                                                                                                                                                                                                                                     |
| layout                                                                                             | `'row' \| 'stacked'`                           | No       | `'row'`                                             | Inline default or textarea above a separate control row; also exposed on the Web Component.                                                                                                                                                                                                                           |
| actionText                                                                                         | `string`                                       | No       | absent                                              | Optional visible text beside the idle action icon. Omitted or empty keeps icon-only markup. Also exposed as Web Component `action-text` attribute / `actionText` property.                                                                                                                                            |

## Events

| Event             | Type                                                                                  | Description                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onsubmit          | `(value: string, attachments: File[]) => boolean \| void \| Promise<boolean \| void>` | Fires on submit with the value and pending attachments. Returning (or resolving to) `false` skips the automatic clear — see below.                                                  |
| oninput           | `(value: string, event: Event) => void`                                               | Fires on every input change.                                                                                                                                                        |
| onkeydown         | `(event: KeyboardEvent) => void`                                                      | Fires on key down in the input.                                                                                                                                                     |
| onstop            | `() => void`                                                                          | Enables the stop button. Fires when stop is pressed.                                                                                                                                |
| onvoice           | `() => void`                                                                          | Enables the voice button. Fires when the mic is pressed.                                                                                                                            |
| oncanceldictation | `() => void`                                                                          | Fires on Escape while `recording` is `'recording'` (or the legacy `true`), and only then — see [Dictation](#dictation-tri-state-recording-escape-to-cancel-caller-supplied-status). |
| onattach          | `(files: File[]) => void`                                                             | Enables the attach button. Fires with newly picked files.                                                                                                                           |
| onattachclick     | `() => void`                                                                          | Replaces the built-in picker: the attach button fires this instead of opening a file dialog (e.g. to open your own chooser modal).                                                  |
| onremoverichimage | `(id: string) => void`                                                                | Remove callback for a rich image chip. Omit both rich removal callbacks to render the rich strip read-only.                                                                         |
| onremoverichfile  | `(id: string) => void`                                                                | Remove callback for a rich file chip.                                                                                                                                               |
| onremoverichvideo | `(id: string) => void`                                                                | Remove callback for a rich video chip.                                                                                                                                              |
| onopenrichimage   | `(image) => void`                                                                     | Makes a rich image tile clickable; fires with the attachment (lightbox seam).                                                                                                       |
| onopenrichvideo   | `(video) => void`                                                                     | Makes a rich video tile clickable; fires with the attachment (playback seam).                                                                                                       |
| onopenrichfile    | `(file) => void`                                                                      | Makes a rich file tile clickable; fires with the attachment.                                                                                                                        |
| onpaste           | `(event: ClipboardEvent) => void`                                                     | Fires on paste into the input — the paste-to-attach seam.                                                                                                                           |
| onaction          | `() => void`                                                                          | Enables the idle action button, shown in the send slot while there is nothing to send, stop, or record.                                                                             |

## CSS Variables

| Variable                                             | Default                            | CSS Property           | Description                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--chat-composer-slash-menu-gap`                     | `8px`                              | margin-bottom          | Space between the menu and the composer.                                                                                                                                                                                                                                                                                           |
| `--chat-composer-slash-menu-outset`                  | `0px`                              | left, right, bottom    | How far the menu extends past the composer's padding box (e.g. its border width), to line up with its outer edge.                                                                                                                                                                                                                  |
| `--chat-composer-slash-menu-z-index`                 | `30`                               | z-index                | Menu stacking.                                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-slash-menu-background`              | `#ffffff`                          | background             | Menu background.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-slash-menu-border`                  | `1px solid #e4e4e7`                | border                 | Menu border.                                                                                                                                                                                                                                                                                                                       |
| `--chat-composer-slash-menu-border-radius`           | `12px`                             | border-radius          | Menu corners.                                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-slash-menu-box-shadow`              | `0 8px 24px rgb(0 0 0 / 12%)`      | box-shadow             | Menu shadow.                                                                                                                                                                                                                                                                                                                       |
| `--chat-composer-slash-list-padding`                 | `4px`                              | padding                | List padding.                                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-slash-list-max-height`              | `280px`                            | max-height             | List height before it scrolls.                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-slash-list-gap`                     | `2px`                              | gap                    | Gap between rows.                                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-slash-foot-padding`                 | `4px 12px`                         | padding                | Key-hint line padding.                                                                                                                                                                                                                                                                                                             |
| `--chat-composer-slash-foot-border`                  | `1px solid #e4e4e7`                | border-top             | Key-hint line top border.                                                                                                                                                                                                                                                                                                          |
| `--chat-composer-slash-foot-font-family`             | `inherit`                          | font-family            | Key-hint font.                                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-slash-foot-font-variant-ligatures`  | `inherit`                          | font-variant-ligatures | Key-hint ligatures.                                                                                                                                                                                                                                                                                                                |
| `--chat-composer-slash-foot-font-size`               | `12px`                             | font-size              | Key-hint size.                                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-slash-foot-color`                   | `#71717a`                          | color                  | Key-hint colour.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-slash-name-font-family`             | `monospace`                        | font-family            | Default row: command name font.                                                                                                                                                                                                                                                                                                    |
| `--chat-composer-slash-name-color`                   | `#2563eb`                          | color                  | Default row: command name colour.                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-slash-hint-font-size`               | `12px`                             | font-size              | Default row: argument hint size.                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-slash-hint-color`                   | `#71717a`                          | color                  | Default row: argument hint colour.                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-slash-desc-color`                   | `#52525b`                          | color                  | Default row: description colour.                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-slash-badge-background`             | `#eff6ff`                          | background             | Default row: badge background.                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-slash-badge-color`                  | `#2563eb`                          | color                  | Default row: badge colour.                                                                                                                                                                                                                                                                                                         |
| `--chat-composer-slash-badge-padding`                | `2px 8px`                          | padding                | Default row: badge padding.                                                                                                                                                                                                                                                                                                        |
| `--chat-composer-slash-badge-border-radius`          | `999px`                            | border-radius          | Default row: badge corner rounding.                                                                                                                                                                                                                                                                                                |
| `--chat-composer-slash-badge-font-size`              | `12px`                             | font-size              | Default row: badge text size.                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-slash-item-selected-background`     | `#f4f4f5`                          | background             | Default background of the arrow-key-highlighted row's `<li>`. Only applied when `slashSelectedItemClasses` is not set — a consumer's own class is otherwise the sole source of the selected look, as before. Row hover/focus-visible come from the row's own `Button` and its usual `--button-hover-color`/focus-visible defaults. |
| `--chat-composer-width`                              | `100%`                             | width                  | Width of the composer.                                                                                                                                                                                                                                                                                                             |
| `--chat-composer-gap`                                | `8px`                              | gap                    | Gap between leading/input/send.                                                                                                                                                                                                                                                                                                    |
| `--chat-composer-padding`                            | `8px`                              | padding                | Outer padding.                                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-background`                         | `#ffffff`                          | background             | Composer background.                                                                                                                                                                                                                                                                                                               |
| `--chat-composer-border`                             | `1px solid #e4e4e7`                | border                 | Composer border.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-border-radius`                      | `24px`                             | border-radius          | Composer corner rounding.                                                                                                                                                                                                                                                                                                          |
| `--chat-composer-box-shadow`                         | `none`                             | box-shadow             | Composer shadow.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-disabled-opacity`                   | `0.6`                              | opacity                | Opacity when disabled.                                                                                                                                                                                                                                                                                                             |
| `--chat-composer-font-family`                        | `inherit`                          | font-family            | Input font family.                                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-font-size`                          | `0.9375rem`                        | font-size              | Input font size.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-font-weight`                        | `inherit`                          | font-weight            | Input font weight.                                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-line-height`                        | `1.5`                              | line-height            | Input line height.                                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-color`                              | `#18181b`                          | color                  | Input text color.                                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-placeholder-color`                  | `#a1a1aa`                          | color                  | Placeholder color.                                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-input-padding`                      | `6px 4px`                          | padding                | Input padding.                                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-max-height`                         | `160px`                            | max-height             | Max input height before scrolling.                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-send-size`                          | `40px`                             | height/width           | Send button size.                                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-send-padding`                       | `8px`                              | padding                | Send button padding.                                                                                                                                                                                                                                                                                                               |
| `--chat-composer-send-border-radius`                 | `50%`                              | border-radius          | Send button corner rounding.                                                                                                                                                                                                                                                                                                       |
| `--chat-composer-send-background-color`              | `#18181b`                          | background             | Send button background.                                                                                                                                                                                                                                                                                                            |
| `--chat-composer-send-color`                         | `#ffffff`                          | color                  | Send icon color.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-send-hover-background-color`        | `#27272a`                          | background             | Send button hover background.                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-stack-gap`                          | `8px`                              | gap                    | Gap between attachment chips and the input row.                                                                                                                                                                                                                                                                                    |
| `--chat-composer-attachments-gap`                    | `6px`                              | gap                    | Gap between attachment chips.                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-attachments-padding`                | `2px 4px 0`                        | padding                | Padding around the attachment chip strip.                                                                                                                                                                                                                                                                                          |
| `--chat-composer-action-size`                        | `36px`                             | height/width           | Size of the attach/voice buttons.                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-action-padding`                     | `8px`                              | padding                | Padding of the attach/voice buttons.                                                                                                                                                                                                                                                                                               |
| `--chat-composer-action-background-color`            | `transparent`                      | background             | Resting background of the attach/voice buttons.                                                                                                                                                                                                                                                                                    |
| `--chat-composer-action-border-radius`               | `50%`                              | border-radius          | Corner rounding of the attach/voice buttons.                                                                                                                                                                                                                                                                                       |
| `--chat-composer-action-color`                       | `#52525b`                          | color                  | Icon color of the attach/voice buttons.                                                                                                                                                                                                                                                                                            |
| `--chat-composer-action-hover-background-color`      | `#f4f4f5`                          | background             | Attach/voice hover background.                                                                                                                                                                                                                                                                                                     |
| `--chat-composer-voice-recording-background-color`   | `#fee2e2`                          | background             | Voice button background while recording.                                                                                                                                                                                                                                                                                           |
| `--chat-composer-voice-recording-color`              | `#dc2626`                          | color                  | Voice icon color while recording.                                                                                                                                                                                                                                                                                                  |
| `--chat-composer-stop-background-color`              | `#18181b`                          | background             | Stop button background.                                                                                                                                                                                                                                                                                                            |
| `--chat-composer-stop-color`                         | `#ffffff`                          | color                  | Stop icon color.                                                                                                                                                                                                                                                                                                                   |
| `--chat-composer-idle-action-width`                  | send size; `max-content` with text | width                  | Idle action width.                                                                                                                                                                                                                                                                                                                 |
| `--chat-composer-idle-action-padding`                | send padding; `8px 12px` with text | padding                | Idle action padding.                                                                                                                                                                                                                                                                                                               |
| `--chat-composer-idle-action-border-radius`          | send border radius                 | border-radius          | Idle action corner rounding.                                                                                                                                                                                                                                                                                                       |
| `--chat-composer-idle-action-background-color`       | send background                    | background             | Idle action background.                                                                                                                                                                                                                                                                                                            |
| `--chat-composer-idle-action-color`                  | send color                         | color                  | Idle action label/icon color.                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-idle-action-hover-background-color` | send hover background              | background             | Idle action hover background.                                                                                                                                                                                                                                                                                                      |
| `--chat-composer-idle-action-hover-color`            | idle action color                  | color                  | Idle action hover label/icon color.                                                                                                                                                                                                                                                                                                |
| `--chat-composer-idle-action-gap`                    | `0px`; `6px` with text             | gap                    | Idle action icon/label spacing.                                                                                                                                                                                                                                                                                                    |
| `--chat-composer-idle-action-icon-size`              | `20px` with text                   | height/width           | Idle action glyph size with a visible label.                                                                                                                                                                                                                                                                                       |

## Web Component

Tag: `<sui-chat-composer>`

```html
<sui-chat-composer placeholder="Type a message…"></sui-chat-composer>
```

### Stacked layout

`layout="stacked"` places the textarea above the control row; omitting it keeps
the original row layout. The `layout` JS property accepts `'row'` or `'stacked'`
and can be updated after mount. This is forwarded in both the built-in attachment
path and the `attachments-preview` slot path. Existing accessible-label attributes
continue to name the actual textarea and buttons:

```html
<sui-chat-composer
  layout="stacked"
  input-aria-label="Ask Automatic"
  send-label="Send to Automatic"
  placeholder="Investigate payment declines…"
></sui-chat-composer>
```

### Web Component Events

`onstop`, `onvoice`, `oncanceldictation`, `onattach`, `onattachclick`, `onaction`,
`onremoverichimage`, `onremoverichfile`, `onremoverichvideo`, `onopenrichimage`,
`onopenrichvideo` and `onopenrichfile` are available as JS properties, and each also dispatches
a same-named DOM custom event (bubbles, composed) for a consumer who only calls
`addEventListener`. Every one of these takes at most one argument, so detail is that argument
as-is (or absent for the zero-argument ones):

```js
const composer = document.querySelector('sui-chat-composer');
composer.addEventListener('attach', (e) => uploadFiles(e.detail));
composer.addEventListener('removerichimage', (e) => forgetAttachment(e.detail));
composer.addEventListener('action', () => runCustomAction());
```

`onsubmit`, `oninput`, `onkeydown` and `onpaste` stay JS-property-only callbacks and do not
dispatch DOM events: each name is already one of `HTMLElement`'s own native events, so a
listener registered under any of them would receive both the real one and a synthetic one.

### Slots

| Slot Name             | Maps to Snippet      | Description                                                                                                                                                                                         |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attachments-preview` | `attachmentsPreview` | Replaces the built-in attachment strip. Takes effect only once slotted — an unslotted `<sui-chat-composer>` keeps falling back to the built-in rich strip or pill strip instead of showing nothing. |
| `send-icon`           | `sendIcon`           | Custom send-button icon. Defaults to the built-in send glyph.                                                                                                                                       |
| `stop-icon`           | `stopIcon`           | Custom stop-button icon. Defaults to the built-in stop glyph.                                                                                                                                       |
| `voice-icon`          | `voiceIcon`          | Custom voice-button icon. Defaults to the built-in mic glyph.                                                                                                                                       |
| `attach-icon`         | `attachIcon`         | Custom attach-button icon. Defaults to the built-in paperclip glyph.                                                                                                                                |
| `action-icon`         | `actionIcon`         | Icon for the idle action button (see `onaction`). Defaults to the built-in mic glyph.                                                                                                               |
| `rich-remove-icon`    | `richRemoveIcon`     | Glyph inside a rich attachment chip's remove button. Defaults to the built-in cross glyph.                                                                                                          |
| `rich-file-icon`      | `richFileIcon`       | Glyph on a rich file chip. Defaults to the built-in file glyph.                                                                                                                                     |
| `leading`             | `leading`            | Content before the input.                                                                                                                                                                           |

> **Svelte-only:** `slashItem` receives `(command, highlighted)`, so it cannot be expressed as
> a named slot — a Web Component `<slot>` projects markup, it does not forward Svelte snippet
> parameters, so both arguments above would be silently dropped. Use the Svelte component
> directly when you need to override slash-menu row content.
