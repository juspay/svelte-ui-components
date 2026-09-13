# ThemeSwitcher

A theme preference switcher that renders as either a single toggle button or a segmented control. Cycles through configurable options (default: light, dark, system) with animated icon transitions. Persists the user preference to localStorage. Built-in icons are provided for `light`, `dark`, and `system` values; custom options get a generic palette icon, or you can supply your own via the `icon` snippet on each option. This component does NOT apply the theme to the page — it only provides the toggle UI and preference management. The consumer is responsible for applying CSS classes or variables based on the selected value.

For the built-in light/dark case you do not have to write that yourself: import `@juspay/svelte-ui-components/theme-dark.css` and set `data-theme="dark"` on the document root from this component's `onchange`, and every component in the library — including the `<sui-*>` custom elements — follows. See the Dark Mode section of the README.

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

## Accessibility

In `segment` mode each button carries `aria-pressed`, so the selected theme is
reported to assistive technology rather than being shown only by the sliding
indicator.

Every animated transition in this component (the toggle button's background,
the icon swap's opacity/transform, the sliding segment indicator, and the
segment label color) is dropped under `prefers-reduced-motion: reduce` — the
swap becomes instant rather than animated. This is safe to do outright here,
unlike a progress fill: every end state (which icon is shown, where the
indicator sits, which label is highlighted) is meaningful on its own, so there
is no in-between frame that could be misread as a different state.

## Props

| Prop       | Type                    | Required | Default                                                                                                                          | Description                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options    | `ThemeSwitcherOption[]` | No       | `[{ value: 'light', label: 'Light theme' }, { value: 'dark', label: 'Dark theme' }, { value: 'system', label: 'System theme' }]` | Array of theme options to display. Each option has a `value`, optional `label`, and optional `icon` snippet. Built-in icons are provided for `'light'`, `'dark'`, and `'system'` values.                                                                                      |
| value      | `string`                | No       | `'system'`                                                                                                                       | The initially selected theme value. If not provided, defaults to `'system'`. On mount, a stored preference (if any) takes priority, and an explicit `value` prop overrides the stored preference.                                                                             |
| mode       | `'toggle' \| 'segment'` | No       | (derived)                                                                                                                        | Controls the switcher variant. `'toggle'` renders a single icon button that cycles through options on click. `'segment'` renders a segmented control with one button per option. If not set, defaults to `'toggle'` when options has 2 or fewer items, `'segment'` otherwise. |
| storageKey | `string`                | No       | `'theme-preference'`                                                                                                             | The localStorage key used to persist the theme preference. Set to an empty string `''` to disable persistence entirely.                                                                                                                                                       |
| testId     | `string`                | No       | -                                                                                                                                | Value for the `data-pw` attribute on the root element, used for end-to-end testing selectors.                                                                                                                                                                                 |
| classes    | `string`                | No       | -                                                                                                                                | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                        |

## Events

| Event    | Type                                             | Description                                                                                                                                                                                                                                            |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onchange | `(value: string, resolvedValue: string) => void` | Fires when the theme selection changes. Receives the selected `value` and the `resolvedValue` (when `value` is `'system'`, `resolvedValue` is the actual system preference; otherwise it mirrors `value`). Also fires on mount with the initial value. |

## CSS Variables

Override these custom properties to theme the component.

### Toggle Mode

| Variable                               | Default       | CSS Property     | Description                                                                                                                                         |
| -------------------------------------- | ------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--theme-switcher-size`                | `36px`        | width, height    | Size of the toggle button.                                                                                                                          |
| `--theme-switcher-border-radius`       | `8px`         | border-radius    | Border radius of the toggle button (also used by segment control).                                                                                  |
| `--theme-switcher-bg`                  | `transparent` | background-color | Background color of the toggle button.                                                                                                              |
| `--theme-switcher-bg-hover`            | `#f3f4f6`     | background-color | Background color of the toggle button on hover.                                                                                                     |
| `--theme-switcher-bg-pressed`          | `#e5e7eb`     | background-color | Background color of the toggle button while pressed.                                                                                                |
| `--theme-switcher-icon-color`          | `#374151`     | color            | Color of the icons (also used by segment buttons).                                                                                                  |
| `--theme-switcher-transition-duration` | `0.3s`        | transition       | Duration of the icon animation and all transitions. All transitions in this component are dropped (instant) under `prefers-reduced-motion: reduce`. |

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
type ThemeSwitcherMode = 'toggle' | 'segment';
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
  el.onchange = (value, resolvedValue) => console.log(value, resolvedValue);
</script>
```

> **Note:** The `options` prop is an array of objects — set it via JavaScript properties, not HTML attributes.

> **Note:** `onchange` is a callback prop, not a DOM event — assign it as a plain property as above. The custom element does not dispatch a matching DOM event, so `el.addEventListener('change', ...)` registers without error but the handler is never called.

### Slots

`sui-theme-switcher` exposes no named slot. `icon` is a field of each entry in the `options`
array rather than a prop of ThemeSwitcher itself, and slot names are fixed at compile time, so
there is no spelling for a per-option slot and one shared name would reach only the first option
— the browser assigns light-DOM children to the first matching slot in the shadow tree.
Per-option icons are Svelte-only. Leaving `icon` off an option is the normal case: each falls
back to a built-in sun, moon or monitor glyph chosen by its `value`, and to a palette glyph for
an unrecognised one.
