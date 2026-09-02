# ChipInput

A free-text tag/chip input composed from `Input` and `Pill`. The user types into a draft field and commits the current text into a chip by pressing Enter or by blurring the field; each committed chip renders as a dismissible `Pill` with a click-to-remove control. The bindable `values` prop is the `string[]` of committed chips -- duplicate and empty entries are silently dropped on commit. Use it for tag lists, keyword entry, blocklists, or any freeform multi-value field where the set of values is unbounded and user-authored (as opposed to `SplitInput`, which is for a fixed number of structured, fixed-position fields).

## Usage

```svelte
<script>
  import { ChipInput } from '@juspay/svelte-ui-components';

  let productTags = $state(['sale', 'featured']);
</script>

<ChipInput bind:values={productTags} placeholder="Add tag…" testId="product-tags" />
```

```svelte
<script>
  import { ChipInput } from '@juspay/svelte-ui-components';

  let blockedEmails = $state([]);
</script>

<!-- disabled, with onadd/ondismiss for side effects beyond the bound array -->
<ChipInput
  bind:values={blockedEmails}
  placeholder="e.g. name@example.com"
  disabled={blockedEmails.length >= 10}
  onadd={(value) => console.log('added', value)}
  ondismiss={(value) => console.log('removed', value)}
/>
```

```svelte
<script>
  import { ChipInput } from '@juspay/svelte-ui-components';

  let productTags = $state(['sale', 'featured']);
</script>

<!-- opt-in in-place editing: click a chip to correct a typo instead of deleting and retyping -->
<ChipInput
  bind:values={productTags}
  editable
  testId="product-tags"
  onedit={(value, previousValue) => console.log(`${previousValue} -> ${value}`)}
/>
```

## Props

| Prop        | Type       | Required | Default        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ---------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| values      | `string[]` | Yes      | `[]`           | Bindable. The committed chips, in insertion order. Replaced with a new array by add/dismiss/edit (`values` is reassigned, not mutated in place -- do not rely on array reference identity); also settable externally.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ariaLabel   | `string`   | No       | `-`             | Accessible name for the draft field; ChipInput renders no visible label of its own.                                  |
| placeholder | `string`   | No       | `'Add value…'` | Placeholder text shown in the empty draft field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| disabled    | `boolean`  | No       | `false`        | Disables the draft field and hides each chip's dismiss control (chips remain visible, but cannot be added, removed, or edited).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| editable    | `boolean`  | No       | `false`        | Reach for this when a consumer's chips are prone to being ALMOST right -- a misspelled tag, a near-correct email -- and forcing a delete-and-retype round trip for every small correction would be annoying. When `true`, activating a committed chip (click, or Enter/Space once tabbed to it) swaps it for an inline text field pre-filled with its current value: Enter or blurring the field commits the edit back into `values`, Escape restores the original text and leaves `values` untouched. An edit that comes back blank or duplicates another chip is silently discarded, same as a blank/duplicate draft on add. Defaults to `false` -- chips stay display-only and the only way to change one is still to delete it and retype it, unchanged from before this prop existed. |
| testId      | `string`   | No       | `-`            | Base value for the `data-pw`/native `testid` attributes -- see the Test ids section below for the full derivation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| classes     | `string`   | No       | `-`            | CSS class string applied to the component's top-level element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Duplicate values

`ChipInput` is dedup-only by contract: `addChip` drops a value already present in `values`, so the component's own commit path never produces duplicate chips. `values` is bindable, so a caller can still assign an array containing duplicates directly -- if it does, dismissing a chip removes only the first matching occurrence, not every occurrence with that text. An in-place edit (see `editable`) follows the same contract: an edit that would collide with a _different_ existing chip is silently discarded, same as a blank/duplicate value on add.

### Test ids

Every chip, its dismiss control, and the draft/add field carry an id derived from `testId`, so a consuming app's specs keep a working locator per row after adopting `ChipInput` -- following the same `${testId}-<suffix>-<index>` derivation `Table` uses for its rows and cells:

