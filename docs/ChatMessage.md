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
| body                                                         | `Snippet \| null`                | No       | `-`     | Replaces the rendered body while keeping the bubble chrome (avatar, header, attachments, actions). Keep `content` as the text form for copy.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| streaming                                                    | `boolean`                        | No       | `false` | Shows a typing indicator when there is no content yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| status                                                       | `'sending' \| 'sent' \| 'error'` | No       | `-`     | `error` tints the bubble with the error color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| avatar                                                       | `Snippet`                        | No       | `-`     | Avatar shown beside the bubble.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| header                                                       | `Snippet`                        | No       | `-`     | Header row above the bubble (author name, timestamp, etc.).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| attachments                                                  | `Snippet \| null`                | No       | `-`     | Content rendered below the bubble. Collapses to no layout when it renders nothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| allowCopy                                                    | `boolean`                        | No       | `false` | Show a built-in copy button in the hover actions row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| actions                                                      | `Snippet`                        | No       | `-`     | Extra custom actions appended to the actions row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| copyLabel / retryLabel / feedbackUpLabel / feedbackDownLabel | `string`                         | No       | `…`     | Aria-labels for the action buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| testId                                                       | `string`                         | No       | `-`     | `data-pw` on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| classes                                                      | `string`                         | No       | `-`     | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

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

## CSS Variables

| Variable                                       | Default                   | CSS Property  | Description                                             |
| ---------------------------------------------- | ------------------------- | ------------- | ------------------------------------------------------- |
| `--chat-message-max-width`                     | `82%`                     | max-width     | Max width of the message.                               |
| `--chat-message-margin`                        | `0`                       | margin        | Margin around the message.                              |
| `--chat-message-gap`                           | `10px`                    | gap           | Gap between avatar and bubble.                          |
| `--chat-message-content-gap`                   | `6px`                     | gap           | Gap between header, bubble, attachments.                |
| `--chat-message-header-font-size`              | `0.75rem`                 | font-size     | Header row font size.                                   |
| `--chat-message-header-color`                  | `#71717a`                 | color         | Header row color.                                       |
| `--chat-message-bubble-padding`                | `9px 13px`                | padding       | Bubble padding.                                         |
| `--chat-message-bubble-border-radius`          | `16px`                    | border-radius | Bubble corner rounding.                                 |
| `--chat-message-font-size`                     | `0.9375rem`               | font-size     | Bubble text size.                                       |
| `--chat-message-line-height`                   | `1.5`                     | line-height   | Bubble line height.                                     |
| `--chat-message-color`                         | `#27272a`                 | color         | Default bubble text color.                              |
| `--chat-message-background`                    | `#f4f4f5`                 | background    | Default bubble background.                              |
| `--chat-message-border`                        | `none`                    | border        | Default bubble border.                                  |
| `--chat-message-box-shadow`                    | `none`                    | box-shadow    | Default bubble shadow.                                  |
| `--chat-message-sender-color`                  | `#ffffff`                 | color         | Sender bubble text color.                               |
| `--chat-message-sender-background`             | `#18181b`                 | background    | Sender bubble background.                               |
| `--chat-message-sender-border`                 | `none`                    | border        | Sender bubble border.                                   |
| `--chat-message-sender-border-radius`          | `16px`                    | border-radius | Sender bubble corner rounding.                          |
| `--chat-message-responder-color`               | `#27272a`                 | color         | Responder bubble text color.                            |
| `--chat-message-responder-background`          | `transparent`             | background    | Responder bubble background.                            |
| `--chat-message-responder-border`              | `none`                    | border        | Responder bubble border.                                |
| `--chat-message-responder-padding`             | `2px 0`                   | padding       | Responder bubble padding.                               |
| `--chat-message-error-color`                   | `#e0334b`                 | color         | Bubble color when `status` is `error`.                  |
| `--chat-message-attachments-gap`               | `8px`                     | gap           | Gap between attachments.                                |
| `--chat-message-attachments-margin`            | `4px 0 0 0`               | margin        | Margin above attachments.                               |
| `--chat-message-link-color`                    | `#6d28d9`                 | color         | Link color inside rendered HTML.                        |
| `--chat-message-code-font-family`              | `ui-monospace, monospace` | font-family   | Inline/code-block font.                                 |
| `--chat-message-code-background`               | `rgba(0,0,0,0.05)`        | background    | Inline code background.                                 |
| `--chat-message-pre-background`                | `rgba(0,0,0,0.05)`        | background    | Code-block background.                                  |
| `--chat-message-paragraph-margin`              | `0 0 0.5em 0`             | margin        | Paragraph spacing inside rendered HTML.                 |
| `--chat-message-actions-gap`                   | `2px`                     | gap           | Gap between action buttons.                             |
| `--chat-message-actions-opacity`               | `0`                       | opacity       | Resting opacity of the actions row (revealed on hover). |
| `--chat-message-action-size`                   | `28px`                    | height/width  | Size of each action button.                             |
| `--chat-message-action-color`                  | `#71717a`                 | color         | Icon color of action buttons.                           |
| `--chat-message-action-hover-background-color` | `#f4f4f5`                 | background    | Action button hover background.                         |

## Web Component

Tag: `<sui-chat-message>`

```html
<sui-chat-message role="sender" content="Hello!"></sui-chat-message>
```
