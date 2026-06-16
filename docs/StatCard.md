# StatCard

A compact metric display card for dashboards. Shows a title label, a prominent value, an optional delta badge (with automatic positive/negative colour inference from the leading sign character), an optional subtitle, a footer snippet, and an optional custom value snippet for advanced rendering. All visual properties are controlled via CSS custom properties. When `onclick` is provided the root element becomes an accessible button (`role="button"`, `tabindex="0"`, Enter/Space keyboard support) without any API change for existing consumers that omit the prop.

## Usage

```svelte
<script>
  import { StatCard } from '@juspay/svelte-ui-components';
</script>

<StatCard title="Total Revenue" value="₹1.23Cr" delta="+12.5%" subtitle="vs last month" />
```

### Negative Delta

```svelte
<StatCard title="Refund Rate" value="3.2%" delta="-0.8%" subtitle="vs last week" />
```

Delta colour is inferred from the leading character: `+` → green (`--statcard-delta-positive-color`), `-` → red (`--statcard-delta-negative-color`), any other character → neutral grey (`--statcard-delta-color`).

### Explicit Delta Polarity Override

```svelte
<!-- Force green even when delta string has no leading sign -->
<StatCard title="Approval Rate" value="98.4%" delta="98.4%" deltaPositive={true} />
```

### With Footer Snippet

```svelte
<script>
  import { StatCard } from '@juspay/svelte-ui-components';
</script>

<StatCard title="Orders" value="1,482">
  {#snippet footer()}
    <a href="/orders">View all orders →</a>
  {/snippet}
</StatCard>
```

### Custom Value Rendering

```svelte
<script>
  import { StatCard } from '@juspay/svelte-ui-components';
</script>

<StatCard title="Conversion">
  {#snippet valueSnippet()}
    <strong style="color: #7c3aed;">68.2 %</strong>
  {/snippet}
</StatCard>
```

### Themed Card

```svelte
<div class="dark-stat">
  <StatCard title="GMV" value="₹8.4Cr" delta="+5.1%" subtitle="7-day rolling" />
</div>

<style>
  .dark-stat {
    --statcard-background: #1a1a2e;
    --statcard-border: 1px solid #2a2a3c;
    --statcard-color: #e5e7eb;
    --statcard-title-color: #9ca3af;
    --statcard-delta-positive-color: #4ade80;
    --statcard-delta-negative-color: #f87171;
  }
</style>
```

### Interactive Card

```svelte
<script>
  import { StatCard } from '@juspay/svelte-ui-components';

  const handleClick = (event: MouseEvent) => {
    console.log('stat card clicked', event);
  };
</script>

<StatCard
  title="Transactions"
  value="24,310"
  delta="+8.3%"
  onclick={handleClick}
  testId="transactions-stat-card"
/>
```

## Props

| Prop          | Type                          | Required | Default | Description                                                                                                                                           |
| ------------- | ----------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| title         | `string`                      | No       | `-`     | Card heading label rendered above the value row.                                                                                                      |
| value         | `string`                      | No       | `-`     | Pre-formatted metric value string (e.g. `"₹1.23Cr"`, `"98.4%"`). Ignored when `valueSnippet` is provided.                                             |
| delta         | `string`                      | No       | `-`     | Pre-formatted delta string (e.g. `"+12.5%"`, `"-3.2%"`). Auto-infers `deltaPositive` from leading sign when `deltaPositive` is not set.               |
| deltaPositive | `boolean`                     | No       | `-`     | Overrides automatic sign-based colour inference. `true` = positive (green), `false` = negative (red). Omit to let the leading sign decide.            |
| subtitle      | `string`                      | No       | `-`     | Secondary label rendered below the value row.                                                                                                         |
| footer        | `Snippet`                     | No       | `-`     | Snippet rendered in the card footer area, separated by a border-top line.                                                                             |
| valueSnippet  | `Snippet`                     | No       | `-`     | Replaces the string `value` with a custom snippet for advanced value rendering.                                                                       |
| classes       | `string`                      | No       | `-`     | Extra CSS class names appended to the root element. Useful for theming — define classes with CSS variable overrides and pass them to create variants. |
| testId        | `string`                      | No       | `-`     | Value for the `data-pw` attribute on the root element. Used for Playwright test selectors.                                                            |
| onclick       | `(event: MouseEvent) => void` | No       | `-`     | Click handler. When provided, the card root becomes interactive: `role="button"`, `tabindex="0"`, and Enter/Space keydown trigger the handler.        |

## Events

