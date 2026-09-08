# Select

A dropdown selector that supports single and multi-select modes with optional search filtering. In single-select mode, clicking an item selects it and closes the dropdown. In multi-select mode, clicking items toggles them on or off and the dropdown stays open. Selected items in multi-select are shown as dismissible pills. The `items` prop accepts either `SelectItem[]` objects or a plain `string[]` (each string is used as both the id and the label). Custom snippets let you replace the per-option checkbox indicator and add arbitrary content pinned to the bottom of the dropdown. Supports keyboard navigation (Arrow keys, Enter, Escape, Backspace) and closes automatically when clicking outside. The `value` prop is bindable. Browse-a-list is the primary interaction — a closed dropdown the user opens and clicks through, with optional filtering as one feature among several (as opposed to `Combobox`, which is type-to-search first: a text input the user types into, with the dropdown filtering live as they go).

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

Replace the default checkbox indicator with a custom one:

```svelte
<Select {items} multiple placeholder="Pick items">
  {#snippet optionIndicator({ checked })}
    <span>{checked ? '✔' : '○'}</span>
  {/snippet}
</Select>
```

### With triggerSummary (Compact Multi-Select Trigger)

Replace the default pill-per-value layout with a compact summary label in multi-select mode:

```svelte
<Select {items} multiple placeholder="Select columns">
  {#snippet triggerSummary({ value, items })}
    <span>
      {value.length === 0
        ? 'None'
        : value.length === items.length
          ? 'All'
          : `${value.length} selected`}
    </span>
  {/snippet}
</Select>
```

### With Leading Icon

Pass an image URL (or inline data URI) via `leftIcon` to render a leading icon at the left of the trigger. The icon size defaults to 16×16 px and can be customised with the `--select-left-icon-size` CSS variable.

An SVG source is **inlined into the component's DOM**, so an icon drawn with `currentColor` inherits the trigger's text colour and follows the theme. A plain `<img>` renders its source as an isolated document, where `currentColor` resolves against that document's own root and paints UA black instead. Non-SVG sources are unaffected and still render as `<img>`. The same applies to a per-option `icon`.

```svelte
<Select {items} placeholder="Select a city" leftIcon="/icons/globe.svg" />
```

## Props

