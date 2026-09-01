# Tabs

A tab bar with clickable tab items and an animated active indicator. `items` accepts either plain label strings, or `TabItem[]` objects for icons, status dots, subtitles, and grouped section headers. The `activeIndex` prop controls which tab is selected, and the `onchange` event fires when the user selects a different tab; `activeKey` / `onkeychange` do the same by `TabItem.key` instead of index, for lists that can reorder. `orientation="vertical"` turns the bar into a stacked nav/menu rail instead of a horizontal row. For advanced use cases (pills, dirty indicators, close buttons, per-tab menus), pass a `tab` snippet to render custom content inside each tab. All visual aspects are customizable via CSS custom properties. In the default (non-`tab`-snippet) layout, each label's active-state width is reserved up front, so selecting a tab never reflows the tab bar — a tab is already as wide as its bolder active state needs, even while showing the lighter inactive weight.

## Usage

```svelte
<script>
  import { Tabs } from '@juspay/svelte-ui-components';
</script>

<Tabs items={['Tab 1', 'Tab 2', 'Tab 3']} />
```

### With Custom Tab Content

```svelte
<Tabs
  items={['index.ts', 'App.svelte', 'styles.css']}
  activeIndex={0}
  onchange={(index) => (activeIndex = index)}
>
  {#snippet tab({ label, index, active })}
    <span>{label}</span>
    {#if dirtyFiles.has(index)}
      <span class="dirty-dot"></span>
    {/if}
    <button
      onclick={(e) => {
        e.stopPropagation();
        closeTab(index);
      }}>×</button
    >
  {/snippet}
</Tabs>
```

## Props

| Prop        | Type                         | Required | Default        | Description                                                                                                                                                                          |
| ----------- | ---------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| items       | `string[] \| TabItem[]`      | Yes      | -              | Plain label strings for the classic tab bar, or `TabItem[]` objects for icons, status dots, subtitles, and section headers. See `TabItem` type below.                                |
| activeIndex | `number`                     | No       | `0`            | The zero-based index of the currently active tab.                                                                                                                                    |
| activeKey   | `string`                     | No       | `-`            | Selects the active tab by `TabItem.key` instead of index — for item lists that can reorder, where an index would point at the wrong tab after a reorder. Requires `TabItem[]` items. |
| disabled    | `boolean`                    | No       | `false`        | When true, disables all tab interactions and applies disabled styling.                                                                                                               |
| orientation | `'horizontal' \| 'vertical'` | No       | `'horizontal'` | `'horizontal'` is the classic tab bar with a bottom-edge indicator. `'vertical'` stacks items in a column (a nav/menu rail) with a leading-edge indicator and up/down scroll arrows. |
| testId      | `string`                     | No       | `-`            | Value applied to the `data-pw` attribute on the tab bar container for test selectors.                                                                                                |
| classes     | `string`                     | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.               |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet         | Type                                                                                                                         | Description                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| scrollLeftIcon  | `Snippet`                                                                                                                    | Custom icon rendered inside the left scroll arrow button. Defaults to a built-in chevron SVG.                                                                                                                                                                                |
| scrollRightIcon | `Snippet`                                                                                                                    | Custom icon rendered inside the right scroll arrow button. Defaults to a built-in chevron SVG.                                                                                                                                                                               |
| tab             | `Snippet<[{ label: string; index: number; active: boolean; subtitle?: string; icon?: string; status?: TabItem['status'] }]>` | Custom renderer for each tab item. Receives the tab's label, zero-based index, active state, and (when `items` is `TabItem[]`) its `subtitle`/`icon`/`status`. When provided, replaces the default text label. Supports interactive children such as close buttons or menus. |

## Events

| Event       | Type                                     | Description                                                                                                                                                                      |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onchange    | `(index: number, label: string) => void` | Fires when the user clicks a tab that is not the currently active one. Receives the new active index and the label string of the selected tab.                                   |
| onkeychange | `(key: string) => void`                  | Fires alongside `onchange` when `items` is `TabItem[]`. Receives the newly-active tab's `key` — pair with `activeKey` for reorder-safe controlled selection instead of an index. |

## TabItem

The richer item shape — pass `TabItem[]` instead of `string[]` for icons, status dots, subtitles, and grouped section headers:

```typescript
type TabItem = {
  key: string;
  label: string;
  testId?: string;
  subtitle?: string;
  /** Image src rendered before the label. Sized via --tabs-item-icon-size (default 16px). */
  icon?: string;
  /** Status dot after the label. 'none' (default) renders nothing. */
  status?: 'none' | 'default' | 'pending' | 'error' | 'success';
  /** Section header rendered ABOVE this item, for grouped vertical nav (e.g. a "SETTINGS" divider). */
  sectionLabel?: string;
};
```

