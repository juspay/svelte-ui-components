# Browser

A browser chrome wrapper that renders a realistic browser frame with traffic light buttons, an optional address bar with lock icon, and an optional tab bar. Use it to embed screenshots, iframes, or any HTML content inside a recognizable browser window. Purely decorative -- the address bar and buttons are non-interactive.

## Usage

```svelte
<script>
  import { Browser } from '@juspay/svelte-ui-components';
</script>

<Browser url={'https://example.com'} title={'Example'}>
  <img src="/screenshot.png" alt="Screenshot" />
</Browser>
```

## Props

| Prop           | Type                | Required | Default   | Description                                                                                                                                                                                                                |
| -------------- | ------------------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url            | `string`            | No       | `''`      | URL text displayed in the address bar. Purely visual, does not navigate.                                                                                                                                                   |
| title          | `string`            | No       | `''`      | Text displayed in the tab when the tab bar is shown.                                                                                                                                                                       |
| showAddressBar | `boolean`           | No       | `true`    | Whether to show the address bar with lock icon and URL text.                                                                                                                                                               |
| showTabBar     | `boolean`           | No       | `false`   | Whether to show a simplified tab bar with a single tab above the address bar.                                                                                                                                              |
| variant        | `'light' \| 'dark'` | No       | `'light'` | Visual theme of the browser chrome. Light uses gray tones, dark uses dark tones.                                                                                                                                           |
| shadow         | `boolean`           | No       | `true`    | Whether to apply a drop shadow around the entire browser frame.                                                                                                                                                            |
| rounded        | `boolean`           | No       | `true`    | Whether to apply rounded corners to the browser frame.                                                                                                                                                                     |
| testId         | `string`            | No       | `-`       | Test selector value applied as `data-pw` on the outermost element.                                                                                                                                                         |
| classes        | `string`            | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props -- pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                 |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| children | `Snippet` | The content rendered inside the browser viewport area. Accepts any markup such as images, iframes, or HTML. |
| lockIcon | `Snippet` | Custom icon for the address bar lock indicator.                                                             |

## CSS Variables

Override these custom properties to theme the component.

| Variable                             | Default                                                  | CSS Property     | Description                                                            |
| ------------------------------------ | -------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `--browser-width`                    | `100%`                                                   | width            | Width of the entire browser frame.                                     |
| `--browser-max-width`                | `-`                                                      | max-width        | Maximum width of the browser frame.                                    |
| `--browser-border-radius`            | `12px`                                                   | border-radius    | Corner rounding of the browser frame (applied when `rounded` is true). |
| `--browser-shadow`                   | `0 8px 32px rgba(0, 0, 0, 0.12)`                         | box-shadow       | Drop shadow of the browser frame (applied when `shadow` is true).      |
| `--browser-border`                   | `1px solid #d1d5db`                                      | border           | Border of the browser frame.                                           |
| `--browser-chrome-bg`                | `#f3f4f6` (light) / `#1f2937` (dark)                     | background-color | Background color of the chrome area (title bar and address bar).       |
| `--browser-chrome-color`             | `#374151` (light) / `#d1d5db` (dark)                     | color            | Text color in the chrome area.                                         |
| `--browser-titlebar-padding`         | `12px 16px`                                              | padding          | Padding of the title bar containing traffic light buttons.             |
| `--browser-dot-size`                 | `12px`                                                   | width/height     | Size of each traffic light dot.                                        |
| `--browser-dot-gap`                  | `8px`                                                    | gap              | Gap between traffic light dots.                                        |
| `--browser-dot-close-bg`             | `#ef4444`                                                | background-color | Background color of the close (red) dot.                               |
| `--browser-dot-minimize-bg`          | `#f59e0b`                                                | background-color | Background color of the minimize (yellow) dot.                         |
| `--browser-dot-maximize-bg`          | `#22c55e`                                                | background-color | Background color of the maximize (green) dot.                          |
| `--browser-tab-bg`                   | `#ffffff` (light) / `#374151` (dark)                     | background-color | Background color of the active tab.                                    |
| `--browser-tab-color`                | `#374151` (light) / `#d1d5db` (dark)                     | color            | Text color of the active tab.                                          |
| `--browser-tab-font-size`            | `13px`                                                   | font-size        | Font size of the tab text.                                             |
| `--browser-tab-font-family`          | `inherit`                                                | font-family      | Font family of the tab text.                                           |
| `--browser-tab-padding`              | `6px 16px`                                               | padding          | Padding inside the tab.                                                |
| `--browser-tab-border-radius`        | `8px 8px 0 0`                                            | border-radius    | Corner rounding of the tab (top corners only).                         |
| `--browser-addressbar-padding`       | `8px 16px`                                               | padding          | Padding of the address bar row.                                        |
| `--browser-addressbar-bg`            | `#ffffff` (light) / `#111827` (dark)                     | background-color | Background color of the address bar input area.                        |
| `--browser-addressbar-border`        | `1px solid #e5e7eb` (light) / `1px solid #374151` (dark) | border           | Border of the address bar input area.                                  |
| `--browser-addressbar-border-radius` | `6px`                                                    | border-radius    | Corner rounding of the address bar input area.                         |
| `--browser-addressbar-font-size`     | `13px`                                                   | font-size        | Font size of the URL text.                                             |
| `--browser-addressbar-font-family`   | `inherit`                                                | font-family      | Font family of the URL text.                                           |
| `--browser-addressbar-color`         | `#6b7280`                                                | color            | Text color of the URL in the address bar.                              |
| `--browser-addressbar-height`        | `32px`                                                   | height           | Height of the address bar input area.                                  |
| `--browser-lock-color`               | `#6b7280`                                                | fill             | Color of the lock icon in the address bar.                             |
| `--browser-content-bg`               | `#ffffff`                                                | background-color | Background color of the content viewport area.                         |
| `--browser-content-min-height`       | `200px`                                                  | min-height       | Minimum height of the content viewport area.                           |
| `--browser-content-overflow`         | `hidden`                                                 | overflow         | Overflow behavior of the content viewport area.                        |

## Type Reference

```typescript
type BrowserVariant = 'light' | 'dark';
```

## Web Component

Tag: `<sui-browser>`

```html
<sui-browser url="https://example.com" title="Demo" variant="light">
  <div>Page content here</div>
</sui-browser>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                     |
| ----------- | --------------- | ----------------------------------------------- |
| _(default)_ | `children`      | Content rendered inside the browser viewport.   |
| `lock-icon` | `lockIcon`      | Custom icon for the address bar lock indicator. |
