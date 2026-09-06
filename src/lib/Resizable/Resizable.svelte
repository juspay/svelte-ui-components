<script lang="ts">
  import type { ResizableProperties, ResizeEdge } from './properties';

  let {
    width = $bindable(null),
    height = $bindable(null),
    minWidth = 0,
    maxWidth = Number.POSITIVE_INFINITY,
    minHeight = 0,
    maxHeight = Number.POSITIVE_INFINITY,
    handles = ['bottom-right'],
    step = 16,
    disabled = false,
    handleLabel = 'Resize',
    children,
    onresize,
    onresizestart,
    onresizeend,
    testId,
    classes
  }: ResizableProperties = $props();

  const DIRS: Record<ResizeEdge, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    'top-left': { x: -1, y: -1 },
    'top-right': { x: 1, y: -1 },
    'bottom-left': { x: -1, y: 1 },
    'bottom-right': { x: 1, y: 1 }
  };

  let container: HTMLElement | null = $state(null);
  let active: {
    edge: ResizeEdge;
    pointerId: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null = $state(null);

  let activeHandles = $derived(disabled ? [] : handles);

  function clampWidth(value: number): number {
    return Math.min(maxWidth, Math.max(minWidth, value));
  }

  function clampHeight(value: number): number {
    return Math.min(maxHeight, Math.max(minHeight, value));
  }

  function measuredWidth(): number {
    return typeof width === 'number' ? width : (container?.offsetWidth ?? 0);
  }

  function measuredHeight(): number {
    return typeof height === 'number' ? height : (container?.offsetHeight ?? 0);
  }

  function axisOf(edge: ResizeEdge): 'x' | 'y' | 'both' {
    const dir = DIRS[edge];
    if (dir.x !== 0 && dir.y !== 0) {
      return 'both';
    }
    return dir.x !== 0 ? 'x' : 'y';
  }

  function orientationOf(edge: ResizeEdge): 'horizontal' | 'vertical' | null {
    const axis = axisOf(edge);
    if (axis === 'x') {
      return 'vertical';
    }
    if (axis === 'y') {
      return 'horizontal';
    }
    return null;
  }

  function startResize(
    event: PointerEvent & { currentTarget: HTMLElement },
    edge: ResizeEdge
  ): void {
    if (disabled) {
      return;
    }
    event.preventDefault();
    const startW = clampWidth(measuredWidth());
    const startH = clampHeight(measuredHeight());
    width = startW;
    height = startH;
    active = {
      edge,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startW,
      startH
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onresizestart?.({ width: startW, height: startH });
  }

  function moveResize(event: PointerEvent): void {
    if (active === null) {
      return;
    }
    const dir = DIRS[active.edge];
    if (dir.x !== 0) {
      width = clampWidth(active.startW + dir.x * (event.clientX - active.startX));
    }
    if (dir.y !== 0) {
      height = clampHeight(active.startH + dir.y * (event.clientY - active.startY));
    }
    onresize?.({ width: measuredWidth(), height: measuredHeight() });
  }

  function endResize(event: PointerEvent & { currentTarget: HTMLElement }): void {
    if (active === null) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    active = null;
    onresizeend?.({ width: measuredWidth(), height: measuredHeight() });
  }

  function keyResize(event: KeyboardEvent, edge: ResizeEdge): void {
    if (disabled) {
      return;
    }
    const dir = DIRS[edge];
    let nextWidth = measuredWidth();
    let nextHeight = measuredHeight();
    let handled = false;

    if (dir.x !== 0 && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      nextWidth = clampWidth(nextWidth + (event.key === 'ArrowRight' ? step : -step));
      handled = true;
    }
    if (dir.y !== 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      nextHeight = clampHeight(nextHeight + (event.key === 'ArrowDown' ? step : -step));
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      width = nextWidth;
      height = nextHeight;
      onresize?.({ width: nextWidth, height: nextHeight });
    }
  }

  function valueNow(edge: ResizeEdge): number | null {
    const axis = axisOf(edge);
    if (axis === 'y') {
      return typeof height === 'number' ? height : null;
    }
    return typeof width === 'number' ? width : null;
  }

  function valueMin(edge: ResizeEdge): number {
    return axisOf(edge) === 'y' ? minHeight : minWidth;
  }

  function valueMax(edge: ResizeEdge): number | null {
    const max = axisOf(edge) === 'y' ? maxHeight : maxWidth;
    return Number.isFinite(max) ? max : null;
  }
</script>

<div
  class="resizable {classes ?? ''}"
  class:resizing={active !== null}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  bind:this={container}
  style:width={typeof width === 'number' ? `${width}px` : null}
  style:height={typeof height === 'number' ? `${height}px` : null}
>
  {#if typeof children === 'function'}
    {@render children()}
  {/if}

  {#each activeHandles as edge (edge)}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="handle"
      data-edge={edge}
      role="separator"
      tabindex="0"
      aria-label={handleLabel}
      aria-orientation={orientationOf(edge)}
      aria-valuenow={valueNow(edge)}
      aria-valuemin={valueMin(edge)}
      aria-valuemax={valueMax(edge)}
      onpointerdown={(event) => startResize(event, edge)}
      onpointermove={moveResize}
      onpointerup={endResize}
      onkeydown={(event) => keyResize(event, edge)}
    ></div>
  {/each}
</div>

<style>
  .resizable {
    position: relative;
    box-sizing: border-box;
    max-width: var(--resizable-max-width, none);
    max-height: var(--resizable-max-height, none);
    transition: var(--resizable-transition, none);
  }

  .resizable.resizing {
    user-select: none;
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .resizable {
      transition: none;
    }
  }

  .handle {
    position: absolute;
    touch-action: none;
    z-index: var(--resizable-handle-z-index, 2);
    background: var(--resizable-handle-color, transparent);
  }

  .handle:focus-visible {
    outline: var(--resizable-handle-focus-outline, 2px solid #3b5bdb);
    outline-offset: var(--resizable-handle-focus-outline-offset, -2px);
  }

  .handle[data-edge='top'],
  .handle[data-edge='bottom'] {
    left: 0;
    right: 0;
    height: var(--resizable-edge-size, 8px);
    cursor: ns-resize;
  }

  .handle[data-edge='left'],
  .handle[data-edge='right'] {
    top: 0;
    bottom: 0;
    width: var(--resizable-edge-size, 8px);
    cursor: ew-resize;
  }

  .handle[data-edge='top'] {
    top: 0;
  }

  .handle[data-edge='bottom'] {
    bottom: 0;
  }

  .handle[data-edge='left'] {
    left: 0;
  }

  .handle[data-edge='right'] {
    right: 0;
  }

  .handle[data-edge='top-left'],
  .handle[data-edge='top-right'],
  .handle[data-edge='bottom-left'],
  .handle[data-edge='bottom-right'] {
    width: var(--resizable-corner-size, 14px);
    height: var(--resizable-corner-size, 14px);
    z-index: var(--resizable-corner-z-index, 3);
  }

  .handle[data-edge='top-left'] {
    top: 0;
    left: 0;
    cursor: nwse-resize;
  }

  .handle[data-edge='top-right'] {
    top: 0;
    right: 0;
    cursor: nesw-resize;
  }

  .handle[data-edge='bottom-left'] {
    bottom: 0;
    left: 0;
    cursor: nesw-resize;
  }

  .handle[data-edge='bottom-right'] {
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
  }
</style>