## CSS Variables

Override these custom properties to theme the component.

| Variable                                  | Default                                        | CSS Property     | Description                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--tabs-bar-background`                   | `#ffffff`                                      | background       | Background color of the tab bar container.                                                                                                                                                                                            |
| `--tabs-bar-padding`                      | `0px`                                          | padding          | Padding inside the tab bar container.                                                                                                                                                                                                 |
| `--tabs-bar-gap`                          | `0px`                                          | gap              | Gap between individual tab items.                                                                                                                                                                                                     |
| `--tabs-bar-border-bottom`                | `1px solid #e0e0e0`                            | border-bottom    | Bottom border of the tab bar container.                                                                                                                                                                                               |
| `--tabs-bar-border-radius`                | `0`                                            | border-radius    | Corner rounding of the tab bar container.                                                                                                                                                                                             |
| `--tabs-item-padding`                     | `12px 16px`                                    | padding          | Padding inside each tab item.                                                                                                                                                                                                         |
| `--tabs-item-font-size`                   | `14px`                                         | font-size        | Font size of tab label text.                                                                                                                                                                                                          |
| `--tabs-item-font-weight`                 | `400`                                          | font-weight      | Font weight of inactive tab label text.                                                                                                                                                                                               |
| `--tabs-item-font-family`                 | `inherit`                                      | font-family      | Font family of tab label text.                                                                                                                                                                                                        |
| `--tabs-item-color`                       | `#666666`                                      | color            | Text color of inactive tab labels.                                                                                                                                                                                                    |
| `--tabs-item-cursor`                      | `pointer`                                      | cursor           | Cursor style when hovering over a tab item.                                                                                                                                                                                           |
| `--tabs-item-background`                  | `transparent`                                  | background       | Background of inactive tab items.                                                                                                                                                                                                     |
| `--tabs-item-border`                      | `none`                                         | border           | Border applied to each tab item. Use to add a visible border around individual tabs.                                                                                                                                                  |
| `--tabs-item-border-radius`               | `0`                                            | border-radius    | Corner rounding of individual tab items.                                                                                                                                                                                              |
| `--tabs-active-color`                     | `#1a73e8`                                      | color            | Text color of the active tab label.                                                                                                                                                                                                   |
| `--tabs-active-font-weight`               | `600`                                          | font-weight      | Font weight of the active tab label. The inactive-state label width is reserved to match this weight, so overriding it (e.g. to `700`) stays reflow-free.                                                                             |
| `--tabs-active-background`                | `transparent`                                  | background       | Background color of the active tab item.                                                                                                                                                                                              |
| `--tabs-indicator-color`                  | `#1a73e8`                                      | background-color | Color of the active tab indicator line.                                                                                                                                                                                               |
| `--tabs-indicator-height`                 | `2px`                                          | height           | Thickness of the active tab indicator line.                                                                                                                                                                                           |
| `--tabs-indicator-border-radius`          | `2px 2px 0 0`                                  | border-radius    | Corner rounding of the active tab indicator.                                                                                                                                                                                          |
| `--tabs-indicator-transition`             | `left 0.3s ease, width 0.3s ease`              | transition       | CSS transition applied to the sliding indicator when moving between tabs. Set to `none` to disable animation, or supply a custom easing/duration. Automatically overridden to `none` when `prefers-reduced-motion: reduce` is active. |
| `--tabs-hover-color`                      | `#333333`                                      | color            | Text color of tab labels on hover.                                                                                                                                                                                                    |
| `--tabs-hover-background`                 | `#f5f5f5`                                      | background       | Background color of tab items on hover.                                                                                                                                                                                               |
| `--tabs-disabled-opacity`                 | `0.5`                                          | opacity          | Opacity of the entire tab bar when disabled.                                                                                                                                                                                          |
| `--tabs-disabled-cursor`                  | `not-allowed`                                  | cursor           | Cursor style when the tab bar is disabled.                                                                                                                                                                                            |
| `--tabs-transition`                       | `color 0.2s ease, background 0.2s ease`        | transition       | Transition applied to tab items for smooth state changes.                                                                                                                                                                             |
| `--tabs-fade-size`                        | `32px`                                         | mask-image       | Size of the fade-out gradient at scrollable edges.                                                                                                                                                                                    |
| `--tabs-fade-solid`                       | `8px`                                          | mask-image       | Fully-transparent run at the very edge of the fade mask, before the gradient starts ramping to opaque. Prevents a clipped tab label from staying faintly visible (a stray glyph fragment) right beside the scroll arrows.             |
| `--tabs-arrow-size`                       | `28px`                                         | width            | Width of the scroll arrow buttons.                                                                                                                                                                                                    |
| `--tabs-arrow-padding`                    | `0`                                            | padding          | Padding inside the scroll arrow buttons.                                                                                                                                                                                              |
| `--tabs-arrow-border`                     | `none`                                         | border           | Border of the scroll arrow buttons.                                                                                                                                                                                                   |
| `--tabs-arrow-background`                 | `var(--tabs-bar-background, #ffffff)`          | background       | Background color of the scroll arrow buttons.                                                                                                                                                                                         |
| `--tabs-arrow-color`                      | `var(--tabs-item-color, #666666)`              | color            | Icon color of the scroll arrow buttons.                                                                                                                                                                                               |
| `--tabs-arrow-transition`                 | `color 0.2s ease`                              | transition       | Transition applied to scroll arrow buttons.                                                                                                                                                                                           |
| `--tabs-arrow-hover-color`                | `var(--tabs-active-color, #1a73e8)`            | color            | Icon color of scroll arrow buttons on hover.                                                                                                                                                                                          |
| `--tabs-arrow-hover-background`           | `var(--tabs-arrow-background, ...)`            | background       | Background of scroll arrow buttons on hover.                                                                                                                                                                                          |
| `--tabs-item-gap`                         | `-`                                            | gap              | Gap between a `TabItem`'s icon, label, and status dot.                                                                                                                                                                                |
| `--tabs-item-icon-size`                   | `16px`                                         | width, height    | Size of a `TabItem.icon` image.                                                                                                                                                                                                       |
| `--tabs-item-icon-color`                  | `-`                                            | color            | Tint applied to a `TabItem.icon` image (inline SVG using `currentColor` picks this up).                                                                                                                                               |
| `--tabs-item-status-size`                 | `-`                                            | width, height    | Size of the `TabItem.status` dot.                                                                                                                                                                                                     |
| `--tabs-item-status-default-color`        | `-`                                            | background-color | Dot color for `status: 'default'`.                                                                                                                                                                                                    |
| `--tabs-item-status-pending-color`        | `-`                                            | background-color | Dot color for `status: 'pending'`.                                                                                                                                                                                                    |
| `--tabs-item-status-error-color`          | `-`                                            | background-color | Dot color for `status: 'error'`.                                                                                                                                                                                                      |
| `--tabs-item-status-success-color`        | `-`                                            | background-color | Dot color for `status: 'success'`.                                                                                                                                                                                                    |
| `--tabs-section-label-color`              | `-`                                            | color            | Text color of a `TabItem.sectionLabel` header (vertical orientation).                                                                                                                                                                 |
| `--tabs-section-label-font-size`          | `-`                                            | font-size        | Font size of a section label header.                                                                                                                                                                                                  |
| `--tabs-section-label-font-weight`        | `-`                                            | font-weight      | Font weight of a section label header.                                                                                                                                                                                                |
| `--tabs-section-label-letter-spacing`     | `-`                                            | letter-spacing   | Letter spacing of a section label header.                                                                                                                                                                                             |
| `--tabs-section-label-text-transform`     | `-`                                            | text-transform   | Text transform of a section label header (e.g. `uppercase`).                                                                                                                                                                          |
| `--tabs-section-label-padding`            | `-`                                            | padding          | Padding around a section label header.                                                                                                                                                                                                |
| `--tabs-indicator-transition-vertical`    | falls back to `--tabs-indicator-transition`    | transition       | Indicator transition override specifically for `orientation="vertical"` (animates `top`/`height` instead of `left`/`width`).                                                                                                          |
| `--tabs-indicator-border-radius-vertical` | falls back to `--tabs-indicator-border-radius` | border-radius    | Indicator corner rounding override specifically for `orientation="vertical"`.                                                                                                                                                         |

## Web Component

Tag: `<sui-tabs>`

```html
<sui-tabs active-index="0"></sui-tabs>
```

### Slots

| Slot Name           | Maps to Snippet   | Description                                                                                          |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `scroll-left-icon`  | `scrollLeftIcon`  | Custom icon for the left scroll arrow.                                                               |
| `scroll-right-icon` | `scrollRightIcon` | Custom icon for the right scroll arrow.                                                              |
| `tab`               | `tab`             | Custom tab content. Receives `label`, `index`, `active`, and — when the item came from a `TabItem[]` — `subtitle`, `icon` and `status`. Falls back to label text. |

> **Note:** The `items` prop is an array and `tab` is a parameterized Snippet — set them via JavaScript properties.
