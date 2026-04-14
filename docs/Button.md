# Button

An action button that supports two loader modes: a circular spinner overlay or a horizontal progress bar that fills over time. The button text supports HTML content. When `showLoader` is true with `loaderType='ProgressBar'`, clicking the button triggers a progress bar animation and prevents further clicks until complete. Includes icon and children snippet support for rendering custom content.

## Usage

```svelte
<script>
  import { Button } from '@juspay/svelte-ui-components';
</script>

<Button text="Submit" onclick={(e) => console.log('clicked', e)} />
```

### With Icon

```svelte
<Button text="Download" onclick={handleDownload}>
  {#snippet icon()}
    <svg>...</svg>
  {/snippet}
</Button>
```

### With Children (Custom Content)

```svelte
<Button onclick={handleClick}>
  {#snippet children()}
    <span>Custom content with <strong>formatting</strong></span>
  {/snippet}
</Button>
```

## Props

| Prop            | Type                              | Required | Default    | Description                                                                                                                                                                                                                |
| --------------- | --------------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text            | `string`                          | No       | `-`        | The button label text. Supports HTML content (rendered via `{@html}`).                                                                                                                                                     |
| enable          | `boolean`                         | No       | `true`     | Whether the button is clickable. When false, the button appears dimmed and ignores clicks. Equivalent to the inverse of `disabled`.                                                                                        |
| disabled        | `boolean`                         | No       | `false`    | Whether the button is disabled. When true, the button appears dimmed (opacity 0.4) and ignores clicks. Takes effect alongside `enable` — either being falsy disables the button.                                           |
| showProgressBar | `boolean`                         | No       | `false`    | Bindable. When true, a horizontal progress bar overlay animates across the button. Set automatically when `showLoader=true` and `loaderType='ProgressBar'` after first click.                                              |
| showLoader      | `boolean`                         | No       | `false`    | Whether to show a loading indicator. Combined with `loaderType` to determine the visual style.                                                                                                                             |
| loaderType      | `'Circular' \| 'ProgressBar'`     | No       | `-`        | The type of loader to display when `showLoader` is true. `'Circular'` shows a spinning ring inside the button; `'ProgressBar'` shows a horizontal fill animation across the button.                                        |
| type            | `'submit' \| 'reset' \| 'button'` | No       | `'button'` | The HTML button `type` attribute.                                                                                                                                                                                          |
| testId          | `string`                          | No       | `-`        | Value for the `data-pw` attribute, used for end-to-end testing selectors.                                                                                                                                                  |
| ariaLabel       | `string`                          | No       | `-`        | Accessible label for the button. Used when the button has only an icon and no visible text.                                                                                                                                |
| ariaExpanded    | `boolean`                         | No       | `-`        | Sets `aria-expanded` on the button element. Use when the button controls an expandable region (dropdown, accordion, etc.).                                                                                                 |
| ariaSelected    | `boolean`                         | No       | `-`        | Sets `aria-selected` on the button element. Use when the button represents a selectable option (e.g., inside an autocomplete dropdown or tab-like pattern).                                                                |
| role            | `string`                          | No       | `-`        | Overrides the default ARIA role of the button element. Use `'option'` when the button represents a selectable item in a listbox pattern, or `'tab'` for tab-like navigation.                                               |
| classes         | `string`                          | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                                                                  |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| icon     | `Snippet` | A Svelte 5 Snippet for rendering custom icon content (e.g., an SVG) next to the button text. Rendered inside a flex container with configurable order.       |
| children | `Snippet` | A Svelte 5 Snippet for rendering arbitrary content inside the button. Use this instead of `text` when you need full control over the button's inner content. |

## Events

