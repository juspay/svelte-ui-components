# Badge

An icon with a numeric/text badge overlay positioned in the top-right corner, or a standalone count/dot bubble. When `image` is provided the badge overlays the image in the top-right corner. When used without `image` the badge renders as a standalone element — useful for notification counts or status indicators placed inline.

## Usage

```svelte
<script>
  import { Badge } from '@juspay/svelte-ui-components';
</script>

<Badge />
```

## Props

| Prop      | Type               | Required | Default   | Description                                                                                                                                                                                                                |
| --------- | ------------------ | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| image     | `string`           | No       | `-`       | URL of the main icon/image behind the badge. When omitted the badge renders standalone (no image wrapper).                                                                                                                 |
| alt       | `string`           | No       | `''`      | Alt text for the icon image. Use a descriptive string when the image conveys meaning; leave empty (default) for purely decorative images.                                                                                  |
| value     | `string`           | No       | `-`       | Text displayed inside the badge bubble (e.g., notification count like '3' or '99+'). Ignored when `mode` is `'dot'`.                                                                                                       |
| mode      | `'count' \| 'dot'` | No       | `'count'` | Render mode. `'count'` shows the `value` text; `'dot'` renders a small indicator dot with no text.                                                                                                                         |
| hidden    | `boolean`          | No       | `false`   | When `true` the badge bubble is not rendered (the image wrapper, if any, is still visible).                                                                                                                                |
| ariaLabel | `string`           | No       | `-`       | Overrides the auto-derived `aria-label` on a standalone count badge. Has no effect in dot mode or when `image` is provided.                                                                                                |
| testId    | `string`           | No       | `-`       | Value for the `data-pw` attribute on the root element, used by Playwright tests.                                                                                                                                           |
| classes   | `string`           | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Accessibility

When rendered **standalone** (no `image`), the component sets `role="status"` and derives `aria-label` from `value` automatically. Pass `ariaLabel` to supply a more descriptive label (e.g. `"3 unread notifications"`). For `mode="dot"` the element uses `role="presentation"` because a dot carries no numeric meaning on its own — wrap it with a parent element that has its own label or tooltip to give screen-reader users the full context.

## CSS Variables

Override these custom properties to theme the component.

| Variable                       | Default                 | CSS Property     | Description                                           |
| ------------------------------ | ----------------------- | ---------------- | ----------------------------------------------------- |
| `--badge-wrap-margin`          | `0px 12px 10px 0px`     | margin           | Outer margin of the badge wrapper.                    |
| `--badge-wrap-padding`         | `8px 8px 8px 8px`       | padding          | Inner padding of the badge wrapper.                   |
| `--badge-color`                | `#fff`                  | color            | Text color inside the badge bubble.                   |
| `--badge-background`           | `#727272`               | background-color | Background color of the badge bubble.                 |
| `--badge-font-size`            | `12px`                  | font-size        | Font size of the badge text.                          |
| `--badge-font-family`          | `inherit`               | font-family      | Font family of the badge text.                        |
| `--badge-padding`              | `3px 8px`               | padding          | Padding inside the badge bubble.                      |
| `--badge-border-radius`        | `100px`                 | border-radius    | Corner rounding of the badge bubble.                  |
| `--badge-min-width`            | `18px`                  | min-width        | Minimum width of the badge bubble.                    |
| `--badge-min-height`           | `18px`                  | min-height       | Minimum height of the badge bubble.                   |
| `--badge-border`               | `1px solid #fff`        | border           | Border of the badge bubble.                           |
| `--badge-top`                  | `0`                     | top              | Top position of the badge relative to the icon.       |
| `--badge-right`                | `0`                     | right            | Right position of the badge relative to the icon.     |
| `--badge-bottom`               | `-`                     | bottom           | Bottom position of the badge.                         |
| `--badge-left`                 | `-`                     | left             | Left position of the badge.                           |
| `--badge-dot-size`             | `10px`                  | width / height   | Size (width and height) of the dot when `mode="dot"`. |
| `--badge-standalone-position`  | `static`                | position         | CSS position of the badge when rendered standalone.   |
| `--badge-img-border-radius`    | `6px`                   | border-radius    | Corner rounding of the main icon image.               |
| `--badge-img-width`            | `64px`                  | width            | Width of the main icon image.                         |
| `--badge-img-height`           | `64px`                  | height           | Height of the main icon image.                        |
| `--badge-object-fit`           | `contain`               | object-fit       | Object-fit of the main icon image.                    |
| `--badge-img-icon-shadow`      | `0 0 0 0.5px #798fa54d` | box-shadow       | Box shadow of the main icon image.                    |
| `--badge-img-background-color` | `-`                     | background-color | Background color behind the main icon image.          |

## Web Component

Tag: `<sui-badge>`

```html
<sui-badge image="/icon.png" value="3"></sui-badge>
<sui-badge value="5"></sui-badge>
<sui-badge mode="dot"></sui-badge>
```
