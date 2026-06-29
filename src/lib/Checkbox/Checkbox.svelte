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
    ariaControls
  }: CheckboxProperties = $props();

  function handleClick(): void {
    if (disabled) {
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
<label class="container {classes ?? ''}" class:disabled onclick={handleClick} data-pw={testId}>
  <input
    type="checkbox"
    class="native-checkbox"
    {checked}
    {disabled}
    tabindex={-1}
    aria-hidden="true"
    onclick={(e: MouseEvent) => e.stopPropagation()}
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
    onkeydown={handleKeyDown}
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
