# Badge

An icon with a numeric/text badge overlay positioned in the top-right corner. Displays an image with a small badge bubble containing the `value` text. Commonly used for notification counts on icons.

## Usage

```svelte
<script>
  import { Badge } from '@juspay/svelte-ui-components';
</script>

<Badge />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| image | `string` | No | `-` | URL of the main icon/image behind the badge. |
| value | `string` | No | `-` | Text displayed inside the badge bubble (e.g., notification count like '3' or '99+'). |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--badge-wrap-margin` | `0px 12px 10px 0px` | margin | Outer margin of the badge wrapper. |
| `--badge-wrap-padding` | `8px 8px 8px 8px` | padding | Inner padding of the badge wrapper. |
| `--badge-color` | `#fff` | color | Text color inside the badge bubble. |
| `--badge-background` | `#727272` | background-color | Background color of the badge bubble. |
| `--badge-font-size` | `12px` | font-size | Font size of the badge text. |
| `--badge-font-family` | `Euclid Circular A` | font-family | Font family of the badge text. |
| `--badge-padding` | `2px 7.5px` | padding | Padding inside the badge bubble. |
| `--badge-border-radius` | `100px` | border-radius | Corner rounding of the badge bubble. |
| `--badge-min-width` | `7px` | min-width | Minimum width of the badge bubble. |
| `--badge-min-height` | `7px` | min-height | Minimum height of the badge bubble. |
| `--badge-border` | `0.6px solid #fff` | border | Border of the badge bubble. |
| `--badge-top` | `0` | top | Top position of the badge relative to the icon. |
| `--badge-right` | `0` | right | Right position of the badge relative to the icon. |
| `--badge-bottom` | `-` | bottom | Bottom position of the badge. |
| `--badge-left` | `-` | left | Left position of the badge. |
| `--badge-img-border-radius` | `6px` | border-radius | Corner rounding of the main icon image. |
| `--badge-img-width` | `64px` | width | Width of the main icon image. |
| `--badge-img-height` | `64px` | height | Height of the main icon image. |
| `--badge-object-fit` | `contain` | object-fit | Object-fit of the main icon image. |
| `--badge-img-icon-shadow` | `0 0 0 0.5px #798fa54d` | box-shadow | Box shadow of the main icon image. |
| `--badge-img-background-color` | `-` | background-color | Background color behind the main icon image. |
