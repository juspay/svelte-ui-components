# ChatMessage

A single chat bubble. The primitive is the **party** — every message is from one of two sides: `'sender'` (your side; aligned right with an accent bubble) or `'responder'` (the other side; aligned left). `role` takes those primitives directly, plus recognized extensions that map onto them — `'user'` → sender, `'assistant'`/`'system'` → responder, and any custom string → responder. So LLM-style message arrays drop in unchanged while layout and styling stay driven by the two-party primitive (use the exported `partyOf(role)` to resolve a role yourself). Renders `markdown` through the library's sanitized-by-construction pipeline (see `MarkdownText`) when provided, else pre-sanitized `html`, else plain `content` text. While `streaming` with no content yet, it shows a typing indicator (the `LoadingDots` component). Avatar, a header row (author/time), and attachments are supplied as snippets, keeping the component free of any app-specific data shape. Rendered markdown elements (`p`, `a`, `code`, `pre`, lists, headings, blockquotes, tables, images) are styled via `:global` so both `markdown` output and injected HTML look right.

## Usage

```svelte
<script>
  import { ChatMessage } from '@juspay/svelte-ui-components';
</script>

<ChatMessage role="sender" content="Hello!" />
<ChatMessage
  role="responder"
  markdown="Hi — here is **bold**, `code`, and a [link](https://example.com)."
/>
<ChatMessage role="responder" html="<p>Hi — how can I help?</p>" />
<ChatMessage role="responder" content="" streaming={true} />

<!-- LLM-style roles are recognized extensions and map onto the same two parties -->
<ChatMessage role="user" content="Renders identically to sender" />
<ChatMessage role="assistant" content="Renders identically to responder" />
```

## Props

| Prop                                                         | Type                             | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| role                                                         | `ChatRole`                       | Yes      | `-`     | The message's party or an extension mapping to one (`sender`/`user` → sender side; everything else → responder). Drives alignment and bubble styling. See Type Reference.                                                                                                                                                                                                                                                                                                                                                                                                      |
| content                                                      | `string`                         | No       | `''`    | Plain-text content. Rendered as text unless `html` is set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| html                                                         | `string`                         | No       | `-`     | Pre-sanitized HTML rendered in place of `content`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| markdown                                                     | `string`                         | No       | `-`     | Markdown source rendered through the sanitized pipeline (raw HTML escaped, unsafe link/image protocols stripped — see `MarkdownText`). Non-empty `markdown` wins over `html`/`content`; a `body` snippet still wins. An empty string is treated as absent and falls through, exactly like `html`. Used as copy text when `content` is empty. The pipeline loads on demand — the `marked` peer is only needed when this prop is used; during SSR and while loading, `html`/`content` render as the fallback (use `MarkdownText`/`renderMarkdown` for server-rendered markdown). |
| markdownTableLabel                                           | `string`                         | No       | `-`     | Accessible name for each scroll region wrapping a table rendered from `markdown`, including typewriter/streaming output. Omitted or empty preserves the shared renderer's unnamed wrapper. Does not alter caller-supplied `html` or a `body` snippet.                                                                                                                                                                                                                                                                                                                          |
| body                                                         | `Snippet \| null`                | No       | `-`     | Replaces the rendered body while keeping the bubble chrome (avatar, header, attachments, actions). Keep `content` as the text form for copy.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| streaming                                                    | `boolean`                        | No       | `false` | Shows a typing indicator when there is no content yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| typewriter                                                   | `boolean`                        | No       | `false` | Reveal the message progressively through `TypewriterText` instead of painting it at once. Drives off `markdown` or `content`, never `html`; `markdown` types through the same pipeline the static branch uses, so rich text reveals as rich text. `streaming` selects the mode: true keeps typing as the text grows, false shows the remainder at once. Ignored when `body` is set.                                                                                                                                                                                            |
| typewriterSpeed                                              | `number`                         | No       | `-`     | Milliseconds between characters while typing, clamped to a minimum of 1; a non-finite value is ignored. Defaults to `TypewriterText`'s own.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| clampLines                                                   | `number`                         | No       | `0`     | Collapse the rendered body to this many lines and render an expand/collapse `Button` below it. `0` or omitted leaves the message uncollapsed and renders no control. The clamp applies to the rendered body, so `content` — and the copy action — always carry the whole message. A consumer stylesheet setting `--chat-message-clamp-lines` takes priority over this value. See Accessibility.                                                                                                                                                                                |
| marker                                                       | `boolean`                        | No       | `false` | Draw an accent bar along the bubble's leading edge — the quote-bar shape used to mark one party's turns on a flat surface. Decorative and `aria-hidden`; positioned with `--chat-message-marker-offset`. See Marker.                                                                                                                                                                                                                                                                                                                                                           |
| status                                                       | `'sending' \| 'sent' \| 'error'` | No       | `-`     | `error` tints the bubble with the error color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| avatar                                                       | `Snippet`                        | No       | `-`     | Avatar shown beside the bubble.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| header                                                       | `Snippet`                        | No       | `-`     | Header row above the bubble (author name, timestamp, etc.).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| attachments                                                  | `Snippet \| null`                | No       | `-`     | Content rendered below the bubble. Collapses to no layout when it renders nothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| allowCopy                                                    | `boolean`                        | No       | `false` | Show a built-in copy button in the hover actions row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| actions                                                      | `Snippet`                        | No       | `-`     | Extra custom actions appended to the actions row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| copyLabel / retryLabel / feedbackUpLabel / feedbackDownLabel | `string`                         | No       | `…`     | Aria-labels for the action buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| expandLabel / collapseLabel                                  | `string`                         | No       | `…`     | Label on the expand/collapse button, swapped on the expanded state. Defaults `Expand message` / `Collapse message`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| testId                                                       | `string`                         | No       | `-`     | `data-pw` on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| classes                                                      | `string`                         | No       | `-`     | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

