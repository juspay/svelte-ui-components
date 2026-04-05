# Card

A generic container component with an optional title/description header and a content body. Designed as a building block for dashboards, settings panels, product listings, and any grouped content. All visual properties are controlled via CSS custom properties, making it fully theme-agnostic — it inherits text color and background from its parent by default.

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

## Props

| Prop        | Type      | Required | Default | Description                                                                                                                                                            |
| ----------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children    | `Snippet` | Yes      | `-`     | Main content body of the card. Rendered inside the `.card-content` container.                                                                                          |
| title       | `string`  | No       | `-`     | Header title text. When provided, renders the `.card-header` section.                                                                                                  |
| description | `string`  | No       | `-`     | Header subtitle/description text displayed below the title. Only rendered if `title` is also provided.                                                                 |
| classes     | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                       | Default          | CSS Property  | Description                                                          |
| ------------------------------ | ---------------- | ------------- | -------------------------------------------------------------------- |
| `--card-background`            | `inherit`        | background    | Background color of the card.                                        |
| `--card-border`                | `1px solid currentColor` | border | Border of the card. Inherits text color by default.                  |
| `--card-border-radius`         | `8px`            | border-radius | Corner radius of the card.                                           |
| `--card-overflow`              | `hidden`         | overflow      | Overflow behavior of the card content.                               |
| `--card-header-padding`        | `16px 16px 0`    | padding       | Padding of the header section.                                       |
| `--card-header-border-bottom`  | `none`           | border-bottom | Optional border below the header.                                    |
| `--card-title-font-size`       | `16px`           | font-size     | Font size of the title text.                                         |
| `--card-title-font-weight`     | `600`            | font-weight   | Font weight of the title text.                                       |
| `--card-title-color`           | `inherit`        | color         | Color of the title text. Inherits from parent by default.            |
| `--card-description-font-size` | `14px`           | font-size     | Font size of the description text.                                   |
| `--card-description-color`     | `inherit`        | color         | Color of the description text. Inherits from parent by default.      |
| `--card-description-opacity`   | `0.6`            | opacity       | Opacity of the description text for visual hierarchy.                |
| `--card-content-padding`       | `16px`           | padding       | Padding of the content body.                                         |

## Web Component

Tag: `<sui-card>`

```html
<sui-card title="Order Summary" description="Review your items">
  <p>3 items in your cart</p>
</sui-card>
```
