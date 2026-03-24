# ContextMenu

A right-click contextual action menu that appears at the cursor position. Wraps a trigger area via a `children` snippet; right-clicking (or long-pressing on touch) anywhere inside that area opens a floating menu with a list of context-specific actions. Supports full keyboard navigation (ArrowUp/Down to move focus, Enter/Space to select, Escape to close, Home/End to jump), separator lines between groups, danger-styled items for destructive actions, disabled items, optional per-item icons, keyboard shortcut display, and viewport-aware positioning so the menu never overflows off screen. The browser's native context menu is suppressed within the trigger area.

## Usage

```svelte
<script>
  import { ContextMenu } from '@juspay/svelte-ui-components';
</script>

<ContextMenu
  items={[
    { label: 'Cut', value: 'cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', value: 'copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', value: 'paste', shortcut: 'Ctrl+V' },
    { label: '', value: 'sep-1', separator: true },
    { label: 'Delete', value: 'delete', danger: true }
  ]}
  onselect={(item) => console.log(item.value)}
>
  <div
    style="width: 300px; height: 200px; border: 1px dashed #ccc; display: grid; place-items: center;"
  >
    Right-click here
  </div>
</ContextMenu>
```

## Props

| Prop      | Type                | Required | Default   | Description                                                                                                                                                                  |
| --------- | ------------------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items     | `ContextMenuItem[]` | Yes      | `-`       | Array of context menu items to display. Each item defines a label, value, and optional icon, shortcut, disabled, danger, or separator flags. See ContextMenuItem type below. |
| open      | `boolean`           | No       | `false`   | Bindable. Controls whether the context menu is visible. Set to true to open programmatically; bind to react to open/close state changes.                                     |
| maxHeight | `string`            | No       | `'240px'` | Maximum height of the dropdown before it scrolls. Accepts any CSS length value (e.g., '300px', '50vh').                                                                      |
| testId    | `string`            | No       | `-`       | Value for the data-pw attribute on the container, used for end-to-end testing selectors. Individual items get `{testId}-item-{value}`.                                       |
| classes   | `string`            | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.       |

## Snippets

Svelte 5 Snippet props -- pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                                                                        |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| children | `Snippet` | The trigger area that activates the context menu on right-click. The context menu appears at the cursor position when right-clicking anywhere inside this content. |

## Events

