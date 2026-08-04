# Button

An action button with a built-in variant and size system: four visual styles (`primary`, `secondary`, `ghost`, `destructive`), three sizes (`sm`/`md`/`lg`), plus `iconOnly` and `fullWidth` affordances. It can render as a styled link via `href`, exposes a `loading` state (spinner + `aria-busy`), and supports icon/children snippets. Every visual property remains overridable through `--button-*` CSS variables, so an explicit override or a `classes` recipe always wins over the variant default.

## Usage

```svelte
<script>
  import { Button } from '@juspay/svelte-ui-components';
</script>

<Button text="Submit" onclick={(e) => console.log('clicked', e)} />
```

### Variants

```svelte
<Button text="Primary" variant="primary" />
<Button text="Secondary" variant="secondary" />
<Button text="Ghost" variant="ghost" />
<Button text="Destructive" variant="destructive" />
```

### Sizes

```svelte
<Button text="Small" size="sm" />
<Button text="Medium" size="md" />
<Button text="Large" size="lg" />
```

### Icon only

Pair `iconOnly` with `ariaLabel` so the button has an accessible name.

```svelte
<Button iconOnly ariaLabel="Add">
  {#snippet icon()}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  {/snippet}
</Button>
```

> Use `stroke="currentColor"` (or `fill="currentColor"`) in the icon so it inherits the button's text color across variants.

### Full width

```svelte
<Button text="Continue" fullWidth />
```

### Loading

`loading` shows the spinner, sets `aria-busy`, and disables the button (preferred over the legacy `showLoader`/`loaderType` pair).

```svelte
<Button text={saving ? 'Saving…' : 'Save'} loading={saving} onclick={save} />
```

### As a link

With `href` the button renders as a styled `<a>`. A disabled link is rendered inert via `aria-disabled` and `tabindex="-1"`.

