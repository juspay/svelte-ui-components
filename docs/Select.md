# Select

A dropdown selector that supports single and multi-select modes with optional search filtering. In single-select mode, clicking an item selects it and closes the dropdown. In multi-select mode, clicking items toggles them on or off and the dropdown stays open. Selected items in multi-select are shown as dismissible pills. The `items` prop accepts either `SelectItem[]` objects or a plain `string[]` (each string is used as both the id and the label). Custom snippets let you replace the per-option checkbox indicator and add arbitrary content pinned to the bottom of the dropdown. Supports keyboard navigation (Arrow keys, Enter, Escape, Backspace) and closes automatically when clicking outside. The `value` prop is bindable.

## Usage

```svelte
<script>
  import { Select } from '@juspay/svelte-ui-components';

  const items = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' }
  ];
</script>

<Select {items} placeholder="Pick a fruit" onchange={(val) => console.log(val)} />
```

### String Array Shorthand

Pass a plain `string[]` — each string becomes both the `id` and the `label`:

```svelte
<Select items={['Active', 'Inactive', 'Pending']} placeholder="Select status" />
```

### Multi-Select with Search

```svelte
<Select {items} multiple searchable placeholder="Search fruits..." bind:value={selectedIds} />
```

### With bottomContent Snippet

Pin arbitrary content (e.g. a "Manage…" link) to the bottom of the dropdown:

```svelte
<Select {items} placeholder="Choose">
  {#snippet bottomContent()}
    <a href="/manage">+ Manage options</a>
  {/snippet}
</Select>
```

### With Custom optionIndicator Snippet (Multi-Select)

Replace the default ☐/☑ glyphs with a custom indicator:

```svelte
<Select {items} multiple placeholder="Pick items">
  {#snippet optionIndicator({ checked })}
    <span>{checked ? '✔' : '○'}</span>
  {/snippet}
</Select>
```

## Props

| Prop        | Type                       | Required | Default     | Description                                                                                                                                                                                           |
| ----------- | -------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items       | `SelectItem[] \| string[]` | Yes      | -           | Array of selectable options. Pass `SelectItem[]` objects (each with `id` and `label`) or a plain `string[]` where each string becomes both the id and the label.                                      |
| value       | `string[]`                 | No       | `[]`        | Bindable. Array of selected item IDs. In single-select mode, contains at most one element.                                                                                                            |
| open        | `boolean`                  | No       | `false`     | Bindable. Controls whether the dropdown is open; writes back on open/close so a parent can `bind:open` to observe or drive it. Unbound, the component manages its own state.                          |
| multiple    | `boolean`                  | No       | `false`     | Enables multi-select mode. Items are toggled on/off and displayed as dismissible pills in the trigger area.                                                                                           |
| searchable  | `boolean`                  | No       | `false`     | Enables a text input in the trigger area for filtering items by label. Works in both single and multi-select modes.                                                                                   |
| placeholder | `string`                   | No       | `''`        | Text shown when no item is selected (or in the search input when empty).                                                                                                                              |
| disabled    | `boolean`                  | No       | `false`     | When true, the select is non-interactive, has reduced opacity, and pointer events are disabled.                                                                                                       |
| testId      | `string`                   | No       | -           | Value for the `data-pw` attribute on the container element, used for end-to-end testing selectors.                                                                                                    |
| classes     | `string`                   | No       | -           | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                |
| hierarchy   | `SelectHierarchy`          | No       | `'default'` | Visual hierarchy of the trigger. `'ghost'` renders a transparent, borderless trigger — useful when the Select is embedded in a toolbar or header where a full bordered input would be visually heavy. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet         | Type                              | Description                                                                                                                                        |
| --------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| bottomContent   | `Snippet`                         | Arbitrary content rendered at the bottom of the open dropdown, separated by a border. Use for "Manage options" links or bulk actions.              |
| optionIndicator | `Snippet<[{ checked: boolean }]>` | Custom indicator rendered before each option label in multi-select mode. Receives `{ checked }` and replaces the default ☐/☑ glyphs when provided. |

## Events

| Event    | Type                        | Description                                                                                                                       |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(value: string[]) => void` | Fires when the selection changes. Receives the full array of selected item IDs. In single-select mode, the array has one element. |
| onopen   | `() => void`                | Fires when the dropdown opens.                                                                                                    |
| onclose  | `() => void`                | Fires when the dropdown closes.                                                                                                   |

## CSS Variables

Override these custom properties to theme the component.

### Root

| Variable               | Default   | CSS Property | Description                           |
| ---------------------- | --------- | ------------ | ------------------------------------- |
| `--select-width`       | `100%`    | width        | Width of the select container.        |
| `--select-font-family` | `inherit` | font-family  | Font family for the select component. |
| `--select-font-size`   | `14px`    | font-size    | Font size for the select component.   |
| `--select-color`       | `#333333` | color        | Text color of the select component.   |

