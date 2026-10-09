# ChatMessageList

A scrollable, auto-scrolling container for a conversation. It renders each message with `ChatMessage` by default. To add your own UI below a bubble, pass `messageAttachments` — it receives each `ChatMessageData` and keeps the default bubble along with its copy/retry/feedback actions. To render your own markup _inside_ the bubble (metric cards, reports, media) while keeping all of that chrome, pass `messageBody`; keep `content` populated with the text form so the copy action still works. Use the `message` snippet only when you want to replace a message entirely, which forgoes that default rendering. When there are no messages, the `empty` snippet is shown. An exported `scrollToBottom(behavior?: 'smooth' | 'instant')` instance method scrolls programmatically. `behavior`, when passed, sets the scroll behavior for just that call (without touching the CSS `scroll-behavior` default the rest of the time) and honours `prefers-reduced-motion` by falling back to an instant jump even when `'smooth'` is requested; omitting it uses the list's own scroll-behavior default. Two scroll policies: the default **smart auto-scroll** keeps the latest content in view only while you're already near the bottom, and `scrollPolicy="pin-sender-turn"` implements the conversational-AI pattern — each new sender message pins to the top with reserved headroom (held by `pinHold`) so the reply streams beneath the question. **Smart auto-scroll** keeps the latest content in view only while you're already near the bottom — if you scroll up to read history it won't yank you down, and a **jump-to-latest** button appears instead. Opt-in message actions (`allowCopy`, `onretry`, `onfeedback`) are applied to the default-rendered messages: copy and feedback on assistant messages, retry on the most recent assistant message. Implemented with a Svelte action (no effects), respecting `prefers-reduced-motion`.

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

| Prop               | Type                                 | Required | Default                   | Description                                                                                                        |
| ------------------ | ------------------------------------ | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| messages           | `ChatMessageData[]`                  | Yes      | `-`                       | Messages to render.                                                                                                |
| autoscroll         | `boolean`                            | No       | `true`                    | Auto-scroll to the latest message as content changes.                                                              |
| message            | `Snippet<[ChatMessageData]>`         | No       | `-`                       | Custom per-message rendering; overrides the default bubble.                                                        |
| messageBody        | `Snippet<[ChatMessageData]>`         | No       | `-`                       | Own markup inside each bubble; keeps role styling and actions.                                                     |
| scrollPolicy       | `'near-bottom' \| 'pin-sender-turn'` | No       | `'near-bottom'`           | `pin-sender-turn` pins each new sender message to the top and reserves headroom so the reply streams beneath it.   |
| pinHold            | `boolean`                            | No       | `false`                   | pin-sender-turn only: hold the reserved headroom while the host's turn is still busy; flipping false collapses it. |
| jump               | `boolean`                            | No       | `true`                    | Render the built-in jump-to-latest button. Hosts with their own affordance pass false.                             |
| hideScrollbar      | `boolean`                            | No       | `false`                   | Hide the list's own scrollbar while it stays scrollable, like Scroller's `hideScrollbar`.                          |
| messageAttachments | `Snippet<[ChatMessageData]>`         | No       | `-`                       | Own UI below each bubble; keeps the default bubble and actions.                                                    |
| empty              | `Snippet`                            | No       | `-`                       | Shown when there are no messages.                                                                                  |
| jumpLabel          | `string`                             | No       | `'Jump to latest'`        | Aria-label for the jump-to-latest button.                                                                          |
| jumpIcon           | `Snippet`                            | No       | `-`                       | Custom jump-to-latest icon. Falls back to a built-in asset.                                                        |
| allowCopy          | `boolean`                            | No       | `false`                   | Show copy buttons on assistant messages (default rendering).                                                       |
| testId             | `string`                             | No       | `-`                       | `data-pw` on the root element.                                                                                     |
| ariaLabel          | `string`                             | No       | `'Conversation messages'` | Accessible transcript name, including its native keyboard scroll stop when content overflows.                      |
| classes            | `string`                             | No       | `-`                       | Class string on the root element.                                                                                  |

### Scrollbar, overflow and overscroll

The list scrolls vertically (`overflow-y: auto`) and, by default, leaves everything else to the browser.
Pass `hideScrollbar` to hide its scrollbar without losing scrolling (web component: the `hide-scrollbar`
attribute). It adds the class `hide-scrollbar`, the library's own name (Scroller's, too), so a class of that
name that you pass through `classes` with another meaning is affected as well. Set
`--chat-message-list-overflow-x: hidden` to clip wide content instead of scrolling it sideways, and
`--chat-message-list-overscroll-behavior: none` (or `contain`) to stop a scroll that reaches the end of the
list from moving the page behind it. `overflow-x` and `overflow-y` are not independent: with the token set
to `hidden` beside an `overflow-y: visible` rule of your own, the browser computes `overflow-y` to `auto`.

