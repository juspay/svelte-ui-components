# Composing a range picker

Recipe for a "value range" or "filter range" picker — a trigger button that opens a popover with two number inputs (min/max) and Apply/Cancel actions.

This is a composition of primitives the library already ships. PR [#209](https://github.com/juspay/svelte-ui-components/pull/209) proposed a `RangeSelect` component that wrapped these same four primitives with baked-in Apply/Cancel labels and a fixed blue palette — same bucket as `InfoBlock` ([#200](https://github.com/juspay/svelte-ui-components/pull/200)), `ActionBar` ([#201](https://github.com/juspay/svelte-ui-components/pull/201)), `DescriptiveTile` ([#225](https://github.com/juspay/svelte-ui-components/pull/225)). The library's preferred shape is consumer-composed.

## Primitives used

| Primitive | Role |
|---|---|
| `Button` | Trigger that opens the popover and displays the current range |
| `Popover` | The floating panel that contains the inputs and actions |
| `NumberInput` (×2) | The min and max value editors |
| `Button` (×2) | Apply / Cancel inside the popover footer |

## Component

```svelte
<script lang="ts">
  import { Button, Popover, NumberInput } from '@juspay/svelte-ui-components';

  type RangePickerProps = {
    min: number | null;
    max: number | null;
    label?: string;
    onapply: (range: { min: number | null; max: number | null }) => void;
  };

  let { min, max, label = 'Range', onapply }: RangePickerProps = $props();

  let open = $state(false);
  let draftMin: number | null = $state(min);
  let draftMax: number | null = $state(max);

  function openPicker() {
    draftMin = min;
    draftMax = max;
    open = true;
  }

  function apply() {
    onapply({ min: draftMin, max: draftMax });
    open = false;
  }

  function cancel() {
    open = false;
  }

  function formatRange() {
    if (min === null && max === null) {
      return label;
    }
    if (min !== null && max !== null) {
      return `${min} – ${max}`;
    }
    if (min !== null) {
      return `≥ ${min}`;
    }
    return `≤ ${max}`;
  }
</script>

<Popover bind:open>
  {#snippet trigger()}
    <Button onclick={openPicker}>{formatRange()}</Button>
  {/snippet}

  <div class="range-picker-body">
    <div class="range-picker-inputs">
      <NumberInput bind:value={draftMin} placeholder="Min" />
      <span class="range-picker-separator">–</span>
      <NumberInput bind:value={draftMax} placeholder="Max" />
    </div>
    <div class="range-picker-actions">
      <Button onclick={cancel}>Cancel</Button>
      <Button onclick={apply}>Apply</Button>
    </div>
  </div>
</Popover>

<style>
  .range-picker-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    min-width: 240px;
  }

  .range-picker-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .range-picker-separator {
    color: var(--range-picker-separator-color, #888);
  }

  .range-picker-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
```

## Why no component?

A `RangeSelect` primitive would have to bake in:

- Apply / Cancel button labels (English only, no i18n hook)
- A particular layout (inline vs stacked)
- A palette (the original PR used a blue `#2563eb` default — see PR #199's lesson on hardcoded palette)
- The decision of whether the picker is required to have both bounds or accepts open ranges

Every consumer would then fight those defaults via `classes` / CSS-var overrides — which is the symptom GUIDELINES §9 flags as evidence the surface belongs in user space. The 50 lines above are the entire "component" and they live in the consumer's repo, fully owned, fully customisable.

## Variations

**Slider instead of NumberInput** — if you want drag-to-set, replace the two `<NumberInput>` with a true dual-thumb range slider (a real primitive worth adding if it does not exist yet). The composition pattern stays the same.

**Currency / unit suffix** — wrap each `<NumberInput>` in a flex row with a `<span>` for the unit. The Library does not need a `RangeSelectWithUnit` variant.

**Validation** — derive `isValid = draftMin === null || draftMax === null || draftMin <= draftMax` and disable the Apply button when false. Surface inline error text from a `<p>` in the body.

## Accessibility

- The `Popover` handles focus trap and Escape-to-close.
- Give the trigger `<Button>` an `aria-label` if `formatRange()` returns a non-descriptive value (e.g., just numbers).
- Both `<NumberInput>` instances should carry a label via the `label` prop (omitted above for brevity).
