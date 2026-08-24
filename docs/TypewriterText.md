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
```

## Props

| Prop        | Type                       | Required | Default | Description                                                                  |
| ----------- | -------------------------- | -------- | ------- | ---------------------------------------------------------------------------- |
| text        | `string`                   | Yes      | `-`     | Full text revealed so far — grow it as chunks stream in.                      |
| speed       | `number`                   | No       | `15`    | Milliseconds between characters.                                             |
| isStreaming | `boolean`                  | No       | `false` | While `true`, typing follows `text` growth; on `false` the rest shows at once.|
| renderText  | `(text: string) => string` | No       | `-`     | Renders revealed text as HTML (pass a markdown renderer). The component trusts the returned string — sanitise inside the renderer. Plain text when omitted. |
| testId      | `string`                   | No       | `-`     | `data-pw` on the root element.                                               |
| classes     | `string`                   | No       | `-`     | Class string on the root element.                                            |

## CSS Variables

| Variable                        | Default    | Description                                    |
| ------------------------------- | ---------- | ---------------------------------------------- |
| `--typewriter-text-max-width`   | `100%`     | Max width of the text block.                   |
| `--typewriter-text-white-space` | `pre-wrap` | Whitespace handling in plain-text mode.        |
