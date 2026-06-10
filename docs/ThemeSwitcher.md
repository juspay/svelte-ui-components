# ThemeSwitcher

A theme preference switcher that renders as a single toggle button, a segmented control, or a bare inline link-style button. Cycles through configurable options (default: light, dark, system) with animated icon transitions. Persists the user preference to localStorage. Built-in icons are provided for `light`, `dark`, and `system` values; custom options get a generic palette icon, or you can supply your own via the `icon` snippet on each option. This component does NOT apply the theme to the page — it only provides the toggle UI and preference management. The consumer is responsible for applying CSS classes or variables based on the selected value.

## Usage

```svelte
<script>
  import { ThemeSwitcher } from '@juspay/svelte-ui-components';
</script>

<!-- Simple toggle between light and dark -->
<ThemeSwitcher
  options={[{ value: 'light' }, { value: 'dark' }]}
  onchange={(value, resolved) => console.log(value, resolved)}
/>

<!-- Segmented control with light/dark/system (default options) -->
<ThemeSwitcher mode="segment" />

<!-- Inline link-style cycle button (no background/border/fixed size) -->
<ThemeSwitcher mode="link" />

<!-- Link mode with active option label shown beside the icon -->
<ThemeSwitcher mode="link" showLabel={true} />
```

### With Custom Options

```svelte
<ThemeSwitcher
  options={[
    { value: 'ocean', label: 'Ocean theme' },
    { value: 'forest', label: 'Forest theme' },
    { value: 'sunset', label: 'Sunset theme' }
  ]}
  mode="segment"
  onchange={(value, resolved) => applyTheme(resolved)}
/>
```

### Link Mode — Consumer Recipe

`mode="link"` renders a chromeless inline button. All visual styling is delegated to CSS custom properties so the consumer can match any design context:

```svelte
<!-- Styled link that matches the surrounding text -->
<ThemeSwitcher
  mode="link"
  showLabel={true}
  classes="my-theme-link"
/>

<style>
  .my-theme-link {
    --theme-switcher-link-color: currentColor;
    --theme-switcher-link-color-hover: #4f46e5;
    --theme-switcher-link-underline: underline;
    --theme-switcher-link-font-size: inherit;
  }
</style>
```

## Props

| Prop       | Type                             | Required | Default                                                                                                                          | Description                                                                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options    | `ThemeSwitcherOption[]`          | No       | `[{ value: 'light', label: 'Light theme' }, { value: 'dark', label: 'Dark theme' }, { value: 'system', label: 'System theme' }]` | Array of theme options to display. Each option has a `value`, optional `label`, and optional `icon` snippet. Built-in icons are provided for `'light'`, `'dark'`, and `'system'` values.                                                                                                                         |
| value      | `string`                         | No       | `'system'`                                                                                                                       | The initially selected theme value. If not provided, defaults to `'system'`. On mount, a stored preference (if any) takes priority, and an explicit `value` prop overrides the stored preference.                                                                                                                |
| mode       | `'toggle' \| 'segment' \| 'link'` | No       | (derived)                                                                                                                        | Controls the switcher rendering. `'toggle'` renders a single icon button that cycles through options on click. `'segment'` renders a segmented control with one button per option. `'link'` renders a single inline chromeless button showing the active option's icon (and optionally its label). If not set, defaults to `'toggle'` when options has 2 or fewer items, `'segment'` otherwise. |
| storageKey | `string`                         | No       | `'theme-preference'`                                                                                                             | The localStorage key used to persist the theme preference. Set to an empty string `''` to disable persistence entirely.                                                                                                                                                                                          |
| showLabel  | `boolean`                        | No       | `false`                                                                                                                          | When `true` and `mode="link"`, renders the active option's label beside the icon. Has no effect in `toggle` or `segment` mode.                                                                                                                                                                                   |
| testId     | `string`                         | No       | -                                                                                                                                | Value for the `data-pw` attribute on the root element, used for end-to-end testing selectors.                                                                                                                                                                                                                    |
| classes    | `string`                         | No       | -                                                                                                                                | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                           |

## Events

| Event    | Type                                             | Description                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onchange | `(value: string, resolvedValue: string) => void` | Fires when the theme selection changes. Receives the selected `value` and the `resolvedValue` (when `value` is `'system'`, `resolvedValue` is the actual system preference; otherwise it mirrors `value`). Also fires on mount with the initial value. |

