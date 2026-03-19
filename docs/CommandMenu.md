# CommandMenu

A full-screen action palette triggered by keyboard shortcut (Cmd+K / Ctrl+K). Displays a search input with filterable commands grouped by category. Supports keyboard navigation (ArrowUp/Down, Enter, Escape), shortcut badges, disabled items, custom icons via Snippet, and click-outside-to-close. The overlay locks body scroll while open.

## Usage

```svelte
<script>
  import { CommandMenu } from '@juspay/svelte-ui-components';

  let open = $state(false);
  const commands = [
    { label: 'Go to Dashboard', value: 'dashboard', group: 'Navigation', shortcut: 'Cmd+D' },
    { label: 'Search Users', value: 'search-users', group: 'Navigation', shortcut: 'Cmd+U' },
    { label: 'Create New Item', value: 'create', group: 'Actions', shortcut: 'Cmd+N' },
    { label: 'Export Data', value: 'export', group: 'Actions' },
    { label: 'Settings', value: 'settings', group: 'General', shortcut: 'Cmd+,' }
  ];
</script>

<CommandMenu
  items={commands}
  bind:open
  placeholder="Type a command or search..."
  onselect={(item) => console.log('Selected:', item.value)}
/>
```

## Props

| Prop        | Type            | Required | Default                | Description                                                                                                                                                                              |
| ----------- | --------------- | -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items       | `CommandItem[]` | Yes      | -                      | Array of command items to display. Each item has a label, value, and optional group, icon, shortcut, and disabled fields. Items are filtered by search query matching against the label. |
| open        | `boolean`       | No       | `false`                | Controls visibility of the command menu. Bindable. Set to true to show, false to hide. Automatically toggled by Cmd+K / Ctrl+K keyboard shortcut.                                        |
| placeholder | `string`        | No       | `'Search commands...'` | Placeholder text shown in the search input when no query is entered.                                                                                                                     |
| emptyText   | `string`        | No       | `'No results found.'`  | Text displayed when the search query matches no items.                                                                                                                                   |
| testId      | `string`        | No       | `-`                    | Value for `data-pw` on the overlay container for Playwright testing. Child elements get suffixed testIds (e.g., `{testId}-input`, `{testId}-item-{value}`).                              |
| classes     | `string`        | No       | `-`                    | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                   |

## Snippets

Svelte 5 Snippet props -- pass content blocks to the component.

| Snippet    | Type                     | Description                                                                                                                                             |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| itemIcon   | `Snippet<[CommandItem]>` | Custom icon renderer for each command item. Receives the CommandItem as an argument. When provided, takes precedence over the item's `icon` URL string. |
| searchIcon | `Snippet`                | Custom icon for the search input.                                                                                                                       |

## Events

| Event    | Type                          | Description                                                                                                                                             |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onselect | `(item: CommandItem) => void` | Fires when the user selects a command item via click or Enter key. Receives the full CommandItem object. The menu automatically closes after selection. |
| onclose  | `() => void`                  | Fires when the menu closes for any reason: Escape key, overlay click, Cmd+K toggle, or after item selection.                                            |

## Keyboard Interactions

| Key            | Action                                                 |
| -------------- | ------------------------------------------------------ |
| Cmd+K / Ctrl+K | Toggle the command menu open/closed (global listener). |
| ArrowDown      | Move highlight to next non-disabled item.              |
| ArrowUp        | Move highlight to previous non-disabled item.          |
| Enter          | Select the currently highlighted item.                 |
| Escape         | Close the command menu.                                |

## CSS Variables

Override these custom properties to theme the component.

### Overlay

| Variable                             | Default              | CSS Property     | Description                                                    |
| ------------------------------------ | -------------------- | ---------------- | -------------------------------------------------------------- |
| `--command-menu-overlay-background`  | `rgba(0, 0, 0, 0.5)` | background-color | Background color of the full-screen overlay behind the dialog. |
| `--command-menu-overlay-align`       | `flex-start`         | align-items      | Vertical alignment of the dialog within the overlay.           |
| `--command-menu-overlay-padding-top` | `20vh`               | padding-top      | Top padding that positions the dialog vertically from the top. |
| `--command-menu-z-index`             | `50`                 | z-index          | Stacking order of the overlay.                                 |

