<script lang="ts">
  import type { GaugeProperties } from './properties';

  let {
    value,
    max = 100,
    showLabel = true,
    labelFormatter,
    ariaLabel,
    testId,
    classes
  }: GaugeProperties = $props();

  const VIEW_BOX = 100;
  const CENTER = VIEW_BOX / 2;
  const STROKE = 8;
  const RADIUS = (VIEW_BOX - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Guard against max=0 (division by zero yields NaN or Infinity).
  // When max is 0 or negative the gauge renders empty (0%).
  let clamped = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
  let offset = $derived(CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE);
  // labelFormatter receives the raw (value, max) pair so callers have full
  // context. The built-in fallback shows the computed percentage string
  // (e.g. value=50, max=200 → "25%").
  let labelText = $derived(labelFormatter ? labelFormatter(value, max) : `${Math.round(clamped)}%`);
</script>

<div
  class="gauge {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role="progressbar"
  aria-valuenow={clamped}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={ariaLabel ?? labelText}
>
  <svg viewBox="0 0 {VIEW_BOX} {VIEW_BOX}">
    <circle class="track" cx={CENTER} cy={CENTER} r={RADIUS} fill="none" />
    <circle
      class="bar"
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      fill="none"
      stroke-dasharray={CIRCUMFERENCE}
      stroke-dashoffset={offset}
      stroke-linecap="round"
      transform="rotate(-90 {CENTER} {CENTER})"
    />
  </svg>
  {#if showLabel}
    <div class="label">{labelText}</div>
  {/if}
</div>

<style>
  .gauge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--gauge-size, 120px);
    height: var(--gauge-size, 120px);
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .track {
    stroke: var(--gauge-track-color, #e0e0e0);
    stroke-width: var(--gauge-stroke-width, 8);
  }

  .bar {
    stroke: var(--gauge-bar-color, #2196f3);
    stroke-width: var(--gauge-stroke-width, 8);
    transition: stroke-dashoffset var(--gauge-transition-duration, 0.3s) ease;
  }

  .label {
    position: absolute;
    font-size: var(--gauge-label-font-size, 24px);
    font-weight: var(--gauge-label-font-weight, 600);
    font-family: var(--gauge-label-font-family, inherit);
    color: var(--gauge-label-color, #333);
  }
</style>
