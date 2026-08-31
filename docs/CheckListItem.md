# CheckListItem

A checkbox list item with a text label. When clicked, toggles the `checked` state and fires `onclick` with the new boolean value. Supports a custom `checkboxLabel` snippet to replace the default text display. The checked state is bindable for two-way binding. Purpose-built for a single checkbox + label row — for a richer multi-section row (image, expandable detail, several independent click targets) with no selection semantics, use `ListItem` instead.

## Usage

```svelte
<script>
  import { CheckListItem } from '@juspay/svelte-ui-components';
</script>

<CheckListItem text={'...'} />
```

## Props

| Prop     | Type      | Required | Default     | Description                                                                                                                                                            |
| -------- | --------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text     | `string`  | Yes      | `-`         | The label text for the checkbox item.                                                                                                                                  |
| checked  | `boolean` | No       | `false`     | Bindable. The current checked state of the checkbox.                                                                                                                   |
| disabled | `boolean` | No       | `false`     | When true, the checkbox control is non-interactive and visually dimmed while label content remains fully opaque.                                                       |
| testId   | `string`  | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes  | `string`  | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet       | Type      | Description                                                                  |
| ------------- | --------- | ---------------------------------------------------------------------------- |
| checkboxLabel | `Snippet` | A Svelte 5 Snippet that replaces the default text label with custom content. |

## Events

| Event   | Type                         | Description                                                                     |
| ------- | ---------------------------- | ------------------------------------------------------------------------------- |
| onclick | `(checked: boolean) => void` | Fires after the checkbox state changes. Receives the new boolean checked value. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                | Default  | CSS Property | Description                                    |
| --------------------------------------- | -------- | ------------ | ---------------------------------------------- |
| `--check-list-item-display`             | `flex`   | display      | Display mode of the checkbox item container.   |
| `--check-list-item-align-items`         | `center` | align-items  | Vertical alignment of checkbox and label.      |
| `--check-list-item-width`               | `100%`   | width        | Width of the checkbox item.                    |
| `--check-list-item-padding`             | `-`      | padding      | Inner padding of the checkbox item.            |
| `--check-list-item-gap`                 | `8px`    | gap          | Gap between the checkbox and the label.        |
| `--check-list-item-disabled-opacity`    | `0.4`    | opacity      | Opacity of the checkbox control when disabled. |
| `--check-list-item-text-size`           | `14px`   | font-size    | Font size of the label text.                   |
| `--check-list-item-text-color`          | `-`      | color        | Color of the label text when unchecked.        |
| `--check-list-item-checked-text-color`  | `-`      | color        | Color of the label text when checked.          |
| `--check-list-item-checked-font-weight` | `-`      | font-weight  | Font weight of the label text when checked.    |

## Internal Dependencies

This component uses the following library components internally:

- Checkbox (for the checkbox control)

## Web Component

Tag: `<sui-check-list-item>`

```html
<sui-check-list-item text="Task 1" checked>
  <span slot="checkbox-label">Custom label</span>
</sui-check-list-item>
```

### Slots

| Slot Name        | Maps to Snippet | Description                            |
| ---------------- | --------------- | -------------------------------------- |
| `checkbox-label` | `checkboxLabel` | Custom label content for the checkbox. |
