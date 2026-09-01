# ChatMessageList

A scrollable, auto-scrolling container for a conversation. It renders each message with `ChatMessage` by default. To add your own UI below a bubble, pass `messageAttachments` — it receives each `ChatMessageData` and keeps the default bubble along with its copy/retry/feedback actions. To render your own markup *inside* the bubble (metric cards, reports, media) while keeping all of that chrome, pass `messageBody`; keep `content` populated with the text form so the copy action still works. Use the `message` snippet only when you want to replace a message entirely, which forgoes that default rendering. When there are no messages, the `empty` snippet is shown. An exported `scrollToBottom()` instance method scrolls programmatically. Two scroll policies: the default **smart auto-scroll** keeps the latest content in view only while you're already near the bottom, and `scrollPolicy="pin-sender-turn"` implements the conversational-AI pattern — each new sender message pins to the top with reserved headroom (held by `pinHold`) so the reply streams beneath the question. **Smart auto-scroll** keeps the latest content in view only while you're already near the bottom — if you scroll up to read history it won't yank you down, and a **jump-to-latest** button appears instead. Opt-in message actions (`allowCopy`, `onretry`, `onfeedback`) are applied to the default-rendered messages: copy and feedback on assistant messages, retry on the most recent assistant message. Implemented with a Svelte action (no effects), respecting `prefers-reduced-motion`.

## Usage

```svelte
<script>
  import { ChatMessageList } from '@juspay/svelte-ui-components';

  let messages = $state([
    { id: '1', role: 'user', content: 'Hi' },
    { id: '2', role: 'assistant', content: 'Hello!' }
  ]);
</script>

<ChatMessageList {messages} />
```

## Props

| Prop       | Type                          | Required | Default | Description                                                       |
| ---------- | ----------------------------- | -------- | ------- | --------------------------------------------------------------- |
| messages   | `ChatMessageData[]`           | Yes      | `-`     | Messages to render.                                             |
| autoscroll | `boolean`                     | No       | `true`  | Auto-scroll to the latest message as content changes.          |
| message    | `Snippet<[ChatMessageData]>`  | No       | `-`     | Custom per-message rendering; overrides the default bubble.    |
| messageBody | `Snippet<[ChatMessageData]>` | No | `-`     | Own markup inside each bubble; keeps role styling and actions. |
| scrollPolicy | `'near-bottom' \| 'pin-sender-turn'` | No | `'near-bottom'` | `pin-sender-turn` pins each new sender message to the top and reserves headroom so the reply streams beneath it. |
| pinHold | `boolean` | No | `false` | pin-sender-turn only: hold the reserved headroom while the host's turn is still busy; flipping false collapses it. |
| jump | `boolean` | No | `true` | Render the built-in jump-to-latest button. Hosts with their own affordance pass false. |
| messageAttachments | `Snippet<[ChatMessageData]>` | No | `-`     | Own UI below each bubble; keeps the default bubble and actions. |
| empty      | `Snippet`                     | No       | `-`     | Shown when there are no messages.                              |
| jumpLabel  | `string`                      | No       | `'Jump to latest'` | Aria-label for the jump-to-latest button.          |
| jumpIcon   | `Snippet`                     | No       | `-`     | Custom jump-to-latest icon. Falls back to a built-in asset.   |
| allowCopy  | `boolean`                     | No       | `false` | Show copy buttons on assistant messages (default rendering).  |
| testId     | `string`                      | No       | `-`     | `data-pw` on the root element.                                 |
| classes    | `string`                      | No       | `-`     | Class string on the root element.                             |

## Events

| Event      | Type                                                       | Description                                          |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------- |
| onretry    | `() => void`                                               | Enables retry on the most recent assistant message. |
| onfeedback | `(value: 'up' \| 'down', message: ChatMessageData) => void`| Enables feedback on assistant messages.             |
| onscrollstate | `(state: { atBottom: boolean; scrollable: boolean }) => void` | Reports scroll state changes, for external jump affordances. |

## CSS Variables

| Variable                              | Default        | CSS Property    | Description                          |
| ------------------------------------- | -------------- | --------------- | ------------------------------------ |
| `--chat-message-list-gap`             | `1rem`         | gap             | Gap between messages.                |
| `--chat-message-list-padding`         | `0.75rem 1.5rem` | padding       | Padding of the list.                 |
| `--chat-message-list-scroll-behavior` | `smooth`       | scroll-behavior | Scroll behavior (auto when reduced motion). |
| `--chat-message-list-jump-size`       | `36px`         | height/width    | Size of the jump-to-latest button.   |
| `--chat-message-list-jump-bottom`     | `8px`          | bottom          | Sticky offset of the jump button.    |
| `--chat-message-list-jump-background-color` | `#ffffff` | background      | Jump button background.              |
| `--chat-message-list-jump-hover-background-color` | `#f4f4f5` | background | Jump button hover background.       |
| `--chat-message-list-jump-color`      | `#52525b`      | color           | Jump button icon color.              |
| `--chat-message-list-jump-border`     | `1px solid #e4e4e7` | border     | Jump button border.                  |
| `--chat-message-list-jump-border-radius` | `50%`       | border-radius   | Corner rounding of the jump button.  |
| `--chat-message-list-jump-box-shadow` | `0 4px 12px rgba(0,0,0,0.12)` | box-shadow | Jump button shadow.          |
| `--chat-message-list-jump-padding`    | `8px`          | padding         | Padding inside the jump button.      |
| `--chat-message-list-jump-margin-top` | `4px`          | margin-top      | Space above the jump button.         |

## Web Component

Tag: `<sui-chat-message-list>`

```html
<sui-chat-message-list></sui-chat-message-list>
```

Set `.messages` via JavaScript.
