<script lang="ts">
  import Resizable from '../Resizable/Resizable.svelte';
  import { registerDismissible } from '../_interaction/dismissal';
  import type { ResizeSize } from '../Resizable/properties';
  import type { DockPanelProperties, DockPanelSnapshot, DockPanelState } from './properties';

  let {
    state: panelState = $bindable('closed'),
    width = $bindable(380),
    minWidth = 300,
    maxWidth = 600,
    reservedWidth = $bindable(0),
    label = 'Panel',
    resizeLabel = 'Resize panel',
    header,
    body,
    footer,
    children,
    testId,
    classes,
    onstatechange,
    onwidthchange
  }: DockPanelProperties = $props();

  const lowerWidth = $derived(Number.isFinite(minWidth) ? Math.max(0, minWidth) : 300);
  const upperWidth = $derived(
    Number.isFinite(maxWidth) ? Math.max(lowerWidth, maxWidth) : Math.max(lowerWidth, 600)
  );
  const clampedWidth = $derived(
    Math.min(upperWidth, Math.max(lowerWidth, Number.isFinite(width) ? width : 380))
  );

  const changeState = (nextState: DockPanelState): void => {
    if (panelState !== nextState) {
      panelState = nextState;
      onstatechange?.(nextState);
    }
  };
  const expand = (): void => changeState('expanded');
  const collapse = (): void => changeState('docked');
  const close = (): void => changeState('closed');

  const handleResize = (size: ResizeSize): void => {
    const nextWidth = Math.min(upperWidth, Math.max(lowerWidth, size.width));
    if (width !== nextWidth) {
      width = nextWidth;
      onwidthchange?.(width);
    }
  };

  const synchronizePanel = (node: HTMLElement, snapshot: DockPanelSnapshot) => {
    let releaseDismissal: (() => void) | null = null;
    const update = (nextSnapshot: DockPanelSnapshot): void => {
      if (width !== nextSnapshot.width) {
        width = nextSnapshot.width;
        onwidthchange?.(width);
      }
      const nextReservation = nextSnapshot.state === 'docked' ? nextSnapshot.width : 0;
      if (reservedWidth !== nextReservation) {
        reservedWidth = nextReservation;
      }
      if (nextSnapshot.state === 'expanded' && releaseDismissal === null) {
        releaseDismissal = registerDismissible({ element: () => node, onEscape: collapse });
      } else if (nextSnapshot.state !== 'expanded' && releaseDismissal !== null) {
        releaseDismissal();
        releaseDismissal = null;
      }
    };
    update(snapshot);
    return { update, destroy: () => releaseDismissal?.() };
  };
</script>

<div
  class="dock-panel {classes ?? ''}"
  class:closed={panelState === 'closed'}
  class:expanded={panelState === 'expanded'}
  data-state={panelState}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role="complementary"
  aria-label={label}
  inert={panelState === 'closed'}
  use:synchronizePanel={{ state: panelState, width: clampedWidth }}
  style:width={panelState === 'expanded' ? null : `${clampedWidth}px`}
>
  <Resizable
    width={panelState === 'docked' ? clampedWidth : null}
    minWidth={lowerWidth}
    maxWidth={upperWidth}
    handles={panelState === 'docked' ? ['left'] : []}
    handleLabel={resizeLabel}
    onresize={handleResize}
    classes="dock-panel-frame"
  >
    {#if typeof header === 'function'}
      <div class="header">{@render header({ state: panelState, expand, collapse, close })}</div>
    {/if}
    <div class="body">
      {#if typeof body === 'function'}
        {@render body()}
      {:else if typeof children === 'function'}
        {@render children()}
      {/if}
    </div>
    {#if typeof footer === 'function'}
      <div class="footer">{@render footer()}</div>
    {/if}
  </Resizable>
</div>

<style>
  .dock-panel {
    box-sizing: border-box;
    position: var(--dock-panel-position, fixed);
    top: var(--dock-panel-top, 0px);
    right: var(--dock-panel-right, 0px);
    bottom: var(--dock-panel-bottom, 0px);
    display: flex;
    flex-direction: column;
    min-width: 0;
    z-index: var(--dock-panel-z-index, 30);
    background: var(--dock-panel-background, #ffffff);
    color: var(--dock-panel-color, #18181b);
    border-radius: var(--dock-panel-border-radius, 0px);
    box-shadow: var(--dock-panel-box-shadow, -4px 0 16px #00000012);
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity
        var(--dock-panel-transition-duration, var(--duration-base, var(--motion-duration, 200ms)))
        var(--dock-panel-transition-easing, var(--ease-smooth-out, var(--motion-easing, ease-out))),
      transform
        var(--dock-panel-transition-duration, var(--duration-base, var(--motion-duration, 200ms)))
        var(--dock-panel-transition-easing, var(--ease-smooth-out, var(--motion-easing, ease-out))),
      display
        var(--dock-panel-transition-duration, var(--duration-base, var(--motion-duration, 200ms)))
        allow-discrete;
  }

  .dock-panel.closed {
    display: none;
    opacity: 0;
    transform: translateX(var(--dock-panel-enter-distance, var(--distance-base, 8px)));
  }

  .dock-panel.expanded {
    left: var(--dock-panel-left, 0px);
    width: calc(100% - var(--dock-panel-left, 0px) - var(--dock-panel-right, 0px));
  }

  .dock-panel :global(.dock-panel-frame) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    border: var(--dock-panel-border, 1px solid #e4e4e7);
    --resizable-transition: none;
  }

  .header {
    flex-shrink: 0;
    padding: var(--dock-panel-header-padding, 0px);
    border-bottom: var(--dock-panel-header-border, none);
  }

  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--dock-panel-body-padding, 0px);
  }

  .footer {
    flex-shrink: 0;
    padding: var(--dock-panel-footer-padding, 0px);
    border-top: var(--dock-panel-footer-border, none);
  }

  @starting-style {
    .dock-panel:not(.closed) {
      opacity: 0;
      transform: translateX(var(--dock-panel-enter-distance, var(--distance-base, 8px)));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dock-panel {
      transition: none;
    }
  }
</style>
