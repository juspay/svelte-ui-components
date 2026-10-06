# Menu

A dropdown action menu that opens from a trigger element and displays a list of selectable actions. Supports full keyboard navigation (ArrowUp/Down to move focus, Enter/Space to select, Escape to close, Home/End to jump), typeahead search (type characters to focus matching items), click-outside to close, separator lines between groups, danger-styled items for destructive actions, disabled items, optional per-item icons, and configurable dropdown position. Focus is managed automatically: the first item receives focus on open, and focus returns to the trigger on close.

## Usage

A trigger is exactly one interactive element. Which one depends on what the `trigger` snippet renders.

**The snippet renders a real control (a `Button`, a native `<button>`)** — set `interactiveTrigger` and spread the wiring Menu hands the snippet onto that control. The control is the single Tab stop; it carries `aria-haspopup` and `aria-expanded`, and Menu returns focus to it when the menu closes.

```svelte
<script>
  import { Menu, Button } from '@juspay/svelte-ui-components';
</script>

<Menu
  interactiveTrigger
  items={[
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    { label: 'Delete', value: 'delete', danger: true }
  ]}
  onselect={(item) => console.log(item.value)}
>
  {#snippet trigger(props)}
    <Button {...props} text="Actions" />
  {/snippet}
</Menu>
```

**The snippet renders content that is not interactive (an icon, a glyph, text)** — leave `interactiveTrigger` off. Menu wraps the content in one `role="button" tabindex="0"` element that owns Enter, Space, the arrow keys and the click. Name it with `triggerAriaLabel` when it has no visible text.

```svelte
<Menu {items} triggerAriaLabel="More options">
  {#snippet trigger()}
    <span aria-hidden="true">&#8943;</span>
  {/snippet}
</Menu>
```

Putting a real control inside the default wrapper (`<button>` without `interactiveTrigger`) gives one action two Tab stops — the wrapper, then the control — and nests a button inside a button in the accessibility tree.

## Props

| Prop               | Type                                                                     | Required | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------ | -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items              | `MenuItem[]`                                                             | Yes      | `-`             | Array of menu items to display. Each item defines a label, value, and optional icon, disabled, danger, or separator flags. See MenuItem type below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| open               | `boolean`                                                                | No       | `false`         | Bindable. Controls whether the dropdown is visible. Set to true to open programmatically; bind to react to open/close state changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| testId             | `string`                                                                 | No       | `-`             | Value for the data-pw attribute on the container, used for end-to-end testing selectors. Individual items get `{testId}-item-{value}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| classes            | `string`                                                                 | No       | `-`             | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| transformSvg       | `(svg: string) => string`                                                | No       | `-`             | Rewrites every item icon's SVG markup before it is inlined.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| role               | `'menu' \| 'listbox'`                                                    | No       | `'menu'`        | ARIA role for the dropdown container. Set to `'listbox'` to use the menu as an autocomplete suggestions list. Items automatically get `role="option"` instead of `role="menuitem"`, and `aria-selected` is managed on the focused item.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ariaLabel          | `string`                                                                 | No       | `-`             | Sets `aria-label` on the dropdown container for screen reader identification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| triggerAriaLabel   | `string`                                                                 | No       | `-`             | Accessible name for the focusable trigger element itself (the control the user tabs to). `ariaLabel` names the portaled dropdown, which can't name the trigger — use this instead when the trigger has no visible text. Only applies when `interactiveTrigger` is false.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| id                 | `string`                                                                 | No       | `-`             | Sets the `id` attribute on the dropdown container. Needed for `aria-controls` references from a parent combobox input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| placement          | `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right' \| 'auto'` | No       | `'bottom-left'` | Corner of the trigger the dropdown anchors to. The default preserves the long-standing behavior (including the `--menu-dropdown-top`/`--menu-dropdown-left` tokens). Fixed corners anchor statically — use `'bottom-right'` for row-action menus in a table's trailing column so the panel expands leftwards. `'auto'` measures the panel on every open and picks the corner that keeps it fully inside the viewport: it right-anchors when the panel would overflow the right edge and flips above the trigger when there is not enough room below but enough above.                                                                                                                                                                                          |
| interactiveTrigger | `boolean`                                                                | No       | `false`         | Set when the `trigger` snippet renders its own focusable control (a `Button`, say) and spreads the wiring Menu hands it. Menu then adds no focusable wrapper of its own: the control is the one Tab stop and carries `aria-haspopup`/`aria-expanded`. Left false, Menu wraps the snippet in its own focusable `role="button"`, which suits non-interactive content but gives a real control two tab stops and leaves the outer one unnamed. Through `<sui-menu>` the attribute is `interactive-trigger` and the control is the element in the `trigger` slot (see Web Component).                                                                                                                                                                                  |
| usePortal          | `boolean`                                                                | No       | `false`         | Renders the dropdown into the root of the tree it lives in — `document.body` normally, or the shadow root inside `<sui-menu>` — so a clipping ancestor cannot cut it off, with placement following the trigger on scroll and resize. The root is chosen rather than always `document.body` because Svelte scopes a custom element's CSS to its shadow root: a panel moved into the light DOM keeps its markup and loses every rule scoped to that root, so through `<sui-menu>` it would render unstyled. Defaults to false, which keeps the in-flow `position: absolute` behaviour and any consumer CSS reaching `.menu-dropdown` through an ancestor selector. Portaled panels default to `z-index: 1000`; raise `--menu-z-index` to clear a higher overlay. |
| selectedValue      | `string \| null`                                                         | No       | `null`          | `value` of the currently selected item. When set, opening the menu focuses that item instead of the first one, the matching item gets the `menu-item-selected` class (themeable via the `--menu-item-selected-*` variables), and — in `role="listbox"` mode — `aria-selected` reflects the real selection rather than mere focus.                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Snippets