| Prop             | Type                       | Required | Default        | Description                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | -------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items            | `SelectItem[] \| string[]` | Yes      | -              | Array of selectable options. Pass `SelectItem[]` objects (each with `id` and `label`) or a plain `string[]` where each string becomes both the id and the label.                                                                                                                                                                                                                                                                 |
| value            | `string[]`                 | No       | `[]`           | Bindable. Array of selected item IDs. In single-select mode, contains at most one element.                                                                                                                                                                                                                                                                                                                                       |
| open             | `boolean`                  | No       | `false`        | Bindable. Controls whether the dropdown is open; writes back on open/close so a parent can `bind:open` to observe or drive it. Unbound, the component manages its own state.                                                                                                                                                                                                                                                     |
| multiple         | `boolean`                  | No       | `false`        | Enables multi-select mode. Items are toggled on/off and displayed as dismissible pills in the trigger area.                                                                                                                                                                                                                                                                                                                      |
| searchable       | `boolean`                  | No       | `false`        | Enables a text input for filtering items by label. Works in both single and multi-select modes. See `searchPosition` for where it renders.                                                                                                                                                                                                                                                                                       |
| searchPosition   | `'trigger' \| 'menu'`      | No       | `'trigger'`    | Where the `searchable` input renders. `'trigger'` keeps today's behaviour (input replaces the trigger label, focused on open); `'menu'` puts it inside the open dropdown, reached by Tab after opening — the DS keyboard contract. No effect unless `searchable` is set.                                                                                                                                                         |
| placeholder      | `string`                   | No       | `''`           | Text shown when no item is selected (or in the search input when empty).                                                                                                                                                                                                                                                                                                                                                         |
| disabled         | `boolean`                  | No       | `false`        | When true, the select is non-interactive, has reduced opacity, and pointer events are disabled.                                                                                                                                                                                                                                                                                                                                  |
| error            | `boolean`                  | No       | `false`        | Renders the error treatment: a red trigger border that outranks the hover and focus colours, plus `aria-invalid` on the combobox. Independent of any validation you run — this is the server- or form-driven flag.                                                                                                                                                                                                               |
| errorMessage     | `string`                   | No       | `-`            | Message shown below the trigger while `error` is true, in a `role="alert"` region wired to the combobox via `aria-describedby`. Ignored when `error` is false.                                                                                                                                                                                                                                                                   |
| clearable        | `boolean`                  | No       | `false`        | Adds a clear (×) button to the trigger whenever there is a selection. It resets the value **without opening the menu**. Never rendered when nothing is selected, or while `disabled`.                                                                                                                                                                                                                                            |
| testId           | `string`                   | No       | -              | Value for the `data-pw` attribute on the container element, and the fallback per-option prefix when neither `itemTestId` nor `item.testId` is set (emits `{testId}-{item.id}` per option).                                                                                                                                                                                                                                       |
| itemTestId       | `string`                   | No       | -              | Fallback per-option `data-pw` prefix. Each option emits `data-pw="{itemTestId}-{item.id}"` unless the option's own `item.testId` is set. Takes precedence over the `testId`-derived fallback.                                                                                                                                                                                                                                    |
| classes          | `string`                   | No       | -              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                                                                                                           |
| dropdownAlign    | `'left' \| 'right'`        | No       | `'left'`       | Horizontal anchor of the dropdown panel. `'left'` anchors to the trigger's left edge; `'right'` anchors to the right edge so a wider-than-trigger panel hangs leftward without overflowing.                                                                                                                                                                                                                                      |
| hierarchy        | `SelectHierarchy`          | No       | `'default'`    | Visual hierarchy of the trigger. `'ghost'` renders a transparent, borderless trigger — useful when the Select is embedded in a toolbar or header where a full bordered input would be visually heavy.                                                                                                                                                                                                                            |
| leftIcon         | `string`                   | No       | -              | Image src (URL or data URI) for an icon rendered at the left of the trigger. Size is controlled by `--select-left-icon-size` (default 16px). An SVG source is inlined, so `currentColor` inherits the trigger's text colour.                                                                                                                                                                                                     |
| leftIconTestId   | `string`                   | No       | -              | `data-pw` test id forwarded to the leading icon element for end-to-end testing selectors.                                                                                                                                                                                                                                                                                                                                        |
| showSelectedTick | `boolean`                  | No       | `false`        | Single-select only. When `true`, the selected option shows a checkmark at its right edge. No effect in `multiple` mode. Themeable via `--select-option-tick-size` / `--select-option-tick-color`.                                                                                                                                                                                                                                |
| showSelectAll    | `boolean`                  | No       | `false`        | Multiple mode only. Renders a "Select all" row at the top of the dropdown that toggles every currently-listed (search-filtered) option. Shows an indeterminate indicator when only some listed options are selected.                                                                                                                                                                                                             |
| selectAllLabel   | `string`                   | No       | `'Select all'` | Label text for the `showSelectAll` row.                                                                                                                                                                                                                                                                                                                                                                                          |
| usePortal        | `boolean`                  | No       | `false`        | When `true`, the dropdown panel is portaled to `document.body` and positioned `fixed` relative to the trigger, so an ancestor with `overflow: hidden` or a scroll container (e.g. a table cell) cannot clip it. Placement follows the trigger on scroll/resize and flips above it when there's no room below. Portaled panels default to `z-index: 1000`; raise `--select-dropdown-z-index` to sit above an even higher overlay. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet         | Type                                                       | Description                                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bottomContent   | `Snippet`                                                  | Arbitrary content rendered at the bottom of the open dropdown, separated by a border. Use for "Manage options" links or bulk actions.                                                                                                                                                                                                  |
| optionIndicator | `Snippet<[{ checked: boolean; indeterminate?: boolean }]>` | Custom indicator rendered before each option label in multi-select mode. Receives `{ checked, indeterminate }` and replaces the default checkbox-box indicator when provided. `indeterminate` is `true` only for the `showSelectAll` row when some but not all listed options are selected; always `false` for individual option rows. |
| triggerSummary  | `Snippet<[{ value: string[]; items: SelectItem[] }]>`      | Compact trigger summary for multi-select mode. Receives `{ value, items }` so the consumer can render e.g. "All" or "3 selected" instead of one Pill per value. When omitted, the default Pill-per-value layout is used.                                                                                                               |