## CSS Variables

Override these custom properties to theme the component.

### Toggle Mode

| Variable                               | Default       | CSS Property     | Description                                                        |
| -------------------------------------- | ------------- | ---------------- | ------------------------------------------------------------------ |
| `--theme-switcher-size`                | `36px`        | width, height    | Size of the toggle button.                                         |
| `--theme-switcher-border-radius`       | `8px`         | border-radius    | Border radius of the toggle button (also used by segment control). |
| `--theme-switcher-bg`                  | `transparent` | background-color | Background color of the toggle button.                             |
| `--theme-switcher-bg-hover`            | `#f3f4f6`     | background-color | Background color of the toggle button on hover.                    |
| `--theme-switcher-icon-color`          | `#374151`     | color            | Color of the icons (also used by segment buttons).                 |
| `--theme-switcher-transition-duration` | `0.3s`        | transition       | Duration of the icon animation and all transitions.                |

### Icons

| Variable                             | Default   | CSS Property  | Description                                         |
| ------------------------------------ | --------- | ------------- | --------------------------------------------------- |
| `--theme-switcher-icon-size`         | `18px`    | width, height | Size of the theme icons (sun, moon, monitor, etc.). |
| `--theme-switcher-icon-color-active` | `#1f2937` | color         | Color of the active/selected icon in segment mode.  |

### Segment Mode

| Variable                                  | Default                        | CSS Property     | Description                                                                        |
| ----------------------------------------- | ------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| `--theme-switcher-segment-gap`            | `2px`                          | gap              | Gap between segment buttons.                                                       |
| `--theme-switcher-segment-padding`        | `4px`                          | padding          | Inner padding of the segmented control track. Also used to position the indicator. |
| `--theme-switcher-segment-bg`             | `#f3f4f6`                      | background-color | Background color of the segmented control track.                                   |
| `--theme-switcher-segment-border-radius`  | `6px`                          | border-radius    | Border radius of the active segment indicator and segment buttons.                 |
| `--theme-switcher-segment-active-bg`      | `#ffffff`                      | background-color | Background color of the active segment indicator.                                  |
| `--theme-switcher-segment-shadow`         | `0 1px 2px rgba(0, 0, 0, 0.1)` | box-shadow       | Shadow on the active segment indicator.                                            |
| `--theme-switcher-segment-button-padding` | `6px 10px`                     | padding          | Padding inside each segment button.                                                |

### Link Mode

| Variable                             | Default   | CSS Property    | Description                                                                                                    |
| ------------------------------------ | --------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `--theme-switcher-link-color`        | `inherit` | color           | Idle text/icon color. Defaults to `inherit` so the link blends into surrounding text without imposing a color. |
| `--theme-switcher-link-color-hover`  | `inherit` | color           | Color on hover. Set to a brand color to indicate interactivity.                                                |
| `--theme-switcher-link-gap`          | `4px`     | gap             | Gap between the icon and the label when `showLabel` is true.                                                   |
| `--theme-switcher-link-padding`      | `0`       | padding         | Padding on the root button. Default `0` keeps the element truly chromeless.                                    |
| `--theme-switcher-link-underline`    | `none`    | text-decoration | Set to `underline` for a classic hyperlink appearance.                                                         |
| `--theme-switcher-link-font-size`    | `inherit` | font-size       | Font size for the label. Inherits from the parent by default; the component never sets a hard-coded size.      |

## Type Reference

Custom types used by this component's props and events:

### ThemeSwitcherOption

```typescript
type ThemeSwitcherOption = {
  value: string;
  label?: string;
  icon?: Snippet;
};
```

### ThemeSwitcherMode

```typescript
type ThemeSwitcherMode = 'toggle' | 'segment' | 'link';
```

## Web Component

Tag: `<sui-theme-switcher>`

```html
<sui-theme-switcher storage-key="my-theme"></sui-theme-switcher>

<script>
  const el = document.querySelector('sui-theme-switcher');
  el.options = [
    { value: 'light', label: 'Light theme' },
    { value: 'dark', label: 'Dark theme' },
    { value: 'system', label: 'System theme' }
  ];
  el.addEventListener('change', (e) => console.log(e.detail));
</script>
```

> **Note:** The `options` prop is an array of objects — set it via JavaScript properties, not HTML attributes.
