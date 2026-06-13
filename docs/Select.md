# Select

A dropdown selector that supports single and multi-select modes with optional search filtering. In single-select mode, clicking an item selects it and closes the dropdown. In multi-select mode, clicking items toggles them on or off and the dropdown stays open. Selected items in multi-select are shown as dismissible pills. Multi-select mode includes a "Select All / Deselect All" row (visibility controlled via `--select-select-all-display`). Supports keyboard navigation (Arrow keys, Enter, Escape, Backspace) and closes automatically when clicking outside. The `value` and `open` props are bindable.

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

### Multi-Select with Search

```svelte
<Select {items} multiple searchable placeholder="Search fruits..." bind:value={selectedIds} />
```

## Props

| Prop         | Type           | Required | Default | Description                                                                                                                                                            |
| ------------ | -------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items        | `SelectItem[]` | Yes      | -       | Array of selectable options. Each item has an `id` and a `label`.                                                                                                      |
| value        | `string[]`     | No       | `[]`    | Bindable. Array of selected item IDs. In single-select mode, contains at most one element.                                                                             |
| multiple     | `boolean`      | No       | `false` | Enables multi-select mode. Items are toggled on/off and displayed as dismissible pills in the trigger area.                                                            |
| searchable   | `boolean`      | No       | `false` | Enables a text input in the trigger area for filtering items by label. Works in both single and multi-select modes.                                                    |
| placeholder  | `string`       | No       | `''`    | Text shown when no item is selected (or in the search input when empty).                                                                                               |
| disabled     | `boolean`      | No       | `false` | When true, the select is non-interactive, has reduced opacity, and pointer events are disabled.                                                                        |
| testId       | `string`       | No       | -       | Value for the `data-pw` attribute on the container element, used for end-to-end testing selectors.                                                                     |
| classes      | `string`       | No       | -       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| open         | `boolean`      | No       | `false` | Bindable. Controls whether the dropdown is open. The component writes back on open/close so parents can use `bind:open` to observe or drive the open state. See the Controlled open state section below. |

## Events

| Event    | Type                        | Description                                                                                                                       |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(value: string[]) => void` | Fires when the selection changes. Receives the full array of selected item IDs. In single-select mode, the array has one element. |

## Snippets

| Snippet        | Parameters | Description                                                                                                                                              |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bottomContent` | (none)     | Optional footer rendered inside the dropdown panel, below the options list. Use it for action links or buttons ("Add zone", "Manage rates", etc.). Styled via `--select-bottom-content-*` CSS vars. |

### bottomContent usage

```svelte
<Select {items} multiple bind:value={selected} placeholder="Select zones">
  {#snippet bottomContent()}
    <button onclick={handleAddZone}>+ Add shipping zone</button>
  {/snippet}
</Select>
```

## Controlled open state

Use `bind:open` to let a parent drive when the dropdown is shown. This is useful for accordion-style panels where a separate toggle controls visibility.

```svelte
<script>
  let isOpen = $state(false);
  let selected = $state([]);
</script>

<button onclick={() => (isOpen = !isOpen)}>
  {isOpen ? 'Close' : 'Open'} picker
</button>

<Select {items} bind:open={isOpen} bind:value={selected} placeholder="Controlled externally" />
```

When `open` is not bound, the component manages its own state — existing behaviour is unchanged.

## Hiding the "Select All" row

In multiple mode a "Select All / Deselect All" row is rendered by default. To hide it, set `--select-select-all-display: none` via the `classes` prop or a wrapper CSS rule — no library prop is needed.

```svelte
<!-- via the classes prop -->
<Select {items} multiple classes="no-select-all" placeholder="No Select All" />

<style>
  :global(.no-select-all) {
    --select-select-all-display: none;
  }
</style>
```

```svelte
<!-- via a wrapper element -->
<div class="my-select-wrapper">
  <Select {items} multiple placeholder="No Select All" />
</div>

<style>
  .my-select-wrapper {
    --select-select-all-display: none;
  }
</style>
```

## Deferred apply (consumer recipe)

To fire `onchange` only when the user explicitly confirms a selection (rather than on every toggle), maintain a staged value in the consuming component and swap it in on confirm.

