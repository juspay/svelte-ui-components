<script lang="ts">
  import type { ProgressProperties } from './properties';

  let {
    value,
    max = 100,
    showLabel = false,
    ariaLabel,
    testId,
    classes
  }: ProgressProperties = $props();

  // `max` has to be a finite positive number for a percentage to mean
  // anything. A zero, negative, or non-finite max (an as-yet-unloaded total,
  // say) would make (value / max) NaN or Infinity and put "NaN" into
  // aria-valuenow, which is not a valid ARIA value -- and a non-finite value
  // has the same effect. Treat an unusable range as an empty (0%) bar
  // instead. `value` is guarded here too, not just `max`: a NaN value isn't
  // `< 0`, so it would otherwise slip past the isIndeterminate check below
  // and hit the same NaN-percentage path. This check is deliberately kept
  // independent of `isIndeterminate` below -- a negative `value` (e.g. -1)
  // still signals indeterminate on its own, even paired with an invalid
  // `max`, since indeterminate mode never reads `percentage` in the markup.
  let hasValidRange = $derived(Number.isFinite(value) && Number.isFinite(max) && max > 0);
  let percentage = $derived(hasValidRange ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
  let isIndeterminate = $derived(value < 0);
  // Rounded to 2 decimal places rather than the nearest whole number, so
  // aria-valuenow stays effectively in step with the bar's raw fractional
  // width (matching Gauge's convention of tying aria-valuenow to the raw
  // computed value, not the rounded display text). Full raw precision isn't
  // used because (value / max) * 100 can land on binary floating-point noise
  // like 55.00000000000001 -- rounding to 2 decimals clears that while still
  // keeping the value far closer to the bar's true width than whole numbers.
  let preciseValueNow = $derived(Math.round(percentage * 100) / 100);
  // Shared by the visible label and the aria-label fallback, mirroring
  // Gauge's labelText convention. "Loading" matches the aria-label
  // LoadingDots already uses for its own indeterminate role="status" element.
  let labelText = $derived(isIndeterminate ? 'Loading' : `${Math.round(percentage)}%`);
</script>

<div
  class="container {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role="progressbar"
  aria-valuenow={isIndeterminate ? null : preciseValueNow}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuetext={isIndeterminate ? 'indeterminate' : null}
  aria-busy={isIndeterminate ? true : null}
  aria-label={ariaLabel ?? labelText}
>
  <div class="track">
    <div
      class="bar"
      class:indeterminate={isIndeterminate}
      style:width={isIndeterminate ? null : `${percentage}%`}
    ></div>
  </div>
  {#if showLabel && !isIndeterminate}
    <div class="label">{labelText}</div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    width: var(--progress-container-width, 100%);
    padding: var(--progress-container-padding, 0);
    gap: var(--progress-container-gap, 8px);
  }

  .track {
    flex: 1;
    height: var(--progress-track-height, 8px);
    background: var(--progress-track-background, #e0e0e0);
    border-radius: var(--progress-track-border-radius, var(--radius, 4px));
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: var(--progress-bar-background, #2196f3);
    border-radius: var(--progress-bar-border-radius, var(--radius, 4px));
    transition: var(--progress-bar-transition, width 0.3s ease);
  }

  .bar.indeterminate {
    width: 30%;
    animation: indeterminate var(--progress-indeterminate-duration, 1.5s) ease-in-out infinite;
  }

  .label {
    font-size: var(--progress-label-font-size, 14px);
    font-weight: var(--progress-label-font-weight, 500);
    color: var(--progress-label-color, #333);
    font-family: var(--progress-label-font-family, inherit);
    margin: var(--progress-label-margin, 0);
  }

  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
</style>