### Dialog

| Variable                       | Default                          | CSS Property     | Description                                          |
| ------------------------------ | -------------------------------- | ---------------- | ---------------------------------------------------- |
| `--command-menu-background`    | `#ffffff`                        | background-color | Background color of the command menu dialog panel.   |
| `--command-menu-border-radius` | `12px`                           | border-radius    | Corner rounding of the dialog panel.                 |
| `--command-menu-box-shadow`    | `0 16px 70px rgba(0, 0, 0, 0.2)` | box-shadow       | Shadow of the dialog panel.                          |
| `--command-menu-width`         | `560px`                          | width            | Width of the dialog panel.                           |
| `--command-menu-max-width`     | `90vw`                           | max-width        | Maximum width of the dialog panel.                   |
| `--command-menu-max-height`    | `60vh`                           | max-height       | Maximum height of the dialog panel before scrolling. |
| `--command-menu-border`        | `1px solid #e2e8f0`              | border           | Border of the dialog panel.                          |

### Search Input

| Variable                                 | Default     | CSS Property  | Description                                     |
| ---------------------------------------- | ----------- | ------------- | ----------------------------------------------- |
| `--command-menu-input-wrapper-padding`   | `12px 16px` | padding       | Padding around the search input area.           |
| `--command-menu-input-wrapper-gap`       | `10px`      | gap           | Gap between search icon and input field.        |
| `--command-menu-search-icon-size`        | `20px`      | width, height | Size of the search magnifying glass icon.       |
| `--command-menu-search-icon-color`       | `#94a3b8`   | color         | Color of the search icon.                       |
| `--command-menu-input-font-size`         | `16px`      | font-size     | Font size of the search input text.             |
| `--command-menu-input-font-family`       | `inherit`   | font-family   | Font family of the search input text.           |
| `--command-menu-input-font-weight`       | `400`       | font-weight   | Font weight of the search input text.           |
| `--command-menu-input-color`             | `#1e293b`   | color         | Text color of the search input.                 |
| `--command-menu-input-caret-color`       | `#3b82f6`   | caret-color   | Color of the blinking text cursor in the input. |
| `--command-menu-input-placeholder-color` | `#94a3b8`   | color         | Color of the placeholder text.                  |

### Separator

| Variable                          | Default   | CSS Property     | Description                                             |
| --------------------------------- | --------- | ---------------- | ------------------------------------------------------- |
| `--command-menu-separator-height` | `1px`     | height           | Height of the line between search input and items list. |
| `--command-menu-separator-color`  | `#e2e8f0` | background-color | Color of the separator line.                            |

### Item List

| Variable                         | Default | CSS Property    | Description                                    |
| -------------------------------- | ------- | --------------- | ---------------------------------------------- |
| `--command-menu-list-padding`    | `8px`   | padding         | Padding inside the scrollable items container. |
| `--command-menu-scrollbar-width` | `thin`  | scrollbar-width | Width of the scrollbar in the items list.      |

### Empty State

| Variable                          | Default     | CSS Property | Description                            |
| --------------------------------- | ----------- | ------------ | -------------------------------------- |
| `--command-menu-empty-padding`    | `32px 16px` | padding      | Padding of the empty state message.    |
| `--command-menu-empty-color`      | `#94a3b8`   | color        | Text color of the empty state message. |
| `--command-menu-empty-font-size`  | `14px`      | font-size    | Font size of the empty state message.  |
| `--command-menu-empty-font-style` | `normal`    | font-style   | Font style of the empty state message. |

### Group Heading

