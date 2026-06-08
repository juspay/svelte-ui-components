<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';
  import type { RadioGroupItem, RadioGroupProperties } from './properties';

  let {
    name,
    items = [],
    selectedValue = $bindable(''),
    variant = 'radio',
    direction = 'vertical',
    disabled = false,
    testId,
    classes,
    onchange
  }: RadioGroupProperties = $props();

  const select = (value: string): void => {
    if (disabled) {
      return;
    }
    selectedValue = value;
    onchange?.(value);
  };

  // Per-item test id: explicit item.testId wins; else namespaced under the group
  // testId; else the item value itself (a stable, meaningful fallback).
  const itemTestId = (item: RadioGroupItem): string => {
    if (typeof item.testId === 'string') {
      return item.testId;
    }
    return typeof testId === 'string' ? `${testId}-${item.value}` : item.value;
  };

  const moveFocus = (currentIndex: number, key: string): number | null => {
    const total = items.length;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      return (currentIndex + 1) % total;
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      return (currentIndex - 1 + total) % total;
    }
    if (key === 'Home') {
      return 0;
    }
    if (key === 'End') {
      return total - 1;
    }
    return null;
  };

  // Radio variant: roving focus across the rendered <input type="radio"> elements.
  const handleRadioKeydown = (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }
  ): void => {
    if (disabled || items.length === 0) {
      return;
    }
    const inputs = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    );
    const currentIndex = inputs.findIndex((input) => input === document.activeElement);
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = moveFocus(currentIndex, event.key);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    select(items[nextIndex].value);
    inputs[nextIndex]?.focus();
  };

  // Segmented variant: roving focus across the rendered toggle buttons.
  const handleSegmentKeydown = (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement },
    index: number
  ): void => {
    if (disabled || items.length === 0) {
      return;
    }
    const nextIndex = moveFocus(index, event.key);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    select(items[nextIndex].value);
    const sibling = event.currentTarget.parentElement?.children[nextIndex];
    if (sibling instanceof HTMLElement) {
      sibling.focus();
    }
  };
</script>

{#if variant === 'segmented'}
  <div
    class="radio-group-segmented {classes ?? ''}"
    role="radiogroup"
    aria-label={name}
    data-pw={typeof testId === 'string' ? testId : null}
  >
    {#each items as item, index (item.value)}
      {@const active = item.value === selectedValue}
      <button
        type="button"
        class="radio-group-segment"
        class:active
        class:has-subtitle={item.subtitle}
        role="radio"
        aria-checked={active}
        disabled={disabled || item.disabled}
        tabindex={active || (selectedValue === '' && index === 0) ? 0 : -1}
        data-pw={itemTestId(item)}
        onclick={() => select(item.value)}
        onkeydown={(event) => handleSegmentKeydown(event, index)}
      >
        <span class="radio-group-segment-label">{item.label}</span>
        {#if item.subtitle}
          <span class="radio-group-segment-subtitle">{item.subtitle}</span>
        {/if}
      </button>
    {/each}
  </div>
{:else}
  <!-- tabindex={-1}: the container carries the radiogroup role but stays out of
       the tab order; the rendered radio inputs are the real tab stops. -->
  <div
    class="radio-group {direction === 'horizontal' ? 'horizontal' : 'vertical'} {classes ?? ''}"
    role="radiogroup"
    aria-label={name}
    tabindex={-1}
    data-pw={typeof testId === 'string' ? testId : null}
    onkeydown={handleRadioKeydown}
  >
    {#each items as item (item.value)}
      <Radio
        {name}
        value={item.value}
        bind:selectedValue
        text={item.label}
        disabled={disabled || item.disabled}
        testId={itemTestId(item)}
        onchange={select}
      />
    {/each}
  </div>
{/if}

<style>
  .radio-group {
    display: flex;
    gap: var(--radio-group-gap, 8px);
  }

  .radio-group.vertical {
    flex-direction: column;
  }

  .radio-group.horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .radio-group-segmented {
    display: flex;
    width: var(--radio-group-segmented-width, 100%);
    padding: var(--radio-group-segmented-padding, 2px);
    gap: var(--radio-group-segmented-gap, 2px);
    background: var(--radio-group-segmented-background, #f1f3f5);
    border: var(--radio-group-segmented-border, 1px solid #e0e0e0);
    border-radius: var(--radio-group-segmented-border-radius, 12px);
    box-sizing: border-box;
  }

  .radio-group-segment {
    appearance: none;
    flex: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--radio-group-segment-gap, 2px);
    height: var(--radio-group-segment-height, 28px);
    padding: var(--radio-group-segment-padding, 6px 12px);
    background: var(--radio-group-segment-background, transparent);
    border: none;
    border-radius: var(--radio-group-segment-border-radius, 8px);
    color: var(--radio-group-segment-color, #626262);
    font-size: var(--radio-group-segment-font-size, 13px);
    font-weight: var(--radio-group-segment-font-weight, 500);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  .radio-group-segment.has-subtitle {
    height: auto;
    padding: var(--radio-group-segment-padding-subtitle, 6px 16px);
    align-items: flex-start;
  }

  .radio-group-segment-subtitle {
    font-size: var(--radio-group-segment-subtitle-font-size, 11px);
    color: var(--radio-group-segment-subtitle-color, #8a8a8a);
  }

  .radio-group-segment.active {
    background: var(--radio-group-segment-active-background, #ffffff);
    color: var(--radio-group-segment-active-color, #1a1a1a);
    box-shadow: var(--radio-group-segment-active-shadow, 0 1px 2px rgba(0, 0, 0, 0.08));
  }

  .radio-group-segment.active .radio-group-segment-subtitle {
    color: var(--radio-group-segment-active-subtitle-color, #626262);
  }

  .radio-group-segment:not(.active):not(:disabled):hover {
    color: var(--radio-group-segment-hover-color, #1a1a1a);
  }

  .radio-group-segment:focus-visible {
    outline: var(--radio-group-segment-focus-outline, 2px solid #2196f3);
    outline-offset: 1px;
  }

  .radio-group-segment:disabled {
    cursor: not-allowed;
    opacity: var(--radio-group-segment-disabled-opacity, 0.5);
  }
</style>
