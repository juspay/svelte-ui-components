<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';
  import type { PieChartProperties } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import DeltaIndicator from '../DeltaIndicator/DeltaIndicator.svelte';
  import AnimatedNumber from '../AnimatedNumber/AnimatedNumber.svelte';
  import { arcPath } from '$lib/_chart/paths';
  import { computePieLayout, pieSliceValue } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { measureText, readCssVarPx } from '$lib/_chart/measure';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { truncateToWidth, placedLabelRect, dropOverlapping } from '$lib/_chart/labels';
  import type { LabelRect } from '$lib/_chart/labels';
  import type { LegendItem, TooltipAnchor } from '$lib/_chart/types';
  import { SvelteMap } from 'svelte/reactivity';

  // ── Props ──────────────────────────────────────────────────────

  let {
    data,
    innerRadius = 0,
    padAngle = 0.02,
    showLabels = false,
    showValues = false,
    labelPosition = 'outside',
    showLegend = false,
    startAngle = -Math.PI / 2,
    aspectRatio,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    minHeight = 0,
    valueFormat,
    tooltipSnippet,
    center,
    empty,
    onsliceclick,
    onslicehover,
    testId,
    classes,
    tooltipPortal = false,
    semiCircle = false,
    legendShowValues = false,
    legendPosition = 'bottom',
    legendMaxItems,
    onlegendmore,
    animateLegendValues = false,
    percentDecimals = 0,
    onchartready,
    highlightedIndex = null,
    changePercentage,
    changeInvertColors = false
  }: PieChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let legendExpanded = $state(false);
  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredIndex = $state<number | null>(null);
  let focusedIndex = $state<number | null>(null);
  let programmaticIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Highlight API ──────────────────────────────────────────────

  // Aspect ratio read from the --piechart-semi-aspect-ratio CSS variable on mount.
  let semiAspectRatioCssVar = $state(2);

  onMount(() => {
    onchartready?.({
      highlight: (index) => {
        programmaticIndex = index;
      },
      getCategories: () => data.map((d) => d.label),
      type: 'donut-chart'
    });

    if (typeof window !== 'undefined' && containerEl !== null) {
      const rawValue = getComputedStyle(containerEl)
        .getPropertyValue('--piechart-semi-aspect-ratio')
        .trim();
      const parsed = parseFloat(rawValue);
      if (!Number.isNaN(parsed) && parsed > 0) {
        semiAspectRatioCssVar = parsed;
      }
    }
  });

  // ── Active index ───────────────────────────────────────────────
  // Precedence: keyboard focus > mouse hover > declarative highlightedIndex
  // prop > imperative API.
  //
  // hoveredIndex and focusedIndex are deliberately separate pieces of state
  // (not one index shared by both input sources): a pointer leaving a slice
  // must never erase that slice's focus, and a late/stale pointerleave --
  // which real browsers fire *after* a focus event when focusing an
  // off-screen slice auto-scrolls the page under an unmoved cursor -- must
  // not be able to clobber the focus highlight either. Keeping the two
  // states apart makes that impossible by construction rather than by event
  // ordering. Focus wins outright when both are set: hovering slice A while
  // slice B holds focus keeps B highlighted (focus is the sticky, "current"
  // state a keyboard user is tracking; a stray pointer position elsewhere
  // must not steal it), and A regains hover feedback the moment focus moves
  // off B.
  let pointerOrFocusIndex = $derived<number | null>(focusedIndex ?? hoveredIndex);
  let activeIndex = $derived<number | null>(
    pointerOrFocusIndex ?? highlightedIndex ?? programmaticIndex
  );

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  // Mirrors computePieLayout's own total exactly (both use pieSliceValue) --
  // this duplicate exists only because isEmpty/pctFormat need it before
  // slices are computed; two independently-guarded reduces here is what let
  // the NaN defect survive a first pass that fixed only geometry.ts.
  let total = $derived(data.reduce((sum, d) => sum + pieSliceValue(d.value), 0));
  let pctFormat = $derived.by(
    () =>
      (v: number): string =>
        total === 0 ? '0%' : ((v / total) * 100).toFixed(percentDecimals) + '%'
  );
  // Builds the exact text the static legend branch below prints -- value,
  // then a non-breaking space, then the percentage -- as one string, so
  // the animateLegendValues branch feeds AnimatedNumber literally what a
  // reader already sees today rather than a re-derived approximation of it.
  let legendValueText = $derived.by(
    () =>
      (v: number): string =>
        `${format(v)}\u00A0${pctFormat(v)}`
  );
  let isEmpty = $derived(data.length === 0 || total === 0);

  // When semiCircle is true the effective aspect ratio is driven by:
  // 1. The explicit `aspectRatio` prop (highest priority — always wins).
  // 2. The `--piechart-semi-aspect-ratio` CSS variable (consumer CSS override).
  // 3. The hardcoded default of 2 (width:height = 2:1).
  // For a full circle the caller-provided `aspectRatio` or a square (1:1) default is used.
  let effectiveAspectRatio = $derived(aspectRatio ?? (semiCircle ? semiAspectRatioCssVar : 1));

  let cx = $derived(chartWidth / 2);
  // For a half-donut the SVG origin sits at the bottom of the drawing area so
  // arcs radiate upward into the top half of the viewBox.
  let cy = $derived(semiCircle ? chartHeight : chartHeight / 2);
  let outerR = $derived(
    semiCircle
      ? Math.max(10, chartWidth / 2 - (showLabels && labelPosition === 'outside' ? 40 : 10))
      : Math.max(10, Math.min(cx, cy) - (showLabels && labelPosition === 'outside' ? 40 : 10))
  );
  let innerR = $derived(innerRadius > 0 ? outerR * Math.min(0.95, innerRadius) : 0);

  let slices = $derived.by(() => {
    // For a full circle layout start at the caller-provided startAngle.
    // For semi-circle: compute a full-circle layout anchored at -PI/2, then
    // remap each angle so the entire sweep is compressed into PI radians
    // (the top-half arc from -PI/2 to PI/2).
    const layoutStartAngle = semiCircle ? -Math.PI / 2 : startAngle;
    const rawSlices = computePieLayout(data, layoutStartAngle, padAngle);

    return rawSlices.map((s) => {
      let mappedStart = s.startAngle;
      let mappedEnd = s.endAngle;
      let mappedMid = s.midAngle;

      if (semiCircle) {
        // The raw layout spans [-PI/2, -PI/2 + 2*PI]. We compress it to
        // [-PI/2, PI/2] by halving the angular distance from -PI/2.
        const origin = -Math.PI / 2;
        mappedStart = origin + (s.startAngle - origin) / 2;
        mappedEnd = origin + (s.endAngle - origin) / 2;
        mappedMid = origin + (s.midAngle - origin) / 2;
      }

      const color = s.color ?? data[s.index]?.color ?? getColor(s.index);
      const labelR = labelPosition === 'outside' ? outerR + 16 : (innerR + outerR) / 2;
      return {
        ...s,
        startAngle: mappedStart,
        endAngle: mappedEnd,
        midAngle: mappedMid,
        color,
        path: arcPath(0, 0, innerR, outerR, mappedStart, mappedEnd),
        labelX: labelR * Math.cos(mappedMid),
        labelY: labelR * Math.sin(mappedMid)
      };
    });
  });

  /* A cap only counts when it actually hides something: a legendMaxItems of 5
     over 5 rows must render no control, since a control that reveals nothing
     is worse than none. Non-positive and non-finite values are ignored rather
     than clamping the list to empty -- a plain-JS or web-component caller can
     hand this anything. */
  const legendCap = $derived(
    typeof legendMaxItems === 'number' && Number.isFinite(legendMaxItems) && legendMaxItems > 0
      ? Math.max(1, Math.floor(legendMaxItems))
      : null
  );
  /* A changed list or cap starts a new collapsed view, not a stale expansion.
     This has to be an effect rather than a derived key: collapsing depends on
     the TRANSITION, not on the current values. A list that shrinks below the
     cap and then returns to its former length must stay collapsed, and a key
     built from (cap, length) would match its earlier self and silently
     re-expand -- which is what the regression tests here caught when this was
     written that way. The two values are passed as ordinary arguments so the
     dependencies are real reads rather than `void` expressions. */
  const collapseLegend = (_cap: number | null, _rowCount: number): void => {
    legendExpanded = false;
  };
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    collapseLegend(legendCap, data.length);
  });
  const legendHiddenCount = $derived(legendCap === null ? 0 : Math.max(0, data.length - legendCap));
  const legendRows = $derived(
    legendCap === null || legendExpanded ? data : data.slice(0, legendCap)
  );

  /* Excludes the empty state: with no rows there is no legend column to sit
     beside, and turning the root into a flex row would make the empty message
     a flex item rather than the full-width block it is documented to be. */
  const legendBesideChart = $derived(
    !isEmpty && showLegend && legendShowValues && legendPosition === 'right'
  );

  const instanceId = $props.id();
  const legendListId = `pie-legend-${instanceId}`;

  const handleLegendMore = (): void => {
    /* A consumer opening their own modal must not also get the list expanding
       underneath it, so the callback replaces the built-in behaviour rather
       than firing alongside it. */
    if (typeof onlegendmore === 'function') {
      onlegendmore();
      return;
    }
    legendExpanded = !legendExpanded;
  };

  let legendItems = $derived<LegendItem[]>(
    data.map((d, i) => ({ label: d.label, color: d.color ?? getColor(i) }))
  );

  // ── Label engine ───────────────────────────────────────────────
  // A crowded pie (many slices, long labels) used to render every label
  // unconditionally at its mid-angle: stacked unreadable text that also ran
  // past the chart box. Labels are now measured, truncated to the horizontal
  // room the chart actually has, gated on the slice's arc length (inside
  // position), and de-collided with larger slices winning. Dropped or
  // truncated text stays available on the tooltip and aria-label.
  let visibleSliceLabels = $derived.by(() => {
    const visible = new SvelteMap<number, string>();
    if ((!showLabels && !showValues) || chartWidth <= 0) {
      return visible;
    }
    const font = {
      size: containerEl ? readCssVarPx(containerEl, '--piechart-label-font-size', 12) : 12
    };
    const lineHeight = measureText('Ag', font).height;

    type LabelCandidate = { index: number; value: number; text: string; rect: LabelRect };
    const candidates: LabelCandidate[] = [];
    for (const slice of slices) {
      const parts: string[] = [];
      if (showLabels) {
        parts.push(slice.label);
      }
      if (showValues) {
        parts.push(pctFormat(slice.value));
      }
      const raw = parts.join(' ').trim();
      if (raw.length === 0) {
        continue;
      }
      const absX = cx + slice.labelX;
      const absY = cy + slice.labelY;
      // text-anchor is middle, so the budget is twice the room to the nearer edge.
      const budget = Math.max(0, Math.min(absX, chartWidth - absX) * 2 - 8);
      const labelRadius = labelPosition === 'outside' ? outerR : (innerR + outerR) / 2;
      const arcLength = (slice.endAngle - slice.startAngle) * labelRadius;
      // An inside label sits ON its wedge — hide it when the wedge is thinner
      // than one text line (outside labels rely on the collision pass instead).
      if (labelPosition === 'inside' && arcLength < lineHeight) {
        continue;
      }
      const text = truncateToWidth(raw, budget, font);
      if (text === '') {
        continue;
      }
      const size = measureText(text, font);
      candidates.push({
        index: slice.index,
        value: slice.value,
        text,
        rect: placedLabelRect(
          { x: absX, y: absY, textAnchor: 'middle', dominantBaseline: 'middle' },
          size
        )
      });
    }

    // Feed the greedy first-come collision pass in value order so the larger
    // slice keeps its label whenever two collide.
    const ordered = [...candidates].sort((a, b) => b.value - a.value);
    const keptFlags = dropOverlapping(ordered.map((candidate) => candidate.rect));
    ordered.forEach((candidate, orderedIndex) => {
      if (keptFlags[orderedIndex]) {
        visible.set(candidate.index, candidate.text);
      }
    });
    return visible;
  });

  // The centre snippet (e.g. a currency total like "₹31.24k") is clipped by the
  // foreignObject bounds, so the box must be wide enough for it. The inner hole
  // has diameter 2*innerR; a square of side ~1.9*innerR keeps every edge inside
  // the hole at the text's mid-line while giving the label the room a plain
  // "innerR*1.3" (≈2/3 of the hole) did not — the old value cut the ₹/k off the
  // sides and forced the caption onto two lines.
  let centerBoxSize = $derived(innerR > 0 ? Math.max(0, innerR * 1.9) : 0);

  // The foreignObject for the center snippet is positioned relative to the <g>
  // origin (which is at cx, cy in SVG space). The box is always centred on
  // the translated origin: for a full circle that is the geometric centre, and
  // for a semiCircle the <g> origin sits at the chord line (bottom of the arc),
  // so the snippet is centred on the chord as specified.
  let centerFOY = $derived(-centerBoxSize / 2);

  // ── Tooltip ────────────────────────────────────────────────────

  // Looks a slice up by its stable `index` field rather than array position --
  // `slices` is derived from `data` and its ordering is not a contract, while
  // `activeIndex`/`hoveredIndex` are always original-data indices (see the
  // aria-label and legend, which key off the same index).
  function sliceAt(i: number) {
    return slices.find((s) => s.index === i) ?? null;
  }

  // Tooltip visibility tracks hover-or-focus (pointerOrFocusIndex), not the
  // declarative highlightedIndex prop or the imperative API: those arrive
  // without mouse coordinates, so a tooltip driven by them would render at
  // the top-left (mouseX/mouseY still 0). Highlight styling uses activeIndex
  // (which also covers those two lower-precedence sources); the tooltip
  // stays gated on direct interaction only.
  let tooltipData = $derived.by(() => {
    if (pointerOrFocusIndex === null || !slices[pointerOrFocusIndex]) {
      return null;
    }
    const s = slices[pointerOrFocusIndex];
    return {
      title: s.label,
      items: [
        {
          label: s.label,
          value: `${format(s.value)} (${pctFormat(s.value)})`,
          color: s.color
        }
      ]
    };
  });

  /**
   * Data-space anchor at the slice's own mid-angle, independent of pointer
   * position. Legend hover and keyboard focus have no cursor coordinates, so
   * an anchor keeps the tooltip landing in the same place a pointer hover
   * would -- one contract for all three activation paths.
   */
  let anchor = $derived.by<TooltipAnchor | null>(() => {
    if (pointerOrFocusIndex === null) {
      return null;
    }
    const slice = sliceAt(pointerOrFocusIndex);
    if (slice === null) {
      return null;
    }
    const midR = (innerR + outerR) / 2;
    return {
      x: cx + midR * Math.cos(slice.midAngle),
      y: cy + midR * Math.sin(slice.midAngle),
      side: Math.sin(slice.midAngle) <= 0 ? 'top' : 'bottom'
    };
  });

  // ── Assistive-tech status region ───────────────────────────────
  // Mirrors the tooltip's exact text (value AND percentage) into a live region
  // every slice is described-by, so a screen reader user gets the same detail a
  // pointer hover shows without needing pointer hover -- and, because it reads
  // activeIndex rather than hoveredIndex, it also announces the declarative
  // highlightedIndex prop and the imperative ChartHighlightAPI, neither of
  // which fires a focus event of its own.
  const statusId = `pie-status-${instanceId}`;
  let statusText = $derived.by(() => {
    if (activeIndex === null) {
      return '';
    }
    const s = sliceAt(activeIndex);
    return s === null ? '' : `${s.label}: ${format(s.value)} (${pctFormat(s.value)})`;
  });

  // ── Interactions ───────────────────────────────────────────────
  // Family-wide contract shared with BarChart/FunnelChart/DualAxisBarChart:
  // pointer hover and keyboard focus feed SEPARATE state (hoveredIndex /
  // focusedIndex -- see activeIndex above for why), read together as one
  // "direct interaction" precedence tier ahead of the declarative
  // highlightedIndex prop and the imperative ChartHighlightAPI. Legend
  // pointer/focus events drive the exact same two variables a slice's own
  // events would, so a legend row is just another entry point into the same
  // state, not a third source. Enter/Space on a focused slice invokes the
  // same click callback a pointer click would.

  function trackMouse(e: MouseEvent) {
    const position = pointerPositionIn(containerEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  // onslicehover mirrors the combined pointer-or-focus index, once per
  // actual change -- e.g. a pointer leaving a slice that is still
  // keyboard-focused must not report a hover-cleared event for a highlight
  // that never went away.
  let lastNotifiedIndex: number | null = null;
  function notifyHoverChange(): void {
    const next = pointerOrFocusIndex;
    if (next === lastNotifiedIndex) {
      return;
    }
    lastNotifiedIndex = next;
    onslicehover?.(next === null ? null : { index: next, slice: data[next] });
  }

  function handlePointerEnter(e: MouseEvent, i: number) {
    hoveredIndex = i;
    trackMouse(e);
    notifyHoverChange();
  }

  // Legend rows have no SVG-space mouse coordinates to track, unlike a slice.
  function handleLegendHover(i: number) {
    hoveredIndex = i;
    notifyHoverChange();
  }

  // Wired to pointerleave/mouseleave on both slices and legend rows. Clears
  // ONLY the hover half of the state -- never focusedIndex -- so a late,
  // stale pointerleave (see activeIndex's comment) cannot erase a slice's
  // focus highlight.
  function handlePointerLeave() {
    hoveredIndex = null;
    notifyHoverChange();
  }

  // Wired to focus on both slices and legend rows.
  function handleFocus(i: number) {
    focusedIndex = i;
    notifyHoverChange();
  }

  // Wired to blur on both slices and legend rows. Clears ONLY the focus
  // half; a pointer that happens to still be over the slice keeps it
  // hovered.
  function handleBlur() {
    focusedIndex = null;
    notifyHoverChange();
  }

  function handleKeydown(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onsliceclick?.({ index: i, slice: data[i] });
    }
  }

  // Touch taps have no pointerleave/blur: dismiss when a pointerdown lands outside.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hoveredIndex === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, handlePointerLeave);
  });
