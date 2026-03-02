# ThemeSwitcher

Toggle between light and dark color schemes. A button or segmented control that switches between light, dark, and system themes with animated icon transitions. Persists the user preference to localStorage. This component does NOT apply the theme to the page -- it only provides the toggle UI and preference management. The consumer is responsible for applying CSS classes or variables based on the `theme` value.

## Usage

```svelte
<script>
  import { ThemeSwitcher } from '@juspay/svelte-ui-components';
</script>

<!-- Simple toggle between light and dark -->
<ThemeSwitcher mode="toggle" />

<!-- Segmented control with light/dark/system -->
<ThemeSwitcher mode="tristate" />

<!-- Bind to the theme value and react to changes -->
<ThemeSwitcher bind:theme onchange={(t) => console.log('Theme changed:', t)} />
```

## Props

| Prop          | Type                            | Required | Default              | Description                                                                                                                                                                                                              |
| ------------- | ------------------------------- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| theme         | `'light' \| 'dark' \| 'system'` | No       | `'system'`           | The currently selected theme. Bindable. In toggle mode, only cycles between `'light'` and `'dark'`.                                                                                                                      |
| mode          | `'toggle' \| 'tristate'`        | No       | `'toggle'`           | Controls the switcher variant. `'toggle'` renders a single icon button that flips between light and dark. `'tristate'` renders a segmented control with sun, moon, and monitor icons for light, dark, and system.        |
| storageKey    | `string`                        | No       | `'theme-preference'` | The localStorage key used to persist the theme preference. Set to an empty string `''` to disable persistence entirely.                                                                                                  |
| resolvedTheme | `'light' \| 'dark'`             | No       | (derived)            | Read-only derived value. When `theme` is `'system'`, this resolves to the actual system preference (`'light'` or `'dark'`) by reading `prefers-color-scheme`. When `theme` is `'light'` or `'dark'`, it mirrors `theme`. |
| testId        | `string`                        | No       | `undefined`          | Value for the `data-pw` test selector attribute on the root element.                                                                                                                                                     |
| classes       | `string`                        | No       | `-`                  | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                   |

## Events

| Event    | Type                                             | Description                                                                                                                      |
| -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(theme: 'light' \| 'dark' \| 'system') => void` | Fires when the theme selection changes. Receives the new theme value. Fires both from user interaction and programmatic changes. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                  | Default                     | CSS Property     | Description                                                        |
| ----------------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------------ |
| `--theme-switcher-size`                   | `36px`                      | width, height    | Size of the toggle button in toggle mode.                          |
| `--theme-switcher-icon-size`              | `18px`                      | width, height    | Size of the sun/moon/monitor SVG icons.                            |
| `--theme-switcher-icon-color`             | `#374151`                   | fill, stroke     | Color of the icons.                                                |
| `--theme-switcher-icon-color-active`      | `#1f2937`                   | fill, stroke     | Color of the active/selected icon in tristate mode.                |
| `--theme-switcher-bg`                     | `transparent`               | background-color | Background color of the toggle button in toggle mode.              |
| `--theme-switcher-bg-hover`               | `#f3f4f6`                   | background-color | Background color on hover in toggle mode.                          |
| `--theme-switcher-border-radius`          | `8px`                       | border-radius    | Border radius of the toggle button or segmented control.           |
| `--theme-switcher-transition-duration`    | `0.3s`                      | transition       | Duration of the icon morph animation.                              |
| `--theme-switcher-segment-bg`             | `#f3f4f6`                   | background-color | Background color of the segmented control track in tristate mode.  |
| `--theme-switcher-segment-active-bg`      | `#ffffff`                   | background-color | Background color of the active segment indicator in tristate mode. |
| `--theme-switcher-segment-padding`        | `4px`                       | padding          | Inner padding of the segmented control track.                      |
| `--theme-switcher-segment-gap`            | `2px`                       | gap              | Gap between segments in tristate mode.                             |
| `--theme-switcher-segment-button-padding` | `6px 10px`                  | padding          | Padding inside each segment button.                                |
| `--theme-switcher-segment-border-radius`  | `6px`                       | border-radius    | Border radius of the active segment indicator and segment buttons. |
| `--theme-switcher-segment-shadow`         | `0 1px 2px rgba(0,0,0,0.1)` | box-shadow       | Shadow on the active segment indicator.                            |

## Type Reference

```typescript
type ThemeSwitcherTheme = 'light' | 'dark' | 'system';
type ThemeSwitcherResolvedTheme = 'light' | 'dark';
type ThemeSwitcherMode = 'toggle' | 'tristate';
```
