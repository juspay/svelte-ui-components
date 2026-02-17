# Img

An image component with automatic fallback. If the primary `src` fails to load (onerror), it switches to the `fallback` URL. The fallback only triggers once (won't loop if fallback also fails). Supports hover styling for interactive image use cases.

## Usage

```svelte
<script>
  import { Img } from '@juspay/svelte-ui-components';
</script>

<Img
  src={"..."}
  alt={"..."}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| src | `string` | Yes | `-` | The primary image URL to display. |
| alt | `string` | Yes | `-` | Alt text for the image. |
| fallback | `string \| null` | No | `-` | Fallback image URL. If the primary src fails to load (onerror), the component switches to this URL. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--image-object-fit` | `-` | object-fit | Object-fit of the image (contain, cover, etc.). |
| `--image-height` | `24px` | height | Height of the image. |
| `--image-width` | `24px` | width | Width of the image. |
| `--image-padding` | `0px` | padding | Padding around the image. |
| `--image-border-radius` | `0px` | border-radius | Corner rounding of the image. |
| `--image-margin` | `0px` | margin | Margin around the image. |
| `--image-filter` | `none` | filter | CSS filter applied to the image (e.g., grayscale, brightness). |
| `--image-background` | `-` | background | Background behind the image. |
| `--image-border` | `-` | border | Border of the image. |
| `--image-transition` | `-` | transition | Transition animation for hover effects. |
| `--image-hover-background` | `var(--image-background` | background | Background on hover. |
| `--image-hover-border` | `var(--image-border` | border | Border on hover. |