The `markdownTableLabel` name can be localized and changed while mounted. It uses the existing shared `renderMarkdown` table-label option, so labels are escaped before entering attributes and the nested table keeps its native rows and cells. For `<sui-chat-message>`, set `markdown-table-label` or assign `element.markdownTableLabel`. `ChatMessageData` carries the same optional field through `ChatMessageList` and `Chat`; appending streamed markdown retains that context.

## Events

| Event      | Type                                        | Description                                              |
| ---------- | ------------------------------------------- | -------------------------------------------------------- |
| onretry    | `(() => void) \| null`                      | Enables the retry button. Fires when retry is pressed.   |
| onfeedback | `((value: 'up' \| 'down') => void) \| null` | Enables the 👍/👎 buttons. Fires with the chosen rating. |
| oncopy     | `(text: string) => void`                    | Fires after a successful copy, with the copied text.     |

Actions appear on hover (and always on touch devices) below the bubble; the copy button briefly shows a checkmark on success. Actions (copy/retry/feedback) apply to **responder** messages.

## Type Reference

```ts
// The primitive — every message is from one of two sides of the conversation.
type ChatParty = 'sender' | 'responder';

// Roles are the primitives plus recognized extensions; custom strings are allowed.
type ChatRole = ChatParty | 'user' | 'assistant' | 'system' | (string & {});

// Resolve any role to its party (exported from the package):
partyOf(role: ChatRole): ChatParty; // 'sender' | 'user' → 'sender'; everything else → 'responder'
```

## Accessibility

Only relevant when `clampLines` is set; without it the bubble is inert markup and none of this applies.

- The disclosure control is a real `Button`, rendered below the clamped body. It carries the accessible name (`expandLabel` / `collapseLabel`), `aria-expanded`, the focus order and native keyboard activation.
- **The bubble itself is deliberately not a button.** `role="button"` has presentational children, so it flattens the semantics of everything inside it — and a message body routinely renders paragraphs and lists from `markdown`, `html` or a `body` snippet. Giving the bubble the role would cost a screen-reader user that structure on every clamped message.
- The bubble carries no handler either. An earlier revision let a click anywhere on it toggle, as a pointer convenience; that made it a control keyboard users could not reach, so it is gone. The Button is the only way to toggle, for every input method.
- `aria-controls` on the button points at the clamped body, so assistive tech can reach the region the control governs. The id is generated per instance, so two clamped messages on one page never collide.

## Streaming

`typewriter` and `streaming` compose into the shape a chat surface actually needs: while a reply
is arriving, `streaming` stays `true` and the text keeps typing as it grows; when the turn ends,
`streaming` goes `false` and whatever is left is shown at once rather than typed out after the
fact. Feed the accumulated text — `TypewriterText` continues from where it left off rather than
restarting, so appending to `markdown`/`content` is all a consumer has to do.

