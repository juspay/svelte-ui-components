# SplitButton

A primary action button paired with a dropdown arrow trigger that reveals a menu of secondary actions. Clicking the main button fires the primary action, while clicking the dropdown arrow opens a Menu component with full keyboard navigation, typeahead search, disabled/danger items, and focus management. The dropdown closes when an item is selected, when clicking outside, or when pressing Escape.

## Usage

```svelte
<script>
  import { SplitButton } from '@juspay/svelte-ui-components';
</script>

<SplitButton
  text="Save"
  items={[
    { label: 'Save as Draft', value: 'draft' },
    { label: 'Save & Close', value: 'save-close' },
    { label: 'Discard', value: 'discard', danger: true }
  ]}
  onclick={(e) => console.log('Primary clicked', e)}
  onselect={(item) => console.log('Selected:', item.value)}
/>
```

## Props

| Prop     | Type         | Required | Default | Description                                                                                                                                                                      |
| -------- | ------------ | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text     | `string`     | Yes      | `-`     | The label displayed on the primary action button.                                                                                                                                |
| items    | `MenuItem[]` | Yes      | `-`     | Array of menu items for the dropdown. Uses the same `MenuItem` type as the Menu component — supports `label`, `value`, `icon`, `disabled`, `danger`, and `separator` properties. |
| disabled | `boolean`    | No       | `false` | Whether the entire split button is disabled. When true, both the primary button and dropdown trigger appear dimmed and ignore clicks.                                            |
| testId   | `string`     | No       | `-`     | Value for the `data-pw` attribute on the container, used for end-to-end testing selectors.                                                                                       |
| classes  | `string`     | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.           |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet      | Type      | Description                                                                          |
| ------------ | --------- | ------------------------------------------------------------------------------------ |
| dropdownIcon | `Snippet` | Custom icon for the dropdown trigger arrow. Defaults to a built-in chevron-down SVG. |

## Events

| Event    | Type                          | Description                                                                                                                          |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| onclick  | `(event: MouseEvent) => void` | Fires when the primary action button is clicked. Does NOT fire when disabled is true.                                                |
| onselect | `(item: MenuItem) => void`    | Fires when a dropdown menu item is selected. Receives the full `MenuItem` object. The dropdown closes automatically after selection. |

## CSS Variables

Override these custom properties to theme the component.

### Container

| Variable             | Default | CSS Property | Description                                              |
| -------------------- | ------- | ------------ | -------------------------------------------------------- |
| `--split-button-gap` | `0px`   | gap          | Gap between the primary button and the dropdown trigger. |

### Primary Button

| Variable                                  | Default                                      | CSS Property     | Description                                                              |
| ----------------------------------------- | -------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `--split-button-primary-background`       | `#3a4550`                                    | background-color | Background color of the primary action button.                           |
| `--split-button-primary-color`            | `white`                                      | color            | Text color of the primary action button label.                           |
| `--split-button-primary-padding`          | `8px 16px`                                   | padding          | Inner padding of the primary action button.                              |
| `--split-button-primary-font-size`        | `14px`                                       | font-size        | Font size of the primary action button text.                             |
| `--split-button-primary-font-weight`      | `500`                                        | font-weight      | Font weight of the primary action button text.                           |
| `--split-button-primary-font-family`      | `-`                                          | font-family      | Font family of the primary action button text.                           |
| `--split-button-primary-border`           | `none`                                       | border           | Border style of the primary action button.                               |
| `--split-button-primary-border-radius`    | `4px 0 0 4px`                                | border-radius    | Corner rounding of the primary button (left corners rounded by default). |
| `--split-button-primary-hover-background` | inherits `--split-button-primary-background` | background-color | Background color of the primary button on hover.                         |
| `--split-button-primary-hover-color`      | inherits `--split-button-primary-color`      | color            | Text color of the primary button on hover.                               |

### Dropdown Trigger

| Variable                                  | Default                                      | CSS Property     | Description                                                                               |
| ----------------------------------------- | -------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `--split-button-trigger-background`       | `#3a4550`                                    | background-color | Background color of the dropdown trigger area.                                            |
| `--split-button-trigger-color`            | `white`                                      | color            | Color of the dropdown arrow icon.                                                         |
| `--split-button-trigger-padding`          | `8px`                                        | padding          | Inner padding of the dropdown trigger (applied to `.menu-trigger` via `:global`).         |
| `--split-button-trigger-separator`        | `1px solid rgba(255, 255, 255, 0.3)`         | border-left      | Left border acting as a visual separator between the primary button and dropdown trigger. |
| `--split-button-trigger-border-radius`    | `0 4px 4px 0`                                | border-radius    | Corner rounding of the dropdown trigger (right corners rounded by default).               |
| `--split-button-trigger-hover-background` | inherits `--split-button-trigger-background` | background-color | Background color of the dropdown trigger on hover.                                        |
| `--split-button-trigger-hover-color`      | inherits `--split-button-trigger-color`      | color            | Arrow color of the dropdown trigger on hover.                                             |

### Arrow Icon

| Variable                      | Default | CSS Property | Description                        |
| ----------------------------- | ------- | ------------ | ---------------------------------- |
| `--split-button-arrow-width`  | `10px`  | width        | Width of the dropdown arrow icon.  |
| `--split-button-arrow-height` | `6px`   | height       | Height of the dropdown arrow icon. |

### Disabled State

| Variable                          | Default       | CSS Property | Description                                                               |
| --------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------- |
| `--split-button-disabled-opacity` | `0.4`         | opacity      | Opacity applied to the primary button and dropdown trigger when disabled. |
| `--split-button-disabled-cursor`  | `not-allowed` | cursor       | Cursor shown when hovering over the disabled split button.                |

### Dropdown Menu

The dropdown uses the Menu component internally. Style it with Menu's CSS variables (prefixed `--menu-*`). The SplitButton sets `--menu-container-position: static` so the dropdown positions relative to the `.split-button` container.

## Type Reference

Custom types used by this component's props and events:

### MenuItem

```typescript
type MenuItem = {
  label: string; // Display text for the menu item
  value: string; // Unique identifier used in onselect callback
  icon?: string; // URL/src for an icon image displayed before the label
  disabled?: boolean; // When true, item is dimmed and non-interactive
  danger?: boolean; // When true, item text is styled in a destructive/red color
  separator?: boolean; // When true, renders a horizontal line instead of a clickable item
};
```

## Internal Dependencies

This component uses the following library components internally:

- Button (for the primary action button)
- Menu (for the dropdown with keyboard navigation, typeahead, and a11y)

## Web Component

Tag: `<sui-split-button>`

```html
<sui-split-button text="Save">
  <svg slot="dropdown-icon">...</svg>
</sui-split-button>
```

### Slots

| Slot Name       | Maps to Snippet | Description                         |
| --------------- | --------------- | ----------------------------------- |
| `dropdown-icon` | `dropdownIcon`  | Custom icon for the dropdown arrow. |

> **Note:** The `items` prop is an array — set it via JavaScript property.
