# Choicebox

A large-target selection card used for prominent single or multi-choice selections. Combines a title, optional description, optional icon snippet, and a radio/checkbox indicator into a clickable card. The `selected` prop is bindable and the `onclick` event fires with the new selection state. Supports `radio` and `checkbox` modes to control the indicator style.

## Usage

```svelte
<script>
  import { Choicebox } from '@juspay/svelte-ui-components';
</script>

<Choicebox selected={false} mode="radio">
  <span>Standard Delivery</span>
</Choicebox>
```

## Props

| Prop     | Type                    | Required | Default     | Description                                                                                                                                                            |
| -------- | ----------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selected | `boolean`               | No       | `false`     | The current selection state of the choicebox. Bindable.                                                                                                                |
| mode     | `'radio' \| 'checkbox'` | No       | `'radio'`   | Controls the indicator style. `radio` shows a filled circle when selected, `checkbox` shows a checkmark box.                                                           |
| disabled | `boolean`               | No       | `false`     | When true, the choicebox is non-interactive and visually dimmed.                                                                                                       |
| testId   | `string`                | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes  | `string`                | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

| Snippet  | Type      | Description                                                                                                                      |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| children | `Snippet` | Required. The content rendered inside the choicebox card. Use this to provide your own layout with title, description, icon etc. |

## Events

| Event   | Type                          | Description                                                                                                                                                           |
| ------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(selected: boolean) => void` | Fires after the selection state changes. Receives the new boolean selected value (true = selected, false = deselected). Does not fire when the choicebox is disabled. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default                                | CSS Property  | Description                                                  |
| ----------------------------------- | -------------------------------------- | ------------- | ------------------------------------------------------------ |
| `--choicebox-display`               | `flex`                                 | display       | Display mode of the choicebox container.                     |
| `--choicebox-align-items`           | `center`                               | align-items   | Vertical alignment of the choicebox contents.                |
| `--choicebox-padding`               | `16px`                                 | padding       | Inner padding of the choicebox card.                         |
| `--choicebox-border`                | `2px solid #d0d0d0`                    | border        | Border of the choicebox in its default unselected state.     |
| `--choicebox-border-radius`         | `12px`                                 | border-radius | Corner rounding of the choicebox card.                       |
| `--choicebox-background`            | `#ffffff`                              | background    | Background color of the choicebox in its default state.      |
| `--choicebox-gap`                   | `12px`                                 | gap           | Gap between child elements inside the choicebox.             |
| `--choicebox-cursor`                | `pointer`                              | cursor        | Cursor when hovering the choicebox.                          |
| `--choicebox-font-family`           | `inherit`                              | font-family   | Font family of the choicebox.                                |
| `--choicebox-transition`            | `border-color 0.2s, background 0.2s`   | transition    | Transition for state changes (hover, selected).              |
| `--choicebox-focus-ring`            | `0 0 0 3px rgba(33, 150, 243, 0.3)`    | box-shadow    | Focus ring shown when the choicebox receives keyboard focus. |
| `--choicebox-hover-border-color`    | `#9e9e9e`                              | border-color  | Border color of the choicebox on hover.                      |
| `--choicebox-hover-background`      | `var(--choicebox-background, #ffffff)` | background    | Background color of the choicebox on hover.                  |
| `--choicebox-selected-border-color` | `#2196f3`                              | border-color  | Border color when the choicebox is selected.                 |
| `--choicebox-selected-background`   | `var(--choicebox-background, #ffffff)` | background    | Background color when the choicebox is selected.             |
| `--choicebox-disabled-opacity`      | `0.4`                                  | opacity       | Opacity of the entire choicebox when disabled.               |
| `--choicebox-disabled-cursor`       | `not-allowed`                          | cursor        | Cursor when hovering a disabled choicebox.                   |

## Web Component

Tag: `<sui-choicebox>`

```html
<sui-choicebox mode="radio">
  <span>Option A</span>
</sui-choicebox>
```
