<script lang="ts">
  import type { RadioProperties } from './properties';

  let {
    name,
    value,
    selectedValue = $bindable(''),
    text = '',
    disabled = false,
    testId,
    onchange,
    classes
  }: RadioProperties = $props();

  let checked = $derived(selectedValue === value);

  function handleChange(): void {
    if (disabled) {
      return;
    }
    selectedValue = value;
    onchange?.(value);
  }
</script>

<label
  class="radio-container {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
>
  <input
    type="radio"
    class="radio-input"
    {name}
    {value}
    {checked}
    {disabled}
    onchange={handleChange}
  />
  <span class="radio-indicator" class:checked class:disabled>
    <span class="radio-dot" class:checked class:disabled></span>
  </span>
  {#if text.length > 0}
    <span class="radio-text" class:disabled>{text}</span>
  {/if}
</label>

<style>
  .radio-container {
    display: var(--radio-container-display, inline-flex);
    align-items: var(--radio-container-align-items, center);
    gap: var(--radio-container-gap, 8px);
    cursor: var(--radio-container-cursor, pointer);
    opacity: var(--radio-container-opacity, 1);
  }

  .radio-container.disabled {
    cursor: not-allowed;
  }

  .radio-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
    pointer-events: none;
  }

  .radio-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--radio-size, 20px);
    height: var(--radio-size, 20px);
    border: var(--radio-border, 2px solid #9e9e9e);
    border-radius: var(--radio-border-radius, 50%);
    background-color: var(--radio-background, #ffffff);
    transition: var(--radio-transition, 0.2s);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .radio-indicator.checked {
    border: var(--radio-selected-border, 2px solid #2196f3);
    background-color: var(--radio-selected-background, #ffffff);
  }

  .radio-indicator.disabled {
    border: var(--radio-disabled-border, 2px solid #cccccc);
    background-color: var(--radio-disabled-background, #f5f5f5);
  }

  .radio-container:not(.disabled):hover .radio-indicator:not(.checked) {
    border: var(--radio-hover-border, 2px solid #2196f3);
  }

  .radio-input:focus-visible + .radio-indicator {
    box-shadow: var(--radio-focus-shadow, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .radio-dot {
    width: 0;
    height: 0;
    border-radius: var(--radio-dot-border-radius, 50%);
    background-color: var(--radio-dot-color, #2196f3);
    transition: var(--radio-transition, 0.2s);
  }

  .radio-dot.checked {
    width: var(--radio-dot-size, 10px);
    height: var(--radio-dot-size, 10px);
  }

  .radio-dot.checked.disabled {
    background-color: var(--radio-disabled-dot-color, #cccccc);
  }

  .radio-text {
    font-size: var(--radio-text-font-size, 14px);
    font-weight: var(--radio-text-font-weight, 400);
    color: var(--radio-text-color, #333333);
  }

  .radio-text.disabled {
    color: var(--radio-disabled-text-color, #999999);
  }
</style>
