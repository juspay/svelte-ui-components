# ChatSuggestions

A row of tappable prompt chips (the `Pill` component) — typically shown on an empty conversation to seed the first message. Each item can be a plain string or an object with a display `label` and an underlying `value`; selecting a chip fires `onselect` with the value and index.

`label` and `value` are separate because a short call-to-action ("Refund trends") usually stands in for a much longer query, and sending the label would send the wrong thing. When they differ, the value doubles as the chip's hover text unless `hint` overrides it.

Two layouts: `wrap` (default) flows chips onto as many lines as needed, for a roomy panel; `scroll` keeps them on one draggable line, for a composer on a phone where wrapping would push the input off-screen. `direction="vertical"` turns the row into a full-width menu.

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

| Prop       | Type                                     | Required | Default        | Description                                                                                                                                                                                      |
| ---------- | ---------------------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| items      | `ChatSuggestion[]`                       | Yes      | `-`            | Chips. `ChatSuggestion = string \| { label: string; value?: string; icon?: string; hint?: string }`. `icon` is a **URL** — `Img` fetches it; raw SVG markup would be treated as a relative link. |
| disabled   | `boolean`                                | No       | `false`        | Disable all chips.                                                                                                                                                                               |
| layout     | `'wrap' \| 'scroll'`                     | No       | `'wrap'`       | Flow onto multiple lines, or one draggable line.                                                                                                                                                 |
| direction  | `'horizontal' \| 'vertical'`             | No       | `'horizontal'` | `vertical` stacks chips full-width as a menu.                                                                                                                                                    |
| maxVisible | `number`                                 | No       | `-`            | Render at most this many chips. Omit for all.                                                                                                                                                    |
| loading    | `boolean`                                | No       | `false`        | Hide the chips without unmounting the row.                                                                                                                                                       |
| icon       | `Snippet<[string \| null, number]>`      | No       | `-`            | Custom mark per chip; receives the item's icon (or null) and index.                                                                                                                                        |
| testId     | `string`                                 | No       | `-`            | `data-pw` on the root element.                                                                                                                                                                   |
| classes    | `string`                                 | No       | `-`            | Class string on the root element.                                                                                                                                                                |
| chipClasses | `string`                                | No       | `-`            | Class string placed on every chip wrapper. Without it, a consuming app's centrally-styled chip rules have nothing in the tree to match, and chips silently fall back to the library defaults.  |

## Events

| Event    | Type                                     | Description                    |
| -------- | ---------------------------------------- | ------------------------------ |
| onselect | `(value: string, index: number) => void` | Fires when a chip is selected. |

## CSS Variables

| Variable                                  | Default   | CSS Property | Description                         |
| ----------------------------------------- | --------- | ------------ | ----------------------------------- |
| `--chat-suggestions-width`                | `100%`    | width        | Width of the row.                   |
| `--chat-suggestions-gap`                  | `8px`     | gap          | Gap between chips.                  |
| `--chat-suggestions-flex-wrap`            | `wrap`    | flex-wrap    | Wrapping behavior.                  |
| `--chat-suggestions-padding`              | `0`       | padding      | Padding around the row.             |
| `--chat-suggestions-vertical-align-items` | `stretch` | align-items  | Cross-axis alignment when vertical. |
| `--chat-suggestions-vertical-chip-width`  | `100%`    | width        | Chip width when vertical.           |

Chips are `Pill` instances — theme them with the `--pill-*` variables.

## Web Component

Tag: `<sui-chat-suggestions>`

```html
<sui-chat-suggestions></sui-chat-suggestions>
```

Set `.items` and `.onselect` via JavaScript.
