<script lang="ts">
  import type { AxisProperties } from './types';
  import { defaultTickFormat } from './format';

  let {
    orientation,
    scale,
    tickCount = 5,
    tickFormat,
    showGridlines = false,
    gridlineLength = 0,
    label,
    rotateTicks = false,
    tickEvery = 1,
    labelOffset = 36,
    integerTicks = false,
    classes
  }: AxisProperties = $props();

  let format = $derived(tickFormat ?? defaultTickFormat);

  let isHorizontal = $derived(orientation === 'top' || orientation === 'bottom');

  let tickValues = $derived.by(() => {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
      return scale.ticks(tickCount, integerTicks);
    }
    if ('domain' in scale && Array.isArray(scale.domain)) {
      return scale.domain;
    }
    return [];
  });

  let isBand = $derived('bandwidth' in scale);
  let bandOffset = $derived(isBand && 'bandwidth' in scale ? scale.bandwidth / 2 : 0);

  function positionTick(tick: number | string): number {
    if ('bandwidth' in scale) {
      return scale(String(tick)) + bandOffset;
    }
    return scale(Number(tick)) + bandOffset;
  }

  const TICK_SIZE = 6;
</script>

<g
  class="axis axis-{orientation} {classes ?? ''}"
  data-pw={`axis-${orientation}`}
  testID={`axis-${orientation}`}
>
  {#if isHorizontal}
    <line class="axis-line" x1={scale.range[0]} x2={scale.range[1]} y1={0} y2={0} />
    {#each tickValues as tick, i (i)}
      {@const x = positionTick(tick)}
      <g class="tick" transform="translate({x}, 0)">
        <line class="tick-mark" y2={orientation === 'bottom' ? TICK_SIZE : -TICK_SIZE} />
        {#if i % tickEvery === 0}
          {#if rotateTicks && orientation === 'bottom'}
            <text
              class="tick-label"
              transform="translate(0, {TICK_SIZE + 4}) rotate(-45)"
              text-anchor="end"
              dominant-baseline="auto"
              data-pw={`tick-label-${i}`}
              testID={`tick-label-${i}`}
            >
              {format(tick)}
            </text>
          {:else}
            <text
              class="tick-label"
              y={orientation === 'bottom' ? TICK_SIZE + 4 : -(TICK_SIZE + 4)}
              text-anchor="middle"
              dominant-baseline={orientation === 'bottom' ? 'hanging' : 'auto'}
              data-pw={`tick-label-${i}`}
              testID={`tick-label-${i}`}
            >
              {format(tick)}
            </text>
          {/if}
        {/if}
        {#if showGridlines && gridlineLength > 0}
          <line
            class="gridline"
            y1={0}
            y2={orientation === 'bottom' ? -gridlineLength : gridlineLength}
          />
        {/if}
      </g>
    {/each}
    {#if label}
      <text
        class="axis-label"
        x={(scale.range[0] + scale.range[1]) / 2}
        y={orientation === 'bottom' ? labelOffset : -30}
        text-anchor="middle"
      >
        {label}
      </text>
    {/if}
  {:else}
    <line class="axis-line" y1={scale.range[0]} y2={scale.range[1]} x1={0} x2={0} />
    {#each tickValues as tick, i (i)}
      {@const y = positionTick(tick)}
      <g class="tick" transform="translate(0, {y})">
        <line class="tick-mark" x2={orientation === 'left' ? -TICK_SIZE : TICK_SIZE} />
        <text
          class="tick-label"
          x={orientation === 'left' ? -(TICK_SIZE + 4) : TICK_SIZE + 4}
          text-anchor={orientation === 'left' ? 'end' : 'start'}
          dominant-baseline="middle"
          data-pw={`tick-label-${i}`}
          testID={`tick-label-${i}`}
        >
          {format(tick)}
        </text>
        {#if showGridlines && gridlineLength > 0}
          <line
            class="gridline"
            x1={0}
            x2={orientation === 'left' ? gridlineLength : -gridlineLength}
          />
        {/if}
      </g>
    {/each}
    {#if label}
      <text
        class="axis-label"
        transform="rotate(-90)"
        x={-(scale.range[0] + scale.range[1]) / 2}
        y={orientation === 'left' ? -40 : 40}
        text-anchor="middle"
      >
        {label}
      </text>
    {/if}
  {/if}
</g>

<style>
  .axis-line {
    stroke: var(--chart-axis-color, light-dark(#666, #9ca3af));
    stroke-width: var(--chart-axis-stroke-width, 1);
  }

  .tick-mark {
    stroke: var(--chart-axis-color, light-dark(#666, #9ca3af));
    stroke-width: var(--chart-axis-stroke-width, 1);
  }

  .tick-label {
    fill: var(--chart-axis-color, light-dark(#666, #9ca3af));
    font-size: var(--chart-axis-font-size, 11px);
    font-family: var(--chart-axis-font-family, inherit);
  }

  .axis-label {
    fill: var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    font-size: var(--chart-axis-label-font-size, 12px);
    font-family: var(--chart-axis-font-family, inherit);
    font-weight: 500;
  }

  .gridline {
    stroke: var(--chart-gridline-color, light-dark(#e0e0e0, #374151));
    stroke-opacity: var(--chart-gridline-opacity, 0.5);
    stroke-dasharray: var(--chart-gridline-dash, 4 4);
  }
</style>
