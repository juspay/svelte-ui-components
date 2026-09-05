# Combobox

A text input with an attached dropdown list that filters options as the user types. Built on the library's Input component internally, so it inherits Input's validation, text transformers, and formatting capabilities via the `inputProperties` pass-through. Implements the WAI-ARIA combobox pattern with full keyboard navigation (ArrowUp/Down to highlight, Enter to select, Escape to close, Tab to close and move focus). The dropdown opens on focus or typing and closes on outside click, Escape, or item selection. Supports disabled items, custom item rendering via a Snippet, custom filter logic, a custom empty-state Snippet, input prefix/suffix slots, dropdown header/footer slots, and bindable `value`, `inputValue`, `open`, and `highlightedIndex` state. Type-to-search is the primary interaction (as opposed to `Select`, which is browse-a-list — a closed dropdown the user opens and clicks through, where search if present is one feature among several rather than the way in).

It also supports **multi-select** (`multiple`): picks become removable pills inside the control, tracked via a bindable `selected` array, with optional inline **create** (`allowCreate`), a **selection limit** (`maxSelected`), and a persistent custom **action** row.

## Usage

```svelte
<script>
  import { Combobox } from '@juspay/svelte-ui-components';

  const fruits = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' }
  ];

  let selected = $state('');
</script>

<Combobox items={fruits} bind:value={selected} placeholder="Search fruits..." />
```

### Multi-select (pills)

Set `multiple` and bind a `selected` string array. Picked options render as removable pills; `Backspace` on an empty input removes the last pill.

```svelte
<script>
  let picked = $state([]);
</script>

<Combobox items={fruits} multiple bind:selected={picked} placeholder="Pick fruits…" />
```

### Multi-select with create

`allowCreate` offers a "Create …" row when the typed value has no match. Use `oncreate` to persist the new option into your own `items` list.

```svelte
<Combobox
  items={tagItems}
  multiple
  allowCreate
  bind:selected={tags}
  oncreate={(value) => (tagItems = [...tagItems, { id: value, label: value }])}
/>
```

### Selection limit

```svelte
<Combobox items={fruits} multiple maxSelected={3} bind:selected={picked} />
```

### Custom action row

```svelte
<Combobox
  items={fruits}
  multiple
  bind:selected={picked}
  action={{ label: 'Manage…', onClick: openManager }}
/>
```

### With Custom Item Rendering

```svelte
<Combobox items={fruits} bind:value={selected}>
  {#snippet itemSnippet(item, isHighlighted)}
    <div class:highlighted={isHighlighted}>
      <strong>{item.label}</strong>
      <span>({item.id})</span>
    </div>
  {/snippet}
</Combobox>
```

### With Custom Filter

```svelte
<Combobox
  items={fruits}
  bind:value={selected}
  filterFn={(item, query) => item.label.toLowerCase().startsWith(query.toLowerCase())}
/>
```

### With Custom Empty State

```svelte
<Combobox items={fruits} bind:value={selected}>
  {#snippet emptySnippet()}
    <div style="padding: 12px; text-align: center;">
      <p>No matches found</p>
      <button onclick={handleCreateNew}>Create new item</button>
    </div>
  {/snippet}
</Combobox>
```

### With Extra Item Data

TypeScript's structural typing lets you pass items with extra properties. Cast inside the snippet to access them.

```svelte
<script>
  import type { ComboboxItem } from '@juspay/svelte-ui-components';

  type UserItem = ComboboxItem & { avatar: string; role: string };

  const users: UserItem[] = [
    { id: '1', label: 'Alice', avatar: '/alice.png', role: 'Admin' },
    { id: '2', label: 'Bob', avatar: '/bob.png', role: 'User' }
  ];
</script>

<Combobox items={users} bind:value={selected}>
  {#snippet itemSnippet(item, isHighlighted)}
    {@const user = item as UserItem}
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src={user.avatar} alt="" width="24" height="24" />
      <div>
        <div>{user.label}</div>
        <div style="font-size: 12px; color: #666;">{user.role}</div>
      </div>
    </div>
  {/snippet}
</Combobox>
```

### With Search Icon and Clear Button

```svelte
<Combobox items={fruits} bind:value={selected} bind:inputValue>
  {#snippet inputPrefix()}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  {/snippet}
  {#snippet inputSuffix()}
    {#if inputValue.length > 0}
      <button onclick={() => (inputValue = '')} style="border: none; background: none; cursor: pointer;">
        &times;
      </button>
    {/if}
  {/snippet}
</Combobox>
```

