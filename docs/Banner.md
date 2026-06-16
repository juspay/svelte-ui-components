# Banner

A notification banner with optional icon snippet, text content, inline link text, right content slot, and a dismissible close button. Supports click interaction with keyboard accessibility (Enter/Space triggers click, `role="button"` + `tabindex` added automatically when `onclick` is provided). Uses a `slide` transition when showing/hiding. The `visible` prop is bindable for two-way dismiss state control. Good for promotional messages, alerts, or announcements.

## Usage

```svelte
<script>
  import { Banner } from '@juspay/svelte-ui-components';
</script>

<Banner
  text="New version available"
  linkText="Update now"
  dismissible
  onclick={() => console.log('banner clicked')}
  ondismiss={() => console.log('dismissed')}
/>
```

### With Custom Icon

```svelte
<Banner text="Deployment successful">
  {#snippet icon()}
    <svg>...</svg>
  {/snippet}
</Banner>
```

### With Right Content

```svelte
<Banner text="Trial ends in 3 days">
  {#snippet rightContent()}
    <button>Upgrade</button>
  {/snippet}
</Banner>
```

### With Title Snippet

```svelte
<Banner text="Your cart was abandoned 2 hours ago.">
  {#snippet title()}
    <strong>Don't forget your items</strong>
  {/snippet}
</Banner>
```

### Consumer Theming via `classes` (error + compact variant)

No tone enum is needed — define the variant in your app's CSS and pass it through `classes`:

```css
/* app.css */
.banner-error {
  --banner-background: #fff0f0;
  --banner-color: #c0392b;
  --banner-border: 1px solid #e74c3c;
  --banner-border-radius: 6px;
}

.banner-compact {
  --banner-padding: 6px 12px;
}
```

```svelte
<Banner
  text="Payment failed. Please try again."
  classes="banner-error banner-compact"
  role="alert"
/>
```

## Props

| Prop        | Type                                          | Required | Default | Description                                                                                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text        | `string`                                      | Yes      | `-`     | The main banner message text.                                                                                                                                                                                                                                                                   |
| icon        | `Snippet`                                     | No       | `-`     | Svelte 5 Snippet for a custom icon displayed to the left of the text.                                                                                                                                                                                                                           |
| title       | `Snippet`                                     | No       | `-`     | Optional Snippet rendered above the main text inside a `banner-body` flex column. When omitted the layout is identical to today.                                                                                                                                                                |
| linkText    | `string`                                      | No       | `-`     | Optional link text appended inline after the main text, styled in a different color (blue by default).                                                                                                                                                                                          |
| dismissible | `boolean`                                     | No       | `false` | Whether to show a close/dismiss button on the right side of the banner.                                                                                                                                                                                                                         |
| visible     | `boolean`                                     | No       | `true`  | Bindable. Controls whether the banner is visible. When `dismissible` is true, clicking the dismiss button sets this to `false`. Supports two-way binding via `bind:visible`.                                                                                                                    |
| role        | `string \| null`                              | No       | `null`  | ARIA role override. When provided, this value is used verbatim instead of the automatic `"button"` role that is added when `onclick` is present. Use `role="alert"` for error banners that should announce to screen readers.                                                                   |
| testId      | `string`                                      | No       | `-`     | Value for the `data-pw` attribute on the banner container. The dismiss button gets `{testId}-dismiss`. Used for Playwright selectors.                                                                                                                                                           |
| classes     | `string`                                      | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles (see example above).                                                                                                      |
| type        | `'info' \| 'success' \| 'warning' \| 'error'` | No       | `-`     | Intent preset that applies a soft tinted background, text and border for the matching state. When omitted the banner keeps its default neutral look. Each preset is overridable via its own `--banner-{type}-*` variables (and still respects the base `--banner-background`/`--banner-color`). |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet      | Type      | Description                                                                                                                              |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| icon         | `Snippet` | Custom icon content displayed to the left of the text. Rendered inside a flex container with configurable size via `--banner-icon-size`. |
| title        | `Snippet` | Optional heading rendered above the main text. Controlled via `--banner-title-font-weight` and `--banner-body-gap`.                      |
| rightContent | `Snippet` | Custom content on the right side of the banner, before the dismiss button.                                                               |
| dismissIcon  | `Snippet` | Custom icon for the dismiss button. Defaults to a built-in close (X) SVG.                                                                |

## Events