### Disabled State

| Variable                    | Default       | CSS Property | Description                               |
| --------------------------- | ------------- | ------------ | ----------------------------------------- |
| `--select-disabled-opacity` | `0.5`         | opacity      | Opacity when the select is disabled.      |
| `--select-disabled-cursor`  | `not-allowed` | cursor       | Cursor shown when the select is disabled. |

### Trigger

| Variable                              | Default                                | CSS Property  | Description                                                 |
| ------------------------------------- | -------------------------------------- | ------------- | ----------------------------------------------------------- |
| `--select-trigger-gap`                | `4px`                                  | gap           | Gap between items (pills, input, value) inside the trigger. |
| `--select-trigger-min-height`         | `40px`                                 | min-height    | Minimum height of the trigger area.                         |
| `--select-trigger-padding`            | `8px 12px`                             | padding       | Inner padding of the trigger area.                          |
| `--select-trigger-background`         | `#ffffff`                              | background    | Background color of the trigger area.                       |
| `--select-trigger-border`             | `1px solid #cccccc`                    | border        | Border of the trigger area.                                 |
| `--select-trigger-border-radius`      | `6px`                                  | border-radius | Corner rounding of the trigger area.                        |
| `--select-trigger-transition`         | `border-color 0.15s, box-shadow 0.15s` | transition    | Transition for trigger hover/focus effects.                 |
| `--select-trigger-hover-border-color` | `#999999`                              | border-color  | Border color of the trigger on hover.                       |
| `--select-trigger-focus-border-color` | `#2563eb`                              | border-color  | Border color of the trigger when focused or open.           |
| `--select-trigger-focus-shadow`       | `0 0 0 2px rgba(37, 99, 235, 0.2)`     | box-shadow    | Box shadow of the trigger when focused or open.             |

### Placeholder

| Variable                     | Default   | CSS Property | Description                                                 |
| ---------------------------- | --------- | ------------ | ----------------------------------------------------------- |
| `--select-placeholder-color` | `#999999` | color        | Text color of the placeholder and search input placeholder. |

### Arrow

| Variable               | Default   | CSS Property  | Description                               |
| ---------------------- | --------- | ------------- | ----------------------------------------- |
| `--select-arrow-size`  | `16px`    | width, height | Size of the dropdown chevron arrow icon.  |
| `--select-arrow-color` | `#666666` | color         | Color of the dropdown chevron arrow icon. |

### Dropdown

| Variable                          | Default                         | CSS Property  | Description                                                                                                           |
| --------------------------------- | ------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--select-dropdown-gap`           | `4px`                           | margin-top    | Gap between the trigger and the dropdown panel.                                                                       |
| `--select-dropdown-background`    | `#ffffff`                       | background    | Background color of the dropdown panel.                                                                               |
| `--select-dropdown-border`        | `1px solid #cccccc`             | border        | Border of the dropdown panel.                                                                                         |
| `--select-dropdown-border-radius` | `6px`                           | border-radius | Corner rounding of the dropdown panel.                                                                                |
| `--select-dropdown-shadow`        | `0 4px 12px rgba(0, 0, 0, 0.1)` | box-shadow    | Box shadow of the dropdown panel.                                                                                     |
| `--select-dropdown-max-height`    | `200px`                         | max-height    | Maximum height of the dropdown (scrolls beyond).                                                                      |
| `--select-dropdown-z-index`       | `10`                            | z-index       | Stack order of the dropdown panel.                                                                                    |
| `--select-dropdown-left`          | `0`                             | left          | Left edge of the dropdown relative to the trigger. Set to `auto` to anchor by the right edge instead.                 |
| `--select-dropdown-right`         | `0`                             | right         | Right edge of the dropdown relative to the trigger. Set to `auto` to let the panel grow rightward from the left edge. |
| `--select-dropdown-min-width`     | `auto`                          | min-width     | Minimum width of the dropdown panel. Set to `100%` to keep it at least as wide as the trigger.                        |
| `--select-dropdown-max-width`     | `none`                          | max-width     | Maximum width of the dropdown panel (e.g. `70vw` to cap growth on wide content).                                      |
| `--select-dropdown-width`         | `auto`                          | width         | Width of the dropdown panel. Set to `max-content` to size to the longest option instead of the trigger width.         |

### Options

