# ChatSuggestions

A row of tappable prompt chips (the `Pill` component) — typically shown on an empty conversation to seed the first message. Each item can be a plain string or an object with a display `label` and an underlying `value`; selecting a chip fires `onselect` with the value and index.

## Usage

```svelte
<script>
  import { ChatSuggestions } from '@juspay/svelte-ui-components';
</script>

<ChatSuggestions
  items={['Track my order', 'Return policy?', { label: 'Talk to a human', value: 'handoff' }]}
  onselect={(value) => console.log(value)}
/>
```

## Props

| Prop     | Type                | Required | Default | Description                                                  |
| -------- | ------------------- | -------- | ------- | ----------------------------------------------------------- |
| items    | `ChatSuggestion[]`  | Yes      | `-`     | Chips. `ChatSuggestion = string \| { label: string; value?: string }`. |
| disabled | `boolean`           | No       | `false` | Disable all chips.                                          |
| testId   | `string`            | No       | `-`     | `data-pw` on the root element.                             |
| classes  | `string`            | No       | `-`     | Class string on the root element.                         |

## Events

| Event    | Type                                  | Description                                      |
| -------- | ------------------------------------- | ------------------------------------------------ |
| onselect | `(value: string, index: number) => void` | Fires when a chip is selected.                |

## CSS Variables

| Variable                        | Default | CSS Property | Description                  |
| ------------------------------- | ------- | ------------ | ---------------------------- |
| `--chat-suggestions-width`      | `100%`  | width        | Width of the row.            |
| `--chat-suggestions-gap`        | `8px`   | gap          | Gap between chips.           |
| `--chat-suggestions-flex-wrap`  | `wrap`  | flex-wrap    | Wrapping behavior.           |
| `--chat-suggestions-padding`    | `0`     | padding      | Padding around the row.      |

Chips are `Pill` instances — theme them with the `--pill-*` variables.

## Web Component

Tag: `<sui-chat-suggestions>`

```html
<sui-chat-suggestions></sui-chat-suggestions>
```

Set `.items` and `.onselect` via JavaScript.
