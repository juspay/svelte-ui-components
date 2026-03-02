<script lang="ts">
  import type { GaugeProperties } from './properties';

  let { value, showLabel = true, testId, classes }: GaugeProperties = $props();

  const VIEW_BOX = 100;
  const CENTER = VIEW_BOX / 2;
  const STROKE = 8;
  const RADIUS = (VIEW_BOX - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let clamped = $derived(Math.min(100, Math.max(0, value)));
  let offset = $derived(CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE);
</script>

<div class="gauge {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
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
    <div class="label">{Math.round(clamped)}%</div>
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
