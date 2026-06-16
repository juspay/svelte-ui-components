# Card

A generic container component with an optional title/description header and a content body. Designed as a building block for dashboards, settings panels, product listings, and any grouped content. All visual properties are controlled via CSS custom properties — it looks correct with zero consumer overrides and is fully theme-agnostic. When `onclick` is provided the root element becomes an accessible button (`role="button"`, `tabindex="0"`, Enter/Space keyboard support) without any API change for existing consumers that omit the prop.

## Usage

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<Card title="Order Summary" description="Review your items before checkout.">
  <p>3 items in your cart</p>
</Card>
```

### Content-Only Card

```svelte
<Card>
  <p>A simple card with no header.</p>
</Card>
```

### Themed Card

```svelte
<div class="dark-card">
  <Card title="Dashboard" description="Weekly metrics">
    <p>Revenue: $12,340</p>
  </Card>
</div>

<style>
  .dark-card {
    --card-background: #1a1a2e;
    --card-border: 1px solid #2a2a3c;
    --card-title-color: #e5e7eb;
    --card-description-color: #9ca3af;
  }
</style>
```

### Sized Card

```svelte
<div class="gateway-card">
  <Card title="Payment Gateway">
    <p>Configure your payment settings.</p>
  </Card>
</div>

<style>
  .gateway-card {
    --card-width: 600px;
    --card-min-width: 600px;
    --card-max-width: 600px;
    --card-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
</style>
```

### Clickable Card

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';

  function handleCardClick(event: MouseEvent) {
    console.log('card clicked', event);
  }
</script>

<div class="clickable-card">
  <Card onclick={handleCardClick} testId="platform-card">
    <p>Click anywhere on this card.</p>
  </Card>
</div>

<style>
  .clickable-card {
    --card-background: #f9fafb;
    --card-border: 1px solid #e5e7eb;
    --card-border-radius: 12px;
    --card-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>
```

### Custom Layout (Consumer Recipe)

The Card component intentionally omits named layout slots to keep its API minimal. For multi-zone flex-row layouts (metric tiles, integration rows, list items), place the layout entirely inside the `children` snippet — the consumer controls the structure and the Card provides the container, shadow, and click semantics.

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<!-- Metric tile: icon left, label+value center, badge right -->
<div class="metric-card">
  <Card testId="revenue-card">
    {#snippet children()}
      <div class="card-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; gap:12px;">
        <span>📊</span>
        <div style="flex:1;">
          <p style="margin:0;">Total Revenue</p>
          <strong>$48,320</strong>
        </div>
        <span class="badge">+12.4%</span>
      </div>
    {/snippet}
  </Card>
</div>

<!-- Integration row: clickable card with full-card onclick -->
<div class="integration-card">
  <Card onclick={handleCardClick} testId="shopify-card">
    {#snippet children()}
      <div class="card-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; gap:12px;">
        <span>🛒</span>
        <div style="flex:1;">
          <p style="margin:0;">Shopify</p>
          <small>Connected</small>
        </div>
        <span>›</span>
      </div>
    {/snippet}
  </Card>
</div>

<style>
  .metric-card {
    --card-background: #ffffff;
    --card-border: 1px solid #e5e7eb;
    --card-width: 100%;
  }

  .integration-card {
    --card-background: #f9fafb;
    --card-border: 1px solid #e5e7eb;
    --card-width: 100%;
  }
</style>
```

This pattern gives full layout control to the consumer (any number of zones, any flex/grid arrangement) without baking structural presets into the library.

### Card with Header Right Slot

```svelte
<script>
  import { Card, Button } from '@juspay/svelte-ui-components';
</script>

<Card title="Recent Orders" description="Last 7 days">
  {#snippet headerRight()}
    <Button text="View All" />
  {/snippet}
  <p>12 orders placed</p>
</Card>
```

### Stretch and Scrollable Card

```svelte
<div style="height: 300px; display: flex;">
  <Card title="Activity Log" stretch scrollable>
    {#snippet children()}
      {#each events as event}
        <p>{event.message}</p>
      {/each}
    {/snippet}
    {#snippet footer()}
      <span>End of log</span>
    {/snippet}
  </Card>
</div>
```

## Props

| Prop        | Type                          | Required | Default | Description                                                                                                                                                                  |
| ----------- | ----------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children    | `Snippet`                     | No       | `-`     | Main content body of the card. Rendered inside the `.card-content` container.                                                                                                |
| title       | `string`                      | No       | `-`     | Header title text. When provided, renders the `.card-header` section.                                                                                                        |
| description | `string`                      | No       | `-`     | Header subtitle/description text displayed below the title. Only rendered if `title` is also provided.                                                                       |
| classes     | `string`                      | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.       |
| testId      | `string`                      | No       | `-`     | Value for the `data-pw` attribute on the root element. Used for Playwright test selectors.                                                                                   |
| onclick     | `(event: MouseEvent) => void` | No       | `-`     | Click handler. When provided, the card root becomes interactive: `role="button"`, `tabindex="0"`, and Enter/Space keydown trigger the handler. Omit to keep a plain `<div>`. |
| headerRight | `Snippet`                     | No       | `-`     | Snippet rendered at the top-right of the header row alongside the title/description. When omitted the header row is unchanged (title block takes full width).                |
| footer      | `Snippet`                     | No       | `-`     | Snippet rendered in a `<footer>` element below the content area. When omitted no footer element is rendered.                                                                 |
| stretch     | `boolean`                     | No       | `false` | When true, the card root gets `height: 100%` and becomes a flex column so the content area grows to fill remaining space. Useful in equal-height grid/flex layouts.         |
| scrollable  | `boolean`                     | No       | `false` | When true, the content area becomes vertically scrollable (max-height via `--card-content-max-height`, default 400px). The region also gains `role="region"` and `tabindex="0"` for keyboard accessibility. |
| cssVars     | `Record<string, string \| number>` | No  | `-`     | Per-instance CSS custom properties applied as inline `style` on the card root (e.g. `{ '--bottom-sections-count': 3 }`). Feeds a dynamic value into a recipe class whose selectors/media queries read that variable — something a static `classes` string cannot express. Omit to render no `style` attribute. |

## Events

| Event   | Type                          | Description                                                                                                                                        |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(event: MouseEvent) => void` | Fires when the card is clicked. When provided, the card gains `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). No-op if omitted. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                       | Default                  | CSS Property  | Description                                                                                    |
| ------------------------------ | ------------------------ | ------------- | ---------------------------------------------------------------------------------------------- |
| `--card-background`            | `inherit`                | background    | Background color of the card.                                                                  |
| `--card-border`                | `1px solid currentColor` | border        | Border of the card. Inherits text color by default.                                            |
| `--card-border-radius`         | `8px`                    | border-radius | Corner radius of the card.                                                                     |
| `--card-overflow`              | `hidden`                 | overflow      | Overflow behavior of the card content.                                                         |
| `--card-box-shadow`            | `none`                   | box-shadow    | Box shadow of the card. Set to a shadow value (e.g. `0 2px 8px rgba(0,0,0,0.1)`) or `none`.  |
| `--card-width`                 | `auto`                   | width         | Width of the card. Set to a fixed value (e.g. `600px`) or leave as `auto` for natural sizing. |
| `--card-min-width`             | `0`                      | min-width     | Minimum width constraint.                                                                      |
| `--card-max-width`             | `none`                   | max-width     | Maximum width constraint.                                                                      |
| `--card-height`                | `auto`                   | height        | Height of the card. Set to `100%` for equal-height/stretch layouts (e.g. cards in a stretched grid row); leave as `auto` for natural sizing. |
| `--card-max-height`            | `none`                   | max-height    | Maximum height constraint. Use with `overflow: auto` for scrollable card bodies.               |
| `--card-margin`                | `0`                      | margin        | Outer margin of the card. Useful for stacked card layouts.                                     |
| `--card-cursor`                | `inherit`                | cursor        | Cursor on the card root. Defaults to `pointer` when `onclick` is provided.                     |
| `--card-focus-outline`         | `2px solid currentColor` | outline       | Focus ring shown on the card when interactive and focused via keyboard.                        |
| `--card-focus-outline-offset`  | `2px`                    | outline-offset| Offset of the focus ring from the card edge.                                                   |
| `--card-header-padding`        | `16px 16px 0`            | padding       | Padding of the header section.                                                                 |
| `--card-header-border-bottom`  | `none`                   | border-bottom | Optional border below the header.                                                              |
| `--card-title-font-size`       | `16px`                   | font-size     | Font size of the title text.                                                                   |
| `--card-title-font-weight`     | `600`                    | font-weight   | Font weight of the title text.                                                                 |
| `--card-title-color`           | `inherit`                | color         | Color of the title text. Inherits from parent by default.                                      |
| `--card-description-font-size` | `14px`                   | font-size     | Font size of the description text.                                                             |
| `--card-description-color`     | `inherit`                | color         | Color of the description text. Inherits from parent by default.                                |
| `--card-description-opacity`   | `0.6`                    | opacity       | Opacity of the description text for visual hierarchy.                                          |
| `--card-content-padding`       | `16px`                   | padding       | Padding of the content body.                                                                   |
| `--card-stretch-height`        | `100%`                   | height        | Height of the card root when `stretch=true`. Set to a fixed value or `100%` for full-height layouts. |
| `--card-content-flex`          | `1`                      | flex          | Flex grow/shrink/basis shorthand for the content area when `stretch=true`, allowing it to fill remaining height. |
| `--card-header-align-items`    | `flex-start`             | align-items   | Vertical alignment of the header row when `headerRight` is provided (`.card-header-split` flex container). |
| `--card-header-gap`            | `8px`                    | gap           | Gap between the header main section and the `headerRight` slot when both are present.         |
| `--card-header-right-align-items` | `center`              | align-items   | Vertical alignment of the `headerRight` slot container.                                        |
| `--card-content-max-height`    | `400px`                  | max-height    | Maximum height of the scrollable content area when `scrollable=true`.                         |
| `--card-footer-padding`        | `12px 16px`              | padding       | Padding of the footer element.                                                                 |
| `--card-footer-border-top`     | `none`                   | border-top    | Optional top border for the footer. Set to a border value (e.g. `1px solid #e5e7eb`) to visually separate the footer. |
| `--card-footer-background`     | `inherit`                | background    | Background color of the footer element. Inherits from the card by default.                    |

## Web Component

Tag: `<sui-card>`

Reflected boolean attributes: `stretch`, `scrollable`.

```html
<sui-card title="Order Summary" description="Review your items">
  <p>3 items in your cart</p>
</sui-card>

<!-- stretch + scrollable -->
<sui-card title="Activity Log" stretch scrollable>
  <p>Event 1</p>
  <p>Event 2</p>
</sui-card>
```