| Element                                      | data-pw / testid                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Chip at position `index`                     | `` `${testId}-item-${index}` ``                                                   |
| That chip's dismiss control                  | `` `${testId}-item-${index}-dismiss` `` (Pill's own fixed suffix on the id above) |
| That chip's in-place edit field (`editable`) | `` `${testId}-item-${index}-edit` ``                                              |
| The draft/add field                          | `` `${testId}-add` ``                                                             |

These ids changed in 2.136.0. Before it the chip carried `${testId}-chip` and the draft field
`${testId}-input`; the positional `-item-${index}` form arrived with in-place editing so that a
chip and its edit field can be addressed individually. There is no alias for the old names, so a
consumer test suite upgrading across 2.136.0 repoints those two locators. 3.0.0 has since shipped,
so the rename sits behind a major boundary as well.

`index` is the chip's current position in `values`, so an id follows a chip's slot, not the chip's text -- deleting or editing an earlier chip shifts every later id down. Nothing is rendered when `testId` is unset (matches every other component in this library).

## Events

| Event     | Type                                             | Description                                                                                                                                                              |
| --------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onadd     | `(value: string) => void`                        | Fires after a chip is committed (Enter or blur) and appended to `values`. Not fired for a duplicate or blank draft.                                                      |
| ondismiss | `(value: string) => void`                        | Fires after a chip is removed and spliced out of `values`.                                                                                                               |
| onedit    | `(value: string, previousValue: string) => void` | Fires after an in-place edit (see `editable`) commits a value that actually changed. Not fired when the edit is cancelled (Escape) or committed with the text unchanged. |
| onchange  | `(values: string[]) => void`                     | Fires alongside `onadd`/`ondismiss`/`onedit`, after any of them has already updated `values`.                                                                            |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default                             | CSS Property    | Description                                                             |
| --------------------------------- | ----------------------------------- | --------------- | ----------------------------------------------------------------------- |
| `--chip-input-gap`                | `6px`                               | gap             | Spacing between chips and the draft field.                              |
| `--chip-input-flex-wrap`          | `wrap`                              | flex-wrap       | Whether chips wrap onto multiple lines.                                 |
| `--chip-input-align-items`        | `center`                            | align-items     | Cross-axis alignment of chips and the draft field.                      |
| `--chip-input-justify-content`    | `flex-start`                        | justify-content | Main-axis alignment of the chip/draft row.                              |
| `--chip-input-width`              | `100%`                              | width           | Width of the overall container.                                         |
| `--chip-input-draft-flex`         | `0 1 auto`                          | flex            | Flex sizing of the draft field's wrapper relative to the chips.         |
| `--chip-input-draft-width`        | `90px`                              | width           | Width of the draft field.                                               |
| `--chip-input-draft-height`       | `28px`                              | height          | Height of the draft field.                                              |
| `--chip-input-draft-border`       | `1px solid transparent`             | border          | Border of the draft field.                                              |
| `--chip-input-draft-radius`       | `4px`                               | border-radius   | Corner rounding of the draft field.                                     |
| `--chip-input-draft-focus-border` | `1px solid transparent`             | border          | Border of the draft field while focused.                                |
| `--chip-input-draft-padding`      | `0 2px`                             | padding         | Padding inside the draft field.                                         |
| `--chip-input-draft-font-size`    | `13px`                              | font-size       | Font size of the draft field's text.                                    |
| `--chip-input-pill-gap`           | `4px`                               | gap             | Gap between a chip's label and its dismiss control.                     |
| `--chip-input-pill-background`    | `#e0e0e0`                           | background      | Background color of each chip.                                          |
| `--chip-input-pill-color`         | `#333333`                           | color           | Text color of each chip.                                                |
| `--chip-input-pill-font-size`     | `13px`                              | font-size       | Font size of each chip's label.                                         |
| `--chip-input-pill-font-weight`   | `500`                               | font-weight     | Font weight of each chip's label.                                       |
| `--chip-input-pill-padding`       | `6px 10px`                          | padding         | Padding inside each chip.                                               |
| `--chip-input-pill-border-radius` | `999px`                             | border-radius   | Corner rounding of each chip.                                           |
| `--chip-input-pill-border`        | `none`                              | border          | Border of each chip.                                                    |
| `--chip-input-pill-max-width`     | (none)                              | max-width       | Maximum width of a chip before its label truncates with an ellipsis.    |
| `--chip-input-pill-dismiss-size`  | `14px`                              | width/height    | Size of the dismiss icon on each chip.                                  |
| `--chip-input-pill-dismiss-color` | `currentColor`                      | color           | Color of the dismiss icon on each chip.                                 |
| `--chip-input-edit-width`         | `110px`                             | width           | Width of the in-place edit field (`editable`).                          |
| `--chip-input-edit-height`        | `28px`                              | height          | Height of the in-place edit field.                                      |
| `--chip-input-edit-border`        | (`--chip-input-draft-border`)       | border          | Border of the in-place edit field.                                      |
| `--chip-input-edit-radius`        | (`--chip-input-draft-radius`)       | border-radius   | Corner rounding of the in-place edit field.                             |
| `--chip-input-edit-focus-border`  | (`--chip-input-draft-focus-border`) | border          | Border of the in-place edit field while focused.                        |
| `--chip-input-edit-font-size`     | (`--chip-input-draft-font-size`)    | font-size       | Font size of the in-place edit field's text.                            |
| `--chip-input-edit-padding`       | `0 8px`                             | padding         | Padding inside the in-place edit field.                                 |
| `--chip-input-edit-flex`          | `0 1 auto`                          | flex            | Flex sizing of the in-place edit field's wrapper relative to the chips. |

