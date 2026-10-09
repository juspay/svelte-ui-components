<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let group: SVGGElement | null = $state(null);
  let bounds: { x: number; y: number; width: number; height: number } | null = $state(null);
  const PADDING = 3;

  onMount(() => {
    const text = group?.querySelector('text');
    if (group === null || text === null || typeof text === 'undefined') {
      return;
    }
    let mounted = true;
    let frame = 0;
    function measure(): void {
      if (
        !mounted ||
        group === null ||
        text === null ||
        typeof text === 'undefined' ||
        typeof text.getBBox !== 'function'
      ) {
        return;
      }
      const box = text.getBBox();
      if (box.width <= 0 || box.height <= 0) {
        bounds = null;
        return;
      }
      // getBBox is in the text's own SVG coordinates. This also handles
      // transformed children, rather than assuming page/parent rectangles.
      const parent = group.getCTM?.();
      const child = text.getCTM?.();
      const matrix = parent && child ? parent.inverse().multiply(child) : null;
      const corners = [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x, box.y + box.height],
        [box.x + box.width, box.y + box.height]
      ].map(([x, y]) =>
        matrix === null
          ? { x, y }
          : {
              x: matrix.a * x + matrix.c * y + matrix.e,
              y: matrix.b * x + matrix.d * y + matrix.f
            }
      );
      const x = Math.min(...corners.map((point) => point.x)) - PADDING;
      const y = Math.min(...corners.map((point) => point.y)) - PADDING;
      bounds = {
        x,
        y,
        width: Math.max(...corners.map((point) => point.x)) - x + PADDING,
        height: Math.max(...corners.map((point) => point.y)) - y + PADDING
      };
    }
    function schedule(): void {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    measure();
    const resize = new ResizeObserver(schedule);
    resize.observe(text);
    const mutation = new MutationObserver(schedule);
    mutation.observe(text, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true
    });
    // Font readiness can change glyph bounds without changing the label's
    // content or CSS family. Measure the actual loaded font, not cached canvas
    // estimates, and react to subsequent font loads as well.
    document.fonts?.ready.then(() => {
      if (mounted) {
        schedule();
      }
    });
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  });
</script>

<g class="chart-label-plate" bind:this={group}>
  {#if bounds !== null}
    <rect
      class="chart-label-backdrop"
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      rx="2"
      aria-hidden="true"
    />
  {/if}
  {@render children()}
</g>

<style>
  .chart-label-plate {
    pointer-events: none;
  }
  .chart-label-backdrop {
    /* Keep the default literal: consumer CSS compilers may lower light-dark()
       into private variables that their inherited theme never initializes. */
    fill: var(--chart-label-background, #fff);
    stroke: none;
  }
</style>