Svelte 5 Snippet props -- pass content blocks to the component.

| Snippet | Type      | Description                                                                                                              |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| trigger | `Snippet` | The trigger element that the menu attaches to. Clicking or pressing Enter/Space/ArrowDown on the trigger opens the menu. |

## Events

| Event    | Type                       | Description                                                                                                            |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| onselect | `(item: MenuItem) => void` | Fires when a non-disabled menu item is selected (via click, Enter, or Space). Receives the full MenuItem object.       |
| onopen   | `() => void`               | Fires when the menu dropdown opens, whether by click, Enter, Space, or ArrowDown/ArrowUp on the trigger.               |
| onclose  | `() => void`               | Fires when the menu dropdown closes, whether by selecting an item, pressing Escape, clicking outside, or pressing Tab. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default                                  | CSS Property     | Description                                                            |
| ------------------------------------------- | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `--menu-container-position`                 | `relative`                               | position         | Position of the outer container that anchors the dropdown.             |
| `--menu-container-display`                  | `inline-block`                           | display          | Display mode of the outer container.                                   |
| `--menu-font-family`                        | `inherit`                                | font-family      | Font family for all menu text.                                         |
| `--menu-font-size`                          | `14px`                                   | font-size        | Base font size for menu items.                                         |
| `--menu-trigger-focus-outline`              | `none`                                   | outline          | Focus outline style for the trigger element.                           |
| `--menu-z-index`                            | `10`                                     | z-index          | Stack order of the dropdown panel.                                     |
| `--menu-background-color`                   | `#ffffff`                                | background-color | Background color of the dropdown panel.                                |
| `--menu-border`                             | `1px solid #e0e0e0`                      | border           | Border around the dropdown panel.                                      |
| `--menu-border-radius`                      | `6px`                                    | border-radius    | Corner rounding of the dropdown panel.                                 |
| `--menu-box-shadow`                         | `0px 4px 16px rgba(0, 0, 0, 0.12)`       | box-shadow       | Shadow of the dropdown panel.                                          |
| `--menu-min-width`                          | `160px`                                  | min-width        | Minimum width of the dropdown panel.                                   |
| `--menu-max-height`                         | `240px`                                  | max-height       | Maximum height of the dropdown before it scrolls.                      |
| `--menu-dropdown-top`                       | `100%`                                   | top              | Top position of the dropdown panel relative to its container.          |
| `--menu-dropdown-left`                      | `0`                                      | left             | Left position of the dropdown panel relative to its container.         |
| `--menu-padding`                            | `4px 0`                                  | padding          | Inner padding of the dropdown panel.                                   |
| `--menu-margin`                             | `4px 0`                                  | margin           | Outer margin of the dropdown panel (gap between trigger and dropdown). |
| `--menu-panel-transition-duration`          | `150ms`                                  | transform, opacity | Duration of the dropdown panel's entrance/exit transition. Read via `getComputedStyle`, checked in order: this token, then `--duration-quick`, then `--motion-duration`, then `150ms`. |
| `--menu-panel-transition-distance`          | `12px`                                   | transform        | Distance (px) the dropdown panel travels on entrance/exit. Checked in order: this token, then `--distance-medium`, then `12px`. |
| `--menu-panel-transition-easing`            | `cubicOut`                               | transform, opacity | Easing curve of the transition, parsed from a CSS easing keyword or `cubic-bezier(...)`. Checked in order: this token, then `--ease-smooth-out`, then `--motion-easing`, then `cubicOut`. |
| `--menu-item-padding`                       | `8px 12px`                               | padding          | Inner padding of each menu item.                                       |
| `--menu-item-color`                         | `#333333`                                | color            | Text color of menu items.                                              |
| `--menu-item-background-color`              | `transparent`                            | background-color | Background color of menu items in their default state.                 |
| `--menu-item-gap`                           | `8px`                                    | gap              | Gap between icon and label within a menu item.                         |
| `--menu-item-white-space`                   | `nowrap`                                 | white-space      | White-space behavior for menu item text.                               |
| `--menu-item-hover-background-color`        | `#f5f5f5`                                | background-color | Background color of a menu item on hover.                              |
| `--menu-item-hover-color`                   | `var(--menu-item-color, #333333)`        | color            | Text color of a menu item on hover.                                    |
| `--menu-item-selected-background-color`     | `transparent`                            | background-color | Background color of the item matching `selectedValue`.                 |
| `--menu-item-selected-color`                | `inherit`                                | color            | Text color of the item matching `selectedValue`.                       |
| `--menu-item-focus-background-color`        | `#f0f0f0`                                | background-color | Background color of a menu item when focused via keyboard.             |
| `--menu-item-focus-outline`                 | `none`                                   | outline          | Focus outline of a menu item when focused via keyboard.                |
| `--menu-item-danger-color`                  | `#dc3545`                                | color            | Text color for danger-flagged items (destructive actions).             |
| `--menu-item-danger-hover-background-color` | `#fff0f0`                                | background-color | Background color for danger items on hover.                            |
| `--menu-item-danger-hover-color`            | `var(--menu-item-danger-color, #dc3545)` | color            | Text color for danger items on hover.                                  |
| `--menu-item-danger-focus-background-color` | `#fff0f0`                                | background-color | Background color for danger items when focused via keyboard.           |
| `--menu-item-disabled-opacity`              | `0.4`                                    | opacity          | Opacity of disabled menu items.                                        |
| `--menu-item-disabled-cursor`               | `not-allowed`                            | cursor           | Cursor shown when hovering disabled items.                             |
| `--menu-separator-height`                   | `1px`                                    | height           | Height of the separator line between item groups.                      |
| `--menu-separator-color`                    | `#e0e0e0`                                | background-color | Color of the separator line.                                           |
| `--menu-separator-margin`                   | `4px 0`                                  | margin           | Vertical spacing around the separator line.                            |
| `--menu-item-icon-height`                   | `16px`                                   | height           | Height of per-item icons.                                              |
| `--menu-item-icon-width`                    | `16px`                                   | width            | Width of per-item icons.                                               |
| `--menu-item-font-weight`                   | `400`                                    | font-weight      | Font weight of menu item labels.                                       |
| `--menu-item-line-height`                   | `1.4`                                    | line-height      | Line height of menu item labels.                                       |

