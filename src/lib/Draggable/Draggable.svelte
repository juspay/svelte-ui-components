<script lang="ts">
  import type { DraggableProperties, DragPosition } from './properties';

  let {
    x = $bindable(0),
    y = $bindable(0),
    axis = 'both',
    handle,
    bounds = null,
    disabled = false,
    step = 16,
    dragLabel = 'Drag to move',
    children,
    onMoveStart,
    onMove,
    onMoveEnd,
    testId,
    classes
  }: DraggableProperties = $props();

  let active: {
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null = $state(null);

  function isInteractive(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      target.closest('input, textarea, select, button, a, [contenteditable="true"]') !== null
    );
  }

  function withinHandle(target: EventTarget | null): boolean {
    if (typeof handle !== 'string' || handle.length === 0) {
      return !isInteractive(target);
    }
    return target instanceof Element && target.closest(handle) !== null;
  }

  function clamp(node: HTMLElement, nextX: number, nextY: number): DragPosition {
    if (bounds !== 'viewport' || typeof window === 'undefined') {
      return { x: nextX, y: nextY };
    }
    const rect = node.getBoundingClientRect();
    let resultX = nextX;
    let resultY = nextY;
    if (rect.left + (nextX - x) < 0) {
      resultX = x - rect.left;
    } else if (rect.right + (nextX - x) > window.innerWidth) {
      resultX = x + (window.innerWidth - rect.right);
    }
    if (rect.top + (nextY - y) < 0) {
      resultY = y - rect.top;
    } else if (rect.bottom + (nextY - y) > window.innerHeight) {
      resultY = y + (window.innerHeight - rect.bottom);
    }
    return { x: resultX, y: resultY };
  }

  function startDrag(event: PointerEvent & { currentTarget: HTMLElement }): void {
    if (disabled || !withinHandle(event.target)) {
      return;
    }
    event.preventDefault();
    active = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: x,
      baseY: y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onMoveStart?.({ x, y });
  }

  function moveDrag(event: PointerEvent & { currentTarget: HTMLElement }): void {
    if (active === null) {
      return;
    }
    const nextX = axis === 'y' ? x : active.baseX + (event.clientX - active.startX);
    const nextY = axis === 'x' ? y : active.baseY + (event.clientY - active.startY);
    const clamped = clamp(event.currentTarget, nextX, nextY);
    x = clamped.x;
    y = clamped.y;
    onMove?.({ x, y });
  }

  function endDrag(event: PointerEvent & { currentTarget: HTMLElement }): void {
    if (active === null) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    active = null;
    onMoveEnd?.({ x, y });
  }

  function keyDrag(event: KeyboardEvent & { currentTarget: HTMLElement }): void {
    if (disabled || event.target !== event.currentTarget) {
      return;
    }
    let nextX = x;
    let nextY = y;
    let moved = false;
    if (axis !== 'y' && event.key === 'ArrowLeft') {
      nextX = x - step;
      moved = true;
    } else if (axis !== 'y' && event.key === 'ArrowRight') {
      nextX = x + step;
      moved = true;
    } else if (axis !== 'x' && event.key === 'ArrowUp') {
      nextY = y - step;
      moved = true;
    } else if (axis !== 'x' && event.key === 'ArrowDown') {
      nextY = y + step;
      moved = true;
    }
    if (moved) {
      event.preventDefault();
      const clamped = clamp(event.currentTarget, nextX, nextY);
      x = clamped.x;
      y = clamped.y;
      onMove?.({ x, y });
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="draggable {classes ?? ''}"
  class:dragging={active !== null}
  data-pw={typeof testId === 'string' ? testId : null}
  tabindex={disabled ? -1 : 0}
  aria-label={dragLabel}
  style:transform={`translate(${x}px, ${y}px)`}
  onpointerdown={startDrag}
  onpointermove={moveDrag}
  onpointerup={endDrag}
  onkeydown={keyDrag}
>
  {#if typeof children === 'function'}
    {@render children()}
  {/if}
</div>

<style>
  .draggable {
    box-sizing: border-box;
    width: var(--draggable-width, fit-content);
    height: var(--draggable-height, fit-content);
    cursor: var(--draggable-cursor, grab);
    touch-action: none;
  }

  .draggable.dragging {
    cursor: var(--draggable-cursor-active, grabbing);
    user-select: none;
  }

  .draggable:focus-visible {
    outline: var(--draggable-focus-outline, 2px solid #3b5bdb);
    outline-offset: var(--draggable-focus-outline-offset, 2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .draggable {
      transition: none;
    }
  }
</style>
