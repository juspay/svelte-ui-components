# ChatBubble

A floating launcher button (FAB) pinned to a corner of the viewport that toggles a floating panel. Drop a `Chat` (or anything) inside via the `children` snippet — `ChatBubble` owns only the launcher, positioning, and open/close behavior, staying decoupled from what it contains. The launcher reuses the `Button` component and shows a chat icon when closed / a close icon when open (both overridable via snippet). Opening moves focus into the panel (`role="dialog"`), Escape closes it and returns focus to the launcher.

Set **`draggable`** to let the user grab the launcher and reposition the whole widget (a click still toggles — drag and click are distinguished by a small movement threshold, and the launcher is kept within the viewport). Two drag styles, via **`dragMode`**:

- **`'snap'` (default)** — anchored, mobile chat-head style: while dragging the bubble follows the pointer, and on release it snaps to the nearest left/right screen edge based on where you let go. The panel re-opens toward the screen center, and the resize edges follow suit.
- **`'free'`** — the bubble stays exactly where it's dropped.

The offset is the bindable `dragX`/`dragY`. Set **`resizable`** to let the user resize the panel from the edges nearest the screen center (via the `Resizable` component); the size is the bindable `panelWidth`/`panelHeight`. Both `draggable` and `resizable` are off by default.

**Expand / collapse.** Bind **`expanded`** to grow the panel to a larger preset (**`expandedPanelWidth`**/**`expandedPanelHeight`**) and toggle it back to the previous size — the panel size animates the change (a scale-up grow), so flipping `expanded` from anywhere in your app smoothly resizes the widget. The normal and expanded sizes are tracked independently, so collapsing restores the pre-expand size and the expanded size is capped to the available viewport space just like a manual resize (resizing while expanded updates `expandedPanelWidth`/`expandedPanelHeight`). The animation is suppressed while the user is actively drag-resizing and under `prefers-reduced-motion: reduce`.

```svelte
<button onclick={() => (expanded = !expanded)}>Toggle size</button>

<ChatBubble bind:open bind:expanded expandedPanelWidth={680} expandedPanelHeight={820}>
  <Chat {messages} bind:value {onsend} onclose={() => (open = false)} />
</ChatBubble>
```

**Adaptive placement.** However the launcher ends up positioned — by `position`, dragging, or snapping — the panel opens toward the side with the most room: it **drops down** when the bubble is in the top half of the viewport and opens upward when it's in the bottom half (and likewise left/right), so the panel never opens off-screen. The resize handles follow the chosen direction. The panel is also **capped to the available space** in that direction, so on small/short viewports it shrinks to fit (the conversation scrolls inside) rather than spilling past the screen edge.

## Usage

```svelte
<script>
  import { ChatBubble, Chat } from '@juspay/svelte-ui-components';

  let messages = $state([]);
  let value = $state('');
  let open = $state(false);

  function onsend(text) {
    messages.push({ id: crypto.randomUUID(), role: 'user', content: text });
    // …call your API, append an assistant reply…
  }
</script>

<ChatBubble bind:open label="Open chat">
  <Chat {messages} bind:value title="Assistant" {onsend} onclose={() => (open = false)} />
</ChatBubble>
```

The panel is sized by `panelWidth`/`panelHeight`; the child fills it (`Chat`'s root defaults to `100%`). `ChatBubble` owns the fixed positioning and the open/close state, so the same `open` you bind here can also be driven from elsewhere in your app.

## Usage — draggable, snap & resizable

Enable the chat-head behaviors. With the default `dragMode="snap"` the bubble docks to the nearest screen edge on release; pass `dragMode="free"` to leave it wherever it is dropped. `resizable` adds drag handles to the open panel.

```svelte
<!-- snap to the nearest edge (default), resizable, position + size persisted -->
<ChatBubble
  bind:open
  draggable
  resizable
  bind:dragX
  bind:dragY
  bind:panelWidth
  bind:panelHeight
  position="bottom-right"
>
  <Chat {messages} bind:value {onsend} onclose={() => (open = false)} />
</ChatBubble>

<!-- free-form drag: stays exactly where dropped -->
<ChatBubble bind:open draggable dragMode="free">
  <Chat {messages} bind:value {onsend} onclose={() => (open = false)} />
</ChatBubble>
```

Bind `dragX`/`dragY` (and `panelWidth`/`panelHeight`) to persist the user's placement and size across sessions. The resize handles are chosen automatically from where the bubble currently sits — e.g. a bottom-right bubble resizes from its top/left edges, and after snapping to the left the panel and its handles flip toward center.

## Usage — decoupled controller

Pair with `ChatController` so the bubble is a complete, transport-agnostic chat widget — adapt SSE, WebSocket, or polling behind the `transport` and the UI never changes:

```svelte
<script>
  import { ChatBubble, Chat, ChatController } from '@juspay/svelte-ui-components';

  const chat = new ChatController({
    typewriter: true,
    transport: async ({ message, signal }, handlers) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
        signal
      });
      // …parse your stream and call the handlers…
      handlers.onText('Hello');
      handlers.onDone?.();
    }
  });

  let value = $state('');
  let open = $state(false);
</script>

<ChatBubble bind:open draggable resizable label="Support">
  <Chat
    messages={chat.messages}
    bind:value
    title="Support"
    subtitle="We reply in minutes"
    streaming={chat.isStreaming}
    onsend={(text) => chat.send(text)}
    onstop={() => chat.stop()}
    onclose={() => (open = false)}
  />
</ChatBubble>
```

## Custom launcher icons

Both launcher icons are snippets; provide your own for closed (`icon`) and open (`openIcon`) states, or leave them for the built-in chat / close icons.

```svelte
<ChatBubble bind:open>
  {#snippet icon()}<MessageIcon />{/snippet}
  {#snippet openIcon()}<ChevronDownIcon />{/snippet}
  <Chat {messages} bind:value {onsend} onclose={() => (open = false)} />
</ChatBubble>
```

## Snippets

| Snippet  | Description                                                                          |
| -------- | ----------------------------------------------------------------------------------- |
| children | Panel content, typically a `Chat`. The panel sizes it to `panelWidth`/`panelHeight`.|
| icon     | Launcher contents when closed. Falls back to a built-in chat icon.                  |
| openIcon | Launcher contents when open. Falls back to a built-in close icon.                   |

## Props

| Prop           | Type                                                      | Required | Default         | Description                                                  |
| -------------- | -------------------------------------------------------- | -------- | --------------- | ----------------------------------------------------------- |
| open           | `boolean`                                                | No       | `false`         | Bindable. Whether the panel is open.                        |
| position       | `'bottom-right'\|'bottom-left'\|'top-right'\|'top-left'` | No       | `'bottom-right'`| Which corner the launcher pins to (panel opens toward center).|
| label          | `string`                                                | No       | `'Open chat'`   | Launcher aria-label (closed) and panel aria-label.          |
| closeLabel     | `string`                                                | No       | `'Close chat'`  | Launcher aria-label when open.                              |
| icon           | `Snippet`                                                | No       | `-`             | Launcher icon when closed. Falls back to a built-in asset.   |
| openIcon       | `Snippet`                                                | No       | `-`             | Launcher icon when open. Falls back to a built-in close icon.|
| children       | `Snippet`                                                | No       | `-`             | Panel content (e.g. a `Chat`).                              |
| draggable      | `boolean`                                                | No       | `false`         | Let the user drag the launcher to reposition the whole widget.|
| dragMode       | `'snap' \| 'free'`                                       | No       | `'snap'`        | `'snap'` anchors to the nearest left/right edge on release; `'free'` stays where dropped. |
| dragX          | `number`                                                | No       | `0`             | Bindable. Horizontal drag offset (px) from the anchored corner. |
| dragY          | `number`                                                | No       | `0`             | Bindable. Vertical drag offset (px) from the anchored corner. |
| resizable      | `boolean`                                                | No       | `false`         | Allow resizing the panel (via `Resizable`).                 |
| panelWidth     | `number`                                                | No       | `380`           | Bindable. Panel width in px.                                |
| panelHeight    | `number`                                                | No       | `600`           | Bindable. Panel height in px.                               |
| minPanelWidth  | `number`                                                | No       | `280`           | Minimum panel width when resizing.                         |
| minPanelHeight | `number`                                                | No       | `360`           | Minimum panel height when resizing.                        |
| expanded       | `boolean`                                                | No       | `false`         | Bindable. Toggle to grow the panel to the expanded preset (animated); restores the prior size on collapse. |
| expandedPanelWidth  | `number`                                            | No       | `600`           | Bindable. Panel width (px) when `expanded` (capped to available space). |
| expandedPanelHeight | `number`                                            | No       | `760`           | Bindable. Panel height (px) when `expanded` (capped to available space).|
| testId         | `string`                                                | No       | `-`             | `data-pw` on the root element.                              |
| classes        | `string`                                                | No       | `-`             | Class string on the root element.                          |

## Events

| Event    | Type                       | Description                                  |
| -------- | -------------------------- | -------------------------------------------- |
| onopen   | `() => void`               | Fires when the panel opens.                  |
| onclose  | `() => void`               | Fires when the panel closes.                 |
| ontoggle | `(open: boolean) => void`  | Fires on any open/close, with the new state. |

## Accessibility

- The launcher is a real `Button` with an `aria-label` (`label` when closed, `closeLabel` when open) and `aria-expanded` reflecting the panel state.
- Opening moves focus into the panel (`role="dialog"`, `aria-label={label}`); Escape closes the panel and returns focus to the launcher.
- Dragging is a pointer enhancement layered on the clickable launcher — the widget is fully usable (open, close, converse) without ever dragging, and a drag never fires a toggle.
- The snap animation honors `prefers-reduced-motion: reduce` (the transition is dropped).

## Internal Dependencies

Reuses `Button` (the launcher) and `Resizable` (panel resizing). Its content is whatever you pass — most commonly `Chat` (optionally driven by `ChatController`).

## CSS Variables

| Variable                              | Default                                       | CSS Property  | Description                       |
| ------------------------------------- | --------------------------------------------- | ------------- | --------------------------------- |
| `--chat-bubble-z-index`               | `1000`                                        | z-index       | Stacking order of the widget.     |
| `--chat-bubble-offset-x`              | `24px`                                        | left/right    | Horizontal distance from the edge.|
| `--chat-bubble-offset-y`              | `24px`                                        | top/bottom    | Vertical distance from the edge.  |
| `--chat-bubble-size`                  | `56px`                                        | height/width  | Launcher button size.             |
| `--chat-bubble-padding`               | `16px`                                        | padding       | Launcher icon padding.            |
| `--chat-bubble-border-radius`         | `50%`                                         | border-radius | Launcher corner rounding.         |
| `--chat-bubble-background-color`      | `#18181b`                                     | background    | Launcher background.              |
| `--chat-bubble-color`                 | `#ffffff`                                     | color         | Launcher icon color.              |
| `--chat-bubble-hover-background-color`| `#27272a`                                     | background    | Launcher hover background.        |
| `--chat-bubble-box-shadow`            | `0 8px 24px rgba(0,0,0,0.25)`                 | box-shadow    | Launcher shadow.                  |
| `--chat-bubble-snap-transition`       | `transform 0.28s cubic-bezier(0.22,1,0.36,1)` | transition    | Snap/reposition animation (disabled while dragging and under reduced-motion). |
| `--chat-bubble-expand-transition`     | `width/height 0.32s cubic-bezier(0.22,1,0.36,1)` | transition | Expand/collapse size animation, applied via the panel's `Resizable` (`--resizable-transition`); disabled while drag-resizing and under reduced-motion. |
| `--chat-bubble-panel-gap`             | `16px`                                        | bottom/top    | Gap between launcher and panel.   |
| `--chat-bubble-panel-max-width`       | `calc(100vw - 32px)`                          | max-width     | Panel max width.                  |
| `--chat-bubble-panel-max-height`      | `calc(100dvh - 120px)`                        | max-height    | Panel max height.                 |
| `--chat-bubble-panel-border-radius`   | `16px`                                        | border-radius | Panel corner rounding.            |
| `--chat-bubble-panel-background`      | `#ffffff`                                     | background    | Panel background.                 |
| `--chat-bubble-panel-box-shadow`      | `0 16px 48px rgba(0,0,0,0.22)`                | box-shadow    | Panel shadow.                     |
| `--chat-bubble-resize-handle-color`   | `transparent`                                 | background    | Resize handle fill (when `resizable`). |

Panel size is set via the bindable `panelWidth`/`panelHeight` props (not CSS variables), so it stays in sync when the panel is resized.

## Web Component

Tag: `<sui-chat-bubble>`

```html
<sui-chat-bubble label="Open chat" draggable resizable></sui-chat-bubble>
```

Put panel content in the default slot, and set object props (`icon`, `openIcon`, `onopen`, …) via JavaScript. Boolean/number/string props map to attributes: `draggable`, `resizable`, `drag-mode`, `drag-x`, `drag-y`, `panel-width`, `panel-height`, `min-panel-width`, `min-panel-height`, `expanded`, `expanded-panel-width`, `expanded-panel-height`, `position`, `label`, `close-label`.