</script>

<div
  class="pie-chart {classes ?? ''}"
  class:legend-right={legendBesideChart}
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <!-- Mirrors the tooltip's own text for every activation path (pointer, focus,
         declarative highlightedIndex, imperative ChartHighlightAPI) -- see statusText. -->
    <div class="sr-only" role="status" aria-live="polite" id={statusId} data-pw="pie-status">
      {statusText}
    </div>

    {#if showLegend && !legendShowValues}
      <Legend items={legendItems} position="top">
        {#snippet customSnippet(syncItems)}
          <!-- Synchronized legend recipe: hovering/focusing an item highlights its
               slice via the same hoveredIndex a pointer hover over the slice itself
               would set -- highlighting, not a visibility toggle (see Legend.svelte's
               separate onToggle path, used by Bar/DualAxis to show/hide a series). -->
          <div class="pie-legend-sync">
            {#each syncItems as item, i (i)}
              <button
                type="button"
                class="legend-item pie-legend-sync-item"
                class:legend-sync-active={activeIndex === i}
                data-pw={`pie-legend-sync-${i}`}
                testID={`pie-legend-sync-${i}`}
                onpointerenter={() => handleLegendHover(i)}
                onpointerleave={handlePointerLeave}
                onfocus={() => handleFocus(i)}
                onblur={handleBlur}
                onclick={() => onsliceclick?.({ index: i, slice: data[i] })}
              >
                <span class="legend-swatch" style="background: {item.color}"></span>
                <span class="legend-label">{item.label}</span>
              </button>
            {/each}
          </div>
        {/snippet}
      </Legend>
    {/if}

    <ChartContainer
      bind:width={chartWidth}
      bind:height={chartHeight}
      aspectRatio={effectiveAspectRatio}
      {maxHeight}
      {minHeight}
    >
      <g transform="translate({cx}, {cy})">
        {#each slices as slice (slice.index)}
          <path
            class="slice"
            class:hovered={activeIndex === slice.index}
            class:dimmed={activeIndex !== null && activeIndex !== slice.index}
            d={slice.path}
            fill={slice.color}
            tabindex="0"
            role="button"
            aria-label="{slice.label}: {format(slice.value)}"
            aria-describedby={statusId}
            onmouseenter={(e) => handlePointerEnter(e, slice.index)}
            onmousemove={trackMouse}
            onmouseleave={handlePointerLeave}
            onfocus={() => handleFocus(slice.index)}
            onblur={handleBlur}
            onkeydown={(e) => handleKeydown(e, slice.index)}
            onclick={() => onsliceclick?.({ index: slice.index, slice: data[slice.index] })}
          />
          {#if visibleSliceLabels.has(slice.index)}
            <text
              class="slice-label"
              class:label-outside={labelPosition === 'outside'}
              x={slice.labelX}
              y={slice.labelY}
              text-anchor="middle"
              dominant-baseline="middle">{visibleSliceLabels.get(slice.index)}</text
            >
          {/if}
        {/each}

        {#if innerR > 0 && typeof center === 'function' && centerBoxSize > 0}
          <foreignObject
            x={-centerBoxSize / 2}
            y={centerFOY}
            width={centerBoxSize}
            height={centerBoxSize}
          >
            <div class="pie-center-content" xmlns="http://www.w3.org/1999/xhtml">
              {@render center()}
            </div>
          </foreignObject>
        {/if}
      </g>
    </ChartContainer>

    {#if typeof changePercentage === 'number'}
      <div class="pie-delta-badge">
        <DeltaIndicator value={changePercentage} invertColors={changeInvertColors} />
      </div>
    {/if}

    {#if showLegend && legendShowValues}
      <div class="pie-legend-column">
        <ul class="pie-legend-values" id={legendListId}>
          {#each legendRows as d, i (i)}
            <li class="pie-legend-row">
              <span class="pie-legend-swatch" style="background: {d.color ?? getColor(i)}"></span>
              <span class="pie-legend-label">{d.label}</span>
              <span class="pie-legend-value">
                {#if animateLegendValues}
                  <AnimatedNumber value={legendValueText(pieSliceValue(d.value))} />
                {:else}
                  {format(pieSliceValue(d.value))}&nbsp;{pctFormat(pieSliceValue(d.value))}
                {/if}
              </span>
            </li>
          {/each}
        </ul>
        {#if legendHiddenCount > 0}
          <button
            type="button"
            class="pie-legend-more"
            aria-expanded={typeof onlegendmore === 'function' ? null : legendExpanded}
            {...typeof onlegendmore === 'function' ? {} : { 'aria-controls': legendListId }}
            onclick={handleLegendMore}
          >
            {legendExpanded ? 'Show less' : `+${legendHiddenCount} more`}
          </button>
        {/if}
      </div>
    {/if}

    {#if typeof tooltipSnippet === 'function'}
      <ChartTooltip
        data={tooltipData}
        {mouseX}
        {mouseY}
        {anchor}
        portal={tooltipPortal}
        originEl={containerEl}
        unstyled
      >
        {#snippet content()}
          {#if pointerOrFocusIndex !== null && data[pointerOrFocusIndex]}
            {@render tooltipSnippet(data[pointerOrFocusIndex], pointerOrFocusIndex)}
          {/if}
        {/snippet}
      </ChartTooltip>
    {:else}
      <ChartTooltip
        data={tooltipData}
        {mouseX}
        {mouseY}
        {anchor}
        portal={tooltipPortal}
        originEl={containerEl}
      />
    {/if}
  {/if}
</div>

<style>
  .pie-chart {
    width: 100%;
    position: relative;
  }
  .slice {
    stroke: var(--piechart-stroke-color, #fff);
    stroke-width: var(--piechart-stroke-width, 2);
    transition:
      transform var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease)),
      opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease));
    transform-origin: 0 0;
    cursor: pointer;
  }
  .slice.hovered {
    transform: scale(var(--piechart-hover-scale, 1.05));
    opacity: 1;
  }
  .slice.dimmed {
    opacity: var(--piechart-dimmed-opacity, 0.3);
  }
  .slice:focus-visible {
    outline: var(--piechart-slice-focus-outline, 2px solid currentColor);
    outline-offset: var(--piechart-slice-focus-outline-offset, 2px);
  }
  .slice-label {
    fill: var(--piechart-label-color, #333);
    font-size: var(--piechart-label-font-size, 12px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .slice-label.label-outside {
    fill: var(--piechart-label-color, #555);
  }
  .pie-center-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .pie-delta-badge {
    position: absolute;
    top: var(--piechart-delta-top, 8px);
    right: var(--piechart-delta-right, 8px);
    z-index: 2;
    pointer-events: none;
  }
  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, #9ca3af);
    text-align: center;
  }
  /* Standard visually-hidden recipe (matches ChatComposer's .sr-only): present
     for assistive tech, removed from layout and the visual canvas. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
  .pie-legend-sync {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--chart-legend-gap, 16px);
    font-family: var(--chart-font-family, inherit);
    padding: 8px 0;
  }
  .pie-legend-sync-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    margin: 0;
    padding: var(--piechart-legend-sync-padding, 2px 4px);
    font: inherit;
    cursor: var(--cursor, pointer);
    border-radius: var(--piechart-legend-sync-radius, var(--radius, 4px));
  }
  .pie-legend-sync-item .legend-swatch {
    display: inline-block;
    width: var(--chart-legend-swatch-size, 12px);
    height: var(--chart-legend-swatch-size, 12px);
    border-radius: var(--chart-swatch-radius, 2px);
    flex-shrink: 0;
  }
  .pie-legend-sync-item .legend-label {
    font-size: var(--chart-legend-font-size, 12px);
    color: var(--chart-legend-color, light-dark(#333, #e5e7eb));
  }
  .pie-legend-sync-item.legend-sync-active {
    background: var(
      --piechart-legend-sync-active-background,
      light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1))
    );
  }
  .pie-legend-sync-item:focus-visible {
    outline: var(--piechart-legend-sync-focus-outline, 2px solid currentColor);
    outline-offset: 2px;
  }
  .pie-legend-values {
    display: flex;
    flex-direction: column;
    gap: var(--piechart-legend-gap, 8px);
    padding: var(--piechart-legend-padding, 12px 0 0 0);
    font-family: var(--chart-font-family, inherit);
    list-style: none;
    margin: 0;
  }
  .pie-legend-row {
    display: flex;
    align-items: center;
    gap: var(--piechart-legend-row-gap, 6px);
  }
  .pie-legend-swatch {
    display: inline-block;
    width: var(--chart-legend-swatch-size, 12px);
    height: var(--chart-legend-swatch-size, 12px);
    border-radius: var(--piechart-legend-swatch-radius, var(--radius, 4px));
    flex-shrink: 0;
  }
  .pie-legend-label {
    font-size: var(--chart-legend-font-size, 12px);
    color: var(--chart-legend-color, #333);
    min-width: var(--piechart-legend-label-min-width, 120px);
  }
  .pie-legend-value {
    margin-left: auto;
    font-size: var(--piechart-legend-value-font-size, 12px);
    color: var(--piechart-legend-value-color, #333);
    min-width: var(--piechart-legend-value-min-width, 60px);
    text-align: right;
  }

  /* The column wrapper is present in both placements so the markup does not
     fork; as a plain block it changes nothing about the default below-chart
     rendering. */
  .pie-legend-column {
    display: flex;
    flex-direction: column;
  }

  /* Only the values legend moves beside the chart -- the plain top legend is
     mutually exclusive with it, and the delta badge and tooltip are both
     absolutely positioned, so they stay out of this flex row entirely. */
  .pie-chart.legend-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--piechart-legend-column-gap, 16px);
  }

  .pie-chart.legend-right :global(.chart-container) {
    /* flex-basis 0 rather than auto: the container carries width:100%, which
       as a flex item would otherwise claim the whole row and squeeze the
       legend to nothing. */
    flex: 1 1 0;
    min-width: 0;
  }

  .pie-chart.legend-right .pie-legend-column {
    flex: 0 0 auto;
    max-width: var(--piechart-legend-column-max-width, 50%);
  }

  .pie-chart.legend-right .pie-legend-values {
    padding: var(--piechart-legend-column-padding, 0);
  }

  .pie-legend-more {
    align-self: flex-start;
    margin-top: var(--piechart-legend-more-margin-top, 8px);
    padding: var(--piechart-legend-more-padding, 2px 4px);
    border: none;
    background: none;
    cursor: var(--cursor, pointer);
    font-size: var(--piechart-legend-more-font-size, 12px);
    font-family: inherit;
    color: var(--piechart-legend-more-color, #2563eb);
  }

  .pie-legend-more:hover {
    text-decoration: underline;
  }

  .pie-legend-more:focus-visible {
    outline: var(--piechart-legend-more-focus-outline, 2px solid currentColor);
    outline-offset: 2px;
  }
</style>
