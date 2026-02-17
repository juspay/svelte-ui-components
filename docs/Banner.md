# Banner

A notification banner (sticky by default, positioned at top) with an optional left icon image, text content, optional link text (rendered inline with different color), and an optional right content snippet. The entire banner is clickable. Good for promotional messages or alerts.

## Usage

```svelte
<script>
  import { Banner } from '@juspay/svelte-ui-components';
</script>

<Banner
  text={"..."}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| text | `string` | Yes | `-` | The main banner message text. |
| icon | `string \| null` | No | `-` | URL of an icon image displayed to the left of the text. |
| linkText | `string \| null` | No | `-` | Optional link text appended inline after the main text, styled in a different color (blue by default). |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet | Type | Description |
|---------|------|-------------|
| rightContent | `Snippet` | A Svelte 5 Snippet for custom content on the right side of the banner. |

## Events

| Event | Type | Description |
|-------|------|-------------|
| onclick | `(event: MouseEvent) => void` | Fires when anywhere on the banner is clicked. |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the banner has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--banner-position` | `sticky` | position | CSS position of the banner (sticky sticks to viewport on scroll). |
| `--banner-top` | `0px` | top | Top position of the banner. |
| `--banner-display` | `flex` | display | Display mode of the banner. |
| `--banner-align-items` | `center` | align-items | Vertical alignment of banner content. |
| `--banner-bg-color` | `#637c9529` | background-color | Background color of the banner. |
| `--banner-width` | `100%` | width | Width of the banner. |
| `--banner-height` | `37px` | height | Height of the banner. |
| `--banner-padding` | `10px 12px, 10px, 12px` | padding | Inner padding of the banner. |
| `--banner-gap` | `8px` | gap | Gap between banner content elements. |
| `--banner-justify-content` | `center` | justify-content | Horizontal alignment of banner content. |
| `--banner-cursor` | `pointer` | cursor | Cursor style when hovering the banner. |
| `--banner-img-color` | `#637c95` | color | Color filter for the banner icon. |
| `--banner-img-width` | `18px` | width | Width of the banner icon. |
| `--banner-img-height` | `11.69px` | height | Height of the banner icon. |
| `--banner-img-margin-bottom` | `6px` | margin-bottom | Bottom margin of the banner icon. |
| `--banner-image-align-items` | `center` | align-items | Vertical alignment of the icon container. |
| `--banner-text-flex` | `-` | flex | Flex value of the text container. |
| `--banner-text-order` | `-` | order | Flex order of the text container. |
| `--banner-text-size` | `14px` | size | Size of the banner text. |
| `--banner-font-family` | `Euclid Circular A` | font-family | Font family of the banner text. |
| `--banner-font-style` | `normal` | font-style | Font style of the banner text. |
| `--banner-text-color` | `#637c95` | color | Color of the banner text. |
| `--banner-font-size` | `14px` | font-size | Font size of the banner text. |
| `--banner-line-height` | `17.75px` | line-height | Line height of the banner text. |
| `--banner-font-weight` | `500` | font-weight | Font weight of the banner text. |
| `--banner-overflow` | `hidden` | overflow | Overflow behavior of the banner text. |
| `--banner-text-overflow` | `ellipsis` | text-overflow | Text overflow style (ellipsis for truncation). |
| `--banner-text-white-space` | `nowrap` | white-space | White space handling for banner text. |
| `--banner-text-align-items` | `center` | align-items | Vertical alignment of the text content. |
| `--banner-linktext-color` | `#0099ff` | color | Color of the link text appended to the main text. |
| `--banner-right-content-order` | `-` | order | Flex order of the right content area. |
| `--banner-right-content-display` | `flex` | display | Display mode of the right content area. |
