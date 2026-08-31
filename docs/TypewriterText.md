# TypewriterText

Reveals text one character at a time, the way a streaming model answer reads. Built for streaming: while `isStreaming` is `true`, typing follows the growing `text` without restarting; the moment it turns `false`, the remainder appears at once.

## Usage

```svelte
<script>
  import { TypewriterText } from '@juspay/svelte-ui-components';
</script>

<TypewriterText text={answer} isStreaming={stillStreaming} />

<!-- Rich text: inject a renderer (e.g. a markdown parser) -->
<TypewriterText text={answer} renderText={(text) => marked(text)} />

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
  onProgress={({ index, total }) => {
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

## Props

| Prop            | Type                                     | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text            | `string`                                 | Yes      | `-`     | Full text revealed so far — grow it as chunks stream in.                                                                                                                                                                                                                                                                                                                                                                        |
| speed           | `number`                                 | No       | `15`    | Milliseconds between characters. Ignored per character class covered by `variableDelay`.                                                                                                                                                                                                                                                                                                                                        |
| isStreaming     | `boolean`                                | No       | `false` | While `true`, typing follows `text` growth; on `false` the rest shows at once.                                                                                                                                                                                                                                                                                                                                                  |
| renderText      | `(text: string) => string`               | No       | `-`     | Renders revealed text as HTML (pass a markdown renderer). The component trusts the returned string — sanitise inside the renderer. Plain text when omitted.                                                                                                                                                                                                                                                                     |
| variableDelay   | `TypewriterVariableDelay`                | No       | `-`     | Opt into per-character-class pacing (`digit`, `whitespace`, `punctuation`, `default`), each a `{ min, max }` millisecond range — a random value in range is picked per character. Any class you omit (including `default`) falls back to `speed`. Omit the whole prop to keep the flat `speed` for every character.                                                                                                             |
| resolveDelay    | `TypewriterDelayResolver`                | No       | `-`     | Compute each character's delay yourself, for pacing that varies with POSITION rather than only with character class — an acceleration cycle, a slow-down at the end. Receives `{ character, index, wordCount }`, where `wordCount` is the number of whole words revealed so far, and returns milliseconds. Takes over pacing entirely when set: `variableDelay` and `speed` are not consulted. Omit it and pacing is unchanged. |
| onProgress      | `(progress: TypewriterProgress) => void` | No       | `-`     | Called every time a character is revealed (and once more if `isStreaming` turns `false` while text remains, since the rest appears at once). `progress` is `{ index, total, displayedText }`. Not called when omitted.                                                                                                                                                                                                          |
| renderCharacter | `Snippet<[TypewriterCharacterContext]>`  | No       | `-`     | Render each revealed character yourself — highlight a token, wrap a number — instead of the plain text node. `context` is `{ character, index }` (`index` is the position within `text`). Ignored when `renderText` is set. Plain text per character when omitted.                                                                                                                                                              |
| testId          | `string`                                 | No       | `-`     | `data-pw` on the root element.                                                                                                                                                                                                                                                                                                                                                                                                  |
| classes         | `string`                                 | No       | `-`     | Class string on the root element.                                                                                                                                                                                                                                                                                                                                                                                               |

## CSS Variables

| Variable                        | Default    | Description                             |
| ------------------------------- | ---------- | --------------------------------------- |
| `--typewriter-text-max-width`   | `100%`     | Max width of the text block.            |
| `--typewriter-text-white-space` | `pre-wrap` | Whitespace handling in plain-text mode. |