| Variable                                    | Default                                        | CSS Property | Description                                                               |
| ------------------------------------------- | ---------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| `--select-option-padding`                   | `8px 12px`                                     | padding      | Padding inside each dropdown option.                                      |
| `--select-option-color`                     | `#333333`                                      | color        | Text color of dropdown options.                                           |
| `--select-option-font-size`                 | `inherit`                                      | font-size    | Font size of dropdown options.                                            |
| `--select-option-gap`                       | `0`                                            | gap          | Gap between the option indicator and the label text in multi-select mode. |
| `--select-option-hover-background`          | `#f0f0f0`                                      | background   | Background of options on hover or keyboard highlight.                     |
| `--select-option-hover-color`               | inherits `--select-option-color`               | color        | Text color of options on hover or keyboard highlight.                     |
| `--select-option-selected-background`       | `#e8f0fe`                                      | background   | Background of selected options.                                           |
| `--select-option-selected-color`            | inherits `--select-option-color`               | color        | Text color of selected options.                                           |
| `--select-option-selected-hover-background` | inherits `--select-option-selected-background` | background   | Background of selected options on hover.                                  |
| `--select-option-indicator-color`           | `currentColor`                                 | color        | Color of the default ☐/☑ indicator shown per option in multi-select mode. |

### Bottom Content

| Variable                          | Default    | CSS Property | Description                                                                                                                                                 |
| --------------------------------- | ---------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--select-bottom-content-border`  | `none`     | border-top   | Separator line between the option list and the bottom content. Set to `1px solid #eeeeee` (or any color) in your own CSS when a visible divider is desired. |
| `--select-bottom-content-padding` | `8px 12px` | padding      | Inner padding of the bottom content area.                                                                                                                   |

### Ghost Trigger

These variables apply when `hierarchy="ghost"`. The trigger starts fully transparent and reveals a subtle background on hover and when open.

| Variable                                    | Default            | CSS Property | Description                                                  |
| ------------------------------------------- | ------------------ | ------------ | ------------------------------------------------------------ |
| `--select-ghost-trigger-background`         | `transparent`      | background   | Background of the ghost trigger at rest.                     |
| `--select-ghost-trigger-border-color`       | `transparent`      | border-color | Border color of the ghost trigger at rest.                   |
| `--select-ghost-trigger-hover-background`   | `rgba(0,0,0,0.04)` | background   | Background of the ghost trigger on hover.                    |
| `--select-ghost-trigger-hover-border-color` | `transparent`      | border-color | Border color of the ghost trigger on hover.                  |
| `--select-ghost-trigger-open-background`    | `rgba(0,0,0,0.06)` | background   | Background of the ghost trigger when the dropdown is open.   |
| `--select-ghost-trigger-open-border-color`  | `transparent`      | border-color | Border color of the ghost trigger when the dropdown is open. |

### Empty State

| Variable                    | Default    | CSS Property | Description                                      |
| --------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `--select-empty-padding`    | `8px 12px` | padding      | Padding of the "No results" empty state message. |
| `--select-empty-color`      | `#999999`  | color        | Text color of the empty state message.           |
| `--select-empty-font-style` | `italic`   | font-style   | Font style of the empty state message.           |
| `--select-empty-font-size`  | `inherit`  | font-size    | Font size of the empty state message.            |

### Pills (Multi-Select)

These variables style the Pill components shown for selected items in multi-select mode. They are forwarded to the internal Pill component.

| Variable                      | Default   | CSS Property  | Description                              |
| ----------------------------- | --------- | ------------- | ---------------------------------------- |
| `--select-pill-background`    | `#e0e0e0` | background    | Background color of selected item pills. |
| `--select-pill-color`         | `#333333` | color         | Text color of selected item pills.       |
| `--select-pill-border-radius` | `999px`   | border-radius | Corner rounding of selected item pills.  |
| `--select-pill-padding`       | `2px 8px` | padding       | Padding inside selected item pills.      |
| `--select-pill-font-size`     | `13px`    | font-size     | Font size of selected item pills.        |

## Type Reference

Custom types used by this component's props and events:

### SelectItem

```typescript
type SelectItem = {
  id: string;
  label: string;
};
```

## Internal Dependencies

This component uses the following library components internally:

- Pill (for displaying selected items in multi-select mode)

## Web Component

Tag: `<sui-select>`

```html
<sui-select placeholder="Pick a fruit"></sui-select>

<script>
  const el = document.querySelector('sui-select');
  el.items = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' }
  ];
  el.addEventListener('change', (e) => console.log(e.detail));
</script>
```

### With Slots

```html
<sui-select placeholder="Pick items">
  <!-- Bottom content -->
  <a slot="bottom-content" href="/manage">+ Manage options</a>
</sui-select>
```

### Slots

| Slot Name        | Maps to Snippet | Description                                                  |
| ---------------- | --------------- | ------------------------------------------------------------ |
| `bottom-content` | `bottomContent` | Arbitrary content pinned to the bottom of the open dropdown. |

> **Note:** The `items` and `value` props are arrays — set them via JavaScript properties, not HTML attributes.

> **Svelte-only:** The `optionIndicator` snippet is not available in Web Component mode. The `option-indicator` slot was removed because Web Component `<slot>` elements do not forward Svelte snippet parameters as HTML attributes, causing the `checked` state to be silently dropped. Use the Svelte component directly when a custom option indicator is needed.
