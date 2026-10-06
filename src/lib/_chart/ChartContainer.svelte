<script lang="ts">
  import type { ChartContainerProperties } from './types';
  import { onMount } from 'svelte';

  let {
    width = $bindable(0),
    height = $bindable(0),
    aspectRatio = 16 / 9,
    minHeight = 0,
    maxHeight = Infinity,
    testId,
    classes,
    ariaLabel,
    ariaDescription,
    interactive = false,
    children
  }: ChartContainerProperties = $props();

  // Instance-scoped, hydration-safe id for the <desc> element that
  // `aria-describedby` points at. Two charts on one page (or in two shadow
  // roots) must never resolve each other's description.
  const instanceId = $props.id();
  const descriptionId = `chart-desc-${instanceId}`;

  // Whitespace-only strings are treated as absent so an empty prop never
  // produces `aria-label=""`, which is a name of nothing rather than no name.
  let name = $derived(typeof ariaLabel === 'string' && ariaLabel.trim() !== '' ? ariaLabel : null);
  let description = $derived(
    typeof ariaDescription === 'string' && ariaDescription.trim() !== '' ? ariaDescription : null
  );

  let containerEl: HTMLDivElement | null = $state(null);
  let isMounted = false;

  function measure() {
    if (containerEl === null) {
      return;
    }
    const rect = containerEl.getBoundingClientRect();
    const w = Math.round(rect.width);
    width = w;
    height = Math.min(maxHeight, Math.max(minHeight, Math.round(w / aspectRatio)));
  }

  // Re-measure whenever aspectRatio changes at runtime (e.g. semiCircle toggled).
  // isMounted guards against running after the onMount cleanup has disconnected
  // the ResizeObserver and the component is being torn down.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    // Reading aspectRatio/maxHeight here makes this effect re-run whenever either
    // changes, so the computed height stays current without waiting for a resize.
    void aspectRatio;
    void maxHeight;
    void minHeight;
    if (isMounted) {
      measure();
    }
  });

  onMount(() => {
    if (containerEl === null) {
      return;
    }

    isMounted = true;
    measure();

    // Coalesce bursts of resize events into a single measure per frame, always
    // using the latest size (a leading-edge debounce would drop the final size).
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(containerEl);

    return () => {
      isMounted = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
</script>

<div
  class="chart-container {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if width > 0 && height > 0}
    <!--
      `role="img"` makes its descendants presentational, so a drawing that holds
      focusable marks must not use it: the marks are either dropped from the
      accessibility tree or announced differently per browser, and axe reports
      the nesting as `nested-interactive`. An interactive drawing is therefore a
      named `group` whose children stay real controls; a static one stays a
      named image. Either way the name sits on the <svg> itself -- a named
      wrapper elsewhere does not name the image inside it.
    -->
    <svg
      viewBox="0 0 {width} {height}"
      preserveAspectRatio="xMidYMid meet"
      role={interactive ? 'group' : 'img'}
      aria-label={name}
      aria-describedby={description === null ? null : descriptionId}
      {width}
      {height}
    >
      {#if description !== null}
        <desc id={descriptionId}>{description}</desc>
      {/if}
      {@render children()}
    </svg>
  {/if}
</div>

<style>
  .chart-container {
    width: 100%;
    /* Floor against the silent zero-collapse bug: a flex/grid ancestor that
       sizes itself by shrink-to-fit/fit-content resolves this div's
       `width: 100%` as an indefinite percentage and contributes 0 to that
       calculation, so the ancestor -- and this div -- settle at 0px with no
       signal, and the `{#if width > 0 && height > 0}` guard below then
       renders nothing at all. A definite min-width isn't subject to that;
       it gives the ancestor a real, non-zero size to lay out against, so
       the collapse can't happen in the first place. Overridable per
       instance via --chart-min-width; PieChart's legend-right layout
       already sets this to 0 for its own case, where flex-basis is
       definite (0, not auto) so shrink-to-fit never applies. */
    min-width: var(--chart-min-width, 160px);
    background: var(--chart-background, transparent);
    font-family: var(--chart-font-family, inherit);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
</style>
