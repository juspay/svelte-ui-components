<script lang="ts">
  import Input from '$lib/Input/Input.svelte';
  import Pill from '$lib/Pill/Pill.svelte';
  import type { ChipInputProperties } from './properties';

  let {
    values = $bindable([]),
    placeholder = 'Add value…',
    disabled = false,
    testId,
    classes,
    onadd,
    ondismiss,
    onchange
  }: ChipInputProperties = $props();

  let draft = $state('');

  function addChip(): void {
    const trimmed = draft.trim();
    draft = '';
    if (trimmed.length === 0 || values.includes(trimmed)) {
      return;
    }
    values = [...values, trimmed];
    onadd?.(trimmed);
    onchange?.([...values]);
  }

  function removeChip(chip: string): void {
    // values is dedup-only by construction (addChip rejects a value already present), so this
    // component's own commit path never produces duplicates. If a caller assigns `values`
    // directly through the bindable prop with a duplicate, remove only the first matching
    // occurrence rather than every occurrence with that text.
    const chipIndex = values.indexOf(chip);
    if (chipIndex === -1) {
      return;
    }
    values = [...values.slice(0, chipIndex), ...values.slice(chipIndex + 1)];
    ondismiss?.(chip);
    onchange?.([...values]);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      addChip();
    }
  }
</script>

<div class="chip-input {classes ?? ''}" data-pw={testId} testID={testId}>
  {#each values as chip (chip)}
    <Pill
      text={chip}
      classes="chip-input-pill"
      dismissible={!disabled}
      {disabled}
      ondismiss={() => removeChip(chip)}
      {...typeof testId === 'string' ? { testId: `${testId}-chip` } : {}}
    />
  {/each}
  <div class="chip-input-draft-wrap">
    <Input
      value={draft}
      {placeholder}
      dataType="text"
      name=""
      autoComplete="off"
      actionInput={false}
      disable={disabled}
      classes="chip-input-draft"
      onInput={(nextValue) => {
        draft = nextValue;
      }}
      onKeyDown={handleKeyDown}
      onBlur={addChip}
      {...typeof testId === 'string' ? { testId: `${testId}-input` } : {}}
    />
  </div>
</div>

<style>
  .chip-input {
    display: flex;
    flex-wrap: var(--chip-input-flex-wrap, wrap);
    align-items: var(--chip-input-align-items, center);
    justify-content: var(--chip-input-justify-content, flex-start);
    gap: var(--chip-input-gap, 6px);
    width: var(--chip-input-width, 100%);

    /* Capture the surrounding cascade's Pill and Input values under distinct names, so the
       per-token mappings below can fall back to them. This has to happen HERE, on the root, where
       --pill-* and --input-* have not yet been re-declared: reading them in the same declaration
       that sets them would be a custom-property cycle and would compute to invalid. Consumers that
       theme Pill/Input app-wide get chips that match the rest of their UI, instead of the library's
       own values overriding their theme.

       Every token that carries the chip's APPEARANCE is captured here — colour, type, spacing and
       shape alike. An app whose Pill is a 14px, 16px-radius chip was still getting 13px and a
       999px pill, because re-declaring a token on the element beats inheriting it no matter which
       property it is; restoring only the colours left the same bug in a less obvious place.
       Tokens the component owns STRUCTURALLY — the draft field's inline padding, margin and
       shadow, and its width/height — deliberately stay fixed, since those position the field among
       the chips rather than describe how it looks. */
    --chip-input-pill-background-default: var(--pill-background, #e0e0e0);
    --chip-input-pill-color-default: var(--pill-color, #333333);
    --chip-input-pill-dismiss-color-default: var(--pill-dismiss-color, currentColor);
    --chip-input-pill-font-size-default: var(--pill-font-size, 13px);
    --chip-input-pill-font-weight-default: var(--pill-font-weight, 500);
    --chip-input-pill-padding-default: var(--pill-padding, 6px 10px);
    --chip-input-pill-border-radius-default: var(--pill-border-radius, 999px);
    --chip-input-pill-border-default: var(--pill-border, none);
    --chip-input-pill-gap-default: var(--pill-gap, 4px);
    --chip-input-pill-dismiss-size-default: var(--pill-dismiss-size, 14px);
    --chip-input-pill-max-width-default: var(--pill-max-width);
    --chip-input-draft-border-default: var(--input-border, 1px solid transparent);
    --chip-input-draft-focus-border-default: var(--input-focus-border, 1px solid transparent);
    --chip-input-draft-radius-default: var(--input-radius, 4px);
    --chip-input-draft-font-size-default: var(--input-font-size, 13px);
  }

  .chip-input-draft-wrap {
    flex: var(--chip-input-draft-flex, 0 1 auto);
  }

  .chip-input :global(.chip-input-pill) {
    --pill-gap: var(--chip-input-pill-gap, var(--chip-input-pill-gap-default));
    --pill-background: var(--chip-input-pill-background, var(--chip-input-pill-background-default));
    --pill-color: var(--chip-input-pill-color, var(--chip-input-pill-color-default));
    --pill-font-size: var(--chip-input-pill-font-size, var(--chip-input-pill-font-size-default));
    --pill-font-weight: var(
      --chip-input-pill-font-weight,
      var(--chip-input-pill-font-weight-default)
    );
    --pill-padding: var(--chip-input-pill-padding, var(--chip-input-pill-padding-default));
    --pill-border-radius: var(
      --chip-input-pill-border-radius,
      var(--chip-input-pill-border-radius-default)
    );
    --pill-border: var(--chip-input-pill-border, var(--chip-input-pill-border-default));
    --pill-max-width: var(--chip-input-pill-max-width, var(--chip-input-pill-max-width-default));
    --pill-dismiss-size: var(
      --chip-input-pill-dismiss-size,
      var(--chip-input-pill-dismiss-size-default)
    );
    --pill-dismiss-color: var(
      --chip-input-pill-dismiss-color,
      var(--chip-input-pill-dismiss-color-default)
    );
  }

  .chip-input-draft-wrap :global(.chip-input-draft) {
    --input-width: var(--chip-input-draft-width, 90px);
    --input-height: var(--chip-input-draft-height, 28px);
    --input-border: var(--chip-input-draft-border, var(--chip-input-draft-border-default));
    --input-radius: var(--chip-input-draft-radius, var(--chip-input-draft-radius-default));
    --input-focus-border: var(
      --chip-input-draft-focus-border,
      var(--chip-input-draft-focus-border-default)
    );
    --input-font-size: var(--chip-input-draft-font-size, var(--chip-input-draft-font-size-default));

    /* Structural, not thematic: the draft field sits inline among the chips, so it keeps its own
       tight padding and no margin or shadow regardless of how the app themes Input elsewhere.
       Override them per-instance via --chip-input-draft-* if a layout genuinely needs it. */
    --input-padding: var(--chip-input-draft-padding, 0 2px);
    --input-margin: 0;
    --input-box-shadow: none;
  }
</style>