The body is `aria-live="off"` and `aria-busy="true"` **while `streaming` is true**, and only then.
That matters when the message sits inside a live region: `ChatMessageList` is `role="log"
aria-live="polite"`, so without it a body growing one character at a time would be announced on
every character. The settled text is still read normally, and outside a live region both
attributes are inert.

`streaming` is the right condition rather than an approximation of one, because a `typewriter`
message with `streaming` false does not reveal incrementally at all: `TypewriterText` clears its
pending timer and assigns the whole string, so the body goes from empty to complete in a single
step. There is no unannounced window to cover.

`streaming` on its own (no `typewriter`) still means what it always did: a typing indicator while
there is no content yet.

### Through `ChatMessageList` and `Chat`

`ChatMessageData` carries `typewriter` and `typewriterSpeed`, so a list can reveal one message
without touching the rest:

```js
messages = [...messages, { id, role: 'responder', content: '', typewriter: true, streaming: true }];
```

`Chat` does **not** set them, and should not be given them: its controller already reveals
progressively one layer down, buffering the stream and appending to `content` on a timer. Setting
`typewriter` on a message `Chat` owns would reveal an already-revealing string — the two would
compose into a much slower, uneven crawl. Use the controller's own `typewriter` option there, and
this prop when you drive `ChatMessage` or `ChatMessageList` yourself.

## Marker

`marker` draws an accent bar along the bubble's leading edge — the quote-bar shape used to mark
one party's turns on a flat surface, where neither side has a filled bubble to tell them apart.

It is decorative. The bar carries no text and is `aria-hidden`, so the distinction it makes has to
be carried by something a screen reader can reach as well; `role` already does that, which is why
the marker adds nothing to the accessibility tree.

The bar is positioned with logical properties, so it follows `role` alignment into RTL rather than
pinning to the left. `--chat-message-marker-offset` is the one to reach for: it defaults to `0`
(flush with the bubble edge) and takes a negative value to sit in the gutter outside the bubble.

```css
.flat-surface .chat-message {
  --chat-message-marker-offset: -12px;
  --chat-message-marker-width: 3px;
  --chat-message-marker-color: var(--your-indicator-color, #6d28d9);
}
```

## CSS Variables

