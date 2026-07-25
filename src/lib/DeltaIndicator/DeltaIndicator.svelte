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
  testID={typeof testId === 'string' ? testId : null}
>
  {#if !hideArrow && direction !== 'neutral'}
    <span class="delta-indicator-arrow delta-arrow-{direction}" aria-hidden="true">
      <svg viewBox="0 0 24 24"
        ><path d="M22 7L13.5 15.5L8.5 10.5L2 17" /><path d="M16 7H22V13" /></svg
      >
    </span>
  {:else if !hideArrow}
    <!-- Neutral/no-change glyph (design-system "— 0%" treatment): an em dash in
         place of the trend arrow, so a flat delta still reads as a stated state. -->
    <span class="delta-indicator-dash" aria-hidden="true">—</span>
  {/if}
  <span class="delta-indicator-text">{text}</span>
</span>

<style>
  .delta-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--delta-indicator-gap, 4px);
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

  /* The tone color is set on the wrapper; the text span must inherit it explicitly.
     A consumer's global `span { color }` rule (higher weight than inheritance) would
     otherwise repaint just the number a neutral text color — leaving only the arrow
     tinted and making up/down deltas read as colorless. */
  .delta-indicator-text {
    color: inherit;
  }

  .delta-indicator-arrow {
    display: inline-flex;
    width: var(--delta-indicator-arrow-size, 16px);
    height: var(--delta-indicator-arrow-size, 16px);
    flex-shrink: 0;
  }

  .delta-indicator-dash {
    color: inherit;
    flex-shrink: 0;
  }

  .delta-indicator-arrow svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: var(--delta-indicator-arrow-stroke-width, 2);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Down-trend mirrors the up-trend glyph vertically (line falling to the
     lower-right, arrowhead at the bottom-right) — the Untitled UI trend-down-01
     shape. A 180deg rotation would instead point down-left. */
  .delta-arrow-down {
    transform: scaleY(-1);
  }
</style>