```svelte
<Button text="Open docs" href="/docs" target="_blank" variant="secondary" />
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
| text            | `string`                          | No       | `-`        | The button label text. Rendered as plain text by default; set `allowHtml` to render as HTML.                                                                                                                               |
| variant         | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | No | `'primary'` | Visual style. Maps to the `--button-*` variables; an explicit `--button-color`/`classes` override wins over the variant default.                                                          |
| size            | `'sm' \| 'md' \| 'lg'`            | No       | `'md'`     | Size preset controlling padding, height, and font size.                                                                                                                                                                    |
| iconOnly        | `boolean`                         | No       | `false`    | Square padding for an icon-only button. Pair with `ariaLabel`.                                                                                                                                                             |
| fullWidth       | `boolean`                         | No       | `false`    | Stretch the button to the full width of its container.                                                                                                                                                                     |
| href            | `string`                          | No       | `-`        | Render the button as a styled `<a>`. `type` is ignored; a disabled link is made inert via `aria-disabled`/`tabindex="-1"`.                                                                                                  |
| target          | `string`                          | No       | `-`        | Anchor target (only with `href`), e.g. `_blank`.                                                                                                                                                                           |
| rel             | `string`                          | No       | `-`        | Anchor rel (only with `href`). Defaults to `noopener noreferrer` when `target="_blank"`.                                                                                                                                   |
| loading         | `boolean`                         | No       | `false`    | Loading state: shows the spinner, sets `aria-busy`, and disables the button. Preferred over `showLoader`/`loaderType`.                                                                                                      |
| allowHtml       | `boolean`                         | No       | `false`    | Render `text` as raw HTML. Only enable for trusted, non-user-derived markup.                                                                                                                                                |
| enable          | `boolean`                         | No       | `true`     | **Deprecated** — use `disabled`. When false the button is disabled. Retained for backward compatibility.                                                                                                                    |
| disabled        | `boolean`                         | No       | `false`    | Whether the button is disabled. When true, the button appears dimmed (opacity 0.4) and ignores clicks.                                                                                                                      |
| showProgressBar | `boolean`                         | No       | `false`    | **Deprecated.** Bindable. When true, a horizontal progress bar overlay animates across the button. Set automatically when `showLoader=true` and `loaderType='ProgressBar'` after first click.                              |
| showLoader      | `boolean`                         | No       | `false`    | **Deprecated** — prefer `loading`. Whether to show a loading indicator. Combined with `loaderType` to determine the visual style.                                                                                           |
| loaderType      | `'Circular' \| 'ProgressBar'`     | No       | `-`        | **Deprecated** — used with `showLoader`. `'Circular'` shows a spinning ring inside the button; `'ProgressBar'` shows a horizontal fill animation across the button.                                                         |
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

| Event        | Type                             | Description                                                                                                                                                                                  |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick      | `(event: MouseEvent) => void`    | Fires when the button is clicked. Does NOT fire when `showProgressBar` is active (clicks are silently ignored during progress).                                                              |
| onkeydown    | `(event: KeyboardEvent) => void` | Fires when a key is pressed down while the button has focus. Use together with `onkeyup` to implement keyboard hold-and-release interactions. Defaults to a no-op `() => {}` (always fires). |
| onkeyup      | `(event: KeyboardEvent) => void` | Fires when a key is released while the button has focus. Defaults to a no-op `() => {}` (always fires).                                                                                      |
| onmousedown  | `(event: MouseEvent) => void`    | Fires when a mouse button is pressed down on the button. Use together with `onmouseup`/`onmouseleave` to implement hold-and-release interactions.                                            |
| onmouseup    | `(event: MouseEvent) => void`    | Fires when a mouse button is released over the button. Use together with `onmousedown` to detect the end of a hold gesture.                                                                  |
| onmouseleave | `(event: MouseEvent) => void`    | Fires when the pointer leaves the button area. Use together with `onmousedown` to cancel a hold gesture if the pointer drifts off the button.                                                |
| ontouchstart | `(event: TouchEvent) => void`    | Fires when a touch point is placed on the button. Use together with `ontouchend` to implement hold-and-release interactions on touch devices.                                                |
| ontouchend   | `(event: TouchEvent) => void`    | Fires when a touch point is removed from the button. Use together with `ontouchstart` to detect the end of a touch hold gesture.                                                             |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default                                           | CSS Property       | Description                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--button-width`                            | `fit-content`                                     | width              | Width of the button container and button element.                                                                                                                                                                                                                                                   |
| `--button-max-height`                       | `-`                                               | max-height         | Maximum height of the button.                                                                                                                                                                                                                                                                       |
| `--button-max-width`                        | `-`                                               | max-width          | Maximum width of the button.                                                                                                                                                                                                                                                                        |
| `--button-min-width`                        | `-`                                               | min-width          | Minimum width of the button.                                                                                                                                                                                                                                                                        |
| `--button-font-family`                      | `-`                                               | font-family        | Font family for the button text.                                                                                                                                                                                                                                                                    |
| `--button-font-weight`                      | `500`                                             | font-weight        | Font weight of the button text.                                                                                                                                                                                                                                                                     |
| `--button-font-size`                        | `14px`                                            | font-size          | Font size of the button text.                                                                                                                                                                                                                                                                       |
| `--button-background`                       | `none`                                            | background-image   | Rest-state image layer painted over `--button-color` — takes any `background-image` value (a gradient, `url(…)`, or comma-separated layers). Deliberately a longhand, so the hook never resets other background layers a consumer may set; solid colors keep using `--button-color`. Also the fallback for hover/active/disabled backgrounds when those aren't set explicitly, so a gradient persists across states. |
| `--button-color`                            | `#3a4550`                                         | background-color   | **Background color** of the button (note: name is misleading — this controls background, not text color).                                                                                                                                                                                           |
| `--button-text-color`                       | `white`                                           | color              | Text/icon color of the button label.                                                                                                                                                                                                                                                                |
| `--button-height`                           | `fit-content`                                     | height             | Height of the button.                                                                                                                                                                                                                                                                               |
| `--button-padding`                          | `16px`                                            | padding            | Inner padding of the button.                                                                                                                                                                                                                                                                        |
| `--button-margin`                           | `-`                                               | margin             | Outer margin of the button.                                                                                                                                                                                                                                                                         |
| `--button-border-radius`                    | `var(--radius, 6px)`                              | border-radius      | Corner rounding of the button.                                                                                                                                                                                                                                                                      |
| `--cursor`                                  | `pointer`                                         | cursor             | Cursor style on hover.                                                                                                                                                                                                                                                                              |
| `--opacity`                                 | `1`                                               | opacity            | Opacity of the button.                                                                                                                                                                                                                                                                              |
| `--button-border`                           | `none`                                            | border             | Border style of the button.                                                                                                                                                                                                                                                                         |
| `--button-justify-content`                  | `center`                                          | justify-content    | Horizontal alignment of content inside the button (flex justify-content).                                                                                                                                                                                                                           |
| `--button-content-flex-direction`           | `row`                                             | flex-direction     | Layout direction of icon/text inside the button (row or column).                                                                                                                                                                                                                                    |
| `--button-content-gap`                      | `16px`                                            | gap                | Gap between icon and text inside the button.                                                                                                                                                                                                                                                        |
| `--button-visibility`                       | `visible`                                         | visibility         | Controls button visibility (visible/hidden).                                                                                                                                                                                                                                                        |
| `--button-box-shadow`                       | `none`                                            | box-shadow         | Box shadow of the button.                                                                                                                                                                                                                                                                           |
| `--button-transition`                       | `none`                                            | transition         | CSS transition of the button element, e.g. `background 0.2s ease`. Unset by default so existing consumers keep today's instant state changes; set this to animate hover/active background changes (most useful with `--button-background` gradients).                                               |
| `--disabled-cursor`                         | `not-allowed`                                     | cursor             | Cursor shown when the button is disabled.                                                                                                                                                                                                                                                           |
| `--disabled-opacity`                        | `0.4`                                             | opacity            | Opacity when the button is disabled.                                                                                                                                                                                                                                                                |
| `--disabled-text-color`                     | `-`                                               | color              | Text color when the button is disabled.                                                                                                                                                                                                                                                             |
| `--disabled-font-size`                      | `-`                                               | font-size          | Font size when the button is disabled.                                                                                                                                                                                                                                                              |
| `--disabled-font-weight`                    | `-`                                               | font-weight        | Font weight when the button is disabled.                                                                                                                                                                                                                                                            |
| `--disabled-border`                         | `-`                                               | border             | Border when the button is disabled.                                                                                                                                                                                                                                                                 |
| `--disabled-background-color`               | `-`                                               | background         | Background color when the button is disabled.                                                                                                                                                                                                                                                       |
| `--button-disabled-box-shadow`              | inherits `--button-box-shadow`                    | box-shadow         | Box shadow when the button is disabled. **Deprecated** — use `--disabled-box-shadow` instead (both names are supported for backward compatibility).                                                                                                                                                 |
| `--disabled-box-shadow`                     | inherits `--button-box-shadow`                    | box-shadow         | Box shadow when the button is disabled. Set to `none` to drop the resting shadow on disabled buttons. Preferred name (supersedes `--button-disabled-box-shadow`).                                                                                                                                   |
| `--button-loader-order`                     | `1`                                               | order              | Flex order of the circular loader relative to icon/text.                                                                                                                                                                                                                                            |
| `--button-icon-order`                       | `2`                                               | order              | Flex order of the icon relative to loader/text.                                                                                                                                                                                                                                                     |
| `--button-icon-display`                     | `-`                                               | display            | Display property of the icon container.                                                                                                                                                                                                                                                             |
| `--button-text-order`                       | `3`                                               | order              | Flex order of the text relative to loader/icon.                                                                                                                                                                                                                                                     |
| `--button-text-display`                     | `-`                                               | display            | Display property of the text container.                                                                                                                                                                                                                                                             |
| `--button-hover-color`                      | inherits `--button-background` → `--button-color` | background         | Background color on hover.                                                                                                                                                                                                                                                                          |
| `--button-hover-text-color`                 | inherits `--button-text-color`                    | color              | Text color on hover.                                                                                                                                                                                                                                                                                |
| `--button-hover-border`                     | inherits `--button-border`                        | border             | Border style on hover.                                                                                                                                                                                                                                                                              |
| `--button-hover-transform`                  | `-`                                               | transform          | CSS transform applied on hover (e.g., `scale(1.05)`). Allows hover scale effects without `:global()`.                                                                                                                                                                                               |
| `--button-active-transform`                 | `-`                                               | transform          | CSS transform applied on active/pressed state (e.g., `scale(0.95)`). Allows press-down effects without `:global()`.                                                                                                                                                                                 |
| `--button-hover-box-shadow`                 | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on hover. Allows raise-on-hover effects without `:global()`.                                                                                                                                                                                                                             |
| `--button-active-background`                | inherits `--button-background` → `--button-color` | background         | Background color on active/pressed state (e.g., a darker pressed shade).                                                                                                                                                                                                                            |
| `--button-active-box-shadow`                | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on active/pressed state.                                                                                                                                                                                                                                                                 |
| `--button-focus-visible-box-shadow`         | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on keyboard focus (`:focus-visible`), e.g. a focus ring, without `:global()`.                                                                                                                                                                                                            |
| `--button-progress-loader-background-color` | `#00000030`                                       | background         | Background color of the progress bar overlay.                                                                                                                                                                                                                                                       |
| `--button-progress-loader-duration`         | `8s`                                              | animation-duration | Duration of the progress bar fill animation.                                                                                                                                                                                                                                                        |

## Type Reference

Custom types used by this component's props and events:

### ButtonVariant

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
```

### ButtonSize

```typescript
type ButtonSize = 'sm' | 'md' | 'lg';
```

### LoaderType

```typescript
type LoaderType = 'Circular' | 'ProgressBar';
```

> **Note:** the `variant`/`size` presets only set internal default values — they never override an explicit `--button-*` variable or a `classes` recipe. This is what keeps existing consumers (e.g. apps that already drive `--button-color` through their own utility classes) rendering unchanged.

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