```svelte
<script>
  import { Select, Button } from '@juspay/svelte-ui-components';

  let committed = $state([]);
  let staged = $state([]);
  let isOpen = $state(false);

  function handleApply() {
    committed = [...staged];
    isOpen = false;
  }
</script>

<Select
  {items}
  multiple
  bind:open={isOpen}
  value={staged}
  onchange={(val) => (staged = val)}
  placeholder="Pick items (apply to confirm)"
>
  {#snippet bottomContent()}
    <Button text="Apply" onclick={handleApply} />
  {/snippet}
</Select>
```

This approach uses `bottomContent` for the Apply button and `bind:open` to close the dropdown after confirm. No library modifications are needed.

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

| Variable                          | Default                         | CSS Property  | Description                                      |
| --------------------------------- | ------------------------------- | ------------- | ------------------------------------------------ |
| `--select-dropdown-gap`           | `4px`                           | margin-top    | Gap between the trigger and the dropdown panel.  |
| `--select-dropdown-background`    | `#ffffff`                       | background    | Background color of the dropdown panel.          |
| `--select-dropdown-border`        | `1px solid #cccccc`             | border        | Border of the dropdown panel.                    |
| `--select-dropdown-border-radius` | `6px`                           | border-radius | Corner rounding of the dropdown panel.           |
| `--select-dropdown-shadow`        | `0 4px 12px rgba(0, 0, 0, 0.1)` | box-shadow    | Box shadow of the dropdown panel.                |
| `--select-dropdown-max-height`    | `200px`                         | max-height    | Maximum height of the dropdown (scrolls beyond). |
| `--select-dropdown-z-index`       | `10`                            | z-index       | Stack order of the dropdown panel.               |

### Options

| Variable                                    | Default                                        | CSS Property | Description                                           |
| ------------------------------------------- | ---------------------------------------------- | ------------ | ----------------------------------------------------- |
| `--select-option-padding`                   | `8px 12px`                                     | padding      | Padding inside each dropdown option.                  |
| `--select-option-color`                     | `#333333`                                      | color        | Text color of dropdown options.                       |
| `--select-option-font-size`                 | `inherit`                                      | font-size    | Font size of dropdown options.                        |
| `--select-option-hover-background`          | `#f0f0f0`                                      | background   | Background of options on hover or keyboard highlight. |
| `--select-option-hover-color`               | inherits `--select-option-color`               | color        | Text color of options on hover or keyboard highlight. |
| `--select-option-selected-background`       | `#e8f0fe`                                      | background   | Background of selected options.                       |
| `--select-option-selected-color`            | inherits `--select-option-color`               | color        | Text color of selected options.                       |
| `--select-option-selected-hover-background` | inherits `--select-option-selected-background` | background   | Background of selected options on hover.              |

### Select All Row (Multi-Select)

| Variable                            | Default              | CSS Property  | Description                                                                                   |
| ----------------------------------- | -------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `--select-select-all-display`       | `flex`               | display       | Set to `none` to hide the "Select All" row without a library prop.                           |
| `--select-select-all-border-bottom` | `1px solid #eeeeee`  | border-bottom | Separator line below the "Select All" row.                                                    |
| `--select-select-all-font-weight`   | `inherit`            | font-weight   | Font weight of the "Select All" label.                                                        |
| `--select-select-all-color`         | `inherit`            | color         | Text color of the "Select All" label. Inherits the component's text color by default.        |

### Empty State

| Variable                    | Default    | CSS Property | Description                                      |
| --------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `--select-empty-padding`    | `8px 12px` | padding      | Padding of the "No results" empty state message. |
| `--select-empty-color`      | `#999999`  | color        | Text color of the empty state message.           |
| `--select-empty-font-style` | `italic`   | font-style   | Font style of the empty state message.           |
| `--select-empty-font-size`  | `inherit`  | font-size    | Font size of the empty state message.            |

### Bottom Content Footer

| Variable                           | Default              | CSS Property | Description                                                     |
| ---------------------------------- | -------------------- | ------------ | --------------------------------------------------------------- |
| `--select-bottom-content-padding`  | `8px 12px`           | padding      | Padding inside the bottom content footer area.                  |
| `--select-bottom-content-border-top` | `1px solid #eeeeee` | border-top   | Top border separating the footer from the options list.         |

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

> **Note:** The `items` and `value` props are arrays — set them via JavaScript properties, not HTML attributes.
