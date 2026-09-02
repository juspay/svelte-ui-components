<script lang="ts">
  import { tick } from 'svelte';
  import Button from '../Button/Button.svelte';
  import Resizable from '../Resizable/Resizable.svelte';
  import chatSvg from '$lib/assets/chat.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  import type { ResizeEdge } from '../Resizable/properties';
  import type { BubbleDrag, ChatBubbleProperties } from './properties';

  let {
    open = $bindable(false),
    position = 'bottom-right',
    label = 'Open chat',
    closeLabel = 'Close chat',
    icon,
    openIcon,
    children,
    draggable = false,
    dragMode = 'snap',
    dragX = $bindable(0),
    dragY = $bindable(0),
    resizable = false,
    panelWidth = $bindable(380),
    panelHeight = $bindable(600),
    minPanelWidth = 280,
    minPanelHeight = 360,
    expanded = $bindable(false),
    expandedPanelWidth = $bindable(600),
    expandedPanelHeight = $bindable(760),
    onopen: onopenLegacy,
    onOpen,
    onclose: oncloseLegacy,
    onClose,
    ontoggle: ontoggleLegacy,
    onToggle,
    testId,
    classes
  }: ChatBubbleProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onclose = $derived(onClose ?? oncloseLegacy);
  const onopen = $derived(onOpen ?? onopenLegacy);
  const ontoggle = $derived(onToggle ?? ontoggleLegacy);

  const DRAG_THRESHOLD = 4;

  function handlesFor(vertical: 'top' | 'bottom', side: 'left' | 'right'): ResizeEdge[] {
    if (vertical === 'bottom') {
      return side === 'right' ? ['top', 'left', 'top-left'] : ['top', 'right', 'top-right'];
    }
    return side === 'right'
      ? ['bottom', 'left', 'bottom-left']
      : ['bottom', 'right', 'bottom-right'];
  }

  let root: HTMLElement | null = $state(null);
  let panel: HTMLElement | null = $state(null);
  let launcher: HTMLElement | null = $state(null);
  let drag = $state<BubbleDrag | null>(null);
  let flipHorizontal: 'left' | 'right' | null = $state(null);
  let flipVertical: 'top' | 'bottom' | null = $state(null);
  let availWidth: number | null = $state(null);
  let availHeight: number | null = $state(null);
  let suppressClick = false;

  let dragging = $derived(drag !== null && drag.moved);
  let effectiveSide: 'left' | 'right' = $derived(
    flipHorizontal ?? (position.endsWith('right') ? 'right' : 'left')
  );
  let verticalSide: 'top' | 'bottom' = $derived(
    flipVertical ?? (position.startsWith('top') ? 'top' : 'bottom')
  );
  let resizeHandles = $derived(handlesFor(verticalSide, effectiveSide));

  let liveWidth = $derived(expanded ? expandedPanelWidth : panelWidth);
  let liveHeight = $derived(expanded ? expandedPanelHeight : panelHeight);

  function setLiveWidth(value: number): void {
    if (expanded) {
      expandedPanelWidth = value;
    } else {
      panelWidth = value;
    }
  }

  function setLiveHeight(value: number): void {
    if (expanded) {
      expandedPanelHeight = value;
    } else {
      panelHeight = value;
    }
  }

  function snapMargin(): number {
    if (root === null) {
      return 24;
    }
    const raw = getComputedStyle(root).getPropertyValue('--chat-bubble-offset-x').trim();
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? 24 : parsed;
  }

  function capFor(
    left: number,
    top: number,
    right: number,
    bottom: number,
    horizontal: 'left' | 'right',
    vertical: 'top' | 'bottom'
  ): void {
    const gap = 16;
    const margin = 8;
    availHeight = Math.max(
      0,
      vertical === 'bottom' ? top - gap - margin : window.innerHeight - bottom - gap - margin
    );
    availWidth = Math.max(
      0,
      horizontal === 'right' ? right - margin : window.innerWidth - left - margin
    );
  }

  function placeAt(left: number, top: number, right: number, bottom: number): void {
    if (typeof window === 'undefined') {
      return;
    }
    const horizontal = (left + right) / 2 < window.innerWidth / 2 ? 'left' : 'right';
    const vertical = (top + bottom) / 2 < window.innerHeight / 2 ? 'top' : 'bottom';
    flipHorizontal = horizontal;
    flipVertical = vertical;
    capFor(left, top, right, bottom, horizontal, vertical);
  }

  async function setOpen(next: boolean): Promise<void> {
    if (next === open) {
      return;
    }
    if (next && launcher !== null) {
      const rect = launcher.getBoundingClientRect();
      placeAt(rect.left, rect.top, rect.right, rect.bottom);
    }
    open = next;
    ontoggle?.(open);
    if (open) {
      onopen?.();
      await tick();
      panel?.focus();
    } else {
      onclose?.();
      launcher?.querySelector('button')?.focus();
    }
  }

  function handleLauncherClick(): void {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    void setOpen(!open);
  }

  function startBubbleDrag(event: PointerEvent): void {
    if (!draggable || launcher === null) {
      return;
    }
    suppressClick = false;
    const rect = launcher.getBoundingClientRect();
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: dragX,
      baseY: dragY,
      moved: false,
      left0: rect.left - dragX,
      top0: rect.top - dragY,
      width: rect.width,
      height: rect.height
    };
  }

  function clampToViewport(
    next: BubbleDrag,
    nextX: number,
    nextY: number
  ): { x: number; y: number } {
    if (typeof window === 'undefined') {
      return { x: nextX, y: nextY };
    }
    let x = nextX;
    let y = nextY;
    const left = next.left0 + nextX;
    const top = next.top0 + nextY;
    if (left < 0) {
      x = -next.left0;
    } else if (left + next.width > window.innerWidth) {
      x = window.innerWidth - next.width - next.left0;
    }
    if (top < 0) {
      y = -next.top0;
    } else if (top + next.height > window.innerHeight) {
      y = window.innerHeight - next.height - next.top0;
    }
    return { x, y };
  }

  function moveBubbleDrag(event: PointerEvent): void {
    if (drag === null) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
      return;
    }
    drag.moved = true;
    const clamped = clampToViewport(drag, drag.baseX + dx, drag.baseY + dy);
    dragX = clamped.x;
    dragY = clamped.y;
    if (open && flipHorizontal !== null && flipVertical !== null) {
      const left = drag.left0 + dragX;
      const top = drag.top0 + dragY;
      capFor(left, top, left + drag.width, top + drag.height, flipHorizontal, flipVertical);
    }
  }

  function endBubbleDrag(): void {
    if (drag === null) {
      return;
    }
    const ended = drag;
    drag = null;
    if (!ended.moved) {
      return;
    }
    suppressClick = true;
    if (typeof window === 'undefined') {
      return;
    }
    if (dragMode === 'snap') {
      const margin = snapMargin();
      const toLeft = ended.left0 + dragX + ended.width / 2 < window.innerWidth / 2;
      dragX = toLeft
        ? margin - ended.left0
        : window.innerWidth - margin - ended.width - ended.left0;
    }
    const left = ended.left0 + dragX;
    const top = ended.top0 + dragY;
    placeAt(left, top, left + ended.width, top + ended.height);
  }

  function handlePanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      void setOpen(false);
    }
  }
