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

## Form participation

A Choicebox renders a real, visually hidden `<input>` behind the card, so giving it a
`name` makes it appear in `FormData` like any other control. It is opt-in: leave `name`
off and nothing is submitted, exactly as before.

```svelte
<form>
  <Choicebox mode="checkbox" name="addons" value="insurance">
    <span>Add insurance</span>
  </Choicebox>
</form>
<!-- submits addons=insurance while selected, nothing while unselected or disabled -->
```

In `radio` mode a `name` also **groups** the cards that share it, which is the behaviour
the browser gives a native radio group and which nothing was doing before:

- selecting one card deselects the others, and each deselected card's `onclick` fires
  with `false`, so a consumer tracking selection through the callback stays correct;
- the group holds a single tab stop — on the selection, or on the first enabled card
  while nothing is selected;
- Arrow Up/Left and Arrow Down/Right move the selection and wrap, Home/End jump to the
  ends, and disabled cards are skipped;
- `required` on the cards is the native "pick one of the group" rule.

```svelte
<Choicebox mode="radio" name="plan" value="basic" required>
  <span>Basic</span>
</Choicebox>
<Choicebox mode="radio" name="plan" value="pro">
  <span>Pro</span>
</Choicebox>
```

Grouping is scoped to cards that share a root node, so two forms on one page can both
use `name="plan"` without interfering. That is narrower than the platform, which scopes
a radio group to the owning form.

### Limits

- **Grouping does not cross a shadow boundary.** Each `<sui-choicebox>` is its own shadow
  root, so `<sui-choicebox mode="radio" name="plan">` siblings each keep their own
  selection and do not arrow between one another. The element does take part in its form
  through `ElementInternals`, so `name`/`value` still reach `FormData`; drive exclusivity
  yourself, or use the Svelte component where you need a grouped radio set.
- **Before hydration every card in a group is a tab stop.** The single tab stop depends
  on sibling state, which only exists on the client; server-rendered markup carries the
  ungrouped `tabindex`.

## Props

| Prop          | Type                    | Required | Default     | Description                                                                                                                                                            |
| ------------- | ----------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selected      | `boolean`               | No       | `false`     | The current selection state of the choicebox. Bindable.                                                                                                                |
| mode          | `'radio' \| 'checkbox'` | No       | `'radio'`   | Controls the indicator style. `radio` shows a filled circle when selected, `checkbox` shows a checkmark box.                                                           |
| disabled      | `boolean`               | No       | `false`     | When true, the choicebox is non-interactive and visually dimmed.                                                                                                       |
| showIndicator | `boolean`               | No       | `true`      | Whether to render the radio dot / checkbox tick. Set false when the card supplies its own selected affordance.                                                         |
| testId        | `string`                | No       | `undefined` | Value for the `data-pw` attribute used in Playwright test selectors.                                                                                                   |
| classes       | `string`                | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| name          | `string`                | No       | `undefined` | Submits the card under this name inside a form. In `radio` mode a name also GROUPS the cards that share it — see [Form participation](#form-participation).            |
| value         | `string`                | No       | `'on'`      | Value submitted while selected.                                                                                                                                        |
| required      | `boolean`               | No       | `false`     | Makes an unselected card block submission. In a named `radio` group this is the native "pick one" rule over the whole group.                                           |
| form          | `string`                | No       | `undefined` | `id` of a form elsewhere in the document, for a card rendered outside it.                                                                                              |
| errorMessage  | `string \| null`        | No       | `undefined` | Text shown, and announced, when the control is in error. Referenced by `aria-describedby` on the group wrapping the control, and sets `aria-invalid` while present.    |
| infoMessage   | `string \| null`        | No       | `undefined` | Persistent helper text describing the control. Referenced the same way, so it is read before the user trips an error rather than only after.                           |
| invalid       | `boolean`               | No       | `false`     | Marks the control invalid without supplying a message, for a consumer driving validity from a server or its own rules.                                                 |

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

`onclick` is this element's only callback prop. It is a JS-property-only callback
(`choicebox.onclick = (selected) => ...`) and does not dispatch a DOM event: `click` is already
`HTMLElement`'s own native event, so a `choicebox.addEventListener('click', ...)` listener
already sees the real click that bubbles out of the shadow root on its own, and a synthetic one
under the same name would double-deliver it to that same listener. This holds even though
`extend: formAssociated(...)` (above) registers this element as a subclass — see
`src/wc/components/dispatch-chat-message-list-choicebox.test.ts` for a runtime assertion of it, not just this claim.

### Props (HTML Attributes)

| Attribute        | Maps to Prop    | Type    | Description                                                                                                                                                                            |
| ---------------- | --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selected`       | `selected`      | Boolean | Reflects the selection state.                                                                                                                                                          |
| `mode`           | `mode`          | String  | `radio` or `checkbox` indicator style.                                                                                                                                                 |
| `disabled`       | `disabled`      | Boolean | Disables interaction and dims the card.                                                                                                                                                |
| `show-indicator` | `showIndicator` | Boolean | Whether to render the radio dot / checkbox tick (default `true`). Boolean attributes are presence-based, so to hide the indicator set the `showIndicator` property to `false` from JS. |
| `test-id`        | `testId`        | String  | Sets `data-pw` on the card for Playwright selectors.                                                                                                                                   |
| `classes`        | `classes`       | String  | CSS classes applied to the card element.                                                                                                                                               |
| `error-message`  | `errorMessage`  | String  | Error text, referenced by `aria-describedby` on the card.                                                                                                                              |
| `info-message`   | `infoMessage`   | String  | Helper text, referenced the same way.                                                                                                                                                  |
| `invalid`        | `invalid`       | Boolean | Marks the card invalid without a message.                                                                                                                                              |
| `name`           | `name`          | String  | Submits the card under this name. See the note below on grouping.                                                                                                                      |
| `value`          | `value`         | String  | Value submitted while selected (default `'on'`).                                                                                                                                       |
| `required`       | `required`      | Boolean | Makes an unselected card block submission.                                                                                                                                             |
| `form`           | `form`          | String  | Has no effect on the element — see below.                                                                                                                                              |

`onclick` is a function prop — set it as a property from JS, not as an attribute.

### Form participation — what the element does and does not do

**It does submit.** `<sui-choicebox>` is form-associated through `ElementInternals`, so a
card with a `name` contributes to `FormData`, takes part in `form.reset()` and
`form.checkValidity()`, and matches `:invalid` on the host. `required` is enforced per
card by the browser.

**It does not group.** The exclusivity that `mode="radio"` gives the Svelte component —
selecting one card deselects its siblings, one tab stop for the set, Arrow/Home/End
moving between cards — is implemented by querying the sibling cards, and each
`<sui-choicebox>` is its own shadow root. Siblings cannot see one another, so:

```html
<!-- Both of these can be selected at once, and Tab stops on each. -->
<sui-choicebox mode="radio" name="plan" value="basic">…</sui-choicebox>
<sui-choicebox mode="radio" name="plan" value="pro">…</sui-choicebox>
```

`required` is likewise per card rather than the native "one of the group" rule, so a
required radio-mode element blocks submission until _that_ card is selected.

Until this is bridged, either drive exclusivity yourself from `onclick` (clearing
`selected` on the others), or use the Svelte `Choicebox` where you need a grouped radio
set. `<sui-radio>` already implements cross-root grouping and is the better choice for a
plain radio group.

**`form` does not work here.** The prop sets the `form` attribute on the control inside
the shadow root, which cannot reach a form in the host document. Place the element inside
its form instead; `ElementInternals` finds the owner from the DOM.

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
