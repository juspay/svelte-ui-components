# WindowedList

Renders only the newest part of a long list, with a "show earlier" control above it that reveals more on demand. It is for feeds that are read from the bottom, such as chat logs, transcripts and activity streams, where rendering thousands of rows up front costs seconds and hundreds of megabytes.

The window is anchored by item key, not by position. Items appended to the list join the window at the bottom and never push rows out from under a reader who has scrolled up. If the anchor item leaves the list (the list was replaced or truncated), the window re-anchors to the newest `initialCount`.

## Usage

```svelte
<script lang="ts">
  import { WindowedList } from '@juspay/svelte-ui-components';

  let { messages }: { messages: { id: string; text: string }[] } = $props();
</script>

<WindowedList items={messages} getKey={(m) => m.id} initialCount={200}>
  {#snippet row({ item, index, isFirst })}
    <p>{index}: {item.text}</p>
  {/snippet}
</WindowedList>
```

## Props

| Prop         | Type                                       | Required | Default                                 | Description                                                                       |
| ------------ | ------------------------------------------ | -------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| items        | `T[]`                                      | Yes      | -                                       | The full list, oldest first.                                                      |
| getKey       | `(item: T) => string`                      | Yes      | -                                       | A stable, unique key per item. It drives the keyed render and anchors the window. |
| row          | `Snippet<[{ item: T; index: number; isFirst: boolean }]>` | Yes | -                          | One rendered item. See the Snippets table below.                                  |
| initialCount | `number`                                   | No       | `200`                                   | How many of the newest items render at first.                                     |
| step         | `number`                                   | No       | `200`                                   | How many more each "show earlier" reveals.                                        |
| earlierLabel | `(next: number, hidden: number) => string` | No       | `Show {next} earlier ({hidden} hidden)` | Text of the default button.                                                       |
| earlier      | `Snippet<[{ hidden: number; next: number; showEarlier: () => void }]>` | No | -         | Replaces the default button. See the Snippets table below.                        |
| classes      | `string`                                   | No       | -                                       | CSS classes for the wrapper element.                                              |
| testId       | `string`                                   | No       | -                                       | Value written to `data-pw` on the wrapper element.                                |

## Snippets

| Snippet | Parameters                                                  | Description                                                                                                                                                         |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| row     | `{ item: T; index: number; isFirst: boolean }`              | One rendered item. `index` is its position in the full `items` list. `isFirst` marks the first rendered row, for a header that would otherwise sit on a hidden row. |
| earlier | `{ hidden: number; next: number; showEarlier: () => void }` | Replaces the default button. Call `showEarlier()` to reveal `next` more.                                                                                            |

## Accessibility

- The default control is a real `Button` whose text states how many rows it reveals and how many are hidden.
- Revealing keeps the reader's place: the first previously rendered row is measured before and after, and the nearest scrolling ancestor moves by the difference. This also covers WebKit, which has no CSS scroll anchoring.
- When the last hidden rows are revealed the control is removed. A custom `earlier` snippet that must keep focus somewhere should manage it.
- Browser find-in-page only searches rendered rows. Give the page its own search if readers need to find text in hidden rows.

## CSS Variables

| Variable                          | Default    | Description                                                                                                                                        |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--windowed-list-display`         | `contents` | Display of the wrapper. `contents` keeps rows as children of the consumer's own layout (its flex gap or grid tracks), as if there were no wrapper. |
| `--windowed-list-earlier-justify` | `center`   | Horizontal alignment of the control.                                                                                                               |
| `--windowed-list-earlier-padding` | `8px 0`    | Padding around the control.                                                                                                                        |

## Web Component

None. `getKey` is a function and `row` is a snippet with arguments, which a custom element's attributes and slots cannot express. Use the Svelte component.
