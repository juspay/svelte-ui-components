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

## Props

| Prop        | Type      | Required | Default | Description                                                                                                                                                                                                                |
| ----------- | --------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text        | `string`  | Yes      | `-`     | The main banner message text.                                                                                                                                                                                              |
| icon        | `Snippet` | No       | `-`     | Svelte 5 Snippet for a custom icon displayed to the left of the text. Replaces the old `string` image URL prop.                                                                                                            |
| linkText    | `string`  | No       | `-`     | Optional link text appended inline after the main text, styled in a different color (blue by default).                                                                                                                     |
| dismissible | `boolean` | No       | `false` | Whether to show a close/dismiss button on the right side of the banner.                                                                                                                                                    |
| visible     | `boolean` | No       | `true`  | Bindable. Controls whether the banner is visible. When `dismissible` is true, clicking the dismiss button sets this to `false`. Supports two-way binding via `bind:visible`.                                               |
| testId      | `string`  | No       | `-`     | Value for the `data-pw` attribute on the banner container. The dismiss button gets `{testId}-dismiss`. Used for Playwright selectors.                                                                                      |
| classes     | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet      | Type      | Description                                                                                                                              |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| icon         | `Snippet` | Custom icon content displayed to the left of the text. Rendered inside a flex container with configurable size via `--banner-icon-size`. |
| rightContent | `Snippet` | Custom content on the right side of the banner, before the dismiss button.                                                               |
| dismissIcon  | `Snippet` | Custom icon for the dismiss button. Defaults to a built-in close (X) SVG.                                                                |

## Events

| Event     | Type                          | Description                                                                                                                                                           |
| --------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void` | Fires when anywhere on the banner is clicked. When provided, the banner becomes interactive with `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). |
| ondismiss | `() => void`                  | Fires after the banner is dismissed (visible set to false). The click event is stopped from propagating to the banner's onclick handler.                              |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default              | CSS Property     | Description                                                               |
| ----------------------------------- | -------------------- | ---------------- | ------------------------------------------------------------------------- |
| `--banner-width`                    | `100%`               | width            | Width of the banner.                                                      |
| `--banner-height`                   | `-`                  | height           | Height of the banner.                                                     |
| `--banner-padding`                  | `10px 12px`          | padding          | Inner padding of the banner.                                              |
| `--banner-gap`                      | `8px`                | gap              | Gap between banner content elements (icon, text, right content, dismiss). |
| `--banner-justify-content`          | `center`             | justify-content  | Horizontal alignment of banner content.                                   |
| `--banner-background`               | `#f0f4f8`            | background-color | Background color of the banner.                                           |
| `--banner-color`                    | `#637c95`            | color            | Text color of the banner.                                                 |
| `--banner-font-family`              | `-`                  | font-family      | Font family of the banner text.                                           |
| `--banner-font-size`                | `14px`               | font-size        | Font size of the banner text.                                             |
| `--banner-font-weight`              | `500`                | font-weight      | Font weight of the banner text.                                           |
| `--banner-line-height`              | `1.3`                | line-height      | Line height of the banner text.                                           |
| `--banner-border-bottom`            | `none`               | border-bottom    | Bottom border of the banner.                                              |
| `--banner-cursor`                   | `pointer`            | cursor           | Cursor style when hovering the banner.                                    |
| `--banner-position`                 | `sticky`             | position         | CSS position of the banner (sticky sticks to viewport on scroll).         |
| `--banner-top`                      | `0`                  | top              | Top position of the banner.                                               |
| `--banner-z-index`                  | `100`                | z-index          | Z-index stacking order of the banner.                                     |
| `--banner-icon-color`               | `currentColor`       | color            | Color of the icon container.                                              |
| `--banner-icon-size`                | `18px`               | width, height    | Width and height of SVGs inside the icon snippet.                         |
| `--banner-link-color`               | `#0099ff`            | color            | Color of the inline link text.                                            |
| `--banner-link-gap`                 | `4px`                | margin-left      | Space between the main text and the link text.                            |
| `--banner-dismiss-border-radius`    | `4px`                | border-radius    | Border radius of the dismiss button.                                      |
| `--banner-dismiss-color`            | `currentColor`       | color            | Color of the dismiss button icon.                                         |
| `--banner-dismiss-hover-background` | `rgba(0, 0, 0, 0.1)` | background-color | Background color of the dismiss button on hover.                          |
| `--banner-dismiss-size`             | `14px`               | width, height    | Width and height of the dismiss button icon SVG.                          |

## Accessibility

- When `onclick` is provided, the banner gets `role="button"` and `tabindex="0"` for keyboard interaction.
- Enter and Space keys trigger the banner's click handler.
- The dismiss button has `aria-label="Dismiss"`.
- Uses Svelte's `slide` transition for smooth show/hide animation.

## Internal Dependencies

This component uses the following library components internally:

- Button (for the dismiss button)