Unset, each token hands the property back to the cascade, so the list is what it was before the tokens:
`overflow-x: visible`, which the browser computes to `auto` beside `overflow-y: auto`, and
`overscroll-behavior: auto`. A rule of your own wins over the tokens' declarations, which carry no
specificity: a selector with at least element, class or attribute weight wins wherever its stylesheet loads.
A rule inside a cascade `@layer` wins only while the token is unset (the unset token reverts to the layer
below it); a set token is an unlayered declaration and beats every layered rule. The exception is a rule with
no specificity at all (`*` or `:where(...)`) that loads before this library's stylesheet: the library's
declaration comes later at equal specificity and wins, so load that rule after the library's CSS, or set the
token.

### The message column

Messages sit in an inner column that fills the list. Five tokens lay it out without a rule that reaches
into the component: `--chat-message-list-inner-padding-bottom` (clearance below the last message, for a
floating composer or suggestion chips), `--chat-message-list-inner-padding-inline` (space beside the
column), `--chat-message-list-inner-width`, `--chat-message-list-inner-max-width` and
`--chat-message-list-inner-margin-inline`. To centre the column on a wide screen set all three of those:
`100%`, a maximum width and `auto`. An auto margin turns the column's stretch off, so without the width it
shrinks to its content. Padding is counted in the width only under `box-sizing: border-box`, which most
resets set; inside the web component's shadow root nothing sets it, so there padding adds to the width. Set the tokens on the list or on any ancestor of it; for the web component, on the element,
since custom properties cross the shadow root. Unset, the column has no padding, no margin, no width of its
own and no maximum width, as before. They follow the cascade rules
of the previous section: a rule of your own wins over them wherever it is written, except inside a cascade
`@layer`, where it wins only while the token is unset, and except a rule with no specificity at all (`*` or
`:where(...)`) that loads before this library's stylesheet, which the library's later declaration beats.

## Events

| Event         | Type                                                          | Description                                                  |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| onretry       | `() => void`                                                  | Enables retry on the most recent assistant message.          |
| onfeedback    | `(value: 'up' \| 'down', message: ChatMessageData) => void`   | Enables feedback on assistant messages.                      |
| onscrollstate | `(state: { atBottom: boolean; scrollable: boolean }) => void` | Reports scroll state changes, for external jump affordances. |

## Accessibility — how messages get announced

The list is a live region, and this is a policy rather than an incidental
attribute. It is documented here because it is easy to undo by accident.

The list root carries `role="log"` with `aria-live="polite"`. `log` is the role
for a running, append-only record, and `polite` means a new message is announced
once the screen reader finishes what it is saying rather than interrupting.

A **streaming** message body is silenced while, and only while, it grows. A
typewriter body gains text one character at a time; inside a polite live region
that would be announced on every tick, producing a stutter of partial words
instead of one sentence. So `ChatMessage` sets `aria-live="off"` and
`aria-busy="true"` on the body while `streaming` is true, and removes both when
it settles:

- `aria-live="off"` is the spec answer — the innermost live setting wins, so the
  body opts out of the region it sits in.
- `aria-busy="true"` is the purpose-built one — "being modified, wait before
  exposing this to the user".

Both are set, so the behaviour does not depend on any single one being
implemented well by a given screen reader.

The silence must be **temporary**. Leaving `aria-live="off"` on after streaming
ends would suppress the settled message too — which is the one announcement the
live region exists to make.

If you replace the list root or render your own message body, carry these across
or the chat stops being usable without sight.

`tests/chat-live-region-policy.test.ts` asserts the list-level clauses — that the
root is a polite `log`, and that silencing a message never silences the region
itself. The two body-level clauses are **not** covered: the demo route has no
fixture that streams a message body, so there is no moment at which one exists
to inspect. That is a gap in coverage, not in behaviour.

## CSS Variables

`--chat-message-list-padding` is also read by ChatMessage as the fallback indent for the lists inside a message body, so setting it to `0` for the list removes that indent too. Set `--chat-message-body-list-padding` to give those lists their own value (see `docs/ChatMessage.md`).

