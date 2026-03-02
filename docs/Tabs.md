# Tabs

A horizontal tab bar with clickable tab items and an animated active indicator. The `activeIndex` prop (bindable) controls which tab is selected, and the `onchange` event fires when the user selects a different tab. All visual aspects are customizable via CSS custom properties.

## Usage

```svelte
<script>
  import { Tabs } from '@juspay/svelte-ui-components';
</script>

<Tabs items={['Tab 1', 'Tab 2', 'Tab 3']} />
```

## Props

| Prop        | Type       | Required | Default     | Description                                                                                                                                                            |
| ----------- | ---------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items       | `string[]` | Yes      | -           | Array of tab label strings rendered as clickable tabs.                                                                                                                 |
| activeIndex | `number`   | No       | `0`         | The zero-based index of the currently active tab. Bindable for two-way sync.                                                                                           |
| disabled    | `boolean`  | No       | `false`     | When true, disables all tab interactions and applies disabled styling.                                                                                                 |
| testId      | `string`   | No       | `undefined` | Value applied to the `data-pw` attribute on the tab bar container for test selectors.                                                                                  |
| classes     | `string`   | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event    | Type                                     | Description                                                                                                                                    |
| -------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(index: number, label: string) => void` | Fires when the user clicks a tab that is not the currently active one. Receives the new active index and the label string of the selected tab. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                         | Default                                 | CSS Property     | Description                                               |
| -------------------------------- | --------------------------------------- | ---------------- | --------------------------------------------------------- |
| `--tabs-bar-background`          | `#ffffff`                               | background       | Background color of the tab bar container.                |
| `--tabs-bar-padding`             | `0px`                                   | padding          | Padding inside the tab bar container.                     |
| `--tabs-bar-gap`                 | `0px`                                   | gap              | Gap between individual tab items.                         |
| `--tabs-bar-border-bottom`       | `1px solid #e0e0e0`                     | border-bottom    | Bottom border of the tab bar container.                   |
| `--tabs-item-padding`            | `12px 16px`                             | padding          | Padding inside each tab item.                             |
| `--tabs-item-font-size`          | `14px`                                  | font-size        | Font size of tab label text.                              |
| `--tabs-item-font-weight`        | `400`                                   | font-weight      | Font weight of inactive tab label text.                   |
| `--tabs-item-font-family`        | `inherit`                               | font-family      | Font family of tab label text.                            |
| `--tabs-item-color`              | `#666666`                               | color            | Text color of inactive tab labels.                        |
| `--tabs-item-cursor`             | `pointer`                               | cursor           | Cursor style when hovering over a tab item.               |
| `--tabs-item-background`         | `transparent`                           | background       | Background of inactive tab items.                         |
| `--tabs-active-color`            | `#1a73e8`                               | color            | Text color of the active tab label.                       |
| `--tabs-active-font-weight`      | `600`                                   | font-weight      | Font weight of the active tab label.                      |
| `--tabs-indicator-color`         | `#1a73e8`                               | background-color | Color of the active tab indicator line.                   |
| `--tabs-indicator-height`        | `2px`                                   | height           | Thickness of the active tab indicator line.               |
| `--tabs-indicator-border-radius` | `2px 2px 0 0`                           | border-radius    | Corner rounding of the active tab indicator.              |
| `--tabs-hover-color`             | `#333333`                               | color            | Text color of tab labels on hover.                        |
| `--tabs-hover-background`        | `#f5f5f5`                               | background       | Background color of tab items on hover.                   |
| `--tabs-disabled-opacity`        | `0.5`                                   | opacity          | Opacity of the entire tab bar when disabled.              |
| `--tabs-disabled-cursor`         | `not-allowed`                           | cursor           | Cursor style when the tab bar is disabled.                |
| `--tabs-transition`              | `color 0.2s ease, background 0.2s ease` | transition       | Transition applied to tab items for smooth state changes. |
