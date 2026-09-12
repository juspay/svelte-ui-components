# Checkbox

A customizable checkbox control with optional label text. Supports checked, unchecked, indeterminate, and disabled states. The `checked` prop is bindable and the `onclick` event fires with the new state after toggling. All visual aspects are controlled via CSS custom properties. `indeterminate` has no equivalent on `Toggle` — it only makes sense for select-some-of-many semantics — so reach for `Toggle` instead for a plain two-state on/off switch.

## Usage

```svelte
<script>
  import { Checkbox } from '@juspay/svelte-ui-components';
</script>

<Checkbox text="Accept terms" />
```

### In a form

`name` opts the box into native submission. Nothing else changes: the value follows the
visible state, and a mixed (`indeterminate`) box submits nothing, exactly as the platform's
own control does.

```svelte
<form onsubmit={handleSubmit}>
  <Checkbox text="Accept terms" name="terms" value="accepted" required />
  <button type="submit">Continue</button>
</form>
```

> Through `<sui-checkbox>` the control lives in a shadow root, so it cannot join a form in
> the host document. Form participation is a Svelte-import feature; the custom element
> still accepts the props, and reports state through `onclick`.

### Styling hooks

The box carries `data-state="checked | unchecked | indeterminate"` and, while disabled,
`data-disabled` — stable attribute hooks for styling that do not depend on class names.

## Props

| Prop          | Type                     | Required | Default     | Description                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text          | `string`                 | Yes      | -           | Label text displayed next to the checkbox.                                                                                                                                                                                                                                                              |
| checked       | `boolean`                | No       | `false`     | The current checked state of the checkbox. Bindable.                                                                                                                                                                                                                                                    |
| disabled      | `boolean`                | No       | `false`     | When true, the checkbox is non-interactive and visually dimmed.                                                                                                                                                                                                                                         |
| indeterminate | `boolean`                | No       | `false`     | Bindable. When true, displays an indeterminate (dash) state instead of a checkmark. Typically used for "select all" patterns where only some children are selected.                                                                                                                                     |
| testId        | `string`                 | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                                                                                                                                                    |
| classes       | `string`                 | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                  |
| ariaControls  | `string`                 | No       | `undefined` | Identifies the element(s) whose contents are controlled by this checkbox. Sets `aria-controls` on the checkbox element for accessibility.                                                                                                                                                               |
| ariaLabel     | `string`                 | No       | `undefined` | Accessible name for the checkbox. Set it whenever the visible `text` label isn't enough or sits outside this component (a table header cell, an icon-only row control) — since name-from-content can't reach it. Ignored when `text` is non-empty, so a visible label is never overridden (WCAG 2.5.3). |
| controlled    | `boolean`                | No       | `false`     | Controlled mode. A click reports the requested value through `onclick` and changes nothing locally, so the parent's `checked` / `indeterminate` stay the single source of truth. Use it wherever the parent may decline the change — a table selection driven from a consumer-owned set.                |
| attributes    | `Record<string, string>` | No       | `undefined` | Extra DOM attributes spread onto the checkbox element itself (the `role="checkbox"` box, not the wrapping label): an `id` for `aria-controls` to point at, or a consumer's own test attribute. Spread last, so a value here wins over the component's own `data-pw`.                                    |
| name          | `string`                 | No       | `undefined` | Submits the box under this name in the form it sits in. Omitted entirely when absent, unchecked, indeterminate or disabled — what a native checkbox does.                                                                                                                                               |
| value         | `string`                 | No       | `'on'`      | Value submitted while checked. `'on'` is the native default.                                                                                                                                                                                                                                            |
| required      | `boolean`                | No       | `false`     | Blocks submission while unchecked. Invalid validation moves focus to the visible box, since the control carrying `required` is deliberately not a tab stop.                                                                                                                                             |
| form          | `string`                 | No       | `undefined` | `id` of a form elsewhere in the same document, for a box rendered outside it.                                                                                                                                                                                                                           |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet           | Type      | Description                                                                                           |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| checkedIcon       | `Snippet` | Custom icon rendered inside the checkbox when in the checked state. Defaults to a built-in SVG.       |
| indeterminateIcon | `Snippet` | Custom icon rendered inside the checkbox when in the indeterminate state. Defaults to a built-in SVG. |

## Events

