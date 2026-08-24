# Pill

A small rounded label used for categorization, tagging, or filtering. Supports an optional dismiss button that lets users remove the pill. Text is automatically truncated with an ellipsis when it exceeds the maximum width.

## Usage

```svelte
<script>
  import { Pill } from '@juspay/svelte-ui-components';
</script>

<Pill text={'...'} />
```

### Theming with Classes

Define variant classes in your app's CSS that set Pill CSS variables, then pass them via the `classes` prop:

```css
/* app.css */
.pill-success {
  --pill-background: #d4edda;
  --pill-color: #155724;
  --pill-hover-background: #c3e6cb;
}

.pill-warning {
  --pill-background: #fff3cd;
  --pill-color: #856404;
  --pill-hover-background: #ffeeba;
}

.pill-error {
  --pill-background: #f8d7da;
  --pill-color: #721c24;
  --pill-hover-background: #f1b0b7;
}

.pill-info {
  --pill-background: #d1ecf1;
  --pill-color: #0c5460;
  --pill-hover-background: #bee5eb;
}
```

```svelte
<Pill text="Active" classes="pill-success" />
<Pill text="Pending" classes="pill-warning" />
<Pill text="Failed" classes="pill-error" />
<Pill text="New" classes="pill-info" />
```

## Props

| Prop        | Type      | Required | Default | Description                                                                                                                                                            |
| ----------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text        | `string`  | Yes      | `-`     | The label text displayed inside the pill. Long text is truncated with an ellipsis when it exceeds the maximum width.                                                   |
| dismissible | `boolean` | No       | `false` | When true, shows a small X button after the text that triggers the ondismiss event when clicked.                                                                       |
| disabled    | `boolean` | No       | `false` | When true, the pill appears dimmed (opacity 0.4), shows a not-allowed cursor, and ignores all click and dismiss interactions.                                          |
| testId      | `string`  | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors. The dismiss button receives `{testId}-dismiss`.                                                |
| classes     | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet     | Type      | Description                                                                                                                                                                                                                                                             |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| leadingIcon | `Snippet` | Content rendered immediately before the text label inside a `<span class="pill-leading-icon">` wrapper. Compose with an icon or small image. Leave accessibility attributes (e.g. `aria-hidden`, `aria-label`) on the icon itself — the wrapper is presentational only. |
| dismissIcon | `Snippet` | Custom icon for the dismiss/close button.                                                                                                                                                                                                                               |

## Events

| Event     | Type                          | Description                                                                                                                                                                          |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onclick   | `(event: MouseEvent) => void` | Fires when the pill body is clicked. Does NOT fire when the pill is disabled.                                                                                                        |
| ondismiss | `() => void`                  | Fires when the dismiss button (X) is clicked. Only available when dismissible is true. Does NOT fire when the pill is disabled. The click event does not propagate to the pill body. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                     | Default                                   | CSS Property     | Description                                                               |
| ---------------------------- | ----------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `--pill-background`          | `#e0e0e0`                                 | background-color | Background color of the pill.                                             |
| `--pill-color`               | `#333333`                                 | color            | Text color of the pill label.                                             |
| `--pill-font-size`           | `13px`                                    | font-size        | Font size of the pill text.                                               |
| `--pill-font-weight`         | `500`                                     | font-weight      | Font weight of the pill text.                                             |
| `--pill-font-family`         | `-`                                       | font-family      | Font family of the pill text.                                             |
| `--pill-padding`             | `6px 10px`                                | padding          | Inner padding of the pill.                                                |
| `--pill-border-radius`       | `999px`                                   | border-radius    | Corner rounding of the pill (999px creates a fully rounded shape).        |
| `--pill-border`              | `none`                                    | border           | Border style of the pill.                                                 |
| `--pill-gap`                 | `4px`                                     | gap              | Spacing between the text and the dismiss button.                          |
| `--pill-cursor`              | `pointer`                                 | cursor           | Cursor style when hovering over the pill.                                 |
| `--pill-width`               | `auto`                                    | width            | Chip width. Set to `100%` to fill a column.                               |
| `--pill-justify-content`     | `center`                                  | justify-content  | Content alignment inside the pill.                                        |
| `--pill-text-align`          | `center`                                  | text-align       | Label alignment.                                                          |
| `--pill-max-width`           | `-`                                       | max-width        | Maximum width of the pill. Text is truncated with ellipsis when exceeded. |
| `--pill-line-height`         | `1`                                       | line-height      | Line height of the pill.                                                  |
| `--pill-flex-shrink`         | `-`                                       | flex-shrink      | Flex shrink behavior of the pill.                                         |
| `--pill-text-overflow`       | `ellipsis`                                | text-overflow    | How overflowing text is displayed (e.g., ellipsis or clip).               |
| `--pill-hover-background`    | `var(--pill-background, #d0d0d0)`         | background-color | Background color when hovering over the pill.                             |
| `--pill-hover-color`         | `var(--pill-color, #333333)`              | color            | Text color when hovering over the pill.                                   |
| `--pill-disabled-opacity`    | `0.4`                                     | opacity          | Opacity of the pill when disabled.                                        |
| `--pill-disabled-cursor`     | `not-allowed`                             | cursor           | Cursor style when the pill is disabled.                                   |
| `--pill-dismiss-size`        | `14px`                                    | width, height    | Size of the dismiss button icon (X).                                      |
| `--pill-dismiss-color`       | `currentColor`                            | color            | Color of the dismiss button icon.                                         |
| `--pill-dismiss-hover-color` | `var(--pill-dismiss-color, currentColor)` | color            | Color of the dismiss button icon on hover.                                |

## Internal Dependencies

This component uses the following library components internally:

- Button (for the pill container and dismiss action)

## Web Component

Tag: `<sui-pill>`

```html
<sui-pill text="Active" dismissible></sui-pill>
```

### Slots

| Slot Name      | Maps to Snippet | Description                                                              |
| -------------- | --------------- | ------------------------------------------------------------------------ |
| `leading-icon` | `leadingIcon`   | Content rendered before the text label (icon, image, or inline element). |
| `dismiss-icon` | `dismissIcon`   | Custom icon for the dismiss/close button.                                |