### With Dropdown Header and Footer

```svelte
<Combobox items={fruits} bind:value={selected}>
  {#snippet dropdownHeader()}
    <div style="padding: 8px 12px; font-size: 12px; color: #999; border-bottom: 1px solid #eee;">
      Suggestions
    </div>
  {/snippet}
  {#snippet dropdownFooter()}
    <div style="padding: 8px 12px; border-top: 1px solid #eee;">
      <button onclick={handleShowAll} style="width: 100%; border: none; background: none; color: #2563eb; cursor: pointer;">
        Show all results
      </button>
    </div>
  {/snippet}
</Combobox>
```

### Server-Side Filtering

```svelte
<script>
  let results = $state([]);
  let loading = $state(false);

  async function handleInput(query) {
    loading = true;
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    results = await res.json();
    loading = false;
  }
</script>

<Combobox
  items={results}
  filterFn={() => true}
  oninput={handleInput}
  placeholder="Search..."
>
  {#snippet inputSuffix()}
    {#if loading}
      <span class="spinner" />
    {/if}
  {/snippet}
  {#snippet emptySnippet()}
    <div style="padding: 12px; text-align: center; color: #999;">
      {loading ? 'Searching...' : 'No results found'}
    </div>
  {/snippet}
</Combobox>
```

### Accessing the Input Element

Combobox doesn't expose the input as a bindable prop — like every other component in this library, DOM/instance access goes through `bind:this` plus an exported method (see Methods below).

```svelte
<script>
  let comboboxRef = $state(null);

  function focusInput() {
    comboboxRef?.getInputRef()?.focus();
  }
</script>

<Combobox items={fruits} bind:this={comboboxRef} />
<button onclick={focusInput}>Focus the combobox</button>
```

### With Input Validation

Pass Input props via `inputProperties` to enable validation, text formatting, and more.

```svelte
<Combobox
  items={fruits}
  bind:value={selected}
  inputProperties={{
    validationPattern: /^[a-zA-Z]+$/,
    onErrorMessage: 'Letters only',
    maxLength: 20
  }}
  inputEventProperties={{
    onStateChange: (state) => console.log('Validation:', state)
  }}
/>
```

## Props