| Event   | Type                         | Description                                                                                                                                                      |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(checked: boolean) => void` | Fires after the checkbox state changes. Receives the new boolean checked value (true = checked, false = unchecked). Does not fire when the checkbox is disabled. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                              | Default                             | CSS Property       | Description                                                                                                                    |
| ------------------------------------- | ----------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `--checkbox-container-display`        | `inline-flex`                       | display            | Display mode of the checkbox container.                                                                                        |
| `--checkbox-container-align-items`    | `center`                            | align-items        | Vertical alignment of checkbox and label.                                                                                      |
| `--checkbox-container-gap`            | `8px`                               | gap                | Gap between the checkbox and label text.                                                                                       |
| `--checkbox-container-cursor`         | `pointer`                           | cursor             | Cursor when hovering the checkbox container.                                                                                   |
| `--checkbox-size`                     | `20px`                              | width, height      | Width and height of the checkbox box.                                                                                          |
| `--checkbox-border`                   | `2px solid #757575`                 | border             | Border of the checkbox box in its unchecked state.                                                                             |
| `--checkbox-border-radius`            | `var(--radius, 4px)`                | border-radius      | Corner rounding of the checkbox box. Falls back to the shared `--radius` token, then `4px`.                                    |
| `--checkbox-background`               | `transparent`                       | background-color   | Background color of the checkbox box when unchecked.                                                                           |
| `--checkbox-checked-background`       | `#2196f3`                           | background-color   | Background color of the checkbox box when checked.                                                                             |
| `--checkbox-checked-border`           | `2px solid #2196f3`                 | border             | Border of the checkbox box when checked.                                                                                       |
| `--checkbox-indeterminate-background` | `#2196f3`                           | background-color   | Background color of the checkbox box when in the indeterminate state.                                                          |
| `--checkbox-indeterminate-border`     | `2px solid #2196f3`                 | border             | Border of the checkbox box when in the indeterminate state.                                                                    |
| `--checkbox-disabled-opacity`         | `0.4`                               | opacity            | Opacity of the entire checkbox when disabled.                                                                                  |
| `--checkbox-disabled-cursor`          | `not-allowed`                       | cursor             | Cursor when hovering a disabled checkbox.                                                                                      |
| `--checkbox-hover-border-color`       | `#212121`                           | border-color       | Border color of the checkbox box on hover (unchecked state only).                                                              |
| `--checkbox-focus-ring`               | `0 0 0 3px rgba(33, 150, 243, 0.3)` | box-shadow         | Focus ring shown when the checkbox receives keyboard focus.                                                                    |
| `--checkbox-transition`               | `0.2s`                              | transition         | Transition duration for background and border changes.                                                                         |
| `--checkbox-checkmark-color`          | `white`                             | color (SVG stroke) | Color of the checkmark icon when checked.                                                                                      |
| `--checkbox-dash-color`               | `white`                             | color (SVG stroke) | Color of the dash icon when in the indeterminate state.                                                                        |
| `--checkbox-icon-size`                | `14px`                              | width, height      | Size of the checkmark/dash icon inside the checkbox.                                                                           |
| `--checkbox-label-font-size`          | `14px`                              | font-size          | Font size of the label text.                                                                                                   |
| `--checkbox-label-font-weight`        | `400`                               | font-weight        | Font weight of the label text.                                                                                                 |
| `--checkbox-label-color`              | `#212121`                           | color              | Color of the label text.                                                                                                       |
| `--radius`                            | `4px`                               | border-radius      | Shared corner-radius token read by several components. Only takes effect on Checkbox when `--checkbox-border-radius` is unset. |

## Web Component

Tag: `<sui-checkbox>`

```html
<sui-checkbox text="Accept terms" checked></sui-checkbox>
<sui-checkbox text="Parent decides" controlled></sui-checkbox>
```

`controlled` maps to the attribute of the same name; `attributes` is an object property, set from script.

### Slots

| Slot Name            | Maps to Snippet     | Description                                                          |
| -------------------- | ------------------- | -------------------------------------------------------------------- |
| `checked-icon`       | `checkedIcon`       | Custom icon for the checked state; defaults to the checkmark glyph.  |
| `indeterminate-icon` | `indeterminateIcon` | Custom icon for the indeterminate state; defaults to the dash glyph. |
