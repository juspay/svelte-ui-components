# IconStack

A horizontal stack of circular icons/avatars with negative margin layering (each icon overlaps the previous one). Each item can be either an `image` (renders an `<img>`) or `text` (renders a text span). Icons are z-indexed so the first icon appears on top. Commonly used for showing multiple user avatars or bank icons in a compact space.

## Usage

```svelte
<script>
  import { IconStack } from '@juspay/svelte-ui-components';
</script>

<IconStack />
```

## Props

| Prop    | Type              | Required | Default | Description                                                                                                                                                            |
| ------- | ----------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icons   | `IconStackItem[]` | No       | `-`     | Array of IconStackItem objects. Each item has a `type` ('image' or 'text') and a `content` string (URL for images, display text for text items).                       |
| classes | `string`          | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                           | Default               | CSS Property    | Description                                             |
| ---------------------------------- | --------------------- | --------------- | ------------------------------------------------------- |
| `--stack-container-margin`         | `0px`                 | margin          | Margin of the icon stack container.                     |
| `--stack-icon-width`               | `36px`                | width           | Width of each icon circle.                              |
| `--stack-icon-height`              | `36px`                | height          | Height of each icon circle.                             |
| `--stack-icon-bg`                  | `white`               | background      | Background color of each icon circle.                   |
| `--stack-icon-radius`              | `50%`                 | border-radius   | Corner rounding of each icon (50% for circle).          |
| `--stack-icon-margin`              | `0px 0px 0px -14px`   | margin          | Margin of each icon (negative left for overlap effect). |
| `--stack-icon-align-items`         | `center`              | align-items     | Vertical alignment of content inside each icon.         |
| `--stack-icon-border`              | `1px solid #ffffff40` | border          | Border of each icon circle.                             |
| `--stack-icon-justify-content`     | `center`              | justify-content | Horizontal alignment of content inside each icon.       |
| `--stack-icon-shadow`              | `0 2px 4px #00000026` | box-shadow      | Box shadow of each icon circle.                         |
| `--stack-img-width`                | `36px`                | width           | Width of the image inside each icon.                    |
| `--stack-img-height`               | `36px`                | height          | Height of the image inside each icon.                   |
| `--text-conatiner-width`           | `36px`                | width           | Width of text-type icon containers.                     |
| `--text-conatiner-height`          | `36px`                | height          | Height of text-type icon containers.                    |
| `--text-container-align-items`     | `center`              | align-items     | Vertical alignment inside text-type icons.              |
| `--text-container-justify-content` | `center`              | justify-content | Horizontal alignment inside text-type icons.            |
| `--text-color`                     | `#666`                | color           | Text color inside text-type icons.                      |
| `--text-size`                      | `13px`                | font-size       | Font size inside text-type icons.                       |
| `--text-weight`                    | `500`                 | font-weight     | Font weight inside text-type icons.                     |
| `--text-align`                     | `center`              | text-align      | Text alignment inside text-type icons.                  |

## Type Reference

Custom types used by this component's props and events:

### IconStackItem

```typescript
type IconStackItem = { type: 'image' | 'text'; content: string };
```
