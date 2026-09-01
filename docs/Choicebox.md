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

| Prop          | Type                    | Required | Default     | Description                                                                                                                                                            |
| ------------- | ----------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selected      | `boolean`               | No       | `false`     | The current selection state of the choicebox. Bindable.                                                                                                                |
| mode          | `'radio' \| 'checkbox'` | No       | `'radio'`   | Controls the indicator style. `radio` shows a filled circle when selected, `checkbox` shows a checkmark box.                                                           |
| disabled      | `boolean`               | No       | `false`     | When true, the choicebox is non-interactive and visually dimmed.                                                                                                       |
| showIndicator | `boolean`               | No       | `true`      | Whether to render the radio dot / checkbox tick. Set false when the card supplies its own selected affordance.                                                         |
| testId        | `string`                | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes       | `string`                | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

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

### Props (HTML Attributes)

| Attribute        | Maps to Prop    | Type    | Description                                                                                                                                              |
| ---------------- | --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selected`       | `selected`      | Boolean | Reflects the selection state.                                                                                                                            |
| `mode`           | `mode`          | String  | `radio` or `checkbox` indicator style.                                                                                                                   |
| `disabled`       | `disabled`      | Boolean | Disables interaction and dims the card.                                                                                                                  |
| `show-indicator` | `showIndicator` | Boolean | Whether to render the radio dot / checkbox tick (default `true`). Boolean attributes are presence-based, so to hide the indicator set the `showIndicator` property to `false` from JS. |
| `test-id`        | `testId`        | String  | Sets `data-pw` on the card for Playwright selectors.                                                                                                     |
| `classes`        | `classes`       | String  | CSS classes applied to the card element.                                                                                                                 |

`onclick` is a function prop — set it as a property from JS, not as an attribute.

### Indicator

The indicator is decorative — the card itself carries `role` and `aria-checked`, so the mark is
`aria-hidden`. It is placed last and pushed to the trailing edge; reorder it with
`--choicebox-indicator-order`.

| Variable                                    | Default                              | Description                                                       |
| ------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| `--choicebox-indicator-size`                | `20px`                               | Width and height of the indicator.                                |
| `--choicebox-indicator-border`              | `2px solid #757575`                  | Border when unselected.                                           |
| `--choicebox-indicator-background`          | `transparent`                        | Fill when unselected.                                             |
| `--choicebox-indicator-selected-border`     | `2px solid #2196f3`                  | Border when selected.                                             |
| `--choicebox-indicator-selected-background` | `#2196f3`                            | Fill when selected.                                               |
| `--choicebox-indicator-border-radius`       | `var(--radius, 4px)`                 | Corner rounding in `checkbox` mode.                               |
| `--choicebox-indicator-dot-inset`           | `4px`                                | Ring thickness that forms the dot in `radio` mode.                |
| `--choicebox-indicator-icon-size`           | `14px`                               | Size of the checkmark in `checkbox` mode.                         |
| `--choicebox-indicator-icon-color`          | `#ffffff`                            | Colour of the checkmark.                                          |
| `--choicebox-indicator-order`               | `1`                                  | Flex order of the indicator within the card.                      |
| `--choicebox-indicator-margin-inline-start` | `auto`                               | Leading margin; `auto` pins it to the trailing edge.              |
| `--choicebox-indicator-transition`          | `background 0.2s, border-color 0.2s` | Transition on the indicator's fill/border when selection changes. |
