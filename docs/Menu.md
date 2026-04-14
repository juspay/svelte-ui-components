# Menu

A dropdown action menu that opens from a trigger element and displays a list of selectable actions. Supports full keyboard navigation (ArrowUp/Down to move focus, Enter/Space to select, Escape to close, Home/End to jump), typeahead search (type characters to focus matching items), click-outside to close, separator lines between groups, danger-styled items for destructive actions, disabled items, optional per-item icons, and configurable dropdown position. Focus is managed automatically: the first item receives focus on open, and focus returns to the trigger on close.

## Usage

```svelte
<script>
  import { Menu } from '@juspay/svelte-ui-components';
</script>

<Menu
  items={[
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    { label: 'Delete', value: 'delete', danger: true }
  ]}
  onselect={(item) => console.log(item.value)}
>
  {#snippet trigger()}
    <button>Actions</button>
  {/snippet}
</Menu>
```

## Props

| Prop    | Type         | Required | Default | Description                                                                                                                                                            |
| ------- | ------------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items   | `MenuItem[]` | Yes      | `-`     | Array of menu items to display. Each item defines a label, value, and optional icon, disabled, danger, or separator flags. See MenuItem type below.                    |
| open      | `boolean`              | No       | `false`  | Bindable. Controls whether the dropdown is visible. Set to true to open programmatically; bind to react to open/close state changes.                                   |
| testId    | `string`               | No       | `-`      | Value for the data-pw attribute on the container, used for end-to-end testing selectors. Individual items get `{testId}-item-{value}`.                                 |
| classes   | `string`               | No       | `-`      | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| role      | `'menu' \| 'listbox'`  | No       | `'menu'` | ARIA role for the dropdown container. Set to `'listbox'` to use the menu as an autocomplete suggestions list. Items automatically get `role="option"` instead of `role="menuitem"`, and `aria-selected` is managed on the focused item. |
| ariaLabel | `string`               | No       | `-`      | Sets `aria-label` on the dropdown container for screen reader identification.                                                                                          |
| id        | `string`               | No       | `-`      | Sets the `id` attribute on the dropdown container. Needed for `aria-controls` references from a parent combobox input.                                                 |

## Snippets

Svelte 5 Snippet props -- pass content blocks to the component.

| Snippet | Type      | Description                                                                                                              |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| trigger | `Snippet` | The trigger element that the menu attaches to. Clicking or pressing Enter/Space/ArrowDown on the trigger opens the menu. |

## Events