| Variable                                          | Default                       | CSS Property        | Description                                 |
| ------------------------------------------------- | ----------------------------- | ------------------- | ------------------------------------------- |
| `--chat-message-list-gap`                         | `1rem`                        | gap                 | Gap between messages.                       |
| `--chat-message-list-padding`                     | `0.75rem 1.5rem`              | padding             | Padding of the list.                        |
| `--chat-message-list-scroll-behavior`             | `smooth`                      | scroll-behavior     | Scroll behavior (auto when reduced motion). |
| `--chat-message-list-overflow-x`                  | `visible`                     | overflow-x          | Horizontal overflow of the list.            |
| `--chat-message-list-overscroll-behavior`         | `auto`                        | overscroll-behavior | Whether a scroll at the end chains outward. |
| `--chat-message-list-inner-padding-bottom`        | `0`                           | padding-bottom      | Clearance below the last message.           |
| `--chat-message-list-inner-padding-inline`        | `0`                           | padding-inline      | Space beside the message column.            |
| `--chat-message-list-inner-width`                 | `auto`                        | width               | Width of the message column.                |
| `--chat-message-list-inner-max-width`             | `none`                        | max-width           | Maximum width of the message column.        |
| `--chat-message-list-inner-margin-inline`         | `0`                           | margin-inline       | Margin beside the column.                   |
| `--chat-message-list-jump-size`                   | `36px`                        | height/width        | Size of the jump-to-latest button.          |
| `--chat-message-list-jump-bottom`                 | `8px`                         | bottom              | Sticky offset of the jump button.           |
| `--chat-message-list-jump-background-color`       | `#ffffff`                     | background          | Jump button background.                     |
| `--chat-message-list-jump-hover-background-color` | `#f4f4f5`                     | background          | Jump button hover background.               |
| `--chat-message-list-jump-color`                  | `#52525b`                     | color               | Jump button icon color.                     |
| `--chat-message-list-jump-border`                 | `1px solid #e4e4e7`           | border              | Jump button border.                         |
| `--chat-message-list-jump-border-radius`          | `50%`                         | border-radius       | Corner rounding of the jump button.         |
| `--chat-message-list-jump-box-shadow`             | `0 4px 12px rgba(0,0,0,0.12)` | box-shadow          | Jump button shadow.                         |
| `--chat-message-list-jump-padding`                | `8px`                         | padding             | Padding inside the jump button.             |
| `--chat-message-list-jump-margin-top`             | `4px`                         | margin-top          | Space above the jump button.                |

## Web Component

Tag: `<sui-chat-message-list>`

```html
<sui-chat-message-list></sui-chat-message-list>
```

Set `.messages` via JavaScript.

### Web Component Events

`onscrollstate`, `onretry` and `onfeedback` are available as JS properties, and each also
dispatches a same-named DOM custom event (bubbles, composed) for a consumer who only calls
`addEventListener` — `scrollstate`'s detail is the `{ atBottom, scrollable }` state object
as-is, `retry` carries no detail, and `feedback`'s detail is `{ value, message }`:

```js
const list = document.querySelector('sui-chat-message-list');
list.addEventListener('scrollstate', (e) => setJumpVisible(!e.detail.atBottom));
list.addEventListener('feedback', (e) => rate(e.detail.value, e.detail.message));
```

None of this element's callback props collide with a native `HTMLElement` accessor, so there is
nothing to caveat here.

### Slots

| Slot Name   | Maps to Snippet | Description                                                         |
| ----------- | --------------- | ------------------------------------------------------------------- |
| `empty`     | `empty`         | Shown when there are no messages.                                   |
| `jump-icon` | `jumpIcon`      | Custom jump-to-latest icon. Defaults to the built-in chevron glyph. |

> **Svelte-only:** `message` (receives `ChatMessageData`), `messageBody` (receives `ChatMessageData`), `messageAttachments` (receives `ChatMessageData`) take arguments, so they cannot be expressed as a named slot: a Web Component `<slot>` projects markup, it does not forward Svelte snippet parameters, so the arguments above would be silently dropped. Use the Svelte component directly when you need these.

## Keyboard reading

An overflowing transcript joins the native Tab order so readers can use the browser's scroll keys even when its messages contain no interactive controls and `jump={false}`. It leaves that order when the transcript fits. `ariaLabel` supplies its accessible name (default `Conversation messages`), and `--chat-message-list-focus-outline` customizes the visible focus ring. The custom element accepts `aria-label` or `chatMessageListAriaLabel`.
