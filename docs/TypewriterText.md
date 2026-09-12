# TypewriterText

Reveals text one character at a time, the way a streaming model answer reads. Built for streaming: while `isStreaming` is `true`, typing follows the growing `text` without restarting; the moment it turns `false`, the remainder appears at once.

Typing is an animation, so it honours `prefers-reduced-motion: reduce`: when the reader has asked for less motion, text is disclosed as it arrives instead of being typed, and `speed` / `variableDelay` / `resolveDelay` are not consulted. `onprogress` still fires, once per disclosure rather than once per character.

> **Already using `ChatController` with `typewriter: true`? Do not also wrap `msg.content` in this component.**
>
> Both reveal text progressively, and they compose badly: the controller is already growing `msg.content` character by character, so a `messageBody` snippet that renders `<TypewriterText text={msg.content} isStreaming={msg.streaming} />` re-types every increment on its own cadence — a compounding double-reveal, not merely duplicated work. Pick one:
>
> - **Reveal handled by the controller** — set `typewriter: true` and render `msg.content` as plain text. Simplest, and what `Chat`'s own examples use.
> - **Reveal handled here** — leave `typewriter` unset (or `false`) on the controller and wrap `msg.content` in `TypewriterText`. Reach for this when you want per-character control the controller does not expose: `variableDelay`, `resolveDelay`, `renderCharacter`, or `onprogress`.

## Usage

```svelte
<script>
  import { TypewriterText } from '@juspay/svelte-ui-components';
</script>

<TypewriterText text={answer} isStreaming={stillStreaming} />

<!-- Safe rich text: no parser or custom callback needed at the call site -->
<TypewriterText text={answer} markdown isStreaming={stillStreaming} />

<!-- Variable pacing: slow down for digits, add a beat at punctuation -->
<TypewriterText
  text={answer}
  variableDelay={{
    digit: { min: 150, max: 200 },
    whitespace: { min: 40, max: 80 },
    punctuation: { min: 150, max: 250 },
    default: { min: 15, max: 30 }
  }}
/>

<!-- Progress: scroll a container, or show how far along typing is -->
<TypewriterText
  text={answer}
  onprogress={({ index, total }) => {
    percentTyped = Math.round((index / total) * 100);
  }}
/>

<!-- Per-character render hook: decorate what's being typed -->
<TypewriterText text={answer}>
  {#snippet renderCharacter({ character, index })}
    {#if /\d/.test(character)}
      <strong>{character}</strong>
    {:else}
      {character}
    {/if}
  {/snippet}
</TypewriterText>
```

## Safe Markdown

Set `markdown` to render the revealed source through the same safe Markdown pipeline as `MarkdownText`. It supports headings, emphasis, code, lists, tables, links and images. Raw HTML is escaped and shown as text, never inserted as live elements. Links allow `http:`, `https:`, `mailto:` and `tel:`; images allow `http:` and `https:`. Relative URLs are resolved against an HTTPS base for the protocol check. Unsafe destinations (including `javascript:` and `data:`) are removed while their link or alt text is kept. External HTTP(S) links receive `target="_blank"` and `rel="noopener noreferrer"`.

Install the package's optional **`marked@^18.0.0` peer dependency** to use Markdown in a Svelte consumer. TypewriterText loads the renderer lazily only when Markdown is enabled, so plain-text consumers do not require the parser. While it loads, or if it cannot load, the revealed source stays escaped plain text; it never falls back to `renderText` or `renderCharacter`. Markdown formatting appears when the renderer resolves. The prebuilt custom-element bundle includes the renderer. You do not need to import a parser or sanitizer at the call site.

```svelte
<script>
  import { TypewriterText } from '@juspay/svelte-ui-components';
</script>

<TypewriterText text={answer} markdown isStreaming={stillStreaming} />

<!-- Narrow the policy: HTTPS links only, no images or task-list checkboxes -->
<TypewriterText
  text={answer}
  markdown
  isStreaming={stillStreaming}
  markdownOptions={{
    breaks: true,
    sanitize: {
      allowedProtocols: ['https:'],
      allowedTags: ['a', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol'],
      disableTaskLists: true
    }
  }}
/>
```

`markdownOptions` uses the shared `RenderMarkdownOptions` type, not a separate TypewriterText policy:

- `breaks`: render single newlines as line breaks.
- `inline`: parse inline Markdown without block elements.
- `tableLabel`: accessible name for the keyboard-focusable wrapper around tables.
- `sanitize.allowedProtocols`: narrow the default protocol sets, never widen them. An empty array removes every link and image destination. Listing `javascript:` cannot enable it.
- `sanitize.allowedTags`: narrow the recognized Markdown-generated formatting tags, for example omitting `img` to keep only the alt text. This is not an allow-list for raw HTML or an arbitrary HTML sanitizer.
- `sanitize.disableTaskLists`: omit disabled task-list checkboxes while retaining the list text.

Omitting the options retains the shared renderer's defaults. Null and non-object options from JavaScript or HTML use those defaults too. None of these options enable raw HTML.

### Rendering precedence and trust boundary

The order is explicit:

1. **`markdown === true`**: safe Markdown rendering; both `renderText` and `renderCharacter` are ignored, even if supplied.
2. **`renderText` callback**: trusted custom HTML, when Markdown is not enabled.
3. **`renderCharacter` snippet**: per-character rendering, when neither renderer above is active.
4. **Escaped plain text**: the default.

