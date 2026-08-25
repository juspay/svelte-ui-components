# Chat

A full chat surface that composes `ChatHeader`, `ChatMessageList`, `ChatSuggestions`, `ChatToolStatus`, and `ChatComposer` into one drop-in component. It is **fully controlled** — you pass `messages` and handle `onsend`; the component owns no transport, so it works with any backend. For a batteries-included experience, pair it with the decoupled **`ChatController`** (below), which manages message state, streaming, and an optional typewriter reveal while delegating the actual network call to a pluggable transport.

Markdown is intentionally not bundled: pass pre-sanitized HTML on a message's `html` field (e.g. the output of your own `marked` + `DOMPurify`) and it renders in the bubble.

## Usage (controlled)

```svelte
<script>
  import { Chat } from '@juspay/svelte-ui-components';

  let messages = $state([]);
  let value = $state('');

  function onsend(text) {
    messages.push({ id: crypto.randomUUID(), role: 'sender', content: text });
    // ...call your API, append a responder message, stream into it...
  }
</script>

<Chat {messages} bind:value title="Assistant" placeholder="Ask anything…" {onsend} />
```

## Usage (with the decoupled controller)

`ChatController` is a runes-based state holder. Its single dependency on your backend is the **`transport`** function — adapt SSE, WebSocket, or polling to the `ChatTransport` shape and the controller/UI never need to know the difference.

```svelte
<script>
  import { Chat, ChatController } from '@juspay/svelte-ui-components';

  const chat = new ChatController({
    typewriter: true,
    transport: async ({ message, history, sessionId, signal }, handlers) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
        signal
      });
      // parse your stream and call the handlers:
      handlers.onToolStatus?.({ label: 'Searching…' });
      handlers.onText('Hello ');
      handlers.onText('world');
      handlers.onDone?.();
    }
  });

  let value = $state('');
</script>

<Chat
  messages={chat.messages}
  bind:value
  toolStatus={chat.toolStatus}
  disabled={chat.isStreaming}
  suggestions={['Track my order', 'Return policy?']}
  onsend={(text) => chat.send(text)}
/>
```

### `ChatController`

| Member | Type | Description |
| ------ | ---- | ----------- |
| `messages` | `ChatMessageData[]` | Reactive message list. |
| `isStreaming` | `boolean` | True while a response is in flight. |
| `toolStatus` | `ChatToolStatus \| null` | Current tool/typing status. |
| `send(text)` | `Promise<void>` | Append the sender's message and stream the reply. |
| `retry()` | `Promise<void>` | Drop the last reply and re-run the most recent sender message. |
| `stop()` | `void` | Abort the in-flight response. |
| `reset()` | `void` | Clear all messages and state. |

`ChatControllerOptions`: `transport` (required `ChatTransport`), `initialMessages?`, `typewriter?` (reveal text char-by-char), `generateId?` (defaults to `crypto.randomUUID()`).

`ChatTransport`: `(input: { message, history, sessionId, signal }, handlers: ChatStreamHandlers) => Promise<void>`. Handlers: `onText` (required), `onToolStatus?`, `onAttachment?`, `onError?`, `onDone?`. The controller threads sessions for you: whatever a transport reports via `onDone({ sessionId })` is passed back on the next request's `input.sessionId`.

**Roles.** Messages use the two-party primitive `role` — `sender` / `responder` (see `ChatMessage`). The controller emits those, and `partyOf(role)` resolves any role (including the `user`/`assistant`/`system` extensions) to its party. Map the primitive to your provider's roles inside the transport, where the API-specific terms belong: `history.map((m) => ({ role: partyOf(m.role) === 'sender' ? 'user' : 'assistant', content: m.content }))`.

## Your own UI inside a message

Two snippets, and the difference matters. `message` replaces the whole message — you own the bubble, alignment, streaming indicator, and you lose the built-in copy / retry / feedback wiring. `messageAttachments` renders **below** the bubble and keeps all of that, so reach for it first.

It receives the whole `ChatMessageData`, so render on whatever field you like — a custom field of your own, or `attachments`, which `ChatController` fills from a transport's `handlers.onAttachment(...)`:

