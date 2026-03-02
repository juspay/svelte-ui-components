# Choicebox

A large-target selection card used for prominent single or multi-choice selections. Combines a title, optional description, optional icon snippet, and a radio/checkbox indicator into a clickable card. The `selected` prop is bindable and the `onclick` event fires with the new selection state. Supports `radio` and `checkbox` modes to control the indicator style.

## Usage

```svelte
<script>
  import { Choicebox } from '@juspay/svelte-ui-components';
</script>

<Choicebox text="Standard Delivery" description="Arrives in 5-7 business days" />
```

## Props

| Prop        | Type                    | Required | Default     | Description                                                                                                                                                            |
| ----------- | ----------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text        | `string`                | Yes      | -           | Title text displayed as the primary label of the choicebox card.                                                                                                       |
| selected    | `boolean`               | No       | `false`     | The current selection state of the choicebox. Bindable.                                                                                                                |
| description | `string`                | No       | `''`        | Subtitle text displayed below the title for additional context.                                                                                                        |
| mode        | `'radio' \| 'checkbox'` | No       | `'radio'`   | Controls the indicator style. `radio` shows a filled circle when selected, `checkbox` shows a checkmark box.                                                           |
| disabled    | `boolean`               | No       | `false`     | When true, the choicebox is non-interactive and visually dimmed.                                                                                                       |
| testId      | `string`                | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes     | `string`                | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

| Snippet | Description                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| icon    | Optional content rendered in the icon area to the left of the title and description. Typically used for icons or small images. |

## Events

| Event   | Type                          | Description                                                                                                                                                           |
| ------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(selected: boolean) => void` | Fires after the selection state changes. Receives the new boolean selected value (true = selected, false = deselected). Does not fire when the choicebox is disabled. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                               | Default                                | CSS Property             | Description                                                  |
| -------------------------------------- | -------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `--choicebox-display`                  | `flex`                                 | display                  | Display mode of the choicebox container.                     |
| `--choicebox-align-items`              | `center`                               | align-items              | Vertical alignment of the choicebox contents.                |
| `--choicebox-padding`                  | `16px`                                 | padding                  | Inner padding of the choicebox card.                         |
| `--choicebox-border`                   | `2px solid #d0d0d0`                    | border                   | Border of the choicebox in its default unselected state.     |
| `--choicebox-border-radius`            | `12px`                                 | border-radius            | Corner rounding of the choicebox card.                       |
| `--choicebox-background`               | `#ffffff`                              | background               | Background color of the choicebox in its default state.      |
| `--choicebox-gap`                      | `12px`                                 | gap                      | Gap between the icon area, content, and indicator.           |
| `--choicebox-cursor`                   | `pointer`                              | cursor                   | Cursor when hovering the choicebox.                          |
| `--choicebox-min-height`               | `auto`                                 | min-height               | Minimum height of the choicebox card.                        |
| `--choicebox-transition`               | `border-color 0.2s, background 0.2s`   | transition               | Transition for state changes (hover, selected).              |
| `--choicebox-focus-ring`               | `0 0 0 3px rgba(33, 150, 243, 0.3)`    | box-shadow               | Focus ring shown when the choicebox receives keyboard focus. |
| `--choicebox-hover-border-color`       | `#9e9e9e`                              | border-color             | Border color of the choicebox on hover.                      |
| `--choicebox-hover-background`         | `var(--choicebox-background, #ffffff)` | background               | Background color of the choicebox on hover.                  |
| `--choicebox-selected-border-color`    | `#2196f3`                              | border-color             | Border color when the choicebox is selected.                 |
| `--choicebox-selected-background`      | `var(--choicebox-background, #ffffff)` | background               | Background color when the choicebox is selected.             |
| `--choicebox-disabled-opacity`         | `0.4`                                  | opacity                  | Opacity of the entire choicebox when disabled.               |
| `--choicebox-disabled-cursor`          | `not-allowed`                          | cursor                   | Cursor when hovering a disabled choicebox.                   |
| `--choicebox-icon-size`                | `24px`                                 | width, height            | Width and height of the icon area container.                 |
| `--choicebox-icon-margin`              | `0`                                    | margin                   | Margin around the icon area.                                 |
| `--choicebox-content-gap`              | `4px`                                  | gap                      | Gap between the title and description text.                  |
| `--choicebox-title-font-size`          | `16px`                                 | font-size                | Font size of the title text.                                 |
| `--choicebox-title-font-weight`        | `600`                                  | font-weight              | Font weight of the title text.                               |
| `--choicebox-title-color`              | `#212121`                              | color                    | Color of the title text.                                     |
| `--choicebox-title-font-family`        | `inherit`                              | font-family              | Font family of the title text.                               |
| `--choicebox-description-font-size`    | `14px`                                 | font-size                | Font size of the description text.                           |
| `--choicebox-description-font-weight`  | `400`                                  | font-weight              | Font weight of the description text.                         |
| `--choicebox-description-color`        | `#757575`                              | color                    | Color of the description text.                               |
| `--choicebox-indicator-size`           | `20px`                                 | width, height            | Size of the radio circle or checkbox box indicator.          |
| `--choicebox-indicator-border`         | `2px solid #757575`                    | border                   | Border of the indicator in its unselected state.             |
| `--choicebox-indicator-selected-color` | `#2196f3`                              | background, border-color | Fill and border color of the indicator when selected.        |
| `--choicebox-radio-inner-size`         | `10px`                                 | width, height            | Size of the inner filled circle in radio mode when selected. |
| `--choicebox-checkbox-border-radius`   | `3px`                                  | border-radius            | Corner rounding of the checkbox indicator.                   |
| `--choicebox-checkbox-icon-size`       | `14px`                                 | width, height            | Size of the checkmark icon inside the checkbox indicator.    |
| `--choicebox-checkmark-color`          | `white`                                | color (SVG stroke)       | Color of the checkmark icon when selected in checkbox mode.  |
