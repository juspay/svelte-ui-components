# Select

A dropdown selector that supports single-select and multi-select modes. In single-select mode, clicking an item immediately selects it and closes the dropdown. In multi-select mode, items have checkboxes, a 'Select All' toggle, and an 'Apply' button to confirm selection. Displays the selected item label (or a custom `selectedItemLabel`), optional selected-item count badge, and a rotating dropdown arrow. Closes automatically when clicking outside. Supports a left icon (using Img component), custom left content snippet, and bottom content snippet inside the dropdown.

## Usage

```svelte
<script>
  import { Select } from '@juspay/svelte-ui-components';
</script>

<Select />
```

## Props

| Prop                       | Type                         | Required | Default | Description                                                                                                                                                            |
| -------------------------- | ---------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dropDownIconAlt            | `string`                     | No       | `''`    | Alt text for the dropdown arrow icon.                                                                                                                                  |
| placeholder                | `string \| null`             | No       | `''`    | Text shown when no item is selected.                                                                                                                                   |
| label                      | `string \| null`             | No       | `''`    | Label text shown above the select dropdown.                                                                                                                            |
| allItems                   | `string[]`                   | No       | `[]`    | Array of string values representing all available options in the dropdown.                                                                                             |
| selectedItem               | `string \| string[]`         | No       | `''`    | The currently selected value(s). For single-select: a string. For multi-select: a string array. Controls which items appear checked.                                   |
| selectedItemLabel          | `string \| string[] \| null` | No       | `null`  | Custom display label(s) for the selected item(s). If null, the raw selectedItem value is displayed. Allows showing a different label than the underlying value.        |
| showSelectedItemInDropdown | `boolean`                    | No       | `false` | When true, selected items still appear in the dropdown list (useful with checkboxes in multi-select). When false, selected items are hidden from the list.             |
| selectMultipleItems        | `boolean`                    | No       | `false` | Enables multi-select mode with checkboxes, Select All, and Apply button.                                                                                               |
| hideDropDownIcon           | `boolean`                    | No       | `-`     | When true, hides the dropdown arrow icon.                                                                                                                              |
| dropDownIcon               | `string`                     | No       | `-`     | Custom URL for the dropdown arrow icon. Defaults to a down-arrow SVG from sdk.breeze.in.                                                                               |
| leftIcon                   | `ImgProperties \| null`      | No       | `null`  | An ImgProperties object for an icon displayed to the left of the selected text inside the dropdown trigger.                                                            |
| showSingleSelectButton     | `boolean`                    | No       | `-`     | When true in multi-select mode, hides the Select All button and only shows individual checkboxes.                                                                      |
| showSelectedItem           | `boolean`                    | No       | `true`  | When false, always shows the placeholder text instead of the selected item label.                                                                                      |
| showSelectedItemCount      | `boolean`                    | No       | `false` | When true in multi-select mode, shows a count badge next to the selected text indicating how many items are selected.                                                  |
| testId                     | `string`                     | No       | `-`     | Value for data-pw on the dropdown trigger.                                                                                                                             |
| labelTestId                | `string`                     | No       | `-`     | Value for data-pw on the label element.                                                                                                                                |
| itemTestId                 | `string`                     | No       | `-`     | Base value for data-pw on dropdown items. Each item gets `{itemTestId}-{itemValue}`.                                                                                   |
| classes                    | `string`                     | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet       | Type      | Description                                                                                          |
| ------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| leftContent   | `Snippet` | A Svelte 5 Snippet rendered to the left of the selected text in the dropdown trigger.                |
| bottomContent | `Snippet` | A Svelte 5 Snippet rendered at the bottom of the dropdown list, above the Apply button (if present). |

## Events