```svelte
<Chat {messages} bind:value allowCopy onretry={() => chat.retry()} {onsend}>
  {#snippet messageAttachments(msg)}
    {#each msg.attachments ?? [] as item, index (index)}
      <YourComponent data={item} />
    {/each}
  {/snippet}
</Chat>
```

The snippet is invoked for every message, so branch inside it to target specific ones. Rendering nothing costs no layout — the container collapses when empty.

## Layout — fullscreen & floating

`Chat` is position- and size-agnostic: its root fills its container (`--chat-height` / `--chat-width` default to `100%`), with the message list on `flex: 1` and the composer pinned to the bottom. The only requirement is a **bounded-height parent** — the flexing list needs something to fill. Positioning (fixed, floating, modal) is the consumer's job; the component never assumes a layout context.

### Fullscreen

Give it a viewport-sized box (use `100dvh` so the mobile URL bar doesn't clip the composer):

```svelte
<div style="height: 100dvh; width: 100vw">
  <Chat {messages} bind:value title="Assistant" {onsend} />
</div>
```

Or set the variables directly: `--chat-height: 100dvh; --chat-width: 100vw`. On very wide screens, constrain the reading column (bubbles cap at `--chat-message-max-width`, default 82%) with e.g. `--chat-width: min(100%, 820px)` or a centered wrapper.

### Floating widget

The component ships no launcher button or fixed positioning — compose those, and wire the header's `onclose` to the close/minimize action:

```svelte
<script>
  let open = $state(false);
</script>

{#if open}
  <div class="chat-panel">
    <Chat {messages} bind:value title="Assistant" {onsend} onclose={() => (open = false)} />
  </div>
{/if}

<button class="chat-launcher" onclick={() => (open = !open)} aria-label="Chat">💬</button>

<style>
  .chat-panel {
    position: fixed;
    right: 24px;
    bottom: 88px;
    width: 380px;
    height: 600px;
    max-height: calc(100dvh - 120px);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
    z-index: 1000;
  }
  .chat-launcher {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1000;
    width: 56px;
    height: 56px;
    border-radius: 50%;
  }
</style>
```

The fixed-height `.chat-panel` gives `Chat` its bounds; add a slide/scale transition on it for the open animation.

## Props

| Prop            | Type                          | Required | Default | Description                                                                 |
| --------------- | ----------------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| messages        | `ChatMessageData[]`           | Yes      | `-`     | The conversation to render.                                                 |
| value           | `string`                      | No       | `''`    | Bindable. The composer draft text.                                          |
| title           | `string`                      | No       | `''`    | Header title. Header is hidden when there is no title/subtitle/image/close/avatar.|
| subtitle        | `string`                      | No       | `''`    | Header subtitle.                                                             |
| image           | `string`                      | No       | `-`     | Optional header brand image URL (rendered via `Img`). Off by default.       |
| imageAlt        | `string`                      | No       | `''`    | Alt text for the header image.                                              |
| placeholder     | `string`                      | No       | `''`    | Composer placeholder.                                                       |
| disabled        | `boolean`                     | No       | `false` | Disable the composer entirely.                                             |
| streaming       | `boolean`                     | No       | `false` | A reply is streaming — the send button becomes a stop button.              |
| recording       | `boolean`                     | No       | `false` | Visual active state for the composer voice button.                         |
| autoscroll      | `boolean`                     | No       | `true`  | Auto-scroll to the latest message (only when already near the bottom).     |
| toolStatus      | `ChatToolStatus \| null`      | No       | `null`  | Tool/typing status shown above the composer.                               |
| suggestions     | `ChatSuggestion[]`            | No       | `[]`    | Prompt chips shown when the conversation is empty.                          |
| attachments     | `File[]`                      | No       | `[]`    | Bindable. Pending composer attachments.                                    |
| accept          | `string`                      | No       | `''`    | Accepted file types for the attach button.                                |
| multiple        | `boolean`                     | No       | `false` | Allow multiple files per attach pick.                                     |
| allowCopy       | `boolean`                     | No       | `false` | Show copy buttons on assistant messages.                                  |
| closeLabel      | `string`                      | No       | `'Close'`| Aria-label for the header close button.                                    |
| showClose       | `boolean`                     | No       | `-`     | Force the close button on/off (defaults to showing when `onclose` is set). |
| headerAvatar    | `Snippet`                     | No       | `-`     | Brand/avatar mark in the header (takes precedence over `image`).            |
| headerActions   | `Snippet`                     | No       | `-`     | Extra inline header actions.                                                |
| headerContent   | `Snippet`                     | No       | `-`     | Extra content as a full-width second row in the header (toolbar, status…).  |
| message         | `Snippet<[ChatMessageData]>`  | No       | `-`     | Custom per-message rendering. Replaces the default bubble entirely.        |
| messageBody | `Snippet<[ChatMessageData]>` | No | `-` | Per-message bubble body, threaded to `ChatMessageList`. |
| messageAttachments | `Snippet<[ChatMessageData]>` | No     | `-`     | Your own UI rendered below each bubble, keeping the default bubble and its actions. |
| empty           | `Snippet`                     | No       | `-`     | Empty-state content.                                                        |
| composerLeading | `Snippet`                     | No       | `-`     | Content before the composer input.                                         |
| sendIcon / stopIcon / voiceIcon / attachIcon | `Snippet`        | No       | `-`     | Custom composer icons; each falls back to a built-in asset.                 |
| testId          | `string`                      | No       | `-`     | `data-pw` on the root element.                                              |
| classes         | `string`                      | No       | `-`     | Class string on the root element.                                           |

## Events

| Event        | Type                                  | Description                                                            |
| ------------ | ------------------------------------- | --------------------------------------------------------------------- |
| onsend       | `(value: string, attachments: File[]) => void` | Fires when a message is submitted from the composer.         |
| onsuggestion | `(value: string, index: number) => void` | Fires when a suggestion chip is picked. Falls back to `onsend`.    |
| onclose      | `() => void`                          | Fires when the header close button is pressed.                        |
| onstop       | `() => void`                          | Enables the stop button (e.g. `chat.stop`).                           |
| onvoice      | `() => void`                          | Enables the composer voice button.                                    |
| onattach     | `(files: File[]) => void`             | Enables the composer attach button.                                   |
| onretry      | `() => void`                          | Enables retry on the latest assistant message (e.g. `chat.retry`).    |
| onfeedback   | `(value: 'up' \| 'down', message: ChatMessageData) => void` | Enables 👍/👎 on assistant messages.            |

## CSS Variables

| Variable                      | Default       | CSS Property     | Description                          |
| ----------------------------- | ------------- | ---------------- | ------------------------------------ |
| `--chat-height`               | `100%`        | height           | Height of the chat surface.          |
| `--chat-width`                | `100%`        | width            | Width of the chat surface.           |
| `--chat-background`           | `#ffffff`     | background       | Background of the chat surface.      |
| `--chat-border`               | `none`        | border           | Border of the chat surface.          |
| `--chat-border-radius`        | `0`           | border-radius    | Corner rounding of the chat surface. |
| `--chat-footer-gap`           | `10px`        | gap              | Gap between footer rows.             |
| `--chat-footer-padding`       | `12px 1.5rem` | padding          | Padding of the footer area.          |
| `--chat-footer-background`    | `transparent` | background       | Footer background.                   |
| `--chat-footer-border-top`    | `none`        | border-top       | Border above the footer.             |
| `--chat-tool-status-justify`  | `center`      | justify-content  | Alignment of the tool-status row.    |

Child components (`ChatHeader`, `ChatMessageList`, `ChatComposer`, `ChatToolStatus`, `ChatSuggestions`, `ChatMessage`) are themed through their own CSS variables, which cascade into `Chat`.

## Web Component

Tag: `<sui-chat>`

```html
<sui-chat title="Assistant"></sui-chat>
```

Set `.messages`, `.onsend`, and other object/array props via JavaScript.