`renderText` remains a compatibility escape hatch for applications that deliberately supply their own HTML. **The caller owns the safety of every string returned by this callback.** Sanitize untrusted input and the resulting HTML inside your renderer, including every incomplete streaming prefix. `markdownOptions` and its `sanitize` options **do not apply to callback output**. Do not pass an unsanitized Markdown parser as `renderText` for untrusted content; use `markdown` instead. Safe mode cannot sanitize markup produced by a caller-owned snippet when that mode is disabled either.

### Streaming safety

Every visible prefix is parsed through the safe Markdown pipeline, not just the finished message. An incomplete link, code fence or emphasis delimiter may initially appear as text and change formatting as more source arrives. Raw HTML never becomes executable markup at those intermediate frames; unsafe URL protocols are checked each time, including encoded character references. Some incomplete destinations are legitimate relative URLs and may temporarily produce safe links.

Appending source continues the existing reveal; replacing source resets it. When `isStreaming` becomes `false`, the remaining source goes through the same safe renderer immediately. Reduced motion also uses the safe renderer while disclosing text without the typing animation. `onprogress.displayedText`, `index` and `total` always describe the **raw source**, including Markdown delimiters, not HTML or rendered text length. Markdown does not change pacing or progress events. The plain-text whitespace class is not applied in Markdown mode; Markdown controls paragraph and line-break structure.

## Web component

Register the web components through the package's `@juspay/svelte-ui-components/wc` entry in your application bundle (or load a prebuilt web-component bundle). The safe-mode props are available on `sui-typewriter-text`:

```html
<sui-typewriter-text
  markdown
  text="**Safe** Markdown with [a link](https://example.com)"
  markdown-options='{"sanitize":{"allowedProtocols":["https:"]}}'
></sui-typewriter-text>
```

`markdown` is a Boolean attribute: its presence enables safe mode. Omit it to disable the mode; `markdown="false"` still counts as present. `markdown-options` is the explicit JSON attribute for the `markdownOptions` object property. JavaScript can assign the object directly, which is useful for options or streaming text coming from application state:

```javascript
await customElements.whenDefined('sui-typewriter-text');
const writer = document.querySelector('sui-typewriter-text');
if (writer) {
  writer.markdown = true;
  writer.markdownOptions = {
    sanitize: { allowedProtocols: ['https:'], disableTaskLists: true }
  };
  writer.isStreaming = true;
  writer.text = '**Hello';
  // As the next chunk arrives:
  writer.text += '** world';
  // When the source finishes, reveal any remaining characters immediately:
  writer.isStreaming = false;
}
```

Pass callback functions such as `renderText` as JavaScript properties, not string attributes. They have the same trusted-HTML contract and precedence as the Svelte component.

## Props

| Prop            | Type                                     | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text            | `string`                                 | Yes      | `-`     | Full text revealed so far — grow it as chunks stream in.                                                                                                                                                                                                                                                                                                                                                                        |
| speed           | `number`                                 | No       | `15`    | Milliseconds between characters. Ignored per character class covered by `variableDelay`.                                                                                                                                                                                                                                                                                                                                        |
| isStreaming     | `boolean`                                | No       | `false` | While `true`, typing follows `text` growth; on `false` the rest shows at once.                                                                                                                                                                                                                                                                                                                                                  |
| markdown        | `boolean`                                | No       | `false` | Safe Markdown for every revealed prefix. Takes precedence over `renderText` and `renderCharacter`.                                                                                                                                                                                                                                                                                                                              |
| markdownOptions | `RenderMarkdownOptions`                  | No       | `-`     | Shared renderer options: `breaks`, `inline`, `tableLabel`, `sanitize`. Used only when `markdown` is true.                                                                                                                                                                                                                                                                                                                       |
| renderText      | `(text: string) => string`               | No       | `-`     | Trusted custom-HTML callback; caller owns sanitization of every returned frame. Ignored when `markdown` is true. `markdownOptions` never apply to it.                                                                                                                                                                                                                                                                           |
| variableDelay   | `TypewriterVariableDelay`                | No       | `-`     | Opt into per-character-class pacing (`digit`, `whitespace`, `punctuation`, `default`), each a `{ min, max }` millisecond range — a random value in range is picked per character. Any class you omit (including `default`) falls back to `speed`. Omit the whole prop to keep the flat `speed` for every character.                                                                                                             |
| resolveDelay    | `TypewriterDelayResolver`                | No       | `-`     | Compute each character's delay yourself, for pacing that varies with POSITION rather than only with character class — an acceleration cycle, a slow-down at the end. Receives `{ character, index, wordCount }`, where `wordCount` is the number of whole words revealed so far, and returns milliseconds. Takes over pacing entirely when set: `variableDelay` and `speed` are not consulted. Omit it and pacing is unchanged. |
| onprogress      | `(progress: TypewriterProgress) => void` | No       | `-`     | Called per character and on bulk disclosure of remaining text. `{ index, total, displayedText }` describes raw source, including Markdown syntax.                                                                                                                                                                                                                                                                               |
| renderCharacter | `Snippet<[TypewriterCharacterContext]>`  | No       | `-`     | Render each revealed character with `{ character, index }`. Ignored when `markdown` is true or `renderText` is set.                                                                                                                                                                                                                                                                                                             |
| testId          | `string`                                 | No       | `-`     | `data-pw` on the root element.                                                                                                                                                                                                                                                                                                                                                                                                  |
| classes         | `string`                                 | No       | `-`     | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                               |

## CSS Variables

| Variable                        | Default    | Description                             |
| ------------------------------- | ---------- | --------------------------------------- |
| `--typewriter-text-max-width`   | `100%`     | Max width of the text block.            |
| `--typewriter-text-white-space` | `pre-wrap` | Whitespace handling in plain-text mode. |