## Events

| Event    | Type                        | Description                                                                                                                                                                                                      |
| -------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onchange | `(value: string[]) => void` | Fires when the selection changes. Receives the full array of selected item IDs. In single-select mode, the array has one element.                                                                                |
| onopen   | `() => void`                | Fires when the dropdown opens.                                                                                                                                                                                   |
| onclose  | `() => void`                | Fires when the dropdown closes.                                                                                                                                                                                  |
| onclear  | `() => void`                | Fires when the clear button empties the selection, after `onchange` has reported the new empty value. Use it to distinguish "cleared" from "deselected the last item", which `onchange` alone cannot tell apart. |

## Search placement

`searchable` puts the filter input in the trigger and focuses it on open. `searchPosition="menu"` puts it **inside the open dropdown** instead, which is what the design-system keyboard contract specifies:

```svelte
<Select {items} searchable searchPosition="menu" placeholder="Choose a city" />
```

The difference is not cosmetic. With the input in the trigger there is no way to open the menu and keep focus on the combobox, so a keyboard user who wanted to arrow through the options had to type first. With `searchPosition="menu"` the trigger stays a plain combobox, and the search box is reached by **Tab after opening** rather than being focused for you.

Consequences worth knowing:

- **Tab from the trigger does not close the menu** in this variant — that keypress is how the search box is reached. Tab _from_ the search box still closes, since focus is genuinely leaving the widget; Shift+Tab back to the trigger does not.
- **The panel carries no `role`**, and an inner `.select-menu-list` owns `role="listbox"`. A listbox may only contain options, so the search box has to be a sibling of the list rather than a child of it. `aria-controls` points at the list.
- **The list scrolls, not the panel**, so the search box stays put as the user moves down the results.

Defaults to `'trigger'`, so an existing `searchable` Select is unchanged.

## Error state

`error` renders the red trigger border and sets `aria-invalid`. Add `errorMessage` for the hint below it, which renders in a `role="alert"` region wired to the combobox through `aria-describedby` — so it is announced, not merely visible:

```svelte
<Select {items} bind:value error errorMessage="Pick a fruit to continue" />
```

The error border deliberately outranks both the hover and the focus/open border colours. A field that stops looking invalid the moment the user enters it is invalid exactly when nobody can see it.

`error` on its own is valid — you get the border and `aria-invalid` with no message region. Empty or whitespace-only messages render no alert and no description reference. Searchable variants also place error semantics on the actual focused input. Instance IDs are stable across SSR hydration.

## Clearable trigger

`clearable` puts a × beside the trigger whenever there is a selection. It is visually inside the control but is a sibling of the combobox, not a nested interactive descendant. Enter/Space activate it, and focus returns to the trigger or search input after it disappears without opening the menu. Its focus ring is themeable through `--select-clear-focus-outline` (default `2px solid currentColor`). It resets the value **without opening the menu**, which is the whole point: clearing through the menu costs an open, a hunt and a second click.

```svelte
<Select {items} bind:value clearable onclear={() => reset()} />
```

The control is not rendered when nothing is selected, or while `disabled` — a × that never clears anything reads as broken. `onclear` fires after `onchange`, so a consumer that only needs the new value can ignore it.

## Sizing

There is no `size` prop, and none is needed: the trigger's geometry is already themeable.
Define a class in your app's CSS that sets the three variables together, then pass it via
`classes` — the same pattern as **Theming with Classes** on `Pill`:

