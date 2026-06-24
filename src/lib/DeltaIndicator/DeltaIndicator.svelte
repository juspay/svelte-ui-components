<script lang="ts">
  import type { DeltaIndicatorProperties, DeltaDirection } from './properties';

  let {
    value,
    format,
    invertColors = false,
    hideArrow = false,
    neutralThreshold = 0,
    testId,
    classes
  }: DeltaIndicatorProperties = $props();

  const defaultFormat = (input: number): string => `${Math.round(Math.abs(input))}%`;

  // A negative threshold would invert the neutral band and misclassify direction, so
  // clamp it to a non-negative value before the comparison math.
  const safeNeutralThreshold = $derived(Math.max(0, neutralThreshold));

  let direction = $derived<DeltaDirection>(
    value > safeNeutralThreshold ? 'up' : value < -safeNeutralThreshold ? 'down' : 'neutral'
  );

  // Tone drives the color. 'up' reads as positive by default; invertColors flips
  // the positive/negative tone for lower-is-better metrics. Neutral is always muted.
  let tone = $derived(
    direction === 'neutral'
      ? 'neutral'
      : (direction === 'up') !== invertColors
        ? 'positive'
        : 'negative'
  );

  let text = $derived((format ?? defaultFormat)(value));
</script>

<span
  class="delta-indicator delta-{tone} {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if !hideArrow && direction !== 'neutral'}
    <span class="delta-indicator-arrow delta-arrow-{direction}" aria-hidden="true">
      <svg viewBox="0 0 10 10"><path d="M5 1 L9 8 L1 8 Z" /></svg>
    </span>
  {/if}
  <span class="delta-indicator-text">{text}</span>
</span>

<style>
  .delta-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--delta-indicator-gap, 2px);
    font-size: var(--delta-indicator-font-size, 13px);
    font-weight: var(--delta-indicator-font-weight, 600);
    line-height: 1;
  }

  .delta-positive {
    color: var(--delta-indicator-positive-color, #1a9d6f);
  }

  .delta-negative {
    color: var(--delta-indicator-negative-color, #e5484d);
  }

  .delta-neutral {
    color: var(--delta-indicator-neutral-color, #8a8a8a);
  }

  .delta-indicator-arrow {
    display: inline-flex;
    width: var(--delta-indicator-arrow-size, 9px);
    height: var(--delta-indicator-arrow-size, 9px);
    flex-shrink: 0;
  }

  .delta-indicator-arrow svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  .delta-arrow-down {
    transform: rotate(180deg);
  }
</style>