| Event   | Type                          | Description                                                                                                                                          |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(event: MouseEvent) => void` | Fires when the card is clicked. When provided, the card gains `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). No-op if omitted. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default                  | CSS Property   | Description                                                                  |
| --------------------------------- | ------------------------ | -------------- | ---------------------------------------------------------------------------- |
| `--statcard-gap`                  | `4px`                    | gap            | Vertical gap between card sections.                                          |
| `--statcard-padding`              | `16px`                   | padding        | Inner padding of the card.                                                   |
| `--statcard-background`           | `#ffffff`                | background     | Background colour of the card.                                               |
| `--statcard-border`               | `1px solid #e5e7eb`      | border         | Border of the card.                                                          |
| `--statcard-border-radius`        | `8px`                    | border-radius  | Corner radius of the card.                                                   |
| `--statcard-box-shadow`           | `none`                   | box-shadow     | Box shadow of the card.                                                      |
| `--statcard-width`                | `auto`                   | width          | Width of the card.                                                           |
| `--statcard-min-width`            | `0`                      | min-width      | Minimum width constraint.                                                    |
| `--statcard-max-width`            | `none`                   | max-width      | Maximum width constraint.                                                    |
| `--statcard-height`               | `auto`                   | height         | Height of the card.                                                          |
| `--statcard-color`                | `inherit`                | color          | Foreground text colour inherited by all child text.                          |
| `--statcard-cursor`               | `default`                | cursor         | Cursor on the card root. Overridden to `pointer` when `onclick` is provided. |
| `--statcard-focus-outline`        | `2px solid currentColor` | outline        | Focus ring on keyboard focus (interactive mode only).                        |
| `--statcard-focus-outline-offset` | `2px`                    | outline-offset | Offset of the focus ring from the card edge.                                 |
| `--statcard-title-font-size`      | `12px`                   | font-size      | Font size of the title label.                                                |
| `--statcard-title-font-weight`    | `500`                    | font-weight    | Font weight of the title label.                                              |
| `--statcard-title-color`          | `#6b7280`                | color          | Colour of the title label.                                                   |
| `--statcard-title-line-height`    | `1.4`                    | line-height    | Line height of the title label.                                              |
| `--statcard-title-white-space`    | `nowrap`                 | white-space    | White-space of the title label. Set to `normal` to allow wrapping.           |
| `--statcard-value-row-align`      | `baseline`               | align-items    | Vertical alignment of value and delta within the value row.                  |
| `--statcard-value-row-gap`        | `8px`                    | gap            | Horizontal gap between value and delta in the value row.                     |
| `--statcard-value-font-size`      | `24px`                   | font-size      | Font size of the metric value.                                               |
| `--statcard-value-font-weight`    | `600`                    | font-weight    | Font weight of the metric value.                                             |
| `--statcard-value-color`          | `inherit`                | color          | Colour of the metric value. Inherits card foreground by default.             |
| `--statcard-value-line-height`    | `1.2`                    | line-height    | Line height of the metric value.                                             |
| `--statcard-delta-font-size`      | `13px`                   | font-size      | Font size of the delta badge.                                                |
| `--statcard-delta-font-weight`    | `500`                    | font-weight    | Font weight of the delta badge.                                              |
| `--statcard-delta-color`          | `#6b7280`                | color          | Colour of a neutral delta (no sign detected / `deltaPositive` not set).      |
| `--statcard-delta-line-height`    | `1.4`                    | line-height    | Line height of the delta badge.                                              |
| `--statcard-delta-positive-color` | `#16a34a`                | color          | Colour of a positive delta (`+` prefix or `deltaPositive={true}`).           |
| `--statcard-delta-negative-color` | `#dc2626`                | color          | Colour of a negative delta (`-` prefix or `deltaPositive={false}`).          |
| `--statcard-subtitle-font-size`   | `12px`                   | font-size      | Font size of the subtitle label.                                             |
| `--statcard-subtitle-font-weight` | `400`                    | font-weight    | Font weight of the subtitle label.                                           |
| `--statcard-subtitle-color`       | `#9ca3af`                | color          | Colour of the subtitle label.                                                |
| `--statcard-subtitle-line-height` | `1.4`                    | line-height    | Line height of the subtitle label.                                           |
| `--statcard-footer-margin-top`    | `8px`                    | margin-top     | Top margin of the footer section.                                            |
| `--statcard-footer-padding-top`   | `8px`                    | padding-top    | Top padding of the footer section (space between border and content).        |
| `--statcard-footer-border-top`    | `1px solid #e5e7eb`      | border-top     | Top border line separating the footer from the card body.                    |

## Web Component

Tag: `<sui-stat-card>`

```html
<sui-stat-card
  title="Total Revenue"
  value="₹1.23Cr"
  delta="+12.5%"
  subtitle="vs last month"
></sui-stat-card>
```
