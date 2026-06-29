# KeyValue

A read-only label/value grid for rendering detail views — offer summaries, customer profiles, order metadata, and similar "field: value" layouts. Pairs flow row-major across a configurable number of columns, collapsing to a single column on narrow screens. Empty values are skipped by default (so optional fields disappear cleanly), and either side can be fully customised with a snippet for rendering tags, links, avatars, or formatted values.

## Usage

```svelte
<script>
  import { KeyValue } from '@juspay/svelte-ui-components';

  const fields = [
    { label: 'Offer name', value: 'Summer Sale 2026' },
    { label: 'Status', value: 'Active' },
    { label: 'Discount', value: '20% off' },
    { label: 'Valid till', value: '30 Jun 2026' }
  ];
</script>

<KeyValue items={fields} />
```

### Columns

Set how many columns the pairs flow across with `columns` (default `2`). The grid automatically collapses to a single column below 600px wide.

```svelte
<KeyValue items={fields} columns={3} />
```

### Sizes

Three typography presets scale the text, with the value 2px smaller than the label so the key reads as the primary element: `sm` (14/12px), `md` (16/14px, default), and `lg` (18/16px) — label/value respectively. Individual `--keyvalue-label-size` / `--keyvalue-value-size` overrides always win over the preset.

```svelte
<KeyValue items={fields} size="sm" />
<KeyValue items={fields} size="md" />
<KeyValue items={fields} size="lg" />
```

### Horizontal layout

Use `layout="horizontal"` to place each label beside its value instead of above it. The label column width is controlled by the `--keyvalue-label-width` CSS variable.

```svelte
<KeyValue items={fields} layout="horizontal" columns={1} />
```

### Empty values

By default (`hideEmpty`), items whose value is `null`, `undefined`, or an empty/whitespace string are omitted — optional fields simply disappear. Set `hideEmpty={false}` to render them as `emptyText` (default `'—'`) instead.

```svelte
<!-- The "Notes" row is hidden -->
<KeyValue items={[{ label: 'Notes', value: '' }, { label: 'Owner', value: 'Neha' }]} />

<!-- The "Notes" row renders as "N/A" -->
<KeyValue
  items={[{ label: 'Notes', value: '' }]}
  hideEmpty={false}
  emptyText="N/A"
/>
```

### Custom value rendering

Pass a `valueSnippet` to render the value cell yourself — useful for status pills, links, or formatted numbers. It receives `(item, index)`.

```svelte
<script>
  import { KeyValue, Pill } from '@juspay/svelte-ui-components';

  const fields = [
    { label: 'Offer name', value: 'Summer Sale' },
    { label: 'Status', value: 'active' }
  ];
</script>

<KeyValue items={fields}>
  {#snippet valueSnippet(item)}
    {#if item.label === 'Status'}
      <Pill text={item.value} />
    {:else}
      {item.value}
    {/if}
  {/snippet}
</KeyValue>
```

A `labelSnippet` is available for the same purpose on the label side.

### Theming with Classes

Define a class that overrides the KeyValue CSS variables and pass it via `classes`:

```css
/* app.css */
.compact-details {
  --keyvalue-row-gap: 8px;
  --keyvalue-label-color: #6b7280;
  --keyvalue-value-size: 13px;
}
```

```svelte
<KeyValue items={fields} classes="compact-details" />
```

## Props

| Prop         | Type                                | Required | Default      | Description                                                                                                       |
| ------------ | ----------------------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| items        | `KeyValueItem[]`                    | Yes      | `-`          | The label/value pairs to render. Each item is `{ label, value?, testId? }`.                                       |
| columns      | `number`                            | No       | `2`          | Number of columns the pairs flow across (row-major). Collapses to one column on narrow screens.                   |
| layout       | `'vertical' \| 'horizontal'`        | No       | `'vertical'` | `'vertical'` stacks the value under the label; `'horizontal'` places them side-by-side.                           |
| size         | `'sm' \| 'md' \| 'lg'`              | No       | `'md'`       | Typography preset scaling label/value font sizes: `sm` 14/12px, `md` 16/14px, `lg` 18/16px (value 2px below label). |
| hideEmpty    | `boolean`                           | No       | `true`       | When `true`, items with a `null`/`undefined`/empty value are omitted.                                             |
| emptyText    | `string`                            | No       | `'—'`        | Placeholder shown for empty values when `hideEmpty` is `false`.                                                   |
| valueSnippet | `Snippet<[KeyValueItem, number]>`   | No       | `-`          | Custom renderer for the value cell, receiving `(item, index)`. Falls back to plain text.                          |
| labelSnippet | `Snippet<[KeyValueItem, number]>`   | No       | `-`          | Custom renderer for the label cell, receiving `(item, index)`. Falls back to plain text.                          |
| testId       | `string`                            | No       | `-`          | Value for the `data-pw` attribute on the root grid, used for end-to-end testing selectors.                        |
| classes      | `string`                            | No       | `-`          | CSS class string applied to the root grid, for theming via class-scoped CSS variable overrides.                   |

### KeyValueItem

| Field  | Type                          | Required | Description                                                                          |
| ------ | ----------------------------- | -------- | ------------------------------------------------------------------------------------ |
| label  | `string`                      | Yes      | The field label (the "key").                                                         |
| value  | `string \| number \| null`    | No       | The field value. Empty values are skipped when `hideEmpty` is `true`.                |
| testId | `string`                      | No       | Per-item test id, emitted as `data-pw` on the item wrapper.                          |

## Snippets

| Snippet      | Args                    | Description                                            |
| ------------ | ----------------------- | ------------------------------------------------------ |
| valueSnippet | `(item, index)`         | Replaces the default text rendering of the value cell. |
| labelSnippet | `(item, index)`         | Replaces the default text rendering of the label cell. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                        | Default   | CSS Property        | Description                                          |
| ------------------------------- | --------- | ------------------- | ---------------------------------------------------- |
| `--keyvalue-column-gap`         | `32px`    | column-gap          | Horizontal gap between columns.                      |
| `--keyvalue-row-gap`            | `16px`    | row-gap             | Vertical gap between rows.                           |
| `--keyvalue-pair-gap`           | `4px`     | gap                 | Gap between a label and its value within an item.    |
| `--keyvalue-label-color`        | `#1a1a1a` | color               | Label text color.                                    |
| `--keyvalue-label-size`         | size-based | font-size          | Label font size. Defaults to the `size` preset (14/16/18px) unless set.  |
| `--keyvalue-label-weight`       | `600`     | font-weight         | Label font weight.                                   |
| `--keyvalue-label-line-height`  | `1.4`     | line-height         | Label line height.                                   |
| `--keyvalue-label-width`        | `140px`   | flex-basis          | Label column width in `horizontal` layout.           |
| `--keyvalue-value-color`        | `#555`    | color               | Value text color.                                    |
| `--keyvalue-value-size`         | size-based | font-size          | Value font size. Defaults to the `size` preset (12/14/16px) unless set.  |
| `--keyvalue-value-weight`       | `400`     | font-weight         | Value font weight.                                   |
| `--keyvalue-value-line-height`  | `1.4`     | line-height         | Value line height.                                   |