| Event    | Type                              | Description                                                                                                             |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| onselect | `(item: ContextMenuItem) => void` | Fires when a non-disabled menu item is selected (via click, Enter, or Space). Receives the full ContextMenuItem object. |
| onopen   | `() => void`                      | Fires when the context menu opens, triggered by a right-click inside the trigger area.                                  |
| onclose  | `() => void`                      | Fires when the context menu closes, whether by selecting an item, pressing Escape, or clicking outside.                 |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                            | Default                                          | CSS Property     | Description                                                     |
| --------------------------------------------------- | ------------------------------------------------ | ---------------- | --------------------------------------------------------------- |
| `--context-menu-container-display`                  | `contents`                                       | display          | Display mode of the wrapper element around the trigger content. |
| `--context-menu-z-index`                            | `1000`                                           | z-index          | Stacking order of the context menu dropdown.                    |
| `--context-menu-background-color`                   | `#ffffff`                                        | background-color | Background color of the dropdown panel.                         |
| `--context-menu-border`                             | `1px solid #e0e0e0`                              | border           | Border around the dropdown panel.                               |
| `--context-menu-border-radius`                      | `6px`                                            | border-radius    | Corner rounding of the dropdown panel.                          |
| `--context-menu-box-shadow`                         | `0px 4px 16px rgba(0, 0, 0, 0.12)`               | box-shadow       | Shadow of the dropdown panel.                                   |
| `--context-menu-min-width`                          | `160px`                                          | min-width        | Minimum width of the dropdown panel.                            |
| `--context-menu-padding`                            | `4px 0`                                          | padding          | Inner padding of the dropdown panel.                            |
| `--context-menu-font-family`                        | `inherit`                                        | font-family      | Font family for all context menu text.                          |
| `--context-menu-font-size`                          | `14px`                                           | font-size        | Base font size for menu items.                                  |
| `--context-menu-item-padding`                       | `8px 12px`                                       | padding          | Inner padding of each menu item.                                |
| `--context-menu-item-color`                         | `#333333`                                        | color            | Text color of menu items.                                       |
| `--context-menu-item-background-color`              | `transparent`                                    | background-color | Background color of menu items in their default state.          |
| `--context-menu-item-gap`                           | `8px`                                            | gap              | Gap between icon and label within a menu item.                  |
| `--context-menu-item-white-space`                   | `nowrap`                                         | white-space      | White-space behavior for menu item text.                        |
| `--context-menu-item-hover-background-color`        | `#f5f5f5`                                        | background-color | Background color of a menu item on hover.                       |
| `--context-menu-item-hover-color`                   | `var(--context-menu-item-color, #333333)`        | color            | Text color of a menu item on hover.                             |
| `--context-menu-item-focus-background-color`        | `#f0f0f0`                                        | background-color | Background color of a menu item when focused via keyboard.      |
| `--context-menu-item-focus-outline`                 | `none`                                           | outline          | Focus outline of a menu item when focused via keyboard.         |
| `--context-menu-item-danger-color`                  | `#dc3545`                                        | color            | Text color for danger-flagged items (destructive actions).      |
| `--context-menu-item-danger-hover-background-color` | `#fff0f0`                                        | background-color | Background color for danger items on hover.                     |
| `--context-menu-item-danger-hover-color`            | `var(--context-menu-item-danger-color, #dc3545)` | color            | Text color for danger items on hover.                           |
| `--context-menu-item-danger-focus-background-color` | `#fff0f0`                                        | background-color | Background color for danger items when focused via keyboard.    |
| `--context-menu-item-disabled-opacity`              | `0.4`                                            | opacity          | Opacity of disabled menu items.                                 |
| `--context-menu-item-disabled-cursor`               | `not-allowed`                                    | cursor           | Cursor shown when hovering disabled items.                      |
| `--context-menu-separator-height`                   | `1px`                                            | height           | Height of the separator line between item groups.               |
| `--context-menu-separator-color`                    | `#e0e0e0`                                        | background-color | Color of the separator line.                                    |
| `--context-menu-separator-margin`                   | `4px 0`                                          | margin           | Vertical spacing around the separator line.                     |
| `--context-menu-item-icon-height`                   | `16px`                                           | height           | Height of per-item icons.                                       |
| `--context-menu-item-icon-width`                    | `16px`                                           | width            | Width of per-item icons.                                        |
| `--context-menu-item-font-weight`                   | `400`                                            | font-weight      | Font weight of menu item labels.                                |
| `--context-menu-item-line-height`                   | `1.4`                                            | line-height      | Line height of menu item labels.                                |
| `--context-menu-item-shortcut-color`                | `#999999`                                        | color            | Text color of the keyboard shortcut hint.                       |
| `--context-menu-item-shortcut-font-size`            | `12px`                                           | font-size        | Font size of the keyboard shortcut hint.                        |
| `--context-menu-item-shortcut-font-weight`          | `400`                                            | font-weight      | Font weight of the keyboard shortcut hint.                      |
| `--context-menu-item-shortcut-margin-left`          | `16px`                                           | margin-left      | Space between the item label and the keyboard shortcut hint.    |
| `--context-menu-max-height`                         | `240px`                                          | max-height       | Maximum height of the context menu dropdown before scrolling. Also controlled by the `maxHeight` prop via inline style. |

## Type Reference

Custom types used by this component's props and events:

### ContextMenuItem

```typescript
type ContextMenuItem = {
  label: string; // Display text for the menu item
  value: string; // Unique identifier used in onselect callback and test IDs
  icon?: string; // URL/src for an icon image displayed before the label
  shortcut?: string; // Keyboard shortcut hint displayed right-aligned (e.g., "Ctrl+C")
  disabled?: boolean; // When true, item is dimmed and non-interactive
  danger?: boolean; // When true, item text is styled in a destructive/red color
  separator?: boolean; // When true, renders a horizontal line instead of a clickable item
};
```

## Web Component

Tag: `<sui-context-menu>`

```html
<sui-context-menu>
  <button>Right-click me</button>
</sui-context-menu>
```

### Slots

| Slot Name   | Maps to Snippet | Description                                                     |
| ----------- | --------------- | --------------------------------------------------------------- |
| _(default)_ | `children`      | The trigger element that opens the context menu on right-click. |