| Prop             | Type                                                        | Required | Default          | Description                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items            | `ComboboxItem[]`                                            | Yes      | `-`              | Array of selectable items. Each item has an `id`, `label`, optional `disabled` flag, and any extra properties. See ComboboxItem type below.                            |
| value            | `string`                                                    | No       | `''`             | Bindable. The `id` of the currently selected item. Updated when the user selects an item from the dropdown.                                                            |
| inputValue       | `string`                                                    | No       | `''`             | Bindable. The current text in the input field. Used for filtering items. Updated on every keystroke and when an item is selected (set to the item's label).             |
| open             | `boolean`                                                   | No       | `false`          | Bindable. Controls whether the dropdown is visible. Opens on focus or typing; closes on selection, Escape, outside click, or Tab.                                      |
| highlightedIndex | `number`                                                    | No       | `-1`             | Bindable. Index of the currently highlighted item within selectable (non-disabled) items. Set to -1 when nothing is highlighted. Useful for external highlight control. |
| placeholder      | `string`                                                    | No       | `''`             | Placeholder text shown when the input is empty.                                                                                                                        |
| disabled         | `boolean`                                                   | No       | `false`          | When true, the input is non-interactive and the dropdown cannot open. The component appears dimmed (opacity 0.5).                                                      |
| name             | `string`                                                    | No       | `-`              | HTML `name` attribute on the input. Use for form submission.                                                                                                           |
| testId           | `string`                                                    | No       | `-`              | Value for the `data-pw` attribute on the container. The input gets `{testId}-input` and each option gets `{testId}-option-{id}`.                                       |
| classes          | `string`                                                    | No       | `-`              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| noResultsText    | `string`                                                    | No       | `'No results'`   | Text shown in the dropdown when no items match the current input value. Ignored when `emptySnippet` is provided.                                                       |
| ariaLabel        | `string`                                                    | No       | `-`              | Sets `aria-label` on the listbox dropdown. Provides an accessible name for screen readers (e.g., `"Search results"`).                                                  |
| inputProperties  | `OptionalInputProperties`                                   | No       | `-`              | Pass-through props for the internal Input component. Use for validation (`validators`, `validationPattern`, `inProgressPattern`), text formatting (`textTransformers`, `textViewPresentation`), `dataType`, `maxLength`, `minLength`, `useTextArea`, `label`, `onErrorMessage`, `infoMessage`, etc. See Input component docs for the full list. |
| inputEventProperties | `InputEventProperties`                                  | No       | `-`              | Pass-through event handlers for the internal Input component. Use for `onpaste`, `onstatechange`, `onclick`, etc. Note: `oninput`, `onfocus`, `onblur`, and `onkeydown` are managed by Combobox and forwarded — use Combobox's own events for these. |
| filterFn         | `(item: ComboboxItem, query: string) => boolean`            | No       | case-insensitive `includes` | Custom filter function called for each item when `inputValue` is non-empty. Return `true` to include the item. Use for startsWith, fuzzy matching, or server-side filtering (always return `true` and update `items` externally). |
| multiple         | `boolean`                                                   | No       | `false`          | Enable multi-select: picked options become removable pills inside the control, and selection is tracked in `selected` instead of `value`.                             |
| selected         | `string[]`                                                  | No       | `[]`             | Bindable. Array of selected item `id`s (multi-select mode). Use `bind:selected`.                                                                                       |
| maxSelected      | `number`                                                    | No       | `-`              | Cap the number of selections (multi-select). At the limit, option/create rows are hidden and a limit message is shown.                                                 |
| maxSelectedText  | `string`                                                    | No       | `'You can select up to {n}.'` | Message shown in the dropdown once `maxSelected` is reached.                                                                                          |
| allowCreate      | `boolean`                                                   | No       | `false`          | Show a "Create …" row when the query has no exact match. Fires `oncreate`; in multi-select the value is also added to `selected`.                                      |
| createLabel      | `(query: string) => string`                                 | No       | `Create "{query}"` | Builds the create-row label from the current query.                                                                                                                 |
| action           | `ComboboxAction`                                            | No       | `-`              | A persistent custom action row at the foot of the dropdown: `{ label, onClick, keepOpen? }`.                                                                           |

## Methods

Exported methods that can be called via `bind:this` on the component instance.

| Method          | Signature                                               | Description                                                                                                             |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `getInputRef()` | `() => HTMLInputElement \| HTMLTextAreaElement \| null` | Returns a reference to the underlying `<input>` DOM element. Use for custom focus management or third-party library integration. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet        | Type                               | Description                                                                                                                                                                                 |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| itemSnippet    | `Snippet<[ComboboxItem, boolean]>` | Custom rendering for each dropdown item. Receives the `ComboboxItem` and a `boolean` indicating whether the item is currently highlighted. Cast the item to your extended type to access extra properties. |
| emptySnippet   | `Snippet`                          | Custom content shown when the filter matches no items. Use for "create new" buttons, loading indicators, or styled empty states. When provided, overrides `noResultsText`.                  |
| inputPrefix    | `Snippet`                          | Content rendered before the input inside the input wrapper (e.g., a search icon). Sits inside the border/focus ring.                                                                        |
| inputSuffix    | `Snippet`                          | Content rendered after the input inside the input wrapper (e.g., a clear button, spinner, or chevron). Sits inside the border/focus ring.                                                   |
| dropdownHeader | `Snippet`                          | Content rendered at the top of the dropdown, before the options list (e.g., a category label or pinned items).                                                                              |
| dropdownFooter | `Snippet`                          | Content rendered at the bottom of the dropdown, after the options list (e.g., a "Show all results" link or action buttons).                                                                 |
| pillSnippet    | `Snippet<[string, () => void, boolean]>` | Multi-select: custom pill renderer; receives `(value, remove, disabled)`. Defaults to the library `Pill`.                                                                             |
| actionIcon     | `Snippet`                          | Custom leading icon for the persistent `action` row.                                                                                                                                        |

## Events

| Event     | Type                             | Description                                                                                                                                                       |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onselect  | `(item: ComboboxItem) => void`   | Fires when an item is selected from the dropdown (via click or Enter). Receives the full item object. Cast to your extended type to access extra properties.       |
| oninput   | `(value: string) => void`        | Fires on every input change. Receives the current input text. Use for server-side filtering or analytics.                                                          |
| onopen    | `() => void`                     | Fires when the dropdown opens (on focus, typing, or ArrowDown).                                                                                                    |
| onclose   | `() => void`                     | Fires when the dropdown closes (on selection, Escape, outside click, or Tab).                                                                                      |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed in the input, before the component's built-in handling. Call `event.preventDefault()` to suppress the default behavior for that key.   |
| onfocus   | `(event: FocusEvent) => void`    | Fires when the input element gains focus.                                                                                                                          |
| onblur    | `(event: FocusEvent) => void`    | Fires when the input element loses focus.                                                                                                                          |
| onchange  | `(selected: string[]) => void`   | Multi-select: fires whenever the selection changes (add, remove, or create).                                                                                       |
| onadd     | `(value: string) => void`        | Multi-select: fires when a value is added.                                                                                                                          |
| onremove  | `(value: string) => void`        | Multi-select: fires when a value is removed.                                                                                                                        |
| oncreate  | `(value: string) => void`        | Fires when the create row is chosen, with the trimmed query.                                                                                                        |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                       | Default                                                             | CSS Property     | Description                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `--combobox-width`                             | `100%`                                                              | width            | Width of the combobox container.                                               |
| `--combobox-font-family`                       | `inherit`                                                           | font-family      | Font family for the input and dropdown text.                                   |
| `--combobox-font-size`                         | `14px`                                                              | font-size        | Font size for the input and dropdown text.                                     |
| `--combobox-color`                             | `#333333`                                                           | color            | Text color for the input and dropdown.                                         |
| `--combobox-disabled-opacity`                  | `0.5`                                                               | opacity          | Opacity when the combobox is disabled.                                         |
| `--combobox-disabled-cursor`                   | `not-allowed`                                                       | cursor           | Cursor when the combobox is disabled.                                          |
| `--combobox-input-padding`                     | `8px 12px`                                                          | padding          | Inner padding of the input field.                                              |
| `--combobox-input-background`                  | `#ffffff`                                                           | background       | Background color of the input field.                                           |
| `--combobox-input-border`                      | `1px solid #cccccc`                                                 | border           | Border of the input field in its default state.                                |
| `--combobox-input-border-radius`               | `6px`                                                               | border-radius    | Corner rounding of the input field.                                            |
| `--combobox-input-transition`                  | `border-color 0.15s, box-shadow 0.15s`                              | transition       | Transition animation for input border and shadow changes.                      |
| `--combobox-input-hover-border-color`          | `#999999`                                                           | border-color     | Border color of the input on hover.                                            |
| `--combobox-input-focus-border-color`          | `#2563eb`                                                           | border-color     | Border color of the input when focused.                                        |
| `--combobox-input-focus-shadow`                | `0 0 0 2px rgba(37, 99, 235, 0.2)`                                  | box-shadow       | Focus ring shadow around the input.                                            |
| `--combobox-placeholder-color`                 | `#999999`                                                           | color            | Color of the placeholder text.                                                 |
| `--combobox-input-prefix-padding`              | `8px`                                                               | padding-left     | Left padding of the input prefix container.                                    |
| `--combobox-input-suffix-padding`              | `8px`                                                               | padding-right    | Right padding of the input suffix container.                                   |
| `--combobox-dropdown-top`                      | `100%`                                                              | top              | Top position of the dropdown relative to the container. Change to open upward. |
| `--combobox-dropdown-left`                     | `0`                                                                 | left             | Left position of the dropdown relative to the container.                       |
| `--combobox-dropdown-right`                    | `0`                                                                 | right            | Right position of the dropdown relative to the container.                      |
| `--combobox-dropdown-gap`                      | `4px`                                                               | margin-top       | Gap between the input and the dropdown panel.                                  |
| `--combobox-dropdown-background`               | `#ffffff`                                                           | background       | Background color of the dropdown panel.                                        |
| `--combobox-dropdown-border`                   | `1px solid #cccccc`                                                 | border           | Border of the dropdown panel.                                                  |
| `--combobox-dropdown-border-radius`            | `6px`                                                               | border-radius    | Corner rounding of the dropdown panel.                                         |
| `--combobox-dropdown-shadow`                   | `0 4px 12px rgba(0, 0, 0, 0.1)`                                     | box-shadow       | Shadow of the dropdown panel.                                                  |
| `--combobox-dropdown-max-height`               | `200px`                                                             | max-height       | Maximum height of the dropdown before it scrolls.                              |
| `--combobox-dropdown-z-index`                  | `10`                                                                | z-index          | Stack order of the dropdown panel.                                             |
| `--combobox-dropdown-padding`                  | `0`                                                                 | padding          | Inner padding of the dropdown panel.                                           |
| `--combobox-option-padding`                    | `8px 12px`                                                          | padding          | Inner padding of each option.                                                  |
| `--combobox-option-color`                      | `#333333`                                                           | color            | Text color of options.                                                         |
| `--combobox-option-font-size`                  | `inherit`                                                           | font-size        | Font size of option text.                                                      |
| `--combobox-option-font-weight`                | `inherit`                                                           | font-weight      | Font weight of option text.                                                    |
| `--combobox-option-hover-background`           | `#f0f0f0`                                                           | background       | Background color of an option on hover or when highlighted via keyboard.       |
| `--combobox-option-hover-color`                | `var(--combobox-option-color, #333333)`                              | color            | Text color of an option on hover.                                              |
| `--combobox-option-selected-background`        | `#e8f0fe`                                                           | background       | Background color of the currently selected option.                             |
| `--combobox-option-selected-color`             | `var(--combobox-option-color, #333333)`                              | color            | Text color of the currently selected option.                                   |
| `--combobox-option-selected-font-weight`       | `inherit`                                                           | font-weight      | Font weight of the currently selected option.                                  |
| `--combobox-option-selected-hover-background`  | `var(--combobox-option-selected-background, #e8f0fe)`                | background       | Background color of the selected option when also hovered/highlighted.         |
| `--combobox-option-disabled-opacity`           | `0.4`                                                               | opacity          | Opacity of disabled options.                                                   |
| `--combobox-option-disabled-cursor`            | `not-allowed`                                                       | cursor           | Cursor shown when hovering disabled options.                                   |
| `--combobox-empty-padding`                     | `8px 12px`                                                          | padding          | Padding of the "no results" message.                                           |
| `--combobox-empty-color`                       | `#999999`                                                           | color            | Color of the "no results" message text.                                        |
| `--combobox-empty-font-style`                  | `italic`                                                            | font-style       | Font style of the "no results" message.                                        |
| `--combobox-dropdown-header-border`            | `none`                                                              | border-bottom    | Bottom border of the dropdown header section.                                  |
| `--combobox-dropdown-header-padding`           | `0`                                                                 | padding          | Padding of the dropdown header section.                                        |
| `--combobox-dropdown-footer-border`            | `none`                                                              | border-top       | Top border of the dropdown footer section.                                     |
| `--combobox-dropdown-footer-padding`           | `0`                                                                 | padding          | Padding of the dropdown footer section.                                        |

## Type Reference

Custom types used by this component's props and events:

### ComboboxItem

```typescript
type ComboboxItem = {
  id: string; // Unique identifier for the item, used as the selected value
  label: string; // Display text shown in the dropdown and input when selected
  disabled?: boolean; // When true, the item is dimmed and cannot be selected
};
```

To pass extra data (icons, descriptions, etc.), extend the type: `type MyItem = ComboboxItem & { icon: string }` and cast inside `itemSnippet`.

### ComboboxAction

```typescript
type ComboboxAction = {
  label: string;
  onClick: () => void;
  keepOpen?: boolean; // keep the dropdown open after the action runs (default false)
};
```

## Internal Dependencies

This component uses the following library components internally:

- Input (for the text input field — inherits validation, text transformers, and ARIA support)

## Web component

Available as `<sui-combobox>`.

```html
<sui-combobox placeholder="Search…" aria-label="Country" test-id="country"></sui-combobox>
```

```js
document.querySelector('sui-combobox').items = [{ id: 'in', label: 'India' }];
```

`aria-label` names the dropdown listbox (the `role="listbox"` element), not the text input, so
the example above leaves the input without an accessible name of its own. Name the input through
`inputProperties`, whose `label` renders the visible label the field is named by:

```js
document.querySelector('sui-combobox').inputProperties = { label: 'Country' };
```

Attributes are kebab-case: `aria-label`, `test-id`, `input-value`, `highlighted-index`,
`no-results-text`, `max-selected`, `max-selected-text`, `allow-create`. `items`, `selected`, `filterFn`, the
snippet props and every `on*` handler are set as properties, since they are not serialisable
as attributes.