```css
/* app.css */
.select-sm {
  --select-trigger-min-height: 32px;
  --select-trigger-padding: 4px 10px;
  --select-font-size: 13px;
}

.select-lg {
  --select-trigger-min-height: 48px;
  --select-trigger-padding: 12px 14px;
  --select-font-size: 15px;
}
```

```svelte
<Select {items} classes="select-sm" placeholder="Compact" />
<Select {items} placeholder="Default" />
<Select {items} classes="select-lg" placeholder="Roomy" />
```

Measured against the unmodified component, those recipes give:

|              | `--select-trigger-min-height` | `--select-trigger-padding` | `--select-font-size` | rendered height |
| ------------ | ----------------------------- | -------------------------- | -------------------- | --------------- |
| `.select-sm` | 32px                          | 4px 10px                   | 13px                 | 42px            |
| default      | 40px                          | 8px 12px                   | 14px                 | 58px            |
| `.select-lg` | 48px                          | 12px 14px                  | 15px                 | 74px            |

Those rendered heights are for a **single-line trigger**; a multi-select whose pills wrap
onto a second row grows past them.

They are also worth reading carefully, because they are `min-height` **plus** the vertical
padding and border, not the `min-height` itself — 32 + 8 + 2 = 42, 40 + 16 + 2 = 58,
48 + 24 + 2 = 74. So raising `--select-trigger-padding` raises the control even when
`--select-trigger-min-height` is untouched.

That is also why the three move together: setting `min-height` alone leaves the padding and
label at their default scale, which is what makes a hand-tuned single override look wrong
and tempts an `!important`. Set all three, or none.

Because these are your classes rather than ours, the scale is yours too: add an `xs`, match
a host application's density, or drive them from a `[data-density]` attribute. Nothing here
is version-locked to this library.

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

| Variable                              | Default                                | CSS Property  | Description                                                                                                                                     |
| ------------------------------------- | -------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--select-trigger-gap`                | `4px`                                  | gap           | Gap between items (pills, input, value) inside the trigger.                                                                                     |
| `--select-trigger-min-height`         | `40px`                                 | min-height    | Minimum height of the trigger area.                                                                                                             |
| `--select-trigger-padding`            | `8px 12px`                             | padding       | Inner padding of the trigger area.                                                                                                              |
| `--select-trigger-background`         | `#ffffff`                              | background    | Background color of the trigger area.                                                                                                           |
| `--select-trigger-border`             | `1px solid #cccccc`                    | border        | Border of the trigger area.                                                                                                                     |
| `--select-trigger-border-radius`      | `6px`                                  | border-radius | Corner rounding of the trigger area.                                                                                                            |
| `--select-trigger-transition`         | `border-color 0.15s, box-shadow 0.15s` | transition    | Transition for trigger hover/focus effects.                                                                                                     |
| `--select-trigger-hover-border-color` | `#999999`                              | border-color  | Border color of the trigger on hover.                                                                                                           |
| `--select-trigger-focus-border-color` | `#2563eb`                              | border-color  | Border color of the trigger when focused or open.                                                                                               |
| `--select-trigger-error-border-color` | `#dc2626`                              | border-color  | Border color of the trigger while `error` is set. Outranks the hover and focus colours.                                                         |
| `--select-trigger-error-shadow`       | `0 0 0 2px rgba(220, 38, 38, 0.2)`     | box-shadow    | Focus ring shown while `error` is set, in place of the blue one.                                                                                |
| `--select-trigger-pressed-background` | `#ededed`                              | background    | Trigger background while the pointer is down.                                                                                                   |
| `--select-option-pressed-background`  | `#ededed`                              | background    | Option background while the pointer is down. Outranks the hover and selected backgrounds, so a press on an already-selected row still confirms. |
| `--select-error-message-color`        | `#dc2626`                              | color         | Text color of the error message.                                                                                                                |
| `--select-error-message-font-size`    | `12px`                                 | font-size     | Font size of the error message.                                                                                                                 |
| `--select-error-message-margin-top`   | `4px`                                  | margin-top    | Space between the trigger and the error message.                                                                                                |
| `--select-clear-size`                 | `18px`                                 | width/height  | Size of the clear (×) button.                                                                                                                   |
| `--select-clear-color`                | `#666666`                              | color         | Glyph color of the clear button.                                                                                                                |
| `--select-clear-background`           | `transparent`                          | background    | Background of the clear button.                                                                                                                 |
| `--select-clear-hover-background`     | `#ededed`                              | background    | Background of the clear button on hover.                                                                                                        |
| `--select-clear-hover-color`          | `#111111`                              | color         | Glyph color of the clear button on hover.                                                                                                       |
| `--select-clear-pressed-background`   | `#e0e0e0`                              | background    | Background of the clear button while pressed.                                                                                                   |
| `--select-clear-border-radius`        | `var(--radius, 4px)`                   | border-radius | Corner radius of the clear button.                                                                                                              |
| `--select-clear-font-size`            | `16px`                                 | font-size     | Glyph size of the clear button.                                                                                                                 |
| `--select-trigger-focus-shadow`       | `0 0 0 2px rgba(37, 99, 235, 0.2)`     | box-shadow    | Box shadow of the trigger when focused or open.                                                                                                 |

