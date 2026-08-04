# Icon

An icon component that displays an image or inline SVG with an optional text label. By default the container renders as an interactive button (`role="button"`, `tabindex`, click/keydown handling) for accessibility; set `interactive={false}` for purely decorative or informational icons that shouldn't be exposed to assistive tech or the tab order. Layout direction (row or column) is controlled via CSS variable `--icon-container-direction`. Supports two rendering modes: image URL via `icon` prop, or raw SVG markup via `svg` prop.

## Usage

```svelte
<script>
  import { Icon } from '@juspay/svelte-ui-components';
</script>

<!-- Image-based icon -->
<Icon icon="/icons/home.svg" text="Home" />

<!-- Inline SVG icon -->
<Icon svg={'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'} text="Star" />
```

## Props

| Prop    | Type             | Required | Default | Description                                                                                                                                                            |
| ------- | ---------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon    | `string`         | No       | `-`     | URL of the icon image to display. Rendered as `<img src>`.                                                                                                             |
| svg     | `string`         | No       | `-`     | Raw SVG markup string to render inline via `{@html}`. When provided, takes priority over `icon`. Inherits `currentColor` for styling. **Must be trusted content** — never pass unsanitized user input (see Security note below). |
| text    | `string \| null` | No       | `-`     | Optional text label displayed below the icon.                                                                                                                          |
| classes | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| interactive | `boolean`    | No       | `true`  | When `true`, the container gets `role="button"`, `tabindex="0"`, and the `onclick`/`onkeydown` handlers. When `false`, none of those are rendered — use for decorative or informational icons with no click behavior. |

> **Note:** At least one of `icon` or `svg` should be provided. If both are provided, `svg` takes priority.

> **Security:** The `svg` prop uses `{@html}` for rendering and is **not sanitized**. Only pass trusted SVG markup — never pass unsanitized user input, as it may enable XSS attacks (e.g. `<svg onload="...">`).

## Events

| Event     | Type                             | Description                                                     |
| --------- | -------------------------------- | --------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void`    | Fires when the icon container is clicked. Only wired up when `interactive` is `true` (the default). |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the icon container has focus. Only wired up when `interactive` is `true` (the default). |

## CSS Variables

Override these custom properties to theme the component.

| Variable                     | Default        | CSS Property   | Description                                                                |
| ---------------------------- | -------------- | -------------- | -------------------------------------------------------------------------- |
| `--icon-container-paddding`  | `4px`          | padding        | Inner padding of the icon container.                                       |
| `--icon-container-direction` | `column`       | flex-direction | Layout direction of icon + text (column for vertical, row for horizontal). |
| `--icon-height`              | `20px`         | height         | Height of the icon image or SVG container.                                 |
| `--icon-width`               | `20px`         | width          | Width of the icon image or SVG container.                                  |
| `--icon-padding`             | `4px`          | padding        | Padding around the icon image or SVG container.                            |
| `--icon-svg-color`           | `currentColor` | color          | Color of the inline SVG icon (only applies when using `svg` prop).         |
| `--icon-text-padding`        | `4px`          | padding        | Padding around the text label.                                             |
| `--icon-text-direction`      | `column`       | flex-direction | Layout direction of the text area.                                         |
| `--icon-text-font-size`      | `12px`         | font-size      | Font size of the text label.                                               |

## Web Component

Tag: `<sui-icon>`

```html
<!-- Image-based -->
<sui-icon icon="/icons/home.svg" text="Home"></sui-icon>

<!-- Inline SVG -->
<sui-icon svg="<svg viewBox='0 0 24 24' fill='currentColor'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>" text="Star"></sui-icon>
```