| Event     | Type                          | Description                                                                                                                                                           |
| --------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void` | Fires when anywhere on the banner is clicked. When provided, the banner becomes interactive with `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). |
| ondismiss | `() => void`                  | Fires after the banner is dismissed (visible set to false). The click event is stopped from propagating to the banner's onclick handler.                              |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default              | CSS Property     | Description                                                                                                                    |
| ----------------------------------- | -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--banner-width`                    | `100%`               | width            | Width of the banner.                                                                                                           |
| `--banner-height`                   | `-`                  | height           | Height of the banner.                                                                                                          |
| `--banner-padding`                  | `10px 12px`          | padding          | Inner padding of the banner.                                                                                                   |
| `--banner-gap`                      | `8px`                | gap              | Gap between banner content elements (icon, text, right content, dismiss).                                                      |
| `--banner-justify-content`          | `center`             | justify-content  | Horizontal alignment of banner content.                                                                                        |
| `--banner-background`               | `#f0f4f8`            | background-color | Background color of the banner.                                                                                                |
| `--banner-color`                    | `#637c95`            | color            | Text color of the banner.                                                                                                      |
| `--banner-font-family`              | `-`                  | font-family      | Font family of the banner text.                                                                                                |
| `--banner-font-size`                | `14px`               | font-size        | Font size of the banner text.                                                                                                  |
| `--banner-font-weight`              | `500`                | font-weight      | Font weight of the banner text.                                                                                                |
| `--banner-line-height`              | `1.3`                | line-height      | Line height of the banner text.                                                                                                |
| `--banner-border-bottom`            | `none`               | border-bottom    | Bottom border of the banner.                                                                                                   |
| `--banner-border`                   | `-`                  | border           | Full border shorthand. Overrides `--banner-border-bottom` when set.                                                            |
| `--banner-border-radius`            | `0`                  | border-radius    | Corner radius of the banner. Use with `--banner-border` for card-style notifications.                                          |
| `--banner-cursor`                   | `pointer`            | cursor           | Cursor style when hovering the banner.                                                                                         |
| `--banner-position`                 | `sticky`             | position         | CSS position of the banner (sticky sticks to viewport on scroll).                                                              |
| `--banner-top`                      | `0`                  | top              | Top position of the banner.                                                                                                    |
| `--banner-z-index`                  | `100`                | z-index          | Z-index stacking order of the banner.                                                                                          |
| `--banner-icon-color`               | `currentColor`       | color            | Color of the icon container.                                                                                                   |
| `--banner-icon-size`                | `18px`               | width, height    | Width and height of SVGs inside the icon snippet.                                                                              |
| `--banner-body-gap`                 | `0`                  | gap              | Vertical gap between the title and text inside `banner-body`. Set to e.g. `4px` to add spacing when using the `title` snippet. |
| `--banner-title-font-weight`        | `inherit`            | font-weight      | Font weight of the title row. Inherits the banner's font-weight by default.                                                    |
| `--banner-link-color`               | `#0099ff`            | color            | Color of the inline link text.                                                                                                 |
| `--banner-link-gap`                 | `4px`                | margin-left      | Space between the main text and the link text.                                                                                 |
| `--banner-dismiss-border-radius`    | `4px`                | border-radius    | Border radius of the dismiss button.                                                                                           |
| `--banner-dismiss-color`            | `currentColor`       | color            | Color of the dismiss button icon.                                                                                              |
| `--banner-dismiss-hover-background` | `rgba(0, 0, 0, 0.1)` | background-color | Background color of the dismiss button on hover.                                                                               |
| `--banner-dismiss-size`             | `14px`               | width, height    | Width and height of the dismiss button icon SVG.                                                                               |

### Type variants

Set when the `type` prop is used. Each falls back to the base `--banner-background` / `--banner-color` and finally to the literal default, so a consumer can theme a preset either globally or per-type.

| Variable                                                                             | Applies when     | Default                                     |
| ------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------- |
| `--banner-info-background` / `--banner-info-color` / `--banner-info-border`          | `type="info"`    | `#e8f4fb` / `#1a6b8a` / `1px solid #87ceeb` |
| `--banner-success-background` / `--banner-success-color` / `--banner-success-border` | `type="success"` | `#e6f7ed` / `#166534` / `1px solid #24aa5a` |
| `--banner-warning-background` / `--banner-warning-color` / `--banner-warning-border` | `type="warning"` | `#fef3e2` / `#92520a` / `1px solid #f3a42d` |
| `--banner-error-background` / `--banner-error-color` / `--banner-error-border`       | `type="error"`   | `#fde8e8` / `#9b1c1c` / `1px solid #f04438` |

## Accessibility

- When `onclick` is provided, the banner gets `role="button"` and `tabindex="0"` for keyboard interaction.
- Use the `role` prop to override the automatic role (e.g. `role="alert"` for error banners that should be announced immediately by screen readers). Pass `role=""` to remove any role.
- Enter and Space keys trigger the banner's click handler.
- The dismiss button has `aria-label="Dismiss"`.
- Uses Svelte's `slide` transition for smooth show/hide animation.

## Internal Dependencies

This component uses the following library components internally:

- Button (for the dismiss button)

## Web Component

Tag: `<sui-banner>`

```html
<sui-banner text="Update available" dismissible>
  <svg slot="icon">...</svg>
  <a slot="right-content" href="/update">Update now</a>
</sui-banner>
```

### Slots

| Slot Name       | Maps to Snippet | Description                                       |
| --------------- | --------------- | ------------------------------------------------- |
| `icon`          | `icon`          | Icon content rendered at the start of the banner. |
| `title`         | `title`         | Optional heading rendered above the main text.    |
| `right-content` | `rightContent`  | Content rendered on the right side.               |
| `dismiss-icon`  | `dismissIcon`   | Custom dismiss/close icon.                        |