The `--chip-input-edit-*` tokens default from the same `--chip-input-draft-*` values the draft field uses (see the draft field's own tokens above), so theming the draft field also themes the edit field for free; override a `--chip-input-edit-*` token individually only when the edit field genuinely needs to diverge from the draft field.

## Internal Dependencies

- `Input` -- renders the draft text field that a user types a new chip's text into, and (when `editable` is set) the in-place edit field that replaces an activated chip.
- `Pill` -- renders each committed chip, in `dismissible` mode (except while `disabled`); also renders the click target that activates in-place editing when `editable` is set.

### Naming the control

ChipInput draws no label of its own, so a caption rendered beside it is not associated with the
field -- it reads on screen and is absent from the accessibility tree. Give the control the same
words:

```svelte
<span id="order-tags-caption">Blocked order tags</span>
<ChipInput bind:values={orderTags} ariaLabel="Blocked order tags" testId="order-tags" />
```

Prefer the caption's own wording over a different phrase: when the visible label and the
accessible name disagree, speech-input users cannot activate the control by saying what they
see (WCAG 2.5.3, Label in Name).

## Web component

Available as `<sui-chip-input>`. Import the web component build separately:

```html
<script type="module" src="https://juspay.github.io/svelte-ui-components/wc/index.js"></script>

<sui-chip-input aria-label="Product tags" placeholder="Add tag…" test-id="product-tags"></sui-chip-input>
```

`values` and `selected`-style array props are set as properties, not attributes:

```js
document.querySelector('sui-chip-input').values = ['sale', 'featured'];
```

`editable` is a boolean attribute (`<sui-chip-input editable>`); `onedit`, like `onadd`, `ondismiss`
and `onchange`, is a callback and is set as a property.

Attribute names are kebab-case: `aria-label`, `test-id`. `ariaLabel` is the one worth calling
out — ChipInput draws no label of its own, so without it the control reaches the accessibility
tree named only by its placeholder.

> Superseded: an earlier revision of this document stated ChipInput was deliberately Svelte-only
> with no custom element. That was accurate when written and is no longer true.