| Event           | Type                                                     | Description                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onselect        | `(event: { selectedItems: string \| string[] }) => void` | Fires when a selection is confirmed. In single-select: fires immediately when an item is clicked. In multi-select: fires when the Apply button is clicked. Receives { selectedItems: string \| string[] }. |
| ondropdownClick | `() => void`                                             | Fires every time the dropdown opens or closes (toggle).                                                                                                                                                    |
| onkeydown       | `(event: KeyboardEvent) => void`                         | Fires when a key is pressed while the select trigger has focus.                                                                                                                                            |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                       | Default                        | CSS Property                          | Description                                                               |
| ---------------------------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------- |
| `--select-height`                              | `fit-content`                  | height                                | Height of the select dropdown trigger.                                    |
| `--select-bgcolor`                             | `#ffffff`                      | background-color                      | Background color of the select trigger.                                   |
| `--select-font-size`                           | `14px`                         | font-size                             | Font size of the select text.                                             |
| `--select-font-family`                         | `Euclid Circular A`            | font-family                           | Font family of the select text.                                           |
| `--select-radius`                              | `4px`                          | border-radius                         | Corner rounding of the select trigger.                                    |
| `--select-font-weight`                         | `400`                          | font-weight                           | Font weight of the select text.                                           |
| `--select-width`                               | `100%`                         | width                                 | Width of the select component.                                            |
| `--select-min-width`                           | `-`                            | min-width                             | Minimum width of the select component.                                    |
| `--select-box-shadow`                          | `0px 1px 8px #2f537733`        | box-shadow                            | Box shadow of the select trigger.                                         |
| `--select-outline`                             | `none`                         | outline                               | Outline of the select trigger.                                            |
| `--select-border`                              | `1px solid #ccc`               | border                                | Border of the select trigger.                                             |
| `--select-position`                            | `relative`                     | position                              | CSS position of the select component (relative for dropdown positioning). |
| `--select-color`                               | `#333`                         | color                                 | Text color of the select trigger.                                         |
| `--select-align-content`                       | `-`                            | align-content                         | Content alignment of the select.                                          |
| `--select-display`                             | `inline-block`                 | display                               | Display mode of the select.                                               |
| `--select-btn-margin`                          | `1px`                          | --button-margin                       |                                                                           |
| `--select-btn-border-radius`                   | `2px`                          | --button-border-radius                |                                                                           |
| `--select-input-button-margin`                 | `10px`                         | --input-button-margin                 |                                                                           |
| `--select-check-list-item-margin`              | `0px`                          | --check-list-item-margin              |                                                                           |
| `--select-checkbox-margin`                     | `2px 8px 0px 0px`              | --checkbox-margin                     |                                                                           |
| `--select-checkbox-height`                     | `14px`                         | --checkbox-height                     |                                                                           |
| `--select-checkbox-width`                      | `14px`                         | --checkbox-width                      |                                                                           |
| `--select-checkbox-accent-color`               | `#3a4550`                      | --checkbox-accent-color               |                                                                           |
| `--select-check-list-item-checked-font-weight` | `bold`                         | --check-list-item-checked-font-weight |                                                                           |
| `--select-check-list-item-width`               | `fit-content`                  | --check-list-item-width               |                                                                           |
| `--select-hover-color`                         | `#000`                         | color                                 | Text color of the select on hover.                                        |
| `--select-hover-bgcolor`                       | `#ffffff`                      | background-color                      | Background color of the select on hover.                                  |
| `--dropdown-arrow-icon-height`                 | `16px`                         | height                                | Height of the dropdown arrow icon.                                        |
| `--dropdown-arrow-icon-width`                  | `16px`                         | width                                 | Width of the dropdown arrow icon.                                         |
| `--item-padding`                               | `8px 16px`                     | padding                               | Padding inside each dropdown item.                                        |
| `--item-background-color`                      | `#fff`                         | background-color                      | Background color of each dropdown item.                                   |
| `--item-border-radius`                         | `-`                            | border-radius                         | Corner rounding of each dropdown item.                                    |
| `--item-align-items`                           | `-`                            | align-items                           | Vertical alignment of content inside each item.                           |
| `--item-height`                                | `-`                            | height                                | Height of each dropdown item.                                             |
| `--non-selected-hover-bg`                      | `#f0f0f0`                      | background-color                      | Background color of dropdown items on hover.                              |
| `--non-selected-hover-color`                   | `-`                            | color                                 | Text color of dropdown items on hover.                                    |
| `--selected-align-items`                       | `center`                       | align-items                           | Vertical alignment in the selected item display.                          |
| `--selected-margin`                            | `0px 0px 0px 0px`              | margin                                | Margin of the selected item display.                                      |
| `--selected-justify-content`                   | `flex-start`                   | justify-content                       | Horizontal alignment in the selected item display.                        |
| `--selected-item-background-color`             | `#f9f9f9`                      | background-color                      | Background of the selected item trigger area.                             |
| `--selected-item-white-space`                  | `nowrap`                       | white-space                           | White space handling for selected text.                                   |
| `--selected-item-overflow`                     | `hidden`                       | overflow                              | Overflow handling for selected text.                                      |
| `--selected-item-text-overflow`                | `ellipsis`                     | text-overflow                         | Text overflow style (ellipsis) for selected text.                         |
| `--selected-item-max-width`                    | `100%`                         | max-width                             | Max width of the selected text.                                           |
| `--selected-item-padding`                      | `var(--item-padding, 8px 16px` | padding                               | Padding inside the selected item trigger.                                 |
| `--selected-hover-bg`                          | `transparent`                  | background-color                      | Background of the selected trigger on hover.                              |
| `--selected-color`                             | `black`                        | color                                 | Text color of the selected trigger on hover.                              |
| `--non-selected-display`                       | `-`                            | display                               |                                                                           |
| `--non-selected-item-bgcolor`                  | `#ffffff`                      | background-color                      | Background of the dropdown list panel.                                    |
| `--non-selected-item-color`                    | `-`                            | color                                 | Text color of dropdown list items.                                        |
| `--non-selected-width`                         | `100%`                         | width                                 | Width of the dropdown list panel.                                         |
| `--non-selected-min-width`                     | `100%`                         | min-width                             | Minimum width of the dropdown list panel.                                 |
| `--non-selected-word-break`                    | `break-word`                   | word-wrap                             | Word break behavior in dropdown items.                                    |
| `--non-selected-items-position`                | `absolute`                     | position                              | CSS position of the dropdown panel (absolute for overlay).                |
| `--non-selected-items-border-radius`           | `4px`                          | border-radius                         | Corner rounding of the dropdown panel.                                    |
| `--non-selected-margin`                        | `4px 0px 0px 0px`              | margin                                | Margin of the dropdown panel.                                             |
| `--non-select-font-weight`                     | `500`                          | font-weight                           | Font weight of dropdown items.                                            |
| `--non-selected-left`                          | `-`                            | left                                  | Left position of the dropdown panel.                                      |
| `--non-selected-right`                         | `-`                            | right                                 | Right position of the dropdown panel.                                     |
| `--non-selected-top`                           | `-`                            | top                                   | Top position of the dropdown panel.                                       |
| `--non-selected-bottom`                        | `-`                            | bottom                                | Bottom position of the dropdown panel.                                    |
| `--scrollbar-width`                            | `0`                            | width                                 | Width of the scrollbar (0 to hide).                                       |
| `--non-selected-max-height`                    | `165px`                        | max-height                            | Max height of the scrollable item list.                                   |
| `--selected-option-icon`                       | `'✔'`                         | content                               | Content of the checkmark shown next to selected items in single-select.   |
| `--item-selected-icon-color`                   | `-`                            | color                                 | Color of the selected item checkmark icon.                                |
| `--label-text-weight`                          | `400`                          | font-weight                           | Font weight of the label text above the dropdown.                         |
| `--label-text-size`                            | `12px`                         | font-size                             | Font size of the label text.                                              |
| `--label-text-color`                           | `#333`                         | color                                 | Color of the label text.                                                  |
| `--label-container-margin-bottom`              | `4px`                          | margin-bottom                         | Bottom margin of the label.                                               |
| `--label-container-display`                    | `inline-block`                 | display                               | Display mode of the label container.                                      |
| `--select-all-btn-width`                       | `99%`                          | width                                 |                                                                           |
| `--select-all-btn-white-space`                 | `nowrap`                       | white-space                           |                                                                           |
| `--select-all-btn-padding`                     | `10px 16px`                    | padding                               |                                                                           |
| `--select-all-btn-font-size`                   | `14px`                         | --button-font-size                    |                                                                           |
| `--select-all-btn-color`                       | `#ffffff`                      | --button-color                        |                                                                           |
| `--select-all-btn-text-color`                  | `#333`                         | --button-text-color                   |                                                                           |
| `--select-all-btn-inner-padding`               | `0px`                          | --button-padding                      |                                                                           |
| `--select-all-btn-justify-content`             | `flex-start`                   | --button-justify-content              |                                                                           |
| `--apply-btn-container-padding`                | `5px`                          | padding                               |                                                                           |
| `--apply-btn-container-border-top`             | `1px solid #ddd`               | border-top                            |                                                                           |
| `--apply-btn-container-background-color`       | `#f9f9f9`                      | background-color                      |                                                                           |
| `--apply-btn-container-position`               | `sticky`                       | position                              |                                                                           |
| `--apply-btn-container-width`                  | `94%`                          | width                                 |                                                                           |
| `--apply-btn-display`                          | `flex`                         | display                               |                                                                           |
| `--apply-btn-flex-direction`                   | `column`                       | flex-direction                        |                                                                           |
| `--apply-btn-width`                            | `100%`                         | --button-width                        |                                                                           |
| `--apply-btn-padding`                          | `10px`                         | --button-padding                      |                                                                           |
| `--apply-btn-font-size`                        | `14px`                         | --button-font-size                    |                                                                           |
| `--select-icon-container-width`                | `fit-content`                  | width                                 |                                                                           |
| `--select-icon-container-height`               | `fit-content`                  | height                                |                                                                           |
| `--select-icon-container-border-radius`        | `-`                            | border-radius                         |                                                                           |
| `--select-icon-container-opacity`              | `-`                            | opacity                               |                                                                           |
| `--select-icon-container-background`           | `-`                            | background                            |                                                                           |
| `--select-icon-container-margin`               | `0px 8px 0px 0px`              | margin                                |                                                                           |
| `--select-icon-container-padding`              | `-`                            | padding                               |                                                                           |
| `--select-icon-height`                         | `-`                            | --image-height                        |                                                                           |
| `--selected-item-count-margin`                 | `0px 6px`                      | margin                                | Margin around the selected count badge.                                   |
| `--selected-item-count-height`                 | `18px`                         | height                                | Height of the selected count badge.                                       |
| `--selected-item-count-width`                  | `18px`                         | width                                 | Width of the selected count badge.                                        |
| `--selected-item-count-min-width`              | `18px`                         | min-width                             | Min width of the selected count badge.                                    |
| `--selected-item-count-padding`                | `4px`                          | padding                               | Padding inside the selected count badge.                                  |
| `--selected-item-count-display`                | `flex`                         | display                               |                                                                           |
| `--selected-item-count-justify-content`        | `center`                       | justify-content                       |                                                                           |
| `--selected-item-count-align-item`             | `center`                       | align-items                           |                                                                           |
| `--selected-item-count-bg-color`               | `#3a4550`                      | background-color                      | Background color of the selected count badge.                             |
| `--selected-item-count-text-color`             | `#ffffff`                      | color                                 | Text color of the selected count badge.                                   |
| `--selected-item-count-border-radius`          | `4px`                          | border-radius                         | Corner rounding of the selected count badge.                              |

## Type Reference

Custom types used by this component's props and events:

### ImgProperties

```typescript
type ImgProperties = { src: string; alt: string; fallback?: string | null };
```

## Internal Dependencies

This component uses the following library components internally:

- Img
- Button
- CheckListItem