## Type Reference

Custom types used by this component's props and events:

### MenuItem

```typescript
type MenuItem = {
  label: string; // Display text for the menu item
  value: string; // Unique identifier used in onselect callback and test IDs
  icon?: string; // URL/src for an icon image displayed before the label
  disabled?: boolean; // When true, item is dimmed and non-interactive
  danger?: boolean; // When true, item text is styled in a destructive/red color
  separator?: boolean; // When true, renders a horizontal line instead of a clickable item
  id?: string; // DOM id for the item element, needed for aria-activedescendant references
};
```

## Internal Dependencies

This component uses the following library components internally:

- Img (for menu item icon rendering)

## Web Component

Tag: `<sui-menu>`

```html
<sui-menu interactive-trigger>
  <button slot="trigger">Open Menu</button>
</sui-menu>
```

A native control in the `trigger` slot needs the `interactive-trigger` attribute. Without it the shadow-root wrapper is also a focusable `role="button"`, so the slotted button is a second Tab stop inside it. With it the slotted element is the one Tab stop: Menu sets `aria-haspopup="menu"` and `aria-expanded` on the control, opens from its click and the ArrowDown/ArrowUp keys, and returns focus to it when the menu closes. The slotted element must itself be a native control or contain one -- in its light DOM, or in an open shadow root as `<sui-button slot="trigger">` does -- and Menu puts the ARIA state on that native control, the element assistive technology exposes, not on the host; a `<div role="button">` does not turn Enter and Space into a click. Leave the attribute off for slotted content that is not interactive, such as a glyph.

### Slots

| Slot Name | Maps to Snippet | Description                               |
| --------- | --------------- | ----------------------------------------- |
| `trigger` | `trigger`       | The element that opens the menu on click. With `interactive-trigger`, a native control that is itself the single Tab stop. |

> **Note:** The `items` prop is an array — set it via JavaScript property.

> **Svelte-only from markup:** `trigger` receives `MenuTriggerProps`, so it cannot be
> expressed as a named slot carrying those values. Two paths exist and they differ:
> assigning the property (`el.trigger = mySnippet`) DOES receive `MenuTriggerProps`,
> while the `trigger` slot projects static markup and receives nothing. Use the slot for
> a fixed trigger; use the property when the trigger needs the open state or the props
> the menu supplies. With `interactive-trigger` the slot still works for a native control:
> Menu applies the ARIA state to it and listens for its events instead of handing it props.

> **Note:** `onopen` also dispatches a same-named DOM custom event (bubbles, composed) for a
> consumer who only calls `addEventListener` — `menu.addEventListener('open', ...)`. `onselect`
> and `onclose` do not: both are already `HTMLElement`'s own native events, so
> `menu.addEventListener('select', ...)` registers without error but is never called by this
> component — assign the property instead.

## SVG icon transformation

Use `transformSvg` to rewrite SVG item icons before Menu inlines them. This lets icon markup adopt application-specific colours without a consumer wrapper.

```svelte
<Menu
  items={[{ label: 'Archive', value: 'archive', icon: '/icons/archive.svg' }]}
  transformSvg={(svg) => svg.replaceAll('#000000', 'currentColor')}
/>
```