</script>

<svelte:window onpointermove={moveBubbleDrag} onpointerup={endBubbleDrag} />

<div
  class="chat-bubble {classes ?? ''}"
  class:is-draggable={draggable}
  class:dragging
  data-position={position}
  data-effective-side={effectiveSide}
  data-effective-vertical={verticalSide}
  data-expanded={expanded}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  bind:this={root}
  style:transform={draggable ? `translate(${dragX}px, ${dragY}px)` : null}
>
  {#if open}
    <div
      class="panel-anchor"
      style:--resizable-max-width={availWidth === null ? null : `${availWidth}px`}
      style:--resizable-max-height={availHeight === null ? null : `${availHeight}px`}
    >
      <Resizable
        disabled={!resizable}
        bind:width={() => liveWidth, setLiveWidth}
        bind:height={() => liveHeight, setLiveHeight}
        minWidth={minPanelWidth}
        minHeight={minPanelHeight}
        maxWidth={availWidth ?? Number.POSITIVE_INFINITY}
        maxHeight={availHeight ?? Number.POSITIVE_INFINITY}
        handles={resizeHandles}
      >
        <div
          class="panel"
          role="dialog"
          aria-label={label}
          tabindex="-1"
          bind:this={panel}
          onkeydown={handlePanelKeydown}
        >
          {#if typeof children === 'function'}
            {@render children()}
          {/if}
        </div>
      </Resizable>
    </div>
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="launcher" bind:this={launcher} onpointerdown={startBubbleDrag}>
    <Button onclick={handleLauncherClick} ariaLabel={open ? closeLabel : label} ariaExpanded={open}>
      {#if open}
        {#if typeof openIcon === 'function'}
          {@render openIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html closeSvg}
        {/if}
      {:else if typeof icon === 'function'}
        {@render icon()}
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html chatSvg}
      {/if}
    </Button>
  </div>
</div>

<style>
  .chat-bubble {
    position: fixed;
    z-index: var(--chat-bubble-z-index, 1000);
    transition: var(--chat-bubble-snap-transition, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1));
  }

  .chat-bubble.dragging {
    transition: none;
  }

  .chat-bubble[data-position='bottom-right'] {
    right: var(--chat-bubble-offset-x, 24px);
    bottom: var(--chat-bubble-offset-y, 24px);
  }

  .chat-bubble[data-position='bottom-left'] {
    left: var(--chat-bubble-offset-x, 24px);
    bottom: var(--chat-bubble-offset-y, 24px);
  }

  .chat-bubble[data-position='top-right'] {
    right: var(--chat-bubble-offset-x, 24px);
    top: var(--chat-bubble-offset-y, 24px);
  }

  .chat-bubble[data-position='top-left'] {
    left: var(--chat-bubble-offset-x, 24px);
    top: var(--chat-bubble-offset-y, 24px);
  }

  .panel-anchor {
    position: absolute;
    --resizable-handle-color: var(--chat-bubble-resize-handle-color, transparent);
    --resizable-transition: var(
      --chat-bubble-expand-transition,
      width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      height 0.32s cubic-bezier(0.22, 1, 0.36, 1)
    );
  }

  .chat-bubble[data-effective-vertical='bottom'] .panel-anchor {
    bottom: calc(100% + var(--chat-bubble-panel-gap, 16px));
  }

  .chat-bubble[data-effective-vertical='top'] .panel-anchor {
    top: calc(100% + var(--chat-bubble-panel-gap, 16px));
  }

  .chat-bubble[data-effective-side='right'] .panel-anchor {
    right: 0;
  }

  .chat-bubble[data-effective-side='left'] .panel-anchor {
    left: 0;
  }

  .panel {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    max-width: var(--chat-bubble-panel-max-width, calc(100vw - 32px));
    max-height: var(--chat-bubble-panel-max-height, calc(100dvh - 120px));
    border-radius: var(--chat-bubble-panel-border-radius, 16px);
    overflow: hidden;
    background: var(--chat-bubble-panel-background, #ffffff);
    box-shadow: var(--chat-bubble-panel-box-shadow, 0 16px 48px rgba(0, 0, 0, 0.22));
    outline: none;
  }

  .launcher {
    --button-width: var(--chat-bubble-width, var(--chat-bubble-size, 56px));
    --button-height: var(--chat-bubble-height, var(--chat-bubble-size, 56px));
    --button-padding: var(--chat-bubble-padding, 16px);
    --button-border-radius: var(--chat-bubble-border-radius, 50%);
    --button-color: var(--chat-bubble-background-color, #18181b);
    --button-text-color: var(--chat-bubble-color, #ffffff);
    /* Button spaces its icon from its label with this gap. The launcher renders an
       icon alone inside a circle, so that gap would push the glyph off-centre --
       reset to 0 here rather than in Button, whose default is right for a labelled
       button. docs/ChatBubble.md records this as a pill-launcher caveat. */
    --button-content-gap: 0px;
    --button-box-shadow: var(--chat-bubble-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.25));
    --button-hover-color: var(--chat-bubble-hover-background-color, #27272a);
  }

  .chat-bubble.is-draggable .launcher {
    --cursor: grab;
    touch-action: none;
  }

  .chat-bubble.is-draggable.dragging .launcher {
    --cursor: grabbing;
  }

  .launcher :global(svg) {
    height: 100%;
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .chat-bubble {
      transition: none;
    }
  }
</style>
