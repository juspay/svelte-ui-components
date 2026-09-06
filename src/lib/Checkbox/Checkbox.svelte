<script lang="ts">
  import type { CheckboxProperties } from './properties';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';

  let {
    text,
    checked = $bindable(false),
    disabled = false,
    indeterminate = $bindable(false),
    testId,
    checkedIcon,
    indeterminateIcon,
    onclick,
    classes,
    ariaControls,
    ariaLabel,
    controlled = false,
    attributes
  }: CheckboxProperties = $props();

  // Visible text wins over `ariaLabel`, which is what `properties.ts` has always
  // promised and what WCAG 2.5.3 requires: a control showing "Accept terms" must
  // carry that text in its accessible name, so letting an explicit label replace
  // it outright would swap the name a speech-input user says for one they cannot
  // see. `ariaLabel` names the box only when there is no visible text to use —
  // the icon-only and label-in-a-table-header cases it exists for.
  //
  // A blank `ariaLabel` is treated as absent rather than as an empty name, since
  // `aria-label=""` leaves the box unnamed, which is the bug this fixes.
  const accessibleName: string | null = $derived(
    text.length > 0
      ? text
      : typeof ariaLabel === 'string' && ariaLabel.trim() !== ''
        ? ariaLabel
        : null
  );

  function handleClick(): void {
    if (disabled) {
      return;
    }
    // Controlled: the parent owns the state and is told what the click asked
    // for. Nothing is flipped locally, so a parent that declines the change
    // (a controlled table selection that rejects a row) keeps the box, the
    // native input and aria-checked all agreeing with the value it passed.
    if (controlled) {
      onclick?.(!checked);
      return;
    }
    checked = !checked;
    if (indeterminate) {
      indeterminate = false;
    }
    onclick?.(checked);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- preventDefault stops the label's default activation from firing a synthesized
     click that re-toggles the native input AFTER handleClick has flipped the state,
     which left input.checked out of sync with the rendered box (and with
     :checked-based selectors/testing probes). State has one owner: handleClick. -->
<label
  class="container {classes ?? ''}"
  class:disabled
  onclick={(e: MouseEvent) => {
    e.preventDefault();
    handleClick();
  }}
  data-pw={testId}
  testID={testId}
>
  <input
    type="checkbox"
    class="native-checkbox"
    {checked}
    {disabled}
    tabindex={-1}
    aria-hidden="true"
    onclick={(e: MouseEvent) => e.stopPropagation()}
    data-pw={typeof testId === 'string' ? `${testId}-native-input` : null}
    testID={typeof testId === 'string' ? `${testId}-native-input` : null}
  />
  <span
    class="box"
    class:checked
    class:indeterminate
    role="checkbox"
    tabindex={disabled ? -1 : 0}
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-disabled={disabled}
    aria-controls={ariaControls ?? null}
    aria-label={accessibleName}
    onkeydown={handleKeyDown}
    data-pw={typeof testId === 'string' ? `${testId}-box` : null}
    testID={typeof testId === 'string' ? `${testId}-box` : null}
    {...attributes}
  >
    {#if checked && !indeterminate}
      {#if typeof checkedIcon === 'function'}
        {@render checkedIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <span class="icon">{@html checkmarkSvg}</span>
      {/if}
    {/if}
    {#if indeterminate}
      {#if typeof indeterminateIcon === 'function'}
        {@render indeterminateIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <span class="icon dash">{@html minusSvg}</span>
      {/if}
    {/if}
  </span>
  <span class="label" hidden={text.length === 0}>{text}</span>
</label>

<style>
  .container {
    display: var(--checkbox-container-display, inline-flex);
    align-items: var(--checkbox-container-align-items, center);
    gap: var(--checkbox-container-gap, 8px);
    cursor: var(--checkbox-container-cursor, pointer);
  }

  .container.disabled {
    opacity: var(--checkbox-disabled-opacity, 0.4);
    cursor: var(--checkbox-disabled-cursor, not-allowed);
  }

  .native-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-size, 20px);
    height: var(--checkbox-size, 20px);
    border: var(--checkbox-border, 2px solid #757575);
    border-radius: var(--checkbox-border-radius, var(--radius, 4px));
    background-color: var(--checkbox-background, transparent);
    transition:
      background-color var(--checkbox-transition, 0.2s),
      border var(--checkbox-transition, 0.2s);
    flex-shrink: 0;
  }

  .box:focus-visible {
    outline: none;
    box-shadow: var(--checkbox-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .container:not(.disabled) .box:hover {
    border-color: var(--checkbox-hover-border-color, #212121);
  }

  .box.checked {
    background-color: var(--checkbox-checked-background, #2196f3);
    border: var(--checkbox-checked-border, 2px solid #2196f3);
  }

  .box.indeterminate {
    background-color: var(--checkbox-indeterminate-background, #2196f3);
    border: var(--checkbox-indeterminate-border, 2px solid #2196f3);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-icon-size, 14px);
    height: var(--checkbox-icon-size, 14px);
    color: var(--checkbox-checkmark-color, white);
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon.dash {
    color: var(--checkbox-dash-color, white);
  }

  .label {
    font-size: var(--checkbox-label-font-size, 14px);
    font-weight: var(--checkbox-label-font-weight, 400);
    color: var(--checkbox-label-color, #212121);
  }
</style>