| Variable                                       | Default                   | CSS Property       | Description                                             |
| ---------------------------------------------- | ------------------------- | ------------------ | ------------------------------------------------------- |
| `--chat-message-max-width`                     | `82%`                     | max-width          | Max width of the message.                               |
| `--chat-message-min-width`                     | `auto`                    | min-width          | Minimum width; `0` or a length replaces `auto`.         |
| `--chat-message-margin`                        | `0`                       | margin             | Margin around the message.                              |
| `--chat-message-gap`                           | `10px`                    | gap                | Gap between avatar and bubble.                          |
| `--chat-message-content-gap`                   | `6px`                     | gap                | Gap between header, bubble, attachments.                |
| `--chat-message-header-font-size`              | `0.75rem`                 | font-size          | Header row font size.                                   |
| `--chat-message-header-color`                  | `#71717a`                 | color              | Header row color.                                       |
| `--chat-message-bubble-padding`                | `9px 13px`                | padding            | Bubble padding.                                         |
| `--chat-message-bubble-border-radius`          | `16px`                    | border-radius      | Bubble corner rounding.                                 |
| `--chat-message-font-size`                     | `0.9375rem`               | font-size          | Bubble text size.                                       |
| `--chat-message-line-height`                   | `1.5`                     | line-height        | Bubble line height.                                     |
| `--chat-message-color`                         | `#27272a`                 | color              | Default bubble text color.                              |
| `--chat-message-background`                    | `#f4f4f5`                 | background         | Default bubble background.                              |
| `--chat-message-border`                        | `none`                    | border             | Default bubble border.                                  |
| `--chat-message-box-shadow`                    | `none`                    | box-shadow         | Default bubble shadow.                                  |
| `--chat-message-clamp-lines`                   | `clampLines`, else `2`    | line-clamp         | Line count for a clamped bubble. Outranks the prop.     |
| `--chat-message-clamp-toggle-margin-top`       | `4px`                     | margin-top         | Gap between the clamped body and its toggle button.     |
| `--chat-message-sender-color`                  | `#ffffff`                 | color              | Sender bubble text color.                               |
| `--chat-message-sender-background`             | `#18181b`                 | background         | Sender bubble background.                               |
| `--chat-message-sender-border`                 | `none`                    | border             | Sender bubble border.                                   |
| `--chat-message-sender-border-radius`          | `16px`                    | border-radius      | Sender bubble corner rounding.                          |
| `--chat-message-responder-color`               | `#27272a`                 | color              | Responder bubble text color.                            |
| `--chat-message-responder-background`          | `transparent`             | background         | Responder bubble background.                            |
| `--chat-message-responder-border`              | `none`                    | border             | Responder bubble border.                                |
| `--chat-message-responder-padding`             | `2px 0`                   | padding            | Responder bubble padding.                               |
| `--chat-message-marker-width`                  | `2px`                     | width              | Thickness of the `marker` bar.                          |
| `--chat-message-marker-color`                  | `#6d28d9`                 | background         | Color of the `marker` bar.                              |
| `--chat-message-marker-offset`                 | `0px`                     | inset-inline-start | Leading offset; negative puts it outside the bubble.    |
| `--chat-message-marker-inset-block`            | `0`                       | inset-block        | Vertical inset, to stop the bar short of the edges.     |
| `--chat-message-marker-border-radius`          | `0`                       | border-radius      | Rounding of the `marker` bar.                           |
| `--chat-message-error-color`                   | `#e0334b`                 | color              | Bubble color when `status` is `error`.                  |
| `--chat-message-attachments-gap`               | `8px`                     | gap                | Gap between attachments.                                |
| `--chat-message-attachments-margin`            | `4px 0 0 0`               | margin             | Margin above attachments.                               |
| `--chat-message-link-color`                    | `#6d28d9`                 | color              | Link color inside rendered HTML.                        |
| `--chat-message-code-font-family`              | `ui-monospace, monospace` | font-family        | Inline/code-block font.                                 |
| `--chat-message-code-background`               | `rgba(0,0,0,0.05)`        | background         | Inline code background.                                 |
| `--chat-message-pre-background`                | `rgba(0,0,0,0.05)`        | background         | Code-block background.                                  |
| `--chat-message-paragraph-margin`              | `0 0 0.5em 0`             | margin             | Paragraph spacing inside rendered HTML.                 |
| `--chat-message-body-list-margin`              | `0.4em 0`                 | margin             | Margin of a rendered `<ul>`/`<ol>`; read first.         |
| `--chat-message-body-list-padding`             | `1.4em`                   | padding-left       | Indent of a rendered `<ul>`/`<ol>`; read first.         |
| `--chat-message-list-margin`                   | `0.4em 0`                 | margin             | Margin around a rendered `<ul>`/`<ol>` list.            |
| `--chat-message-list-padding`                  | `1.4em`                   | padding-left       | Indent of a rendered `<ul>`/`<ol>` list.                |
| `--chat-message-heading-margin`                | `0.8em 0 0.4em 0`         | margin             | Margin around a rendered heading.                       |
| `--chat-message-blockquote-border-color`       | `rgba(0,0,0,0.15)`        | border-color       | Left border color of a rendered blockquote.             |
| `--chat-message-blockquote-opacity`            | `0.85`                    | opacity            | Opacity of rendered blockquote text.                    |
| `--chat-message-table-border-color`            | `rgba(0,0,0,0.12)`        | border-color       | Border color of a rendered table and its cells.         |
| `--chat-message-table-header-background`       | `rgba(0,0,0,0.04)`        | background         | Background of a rendered table's header row.            |
| `--chat-message-table-focus-outline-color`     | `#3b82f6`                 | outline-color      | Focus ring color of a rendered table's scroll wrapper.  |
| `--chat-message-image-border-radius`           | `8px`                     | border-radius      | Corner rounding of a rendered image.                    |
| `--chat-message-hr-color`                      | `rgba(0,0,0,0.12)`        | border-top         | Color of a rendered horizontal rule.                    |
| `--chat-message-actions-gap`                   | `2px`                     | gap                | Gap between action buttons.                             |
| `--chat-message-actions-opacity`               | `0`                       | opacity            | Resting opacity of the actions row (revealed on hover). |
| `--chat-message-actions-transition`            | `opacity 0.15s ease`      | transition         | Transition for the actions row's hover reveal.          |
| `--chat-message-action-size`                   | `28px`                    | height/width       | Size of each action button.                             |
| `--chat-message-action-padding`                | `6px`                     | padding            | Padding of each action button.                          |
| `--chat-message-action-border-radius`          | `6px`                     | border-radius      | Corner rounding of each action button.                  |
| `--chat-message-action-background-color`       | `transparent`             | background         | Resting background of each action button.               |
| `--chat-message-action-color`                  | `#71717a`                 | color              | Icon color of action buttons.                           |
| `--chat-message-action-hover-background-color` | `#f4f4f5`                 | background         | Action button hover background.                         |

