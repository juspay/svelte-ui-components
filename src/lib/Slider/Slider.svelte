<script lang="ts">
  import type { SliderProperties } from './properties';

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showValue = false,
    labelFormatter,
    testId,
    onchange,
    oninput,
    classes
  }: SliderProperties = $props();

  let percentage = $derived(((value - min) / (max - min)) * 100);
  let displayValue = $derived(labelFormatter ? labelFormatter(value) : String(value));

  function handleInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      value = Number(e.target.value);
      oninput?.(value);
    }
  }

  function handleChange(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      value = Number(e.target.value);
      onchange?.(value);
    }
  }
</script>

<div class="slider-container {classes ?? ''}" class:disabled>
  <input
    type="range"
    class="slider-input"
    {min}
    {max}
    {step}
    {value}
    {disabled}
    data-pw={typeof testId === 'string' ? testId : null}
    oninput={handleInput}
    onchange={handleChange}
    style="--slider-fill-percent: {percentage}%"
  />
  {#if showValue}
    <span class="slider-value">{displayValue}</span>
  {/if}
</div>

<style>
  .slider-container {
    display: flex;
    align-items: center;
    gap: 12px;
    width: var(--slider-container-width, 100%);
    padding: var(--slider-container-padding, 4px 0);
  }

  .slider-container.disabled {
    opacity: var(--slider-disabled-opacity, 0.5);
    cursor: var(--slider-disabled-cursor, not-allowed);
  }

  .slider-input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: var(--slider-track-height, 6px);
    border-radius: var(--slider-track-border-radius, var(--radius, 4px));
    background: var(
      --slider-track,
      linear-gradient(
        to right,
        var(--slider-track-active-color, #2196f3) 0%,
        var(--slider-track-active-color, #2196f3) var(--slider-fill-percent, 0%),
        var(--slider-track-background, #e0e0e0) var(--slider-fill-percent, 0%),
        var(--slider-track-background, #e0e0e0) 100%
      )
    );
    outline: none;
    transition: var(--slider-transition, background 0.2s ease);
    cursor: pointer;
  }

  .slider-container.disabled .slider-input {
    cursor: var(--slider-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--slider-thumb-size, 20px);
    height: var(--slider-thumb-size, 20px);
    border-radius: var(--slider-thumb-border-radius, 50%);
    background: var(--slider-thumb-background, #ffffff);
    border: var(--slider-thumb-border, 2px solid #2196f3);
    box-shadow: var(--slider-thumb-shadow, 0 1px 3px rgba(0, 0, 0, 0.2));
    opacity: var(--slider-thumb-opacity, 1);
    cursor: pointer;
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
  }

  .slider-input::-moz-range-thumb {
    width: var(--slider-thumb-size, 20px);
    height: var(--slider-thumb-size, 20px);
    border-radius: var(--slider-thumb-border-radius, 50%);
    background: var(--slider-thumb-background, #ffffff);
    border: var(--slider-thumb-border, 2px solid #2196f3);
    box-shadow: var(--slider-thumb-shadow, 0 1px 3px rgba(0, 0, 0, 0.2));
    opacity: var(--slider-thumb-opacity, 1);
    cursor: pointer;
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
  }

  .slider-input:hover::-webkit-slider-thumb {
    transform: scale(var(--slider-thumb-hover-scale, 1.15));
    opacity: var(--slider-thumb-hover-opacity, var(--slider-thumb-opacity, 1));
  }

  .slider-input:hover::-moz-range-thumb {
    transform: scale(var(--slider-thumb-hover-scale, 1.15));
    opacity: var(--slider-thumb-hover-opacity, var(--slider-thumb-opacity, 1));
  }

  .slider-input:focus-visible::-webkit-slider-thumb {
    outline: var(--slider-focus-ring, 2px solid #2196f3);
    outline-offset: 2px;
  }

  .slider-input:focus-visible::-moz-range-thumb {
    outline: var(--slider-focus-ring, 2px solid #2196f3);
    outline-offset: 2px;
  }

  .slider-input::-moz-range-track {
    height: var(--slider-track-height, 6px);
    border-radius: var(--slider-track-border-radius, var(--radius, 4px));
    background: transparent;
  }

  .slider-value {
    font-size: var(--slider-value-font-size, 14px);
    font-weight: var(--slider-value-font-weight, 500);
    color: var(--slider-value-color, #333333);
    white-space: nowrap;
  }
</style>
