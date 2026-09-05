<script lang="ts">
  import Input from '$lib/Input/Input.svelte';
  import Pill from '$lib/Pill/Pill.svelte';
  import type { ChipInputProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    values = $bindable([]),
    ariaLabel,
    placeholder = 'Add value…',
    disabled = false,
    editable = false,
    testId,
    classes,
    onadd: onaddProp,
    onAdd,
    ondismiss: ondismissProp,
    onDismiss,
    onedit: oneditProp,
    onEdit,
    onchange: onchangeProp,
    onChange
  }: ChipInputProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onadd = $derived(resolveDeprecatedProp('ChipInput', 'onAdd', 'onadd', onAdd, onaddProp));
  const onchange = $derived(
    resolveDeprecatedProp('ChipInput', 'onChange', 'onchange', onChange, onchangeProp)
  );
  const ondismiss = $derived(
    resolveDeprecatedProp('ChipInput', 'onDismiss', 'ondismiss', onDismiss, ondismissProp)
  );
  const onedit = $derived(
    resolveDeprecatedProp('ChipInput', 'onEdit', 'onedit', onEdit, oneditProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onadd, onchange, ondismiss, onedit);
  });

  let draft = $state('');

  // The chip currently swapped for an inline edit field, held by VALUE rather than by slot
  // index. `values` is dedup-only by construction, so the text is a stable identity, and it is
  // already what the {#each} is keyed by. An index is only a position: if the parent reorders or
  // removes entries while an edit is open, the same index points at a different chip and the
  // commit lands on the wrong one. Only one chip can be mid-edit at a time.
  let editingChip = $state<string | null>(null);
  let editDraft = $state('');
  let editInputRef = $state<{ focus: () => void } | null>(null);

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
    // Identity survives a delete elsewhere in the list, so only the edited chip's own removal
    // has to close the field. No index fix-up is needed.
    if (editingChip === chip) {
      cancelEdit();
    }
    ondismiss?.(chip);
    onchange?.([...values]);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      addChip();
    }
  }

  function startEdit(chip: string): void {
    if (disabled) {
      return;
    }
    editingChip = chip;
    editDraft = chip;
    queueMicrotask(() => editInputRef?.focus());
  }

  function cancelEdit(): void {
    editingChip = null;
    editDraft = '';
  }

  // A commit is only ever valid while the component is enabled and the chip it started on is
  // still present. `disabled` can flip mid-edit, and a pending blur can arrive after it does.
  //
  // Together with the `!disabled` guard on the edit field's {#if}, this is what makes disabling
  // mid-edit safe without an $effect: the field stops rendering, and any Enter or blur already in
  // flight is refused here rather than writing to `values` behind a disabled control.
  function commitEdit(chip: string): void {
    if (disabled) {
      cancelEdit();
      return;
    }
    const index = values.indexOf(chip);
    if (index === -1) {
      cancelEdit();
      return;
    }
    const original = chip;
    const trimmed = editDraft.trim();
    const isUnchanged = trimmed === original;
    // Mirrors addChip's dedup-only contract: a blank edit or one that collides with a
    // DIFFERENT existing chip is silently discarded rather than surfaced as an error.
    const isBlankOrDuplicate = trimmed.length === 0 || (!isUnchanged && values.includes(trimmed));
    if (isUnchanged || isBlankOrDuplicate) {
      cancelEdit();
      return;
    }
    values = values.map((value, valueIndex) => (valueIndex === index ? trimmed : value));
    onedit?.(trimmed, original);
    onchange?.([...values]);
    cancelEdit();
  }

  function handleEditKeyDown(event: KeyboardEvent, chip: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEdit(chip);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }

  function handleEditBlur(chip: string): void {
    if (editingChip !== chip) {
      // Already resolved (Escape, or the chip removed) before this trailing blur arrived --
      // committing again would act on an edit that is no longer open.
      return;
    }
    commitEdit(chip);
  }
</script>

<div class="chip-input {classes ?? ''}" data-pw={testId} testID={testId}>
  {#each values as chip, index (chip)}
    {#if editable && editingChip === chip && !disabled}
      <div class="chip-input-edit-wrap">
        <Input
          value={editDraft}
          dataType="text"
          name=""
          autoComplete="off"
          actionInput={false}
          classes="chip-input-edit"
          bind:this={editInputRef}
          oninput={(nextValue) => {
            editDraft = nextValue;
          }}
          onkeydown={(event) => handleEditKeyDown(event, chip)}
          onblur={() => handleEditBlur(chip)}
          {...typeof testId === 'string' ? { testId: `${testId}-item-${index}-edit` } : {}}
        />
      </div>
    {:else}
      <Pill
        text={chip}
        classes="chip-input-pill"
        dismissible={!disabled}
        {disabled}
        ondismiss={() => removeChip(chip)}
        {...editable && !disabled
          ? { title: `Edit "${chip}"`, onclick: () => startEdit(chip) }
          : {}}
        {...typeof testId === 'string' ? { testId: `${testId}-item-${index}` } : {}}
      />
    {/if}
  {/each}
  <div class="chip-input-draft-wrap">
    <Input
      value={draft}
      {placeholder}
      dataType="text"
      name=""
      {ariaLabel}
      autoComplete="off"
      actionInput={false}
      disable={disabled}
      classes="chip-input-draft"
      oninput={(nextValue) => {
        draft = nextValue;
      }}
      onkeydown={handleKeyDown}
      onblur={addChip}
      {...typeof testId === 'string' ? { testId: `${testId}-add` } : {}}
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

  .chip-input-edit-wrap {
    flex: var(--chip-input-edit-flex, 0 1 auto);
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

  /* The in-place edit field replaces a Pill for the duration of one edit, so it reuses the same
     captured --input-* cascade (--chip-input-draft-*-default, above) the draft field maps from --
     an app that themes Input app-wide gets a matching edit field for free. Only sizing/padding
     get their own --chip-input-edit-* tokens: the field holds an EXISTING (often longer) value
     rather than a short in-progress draft, so it defaults wider. */
  .chip-input-edit-wrap :global(.chip-input-edit) {
    --input-width: var(--chip-input-edit-width, 110px);
    --input-height: var(--chip-input-edit-height, 28px);
    /* Fall through the DRAFT token before the captured default: the edit field is the same
       control as the draft field, wearing the same clothes, so a consumer who themed the draft
       with --chip-input-draft-* must get a matching edit field without naming it twice. */
    --input-border: var(
      --chip-input-edit-border,
      var(--chip-input-draft-border, var(--chip-input-draft-border-default))
    );
    --input-radius: var(
      --chip-input-edit-radius,
      var(--chip-input-draft-radius, var(--chip-input-draft-radius-default))
    );
    --input-focus-border: var(
      --chip-input-edit-focus-border,
      var(--chip-input-draft-focus-border, var(--chip-input-draft-focus-border-default))
    );
    --input-font-size: var(
      --chip-input-edit-font-size,
      var(--chip-input-draft-font-size, var(--chip-input-draft-font-size-default))
    );
    --input-padding: var(--chip-input-edit-padding, 0 8px);
    --input-margin: 0;
    --input-box-shadow: none;
  }
</style>