| Event    | Type                       | Description                                                                                                            |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| onselect | `(item: MenuItem) => void` | Fires when a non-disabled menu item is selected (via click, Enter, or Space). Receives the full MenuItem object.       |
| onopen   | `() => void`               | Fires when the menu dropdown opens, whether by click, Enter, Space, or ArrowDown/ArrowUp on the trigger.               |
| onclose  | `() => void`               | Fires when the menu dropdown closes, whether by selecting an item, pressing Escape, clicking outside, or pressing Tab. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default                                  | CSS Property     | Description                                                            |
| ------------------------------------------- | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `--menu-container-position`                 | `relative`                               | position         | Position of the outer container that anchors the dropdown.             |
| `--menu-container-display`                  | `inline-block`                           | display          | Display mode of the outer container.                                   |
| `--menu-font-family`                        | `inherit`                                | font-family      | Font family for all menu text.                                         |
| `--menu-font-size`                          | `14px`                                   | font-size        | Base font size for menu items.                                         |
| `--menu-trigger-focus-outline`              | `none`                                   | outline          | Focus outline style for the trigger element.                           |
| `--menu-z-index`                            | `10`                                     | z-index          | Stack order of the dropdown panel.                                     |
| `--menu-background-color`                   | `#ffffff`                                | background-color | Background color of the dropdown panel.                                |
| `--menu-border`                             | `1px solid #e0e0e0`                      | border           | Border around the dropdown panel.                                      |
| `--menu-border-radius`                      | `6px`                                    | border-radius    | Corner rounding of the dropdown panel.                                 |
| `--menu-box-shadow`                         | `0px 4px 16px rgba(0, 0, 0, 0.12)`       | box-shadow       | Shadow of the dropdown panel.                                          |
| `--menu-min-width`                          | `160px`                                  | min-width        | Minimum width of the dropdown panel.                                   |
| `--menu-max-height`                         | `240px`                                  | max-height       | Maximum height of the dropdown before it scrolls.                      |
| `--menu-dropdown-top`                       | `100%`                                   | top              | Top position of the dropdown panel relative to its container.          |
| `--menu-dropdown-left`                      | `0`                                      | left             | Left position of the dropdown panel relative to its container.         |
| `--menu-padding`                            | `4px 0`                                  | padding          | Inner padding of the dropdown panel.                                   |
| `--menu-margin`                             | `4px 0`                                  | margin           | Outer margin of the dropdown panel (gap between trigger and dropdown). |
| `--menu-item-padding`                       | `8px 12px`                               | padding          | Inner padding of each menu item.                                       |
| `--menu-item-color`                         | `#333333`                                | color            | Text color of menu items.                                              |
| `--menu-item-background-color`              | `transparent`                            | background-color | Background color of menu items in their default state.                 |
| `--menu-item-gap`                           | `8px`                                    | gap              | Gap between icon and label within a menu item.                         |
| `--menu-item-white-space`                   | `nowrap`                                 | white-space      | White-space behavior for menu item text.                               |
| `--menu-item-hover-background-color`        | `#f5f5f5`                                | background-color | Background color of a menu item on hover.                              |
| `--menu-item-hover-color`                   | `var(--menu-item-color, #333333)`        | color            | Text color of a menu item on hover.                                    |
| `--menu-item-focus-background-color`        | `#f0f0f0`                                | background-color | Background color of a menu item when focused via keyboard.             |
| `--menu-item-focus-outline`                 | `none`                                   | outline          | Focus outline of a menu item when focused via keyboard.                |
| `--menu-item-danger-color`                  | `#dc3545`                                | color            | Text color for danger-flagged items (destructive actions).             |
| `--menu-item-danger-hover-background-color` | `#fff0f0`                                | background-color | Background color for danger items on hover.                            |
| `--menu-item-danger-hover-color`            | `var(--menu-item-danger-color, #dc3545)` | color            | Text color for danger items on hover.                                  |
| `--menu-item-danger-focus-background-color` | `#fff0f0`                                | background-color | Background color for danger items when focused via keyboard.           |
| `--menu-item-disabled-opacity`              | `0.4`                                    | opacity          | Opacity of disabled menu items.                                        |
| `--menu-item-disabled-cursor`               | `not-allowed`                            | cursor           | Cursor shown when hovering disabled items.                             |
| `--menu-separator-height`                   | `1px`                                    | height           | Height of the separator line between item groups.                      |
| `--menu-separator-color`                    | `#e0e0e0`                                | background-color | Color of the separator line.                                           |
| `--menu-separator-margin`                   | `4px 0`                                  | margin           | Vertical spacing around the separator line.                            |
| `--menu-item-icon-height`                   | `16px`                                   | height           | Height of per-item icons.                                              |
| `--menu-item-icon-width`                    | `16px`                                   | width            | Width of per-item icons.                                               |
| `--menu-item-font-weight`                   | `400`                                    | font-weight      | Font weight of menu item labels.                                       |
| `--menu-item-line-height`                   | `1.4`                                    | line-height      | Line height of menu item labels.                                       |

## Type Reference

Custom types used by this component's props and events:

### MenuItem

```typescript
type MenuItem = {
  label: string; // Display text for the menu item
  value: string; // Unique identifier used in onselect callback and test IDs
  icon?: string; // URL/src for an icon image displayed before the label
  disabled?: boolean; // When true, item is dimmed and non-interactive
  danger?: boolean; // When true, item text is styled in a destructive/red color
  separator?: boolean; // When true, renders a horizontal line instead of a clickable item
  id?: string; // DOM id for the item element, needed for aria-activedescendant references
};
```

## Internal Dependencies

This component uses the following library components internally:

- Img (for menu item icon rendering)

## Web Component

Tag: `<sui-menu>`

```html
<sui-menu>
  <button slot="trigger">Open Menu</button>
</sui-menu>
```

### Slots

| Slot Name | Maps to Snippet | Description                               |
| --------- | --------------- | ----------------------------------------- |
| `trigger` | `trigger`       | The element that opens the menu on click. |

> **Note:** The `items` prop is an array — set it via JavaScript property.