| Variable                                      | Default        | CSS Property   | Description                                     |
| --------------------------------------------- | -------------- | -------------- | ----------------------------------------------- |
| `--command-menu-group-heading-padding`        | `8px 12px 4px` | padding        | Padding of each group heading label.            |
| `--command-menu-group-heading-font-size`      | `12px`         | font-size      | Font size of group heading labels.              |
| `--command-menu-group-heading-font-weight`    | `600`          | font-weight    | Font weight of group heading labels.            |
| `--command-menu-group-heading-color`          | `#94a3b8`      | color          | Text color of group heading labels.             |
| `--command-menu-group-heading-text-transform` | `uppercase`    | text-transform | Text transform applied to group heading labels. |
| `--command-menu-group-heading-letter-spacing` | `0.05em`       | letter-spacing | Letter spacing of group heading labels.         |

### Items

| Variable                                | Default     | CSS Property     | Description                                                  |
| --------------------------------------- | ----------- | ---------------- | ------------------------------------------------------------ |
| `--command-menu-item-padding`           | `10px 12px` | padding          | Padding inside each command item row.                        |
| `--command-menu-item-border-radius`     | `8px`       | border-radius    | Corner rounding of each command item row.                    |
| `--command-menu-item-gap`               | `10px`      | gap              | Gap between icon, label, and shortcut within an item.        |
| `--command-menu-item-font-size`         | `14px`      | font-size        | Font size of command item labels.                            |
| `--command-menu-item-color`             | `#334155`   | color            | Text color of command items in their default state.          |
| `--command-menu-item-active-background` | `#f1f5f9`   | background-color | Background color of the currently highlighted/active item.   |
| `--command-menu-item-active-color`      | `#0f172a`   | color            | Text color of the currently highlighted/active item.         |
| `--command-menu-item-disabled-opacity`  | `0.4`       | opacity          | Opacity of disabled command items.                           |
| `--command-menu-item-icon-size`         | `20px`      | width, height    | Size of item icon images (when using icon URL, not Snippet). |

### Keyboard Shortcut Badges

| Variable                           | Default             | CSS Property     | Description                                                             |
| ---------------------------------- | ------------------- | ---------------- | ----------------------------------------------------------------------- |
| `--command-menu-shortcut-gap`      | `4px`               | gap              | Gap between multiple shortcut key badges.                               |
| `--command-menu-kbd-min-width`     | `24px`              | min-width        | Minimum width of each keyboard shortcut badge.                          |
| `--command-menu-kbd-height`        | `22px`              | height           | Height of each keyboard shortcut badge.                                 |
| `--command-menu-kbd-padding`       | `0 6px`             | padding          | Padding inside each keyboard shortcut badge.                            |
| `--command-menu-kbd-border-radius` | `4px`               | border-radius    | Corner rounding of keyboard shortcut badges.                            |
| `--command-menu-kbd-background`    | `#f1f5f9`           | background-color | Background color of keyboard shortcut badges.                           |
| `--command-menu-kbd-border`        | `1px solid #e2e8f0` | border           | Border of keyboard shortcut badges.                                     |
| `--command-menu-kbd-color`         | `#64748b`           | color            | Text color of keyboard shortcut badges.                                 |
| `--command-menu-kbd-font-size`     | `11px`              | font-size        | Font size of keyboard shortcut badge text.                              |
| `--command-menu-kbd-font-family`   | `inherit`           | font-family      | Font family of keyboard shortcut badge text.                            |
| `--command-menu-kbd-font-weight`   | `500`               | font-weight      | Font weight of keyboard shortcut badge text.                            |
| `--command-menu-kbd-box-shadow`    | `0 1px 0 #e2e8f0`   | box-shadow       | Box shadow of keyboard shortcut badges (gives a raised key appearance). |

## Type Reference

Custom types used by this component's props and events:

### CommandItem

```typescript
type CommandItem = {
  label: string;
  value: string;
  group?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
};
```

## Internal Dependencies

This component uses the following library components internally:

- Img (for item icon rendering)

## Web Component

Tag: `<sui-command-menu>`

```html
<sui-command-menu open placeholder="Type a command..."></sui-command-menu>
```

### Slots

| Slot Name     | Maps to Snippet | Description                       |
| ------------- | --------------- | --------------------------------- |
| `search-icon` | `searchIcon`    | Custom icon for the search input. |

> **Note:** The `items` prop is an array and `itemIcon` is a parameterized Snippet — set them via JavaScript properties.