### Left Icon

| Variable                   | Default   | CSS Property  | Description                                                                                                |
| -------------------------- | --------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `--select-left-icon-size`  | `16px`    | width, height | Size of the leading icon in the trigger.                                                                   |
| `--select-left-icon-color` | `inherit` | color         | Color the inlined leading icon resolves `currentColor` against. Defaults to the trigger's own text colour. |

### Placeholder

| Variable                     | Default   | CSS Property | Description                                                 |
| ---------------------------- | --------- | ------------ | ----------------------------------------------------------- |
| `--select-placeholder-color` | `#999999` | color        | Text color of the placeholder and search input placeholder. |
| `--select-value-align`       | `left`    | text-align   | Text alignment of the selected value / placeholder text.    |

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

### In-menu search

| Variable                                  | Default                            | Purpose                 |
| ----------------------------------------- | ---------------------------------- | ----------------------- |
| `--select-menu-search-margin`             | `6px`                              | Space around the input. |
| `--select-menu-search-padding`            | `6px 8px`                          | Input padding.          |
| `--select-menu-search-border`             | `1px solid #cccccc`                | Input border.           |
| `--select-menu-search-border-radius`      | `var(--radius, 4px)`               | Input corner radius.    |
| `--select-menu-search-background`         | `#ffffff`                          | Input background.       |
| `--select-menu-search-color`              | `inherit`                          | Input text colour.      |
| `--select-menu-search-font-size`          | `inherit`                          | Input font size.        |
| `--select-menu-search-focus-border-color` | `#2563eb`                          | Focus border colour.    |
| `--select-menu-search-focus-shadow`       | `0 0 0 2px rgba(37, 99, 235, 0.2)` | Focus ring.             |

### Options