| Event   | Type                             | Description                                                                                                                     |
| ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(event: MouseEvent) => void`    | Fires when the button is clicked. Does NOT fire when `showProgressBar` is active (clicks are silently ignored during progress). |
| onkeyup | `(event: KeyboardEvent) => void` | Fires when a key is released while the button has focus. Defaults to a no-op `() => {}` (always fires, unlike other events which default to undefined). |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default                        | CSS Property       | Description                                                                                               |
| ------------------------------------------- | ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------- |
| `--button-width`                            | `fit-content`                  | width              | Width of the button container and button element.                                                         |
| `--button-max-height`                       | `-`                            | max-height         | Maximum height of the button.                                                                             |
| `--button-max-width`                        | `-`                            | max-width          | Maximum width of the button.                                                                              |
| `--button-font-family`                      | `-`                            | font-family        | Font family for the button text.                                                                          |
| `--button-font-weight`                      | `500`                          | font-weight        | Font weight of the button text.                                                                           |
| `--button-font-size`                        | `14px`                         | font-size          | Font size of the button text.                                                                             |
| `--button-color`                            | `#3a4550`                      | background-color   | **Background color** of the button (note: name is misleading — this controls background, not text color). |
| `--button-text-color`                       | `white`                        | color              | Text/icon color of the button label.                                                                      |
| `--button-height`                           | `fit-content`                  | height             | Height of the button.                                                                                     |
| `--button-padding`                          | `16px`                         | padding            | Inner padding of the button.                                                                              |
| `--button-margin`                           | `-`                            | margin             | Outer margin of the button.                                                                               |
| `--button-border-radius`                    | `0px`                          | border-radius      | Corner rounding of the button.                                                                            |
| `--cursor`                                  | `pointer`                      | cursor             | Cursor style on hover.                                                                                    |
| `--opacity`                                 | `1`                            | opacity            | Opacity of the button.                                                                                    |
| `--button-border`                           | `none`                         | border             | Border style of the button.                                                                               |
| `--button-justify-content`                  | `center`                       | justify-content    | Horizontal alignment of content inside the button (flex justify-content).                                 |
| `--button-content-flex-direction`           | `row`                          | flex-direction     | Layout direction of icon/text inside the button (row or column).                                          |
| `--button-content-gap`                      | `16px`                         | gap                | Gap between icon and text inside the button.                                                              |
| `--button-visibility`                       | `visible`                      | visibility         | Controls button visibility (visible/hidden).                                                              |
| `--button-box-shadow`                       | `none`                         | box-shadow         | Box shadow of the button.                                                                                 |
| `--disabled-cursor`                         | `not-allowed`                  | cursor             | Cursor shown when the button is disabled.                                                                 |
| `--disabled-opacity`                        | `0.4`                          | opacity            | Opacity when the button is disabled.                                                                      |
| `--button-loader-order`                     | `1`                            | order              | Flex order of the circular loader relative to icon/text.                                                  |
| `--button-icon-order`                       | `2`                            | order              | Flex order of the icon relative to loader/text.                                                           |
| `--button-icon-display`                     | `-`                            | display            | Display property of the icon container.                                                                   |
| `--button-text-order`                       | `3`                            | order              | Flex order of the text relative to loader/icon.                                                           |
| `--button-text-display`                     | `-`                            | display            | Display property of the text container.                                                                   |
| `--button-hover-color`                      | inherits `--button-color`      | background         | Background color on hover.                                                                                |
| `--button-hover-text-color`                 | inherits `--button-text-color` | color              | Text color on hover.                                                                                      |
| `--button-hover-border`                     | inherits `--button-border`     | border             | Border style on hover.                                                                                    |
| `--button-hover-transform`                  | `-`                            | transform          | CSS transform applied on hover (e.g., `scale(1.05)`). Allows hover scale effects without `:global()`.    |
| `--button-active-transform`                 | `-`                            | transform          | CSS transform applied on active/pressed state (e.g., `scale(0.95)`). Allows press-down effects without `:global()`. |
| `--button-progress-loader-background-color` | `#00000030`                    | background         | Background color of the progress bar overlay.                                                             |
| `--button-progress-loader-duration`         | `8s`                           | animation-duration | Duration of the progress bar fill animation.                                                              |

## Type Reference

Custom types used by this component's props and events:

### LoaderType

```typescript
type LoaderType = 'Circular' | 'ProgressBar';
```

## Internal Dependencies

This component uses the following library components internally:

- Loader (for the circular spinner mode)

## Web Component

Tag: `<sui-button>`

```html
<sui-button text="Submit"></sui-button>

<!-- With icon slot -->
<sui-button text="Download">
  <svg slot="icon">...</svg>
</sui-button>

<!-- With custom content -->
<sui-button>
  <span>Custom <strong>content</strong></span>
</sui-button>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                                  |
| ----------- | --------------- | ------------------------------------------------------------ |
| _(default)_ | `children`      | Custom content rendered inside the button (replaces `text`). |
| `icon`      | `icon`          | Icon content rendered next to the button text.               |
