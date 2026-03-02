# CheckListItem

A checkbox list item with an HTML-capable text label. When clicked, toggles the `checked` state and fires `onclick` with the new boolean value. Supports a custom `checkboxLabel` snippet to replace the default text display. The checked state is bindable for two-way binding.

## Usage

```svelte
<script>
  import { CheckListItem } from '@juspay/svelte-ui-components';
</script>

<CheckListItem text={'...'} />
```

## Props

| Prop    | Type      | Required | Default | Description                                                                                                                                                            |
| ------- | --------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text    | `string`  | Yes      | `-`     | The label text for the checkbox item. Supports HTML (rendered via {@html}).                                                                                            |
| checked | `boolean` | No       | `false` | Bindable. The current checked state of the checkbox.                                                                                                                   |
| classes | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

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

| Variable                                | Default           | CSS Property  | Description                                                   |
| --------------------------------------- | ----------------- | ------------- | ------------------------------------------------------------- |
| `--check-list-item-display`             | `flex`            | display       | Display mode of the checkbox item container.                  |
| `--check-list-item-align-items`         | `center`          | align-items   | Vertical alignment of checkbox and label.                     |
| `--check-list-item-width`               | `100%`            | width         | Width of the checkbox item.                                   |
| `--check-list-item-padding`             | `-`               | padding       | Inner padding of the checkbox item.                           |
| `--check-list-item-margin`              | `0px 0px 0px 8px` | margin        | Margin of the label text.                                     |
| `--check-list-item-text-size`           | `12px`            | font-size     | Font size of the label text.                                  |
| `--check-list-item-text-color`          | `-`               | color         | Color of the label text when unchecked.                       |
| `--check-list-item-checked-text-color`  | `-`               | color         | Color of the label text when checked.                         |
| `--check-list-item-checked-font-weight` | `-`               | font-weight   | Font weight of the label text when checked.                   |
| `--checkbox-accent-color`               | `#000`            | accent-color  | Accent color of the checkbox (browser-native checkbox color). |
| `--checkbox-height`                     | `24px`            | height        | Height of the checkbox.                                       |
| `--checkbox-width`                      | `24px`            | width         | Width of the checkbox.                                        |
| `--checkbox-margin`                     | `-`               | margin        | Margin around the checkbox.                                   |
| `--checkbox-padding`                    | `-`               | padding       | Padding inside the checkbox.                                  |
| `--checkbox-border-radius`              | `-`               | border-radius | Corner rounding of the checkbox.                              |
| `--checkbox-visibility`                 | `-`               | visibility    | Visibility of the checkbox (hidden to use custom checkbox).   |
