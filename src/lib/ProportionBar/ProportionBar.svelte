<script lang="ts">
  /**
   * ProportionBar — a horizontal stacked bar that visualises how a total is
   * distributed across labelled segments. Renders proportional coloured bands in
   * an SVG track with an optional legend. Each band's width is derived from its
   * `value` relative to the sum of all segments; non-finite or negative values
   * are treated as zero so the rendered widths always stay within 0–100%.
   *
   * @example
   * ```svelte
   * <ProportionBar
   *   segments={[
   *     { label: 'UPI', value: 480 },
   *     { label: 'Cards', value: 220 }
   *   ]}
   * />
   * ```
   *
   * @see docs/ProportionBar.md
   */
  import type { ProportionBarProperties, ProportionBarSegment } from './properties';

  const DEFAULT_PALETTE = ['#8F49DE', '#FFC533', '#62D5C0', '#FF74CD', '#D1E7FF'];

  let {
    segments,
    showLegend = true,
    valueFormat,
    trackHeight,
    testId,
    classes
  }: ProportionBarProperties = $props();

  const resolveColor = (segment: ProportionBarSegment, index: number): string => {
    if (typeof segment.color === 'string' && segment.color.length > 0) {
      return segment.color;
    }
    return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
  };

  /** Reject negative or non-finite values so derived percentages stay within 0–100. */
  const sanitizeValue = (value: number): number =>
    Number.isFinite(value) && value > 0 ? value : 0;

  const total = $derived(segments.reduce((sum, segment) => sum + sanitizeValue(segment.value), 0));

  const computedSegments = $derived(
    segments.map((segment, segmentIndex) => {
      const safeValue = sanitizeValue(segment.value);
      const percent = total > 0 ? (safeValue / total) * 100 : 0;
      return {
        label: segment.label,
        value: safeValue,
        percent,
        color: resolveColor(segment, segmentIndex)
      };
    })
  );

  const defaultFormat = (absoluteValue: number, percent: number): string =>
    `${absoluteValue.toLocaleString()} (${Math.round(percent)}%)`;

  const formatValue = (absoluteValue: number, percent: number): string =>
    (valueFormat ?? defaultFormat)(absoluteValue, percent);

  /**
   * Comma-joined "label: value (percent)" summary. Used as the SVG's accessible
   * name when the legend is hidden, so screen-reader users still get the full
   * breakdown even though the bands themselves are presentational.
   */
  const ariaSummary = $derived(
    computedSegments
      .map(
        (computedSegment) =>
          `${computedSegment.label}: ${formatValue(computedSegment.value, computedSegment.percent)}`
      )
      .join(', ')
  );

  /** Cumulative x offsets for SVG rect positions. */
  const rectSegments = $derived(
    computedSegments.reduce<{ x: number; width: number; color: string }[]>(
      (acc, computedSegment) => {
        const previousX = acc.length > 0 ? acc[acc.length - 1].x + acc[acc.length - 1].width : 0;
        acc.push({ x: previousX, width: computedSegment.percent, color: computedSegment.color });
        return acc;
      },
      []
    )
  );

  const trackHeightStyle = $derived(
    typeof trackHeight === 'string' && trackHeight.length > 0
      ? `--proportion-bar-track-height: ${trackHeight};`
      : ''
  );
</script>

<div
  class="proportion-bar {classes ?? ''}"
  style={trackHeightStyle}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="proportion-bar-track">
    <svg
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      class="proportion-bar-svg"
      role={showLegend ? null : 'img'}
      aria-hidden={showLegend ? 'true' : null}
      aria-label={showLegend ? null : ariaSummary}
      data-pw={typeof testId === 'string' ? `${testId}-svg` : null}
      testID={typeof testId === 'string' ? `${testId}-svg` : null}
    >
      {#each rectSegments as rectSegment, rectIndex (rectIndex)}
        <rect
          x={rectSegment.x}
          y={0}
          width={rectSegment.width}
          height={10}
          fill={rectSegment.color}
        >
          <title
            >{computedSegments[rectIndex].label}: {formatValue(
              computedSegments[rectIndex].value,
              computedSegments[rectIndex].percent
            )}</title
          >
        </rect>
      {/each}
    </svg>
  </div>

  {#if showLegend}
    <ul
      class="proportion-bar-legend"
      aria-label="Segment breakdown"
      data-pw={typeof testId === 'string' ? `${testId}-legend` : null}
      testID={typeof testId === 'string' ? `${testId}-legend` : null}
    >
      {#each computedSegments as computedSegment, legendIndex (legendIndex)}
        <li
          class="proportion-bar-legend-item"
          data-pw={typeof testId === 'string' ? `${testId}-legend-item-${legendIndex}` : null}
          testID={typeof testId === 'string' ? `${testId}-legend-item-${legendIndex}` : null}
        >
          <span
            class="proportion-bar-swatch"
            style="background: {computedSegment.color};"
            aria-hidden="true"
          ></span>
          <span class="proportion-bar-legend-label">{computedSegment.label}</span>
          <span class="proportion-bar-legend-value">
            {formatValue(computedSegment.value, computedSegment.percent)}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .proportion-bar {
    display: flex;
    flex-direction: column;
    gap: var(--proportion-bar-gap, 10px);
    width: var(--proportion-bar-width, 100%);
  }

  .proportion-bar-track {
    width: 100%;
    height: var(--proportion-bar-track-height, 10px);
    border-radius: var(--proportion-bar-track-border-radius, var(--radius, 4px));
    overflow: hidden;
    background: var(--proportion-bar-track-bg, #f0f0f0);
  }

  .proportion-bar-svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .proportion-bar-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--proportion-bar-legend-gap, 6px);
  }

  .proportion-bar-legend-item {
    display: flex;
    align-items: center;
    gap: var(--proportion-bar-legend-item-gap, 8px);
  }

  .proportion-bar-swatch {
    display: inline-block;
    width: var(--proportion-bar-swatch-size, 10px);
    height: var(--proportion-bar-swatch-size, 10px);
    border-radius: var(--proportion-bar-swatch-border-radius, var(--radius, 4px));
    flex-shrink: 0;
  }

  .proportion-bar-legend-label {
    flex: 1;
    font-size: var(--proportion-bar-legend-label-font-size, 13px);
    font-weight: var(--proportion-bar-legend-label-font-weight, 400);
    color: var(--proportion-bar-legend-label-color, #374151);
    line-height: 1.4;
  }

  .proportion-bar-legend-value {
    font-size: var(--proportion-bar-legend-value-font-size, 13px);
    font-weight: var(--proportion-bar-legend-value-font-weight, 500);
    color: var(--proportion-bar-legend-value-color, #111827);
    line-height: 1.4;
    white-space: nowrap;
  }
</style>
