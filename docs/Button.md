# Button

An action button that supports two loader modes: a circular spinner overlay or a horizontal progress bar that fills over time. The button text supports HTML content. When `showLoader` is true with `loaderType='ProgressBar'`, clicking the button triggers a progress bar animation and prevents further clicks until complete. Includes icon slot support for rendering custom icon content next to the text.

## Usage

```svelte
<script>
  import { Button } from '@juspay/svelte-ui-components';
</script>

<Button
  text={"..."}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| text | `string` | Yes | `-` | The button label text. Supports HTML content (rendered via {@html}). |
| enable | `boolean` | No | `true` | Whether the button is clickable. When false, the button appears dimmed (opacity 0.4) and ignores clicks. |
| showProgressBar | `boolean` | No | `false` | Bindable. When true, a horizontal progress bar overlay animates across the button. Set automatically when showLoader=true and loaderType='ProgressBar' after first click. |
| showLoader | `boolean` | No | `false` | Whether to show a loading indicator. Combined with loaderType to determine the visual style. |
| loaderType | `LoaderType = 'Circular' \| 'ProgressBar'` | No | `-` | The type of loader to display when showLoader is true. 'Circular' shows a spinning ring inside the button; 'ProgressBar' shows a horizontal fill animation across the button. |
| type | `'submit' \| 'reset' \| 'button'` | No | `'submit'` | The HTML button type attribute. |
| testId | `string` | No | `-` | Value for the data-pw attribute, used for end-to-end testing selectors. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet | Type | Description |
|---------|------|-------------|
| icon | `Snippet` | A Svelte 5 Snippet for rendering custom icon content (e.g., an SVG) next to the button text. |

## Events

| Event | Type | Description |
|-------|------|-------------|
| onclick | `(event: MouseEvent) => void` | Fires when the button is clicked. Does NOT fire when showProgressBar is active (clicks are silently ignored during progress). |
| onkeyup | `(event: KeyboardEvent) => void` | Fires when a key is released while the button has focus. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--button-width` | `fit-content` | width | Width of the button container and button element. |
| `--button-max-height` | `-` | max-height | Maximum height of the button. |
| `--button-max-width` | `-` | max-width | Maximum width of the button. |
| `--button-font-family` | `-` | font-family | Font family for the button text. |
| `--button-font-weight` | `500` | font-weight | Font weight of the button text. |
| `--button-font-size` | `14px` | font-size | Font size of the button text. |
| `--button-color` | `#3a4550` | background-color | Background color of the button. |
| `--button-text-color` | `white` | color | Text color of the button label. |
| `--button-height` | `fit-content` | height | Height of the button. |
| `--button-padding` | `16px` | padding | Inner padding of the button. |
| `--button-margin` | `-` | margin | Outer margin of the button. |
| `--button-border-radius` | `0px` | border-radius | Corner rounding of the button. |
| `--cursor` | `pointer` | cursor | Cursor style on hover. |
| `--opacity` | `1` | opacity | Opacity of the button. |
| `--button-border` | `none` | border | Border style of the button. |
| `--button-justify-content` | `center` | justify-content | Horizontal alignment of content inside the button (flex justify-content). |
| `--button-content-flex-direction` | `row` | flex-direction | Layout direction of icon/text inside the button (row or column). |
| `--button-content-gap` | `16px` | gap | Gap between icon and text inside the button. |
| `--button-visibility` | `visible` | visibility | Controls button visibility (visible/hidden). |
| `--button-box-shadow` | `none` | box-shadow | Box shadow of the button. |
| `--disabled-cursor` | `not-allowed` | cursor | Cursor shown when the button is disabled. |
| `--disabled-opacity` | `0.4` | opacity | Opacity when the button is disabled. |
| `--button-loader-order` | `1` | order | Flex order of the circular loader relative to icon/text. |
| `--button-icon-order` | `2` | order | Flex order of the icon relative to loader/text. |
| `--button-icon-display` | `-` | display | Display property of the icon container. |
| `--button-text-order` | `3` | order | Flex order of the text relative to loader/icon. |
| `--button-text-display` | `-` | display | Display property of the text container. |
| `--button-hover-color` | `var(--button-color, #3a4550` | background | Background color on hover. |
| `--button-hover-text-color` | `var(--button-text-color, white` | color | Text color on hover. |
| `--button-hover-border` | `var(--button-border, none` | border | Border style on hover. |
| `--button-progress-loader-background-color` | `#00000030` | background | Background color of the progress bar overlay. |

## Type Reference

Custom types used by this component's props and events:

### LoaderType

```typescript
type LoaderType = 'Circular' | 'ProgressBar';
```

## Internal Dependencies

This component uses the following library components internally:

- Loader
