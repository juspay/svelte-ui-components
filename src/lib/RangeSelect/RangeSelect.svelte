<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../Button/Button.svelte';
  import type { RangeSelectProperties, RangeValue } from './properties';

  let {
    min,
    max,
    placeholder = 'Select range',
    minLabel = 'Min',
    maxLabel = 'Max',
    testId,
    classes,
    onapply
  }: RangeSelectProperties = $props();

  let isOpen = $state(false);
  let draftMin: number | null = $state(min ?? null);
  let draftMax: number | null = $state(max ?? null);
  let containerEl: HTMLDivElement | null = $state(null);

  let triggerLabel = $derived.by((): string => {
    const hasMin = typeof min === 'number';
    const hasMax = typeof max === 'number';
    if (hasMin && hasMax) {
      return `${min} – ${max}`;
    }
    if (hasMin) {
      return `≥ ${min}`;
    }
    if (hasMax) {
      return `≤ ${max}`;
    }
    return placeholder;
  });

  let isPlaceholder = $derived(typeof min !== 'number' && typeof max !== 'number');

  const handleTriggerClick = (): void => {
    if (isOpen) {
      handleCancel();
    } else {
      draftMin = min ?? null;
      draftMax = max ?? null;
      isOpen = true;
    }
  };

  const handleApply = (): void => {
    const range: RangeValue = { min: draftMin, max: draftMax };
    onapply?.(range);
    isOpen = false;
  };

  const handleCancel = (): void => {
    draftMin = min ?? null;
    draftMax = max ?? null;
    isOpen = false;
  };

  const handleMinInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const parsed = parseFloat(target.value);
    draftMin = target.value === '' ? null : isNaN(parsed) ? null : parsed;
  };

  const handleMaxInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const parsed = parseFloat(target.value);
    draftMax = target.value === '' ? null : isNaN(parsed) ? null : parsed;
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && isOpen) {
      handleCancel();
    }
  };

  const handleClickOutside = (event: Event): void => {
    if (
      event.target instanceof Node &&
      containerEl !== null &&
      !containerEl.contains(event.target)
    ) {
      handleCancel();
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div
  class="range-select {classes ?? ''}"
  class:open={isOpen}
  bind:this={containerEl}
  onkeydown={handleKeydown}
  role="none"
  {...typeof testId === 'string' ? { 'data-pw': testId } : {}}
>
  <button
    class="range-select-trigger"
    class:range-select-placeholder={isPlaceholder}
    onclick={handleTriggerClick}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    type="button"
  >
    <span class="range-select-trigger-label">{triggerLabel}</span>
    <span class="range-select-trigger-arrow" aria-hidden="true">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 4L6 8L10 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </button>

  {#if isOpen}
    <div class="range-select-popover" role="dialog" aria-label="Select range">
      <div class="range-select-fields">
        <div class="range-select-field">
          <label class="range-select-field-label" for="range-select-min">
            {minLabel}
          </label>
          <input
            id="range-select-min"
            class="range-select-input"
            type="number"
            value={draftMin ?? ''}
            oninput={handleMinInput}
            placeholder={minLabel}
            aria-label={minLabel}
          />
        </div>
        <div class="range-select-field">
          <label class="range-select-field-label" for="range-select-max">
            {maxLabel}
          </label>
          <input
            id="range-select-max"
            class="range-select-input"
            type="number"
            value={draftMax ?? ''}
            oninput={handleMaxInput}
            placeholder={maxLabel}
            aria-label={maxLabel}
          />
        </div>
      </div>
      <div class="range-select-actions">
        <Button text="Cancel" classes="range-select-cancel-btn" onclick={handleCancel} />
        <Button text="Apply" classes="range-select-apply-btn" onclick={handleApply} />
      </div>
    </div>
  {/if}
</div>

<style>
  .range-select {
    position: relative;
    display: inline-block;
    width: var(--range-select-width, fit-content);
  }

  .range-select-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--range-select-trigger-gap, 8px);
    padding: var(--range-select-trigger-padding, 8px 12px);
    background: var(--range-select-trigger-background, #ffffff);
    border: var(--range-select-trigger-border, 1px solid #cccccc);
    border-radius: var(--range-select-trigger-radius, 6px);
    color: var(--range-select-trigger-color, #333333);
    cursor: pointer;
    outline: none;
    white-space: nowrap;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .range-select-trigger:hover {
    border-color: var(--range-select-trigger-hover-border-color, #999999);
  }

  .range-select-trigger:focus-visible,
  .range-select.open .range-select-trigger {
    border-color: var(--range-select-trigger-focus-border-color, #2563eb);
    box-shadow: var(--range-select-trigger-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.2));
  }

  .range-select-placeholder .range-select-trigger-label {
    color: var(--range-select-trigger-placeholder-color, #999999);
  }

  .range-select-trigger-label {
    flex: 1;
  }

  .range-select-trigger-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--range-select-trigger-arrow-color, #666666);
    transition: transform 0.15s;
  }

  .range-select.open .range-select-trigger-arrow {
    transform: rotate(180deg);
  }

  .range-select-popover {
    position: absolute;
    top: calc(100% + var(--range-select-popover-gap, 4px));
    left: 0;
    min-width: var(--range-select-popover-min-width, 200px);
    background: var(--range-select-popover-background, #ffffff);
    border: var(--range-select-popover-border, 1px solid #e0e0e0);
    border-radius: var(--range-select-popover-radius, 8px);
    box-shadow: var(--range-select-popover-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
    padding: var(--range-select-popover-padding, 12px);
    display: flex;
    flex-direction: column;
    gap: var(--range-select-popover-gap-inner, 12px);
    z-index: var(--range-select-popover-z-index, 100);
  }

  .range-select-fields {
    display: flex;
    gap: var(--range-select-fields-gap, 8px);
  }

  .range-select-field {
    display: flex;
    flex-direction: column;
    gap: var(--range-select-field-gap, 4px);
    flex: 1;
    min-width: 0;
  }

  .range-select-field-label {
    color: var(--range-select-label-color, #666666);
  }

  .range-select-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--range-select-input-padding, 6px 8px);
    background: var(--range-select-input-background, #f9f9f9);
    border: var(--range-select-input-border, 1px solid #cccccc);
    border-radius: var(--range-select-input-radius, 4px);
    color: var(--range-select-input-color, #333333);
    outline: none;
    transition: border-color 0.15s;
  }

  .range-select-input:focus {
    border-color: var(--range-select-input-focus-border-color, #2563eb);
    box-shadow: var(--range-select-input-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.15));
  }

  .range-select-input::-webkit-inner-spin-button,
  .range-select-input::-webkit-outer-spin-button {
    opacity: 0.6;
  }

  .range-select-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--range-select-actions-gap, 8px);
  }

  .range-select-actions :global(.range-select-cancel-btn) {
    --button-color: var(--range-select-cancel-btn-color, transparent);
    --button-text-color: var(--range-select-cancel-btn-text-color, #555555);
    --button-border: var(--range-select-cancel-btn-border, 1px solid #cccccc);
    --button-border-radius: var(--range-select-cancel-btn-radius, 4px);
    --button-padding: var(--range-select-cancel-btn-padding, 6px 12px);
    --button-hover-color: var(--range-select-cancel-btn-hover-color, #f5f5f5);
    --button-hover-text-color: var(--range-select-cancel-btn-text-color, #555555);
    --button-hover-border: var(--range-select-cancel-btn-border, 1px solid #cccccc);
  }

  .range-select-actions :global(.range-select-apply-btn) {
    --button-color: var(--range-select-apply-btn-color, #2563eb);
    --button-text-color: var(--range-select-apply-btn-text-color, #ffffff);
    --button-border-radius: var(--range-select-apply-btn-radius, 4px);
    --button-padding: var(--range-select-apply-btn-padding, 6px 12px);
    --button-hover-color: var(--range-select-apply-btn-hover-color, #1d4ed8);
    --button-hover-text-color: var(--range-select-apply-btn-text-color, #ffffff);
  }
</style>
