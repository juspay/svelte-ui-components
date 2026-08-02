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

## Props

| Prop        | Type       | Required | Default        | Description                                                                                                        |
| ----------- | ---------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| values      | `string[]` | Yes      | `[]`            | Bindable. The committed chips, in insertion order. Replaced with a new array by add/dismiss (`values` is reassigned, not mutated in place -- do not rely on array reference identity); also settable externally.        |
| placeholder | `string`   | No       | `'Add value…'`  | Placeholder text shown in the empty draft field.                                                                     |
| disabled    | `boolean`  | No       | `false`         | Disables the draft field and hides each chip's dismiss control (chips remain visible, but cannot be added or removed). |
| testId      | `string`   | No       | `-`             | Value for the `data-pw`/native `testid` attributes on the container. Chips get `` `${testId}-chip` `` and the draft field gets `` `${testId}-input` ``. |
| classes     | `string`   | No       | `-`             | CSS class string applied to the component's top-level element.                                                      |

### Duplicate values

`ChipInput` is dedup-only by contract: `addChip` drops a value already present in `values`, so the component's own commit path never produces duplicate chips. `values` is bindable, so a caller can still assign an array containing duplicates directly -- if it does, dismissing a chip removes only the first matching occurrence, not every occurrence with that text.

## Events

| Event      | Type                          | Description                                                                                                    |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| onadd      | `(value: string) => void`     | Fires after a chip is committed (Enter or blur) and appended to `values`. Not fired for a duplicate or blank draft. |
| ondismiss  | `(value: string) => void`     | Fires after a chip is removed and spliced out of `values`.                                                       |
| onchange   | `(values: string[]) => void`  | Fires alongside `onadd`/`ondismiss`. Receives a copy of the current `values` array.                              |

## CSS Variables

Override these custom properties to theme the component.

| Variable                         | Default                    | CSS Property   | Description                                                        |
| --------------------------------- | --------------------------- | -------------- | -------------------------------------------------------------------- |
| `--chip-input-gap`                | `6px`                       | gap            | Spacing between chips and the draft field.                          |
| `--chip-input-flex-wrap`          | `wrap`                      | flex-wrap      | Whether chips wrap onto multiple lines.                             |
| `--chip-input-align-items`        | `center`                    | align-items    | Cross-axis alignment of chips and the draft field.                  |
| `--chip-input-justify-content`    | `flex-start`                | justify-content| Main-axis alignment of the chip/draft row.                          |
| `--chip-input-width`              | `100%`                      | width          | Width of the overall container.                                     |
| `--chip-input-draft-flex`         | `0 1 auto`                  | flex           | Flex sizing of the draft field's wrapper relative to the chips.     |
| `--chip-input-draft-width`        | `90px`                      | width          | Width of the draft field.                                           |
| `--chip-input-draft-height`       | `28px`                      | height         | Height of the draft field.                                          |
| `--chip-input-draft-border`       | `1px solid transparent`     | border         | Border of the draft field.                                          |
| `--chip-input-draft-radius`       | `4px`                       | border-radius  | Corner rounding of the draft field.                                 |
| `--chip-input-draft-focus-border` | `1px solid transparent`     | border         | Border of the draft field while focused.                            |
| `--chip-input-draft-padding`      | `0 2px`                     | padding        | Padding inside the draft field.                                     |
| `--chip-input-draft-font-size`    | `13px`                      | font-size      | Font size of the draft field's text.                                |
| `--chip-input-pill-gap`           | `4px`                       | gap            | Gap between a chip's label and its dismiss control.                 |
| `--chip-input-pill-background`    | `#e0e0e0`                   | background     | Background color of each chip.                                      |
| `--chip-input-pill-color`         | `#333333`                   | color          | Text color of each chip.                                            |
| `--chip-input-pill-font-size`     | `13px`                      | font-size      | Font size of each chip's label.                                     |
| `--chip-input-pill-font-weight`   | `500`                       | font-weight    | Font weight of each chip's label.                                   |
| `--chip-input-pill-padding`       | `6px 10px`                  | padding        | Padding inside each chip.                                           |
| `--chip-input-pill-border-radius` | `999px`                     | border-radius  | Corner rounding of each chip.                                       |
| `--chip-input-pill-border`        | `none`                      | border         | Border of each chip.                                                |
| `--chip-input-pill-max-width`     | (none)                      | max-width      | Maximum width of a chip before its label truncates with an ellipsis.|
| `--chip-input-pill-dismiss-size`  | `14px`                      | width/height   | Size of the dismiss icon on each chip.                               |
| `--chip-input-pill-dismiss-color` | `currentColor`              | color          | Color of the dismiss icon on each chip.                              |

## Internal Dependencies

- `Input` -- renders the draft text field that a user types a new chip's text into.
- `Pill` -- renders each committed chip, in `dismissible` mode (except while `disabled`).