`--chat-message-min-width` leaves the message's minimum width alone, which is `auto`: a content-based
minimum in a flex row or a grid track, and `0` in a block parent. Set it to `0` or to a length to
replace that minimum. A message in a flex row or a grid track can then shrink below its content, so a
long code line or a wide table scrolls inside the bubble instead of stretching the row. A length such
as `120px` also gives short messages a floor, and likewise lets one wider than its parent shrink to it.
In a column flex parent and a block parent `0` changes nothing. For `<sui-chat-message>` see Web
Component below.

The shrink shows once `--chat-message-max-width` lets the content through. With the default `82%` a
flex row already holds the message to 82% of the row, so `0` changes only its computed `min-width`
there. A grid track is sized from the content in Chromium and Firefox, so the cap does not hold and `0`
brings the message back to it (WebKit holds the cap either way).

The declaration has no specificity, and while the token is unset it gives the property up, so an app
rule that already sets `min-width` on `.chat-message` keeps winning, including one inside a cascade
`@layer`. The exception is a `*` rule that comes before the library's stylesheet: it ties with the
declaration and loses, so set the token to the value you want. A token that is set wins over a layered
rule and over such a `*` rule, and loses to an unlayered rule on `.chat-message`.

`--chat-message-list-margin` and `--chat-message-list-padding` also share a name with ChatMessageList's own
padding token: a page that sets `--chat-message-list-padding: 0` for the list removes the indent of every
list inside a message as well. `--chat-message-body-list-margin` and `--chat-message-body-list-padding` are
read first and fall back to the older names, so a message that sets neither is unchanged, and a page can now
give the list and the lists inside its messages different padding.

## Web Component

Tag: `<sui-chat-message>`

```html
<sui-chat-message role="sender" content="Hello!"></sui-chat-message>
```

### Minimum width

`--chat-message-min-width` crosses the shadow root and sets the `min-width` of the message inside, so a
floor such as `--chat-message-min-width: 120px` works on `<sui-chat-message>`. The flex or grid item is
the element itself, though, and it keeps its own content-based minimum, so `--chat-message-min-width: 0`
on a parent does not let the element shrink. Put `min-width: 0` on the element for that:

```css
sui-chat-message {
  min-width: 0;
}
```

### Web Component Events

`onretry` and `onfeedback` are available as JS properties, and each also dispatches a
same-named DOM custom event (bubbles, composed) for a consumer who only calls
`addEventListener` — `retry` carries no detail, `feedback`'s detail is the
`ChatMessageFeedback` value as-is:

```js
const message = document.querySelector('sui-chat-message');
message.addEventListener('retry', () => resend());
message.addEventListener('feedback', (e) => rate(e.detail));
```

`oncopy` stays a JS-property-only callback and does not dispatch a DOM event: `copy` is already
`HTMLElement`'s own native event, so a `message.addEventListener('copy', ...)` listener would
receive both the real one and a synthetic one under the same name.

### Slots

| Slot Name     | Maps to Snippet | Description                                                                                                                                                                                        |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `body`        | `body`          | Replaces the rendered body while keeping the bubble chrome. Takes effect only once slotted — an unslotted `<sui-chat-message>` keeps rendering `markdown`/`html`/`content` instead of going blank. |
| `avatar`      | `avatar`        | Avatar shown beside the bubble.                                                                                                                                                                    |
| `header`      | `header`        | Header row above the bubble (author name, timestamp, etc.).                                                                                                                                        |
| `attachments` | `attachments`   | Content rendered below the bubble.                                                                                                                                                                 |
| `actions`     | `actions`       | Extra custom actions appended to the actions row.                                                                                                                                                  |