| Variable                                         | Default                                        | CSS Property  | Description                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--select-option-padding`                        | `8px 12px`                                     | padding       | Padding inside each dropdown option.                                                                                                     |
| `--select-option-icon-size`                      | `16px`                                         | width, height | Size of a per-option leading icon (`SelectItem.icon`).                                                                                   |
| `--select-option-icon-color`                     | `inherit`                                      | color         | Color an inlined per-option icon resolves `currentColor` against.                                                                        |
| `--select-option-icon-gap`                       | `8px`                                          | margin-right  | Gap between a per-option icon and its label.                                                                                             |
| `--select-option-color`                          | `#333333`                                      | color         | Text color of dropdown options.                                                                                                          |
| `--select-option-font-size`                      | `inherit`                                      | font-size     | Font size of dropdown options.                                                                                                           |
| `--select-option-gap`                            | `0`                                            | gap           | Gap between the option indicator and the label text in multi-select mode.                                                                |
| `--select-option-hover-background`               | `#f0f0f0`                                      | background    | Background of options on hover or keyboard highlight.                                                                                    |
| `--select-option-hover-color`                    | inherits `--select-option-color`               | color         | Text color of options on hover or keyboard highlight.                                                                                    |
| `--select-option-selected-background`            | `#e8f0fe`                                      | background    | Background of selected options.                                                                                                          |
| `--select-option-selected-color`                 | inherits `--select-option-color`               | color         | Text color of selected options.                                                                                                          |
| `--select-option-selected-hover-background`      | inherits `--select-option-selected-background` | background    | Background of selected options on hover.                                                                                                 |
| `--select-option-indicator-size`                 | `18px`                                         | width, height | Size of the default multi-select checkbox indicator box.                                                                                 |
| `--select-option-indicator-border`               | `2px solid #757575`                            | border        | Border of the unchecked indicator box.                                                                                                   |
| `--select-option-indicator-border-radius`        | `3px`                                          | border-radius | Corner rounding of the indicator box.                                                                                                    |
| `--select-option-indicator-background`           | `transparent`                                  | background    | Background of the unchecked indicator box.                                                                                               |
| `--select-option-indicator-checked-background`   | `#2196f3`                                      | background    | Background of the checked indicator box.                                                                                                 |
| `--select-option-indicator-checked-border-color` | `#2196f3`                                      | border-color  | Border color of the checked indicator box.                                                                                               |
| `--select-option-indicator-check-size`           | `12px`                                         | width, height | Size of the checkmark inside a checked indicator.                                                                                        |
| `--select-option-indicator-check-color`          | `#ffffff`                                      | color         | Color of the checkmark inside a checked indicator.                                                                                       |
| `--select-option-indicator-color`                | `currentColor`                                 | color         | Legacy text-color hook on the indicator wrapper. Inert for the default checkbox box; only affects a text-glyph custom `optionIndicator`. |

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
  /** Optional per-option test id. When set, emitted as `data-pw` directly on the option element (overrides `itemTestId` and `testId` fallbacks). */
  testId?: string;
};
```

### SelectHierarchy

```typescript
type SelectHierarchy = 'default' | 'ghost';
```

## Internal Dependencies

This component uses the following library components internally:

- Pill (for displaying selected items in multi-select mode)
- Img (for rendering the optional leading trigger icon via `leftIcon`)

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

### Attributes (Web Component)

| Attribute           | Prop             | Type    | Description                                                                                    |
| ------------------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `test-id`           | `testId`         | string  | `data-pw` on the container element and fallback per-option prefix.                             |
| `item-test-id`      | `itemTestId`     | string  | Fallback per-option `data-pw` prefix (`{itemTestId}-{item.id}`), overrides `test-id` fallback. |
| `placeholder`       | `placeholder`    | string  | Trigger placeholder text.                                                                      |
| `disabled`          | `disabled`       | boolean | Disables the select.                                                                           |
| `multiple`          | `multiple`       | boolean | Enables multi-select mode.                                                                     |
| `searchable`        | `searchable`     | boolean | Enables search filtering.                                                                      |
| `open`              | `open`           | boolean | Reflected. Controls dropdown open state.                                                       |
| `dropdown-align`    | `dropdownAlign`  | string  | `'left'` or `'right'` — anchors the dropdown panel horizontally.                               |
| `left-icon`         | `leftIcon`       | string  | Image src for the leading trigger icon.                                                        |
| `left-icon-test-id` | `leftIconTestId` | string  | `data-pw` for the leading icon element.                                                        |

> **Note:** The `items` and `value` props are arrays — set them via JavaScript properties, not HTML attributes.

> **Svelte-only:** The `optionIndicator` snippet is not available in Web Component mode. The `option-indicator` slot was removed because Web Component `<slot>` elements do not forward Svelte snippet parameters as HTML attributes, causing the `checked` state to be silently dropped. Use the Svelte component directly when a custom option indicator is needed.
