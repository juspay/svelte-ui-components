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
    ariaLabel,
    ariaLabelledby,
    testId,
    onchange,
    oninput,
    classes,
    ariaValueText,
    name,
    form
  }: SliderProperties = $props();

  // Only the paint is clamped. The value stays exactly what the consumer passed, so a
  // slider handed a number outside its own bounds reports that number rather than
  // being silently corrected — but the track never renders a negative, >100% or NaN
  // fill. An unusable range (empty, reversed, non-finite, or one whose width or
  // quotient overflows to Infinity) has no meaningful fill, so it paints none.
  const percentage: number = $derived.by(() => {
    const span = max - min;
    if (![value, min, max, span].every((part) => Number.isFinite(part)) || span <= 0) {
      return 0;
    }
    const raw = ((value - min) / span) * 100;
    return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  });
  let displayValue = $derived(labelFormatter ? labelFormatter(value) : String(value));
  const valueText: string | null = $derived(
    typeof ariaValueText === 'string'
      ? ariaValueText
      : labelFormatter
        ? labelFormatter(value)
        : null
  );

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
    {name}
    form={typeof form === 'string' ? form : null}
    aria-valuetext={valueText}
    data-disabled={disabled ? '' : null}
    aria-label={typeof ariaLabel === 'string' ? ariaLabel : null}
    aria-labelledby={typeof ariaLabel === 'string' ? null : (ariaLabelledby ?? null)}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
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
      transform var(--slider-thumb-transition-duration, var(--motion-duration, 0.15s))
        var(--slider-thumb-transition-easing, var(--motion-easing, ease)),
      opacity var(--slider-thumb-transition-duration, var(--motion-duration, 0.15s))
        var(--slider-thumb-transition-easing, var(--motion-easing, ease));
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
      transform var(--slider-thumb-transition-duration, var(--motion-duration, 0.15s))
        var(--slider-thumb-transition-easing, var(--motion-easing, ease)),
      opacity var(--slider-thumb-transition-duration, var(--motion-duration, 0.15s))
        var(--slider-thumb-transition-easing, var(--motion-easing, ease));
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
