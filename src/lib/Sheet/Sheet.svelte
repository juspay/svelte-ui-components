<script lang="ts">
  import type { SheetProperties } from './properties';
  import { tick } from 'svelte';
  import Button from '../Button/Button.svelte';

  let {
    open = $bindable(false),
    side = 'right',
    title,
    showOverlay = true,
    showCloseButton = true,
    testId,
    content,
    footer,
    onclose,
    classes
  }: SheetProperties = $props();

  let overlayDiv: HTMLDivElement | null = $state(null);
  let sheetPanel: HTMLDivElement | null = $state(null);
  let internalShouldRender: boolean = $state(open);
  let panelState: 'open' | 'closing' = $state('open');

  function trackOpen(_node: Window, currentOpen: boolean) {
    let prev = currentOpen;
    return {
      update(nextOpen: boolean) {
        if (nextOpen === prev) {
          return;
        }
        if (nextOpen) {
          internalShouldRender = true;
          panelState = 'open';
        } else if (internalShouldRender && panelState === 'open') {
          panelState = 'closing';
        }
        prev = nextOpen;
      }
    };
  }

  function close() {
    open = false;
  }

  function handlePanelAnimationEnd(event: AnimationEvent) {
    if (panelState === 'closing' && event.target === sheetPanel) {
      internalShouldRender = false;
      panelState = 'open';
      onclose?.();
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === overlayDiv) {
      close();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Tab' && sheetPanel !== null) {
      const focusable = sheetPanel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);

      if (first === null || last === null) {
        return;
      }

      const atEdge = document.activeElement === (event.shiftKey ? first : last);
      if (atEdge) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  }

  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
  }

  function scrollLockAction(_node: HTMLElement) {
    panelState = 'open';
    lockScroll();
    tick().then(() => {
      if (sheetPanel !== null) {
        sheetPanel.focus();
      }
    });
    return {
      destroy() {
        unlockScroll();
      }
    };
  }
</script>

<svelte:window use:trackOpen={open} />

{#if internalShouldRender}
  <div
    bind:this={overlayDiv}
    use:scrollLockAction
    class="sheet-overlay {showOverlay ? 'overlay-active' : 'overlay-inactive'} {classes ?? ''}"
    onclick={handleOverlayClick}
    onkeydown={handleKeyDown}
    role="button"
    tabindex="-1"
    data-pw={typeof testId === 'string' ? testId : null}
    data-state={panelState}
  >
    <div
      bind:this={sheetPanel}
      class="sheet-panel {side}"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Sheet'}
      tabindex="-1"
      data-state={panelState}
      onanimationend={handlePanelAnimationEnd}
    >
      {#if typeof title === 'string' || showCloseButton}
        <div class="sheet-header">
          {#if typeof title === 'string'}
            <span class="sheet-title">{title}</span>
          {/if}
          {#if showCloseButton}
            <div class="sheet-close-button">
              <Button
                onclick={close}
                ariaLabel="Close"
                {...typeof testId === 'string' ? { testId: `${testId}-close` } : {}}
              >
                &#x2715;
              </Button>
            </div>
          {/if}
        </div>
      {/if}
      <div class="sheet-content">
        {@render content()}
      </div>
      {#if typeof footer === 'function'}
        <div class="sheet-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--sheet-overlay-z-index, 15);
    -webkit-tap-highlight-color: transparent;
    animation-name: var(--sheet-overlay-animation-name, sheet-overlay-fade-in);
    animation-duration: var(--sheet-overlay-animation-duration, 200ms);
    animation-timing-function: var(--sheet-overlay-animation-easing, ease);
    animation-fill-mode: var(--sheet-overlay-animation-fill-mode, both);
  }

  .sheet-overlay[data-state='closing'] {
    animation-name: var(--sheet-overlay-exit-animation-name, sheet-overlay-fade-out);
    animation-duration: var(--sheet-overlay-exit-animation-duration, 200ms);
    animation-timing-function: var(--sheet-overlay-exit-animation-easing, ease);
    animation-fill-mode: var(--sheet-overlay-exit-animation-fill-mode, both);
  }

  @keyframes sheet-overlay-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes sheet-overlay-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .overlay-active {
    background-color: var(--sheet-overlay-background, #00000066);
    pointer-events: auto;
  }

  .overlay-inactive {
    pointer-events: none;
  }

  .sheet-panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    background-color: var(--sheet-background, #ffffff);
    box-shadow: var(--sheet-box-shadow, -2px 0 8px rgba(0, 0, 0, 0.15));
    z-index: var(--sheet-z-index, 16);
    pointer-events: auto;
    outline: none;
    animation-name: var(--sheet-panel-animation-name, sheet-panel-fly-right);
    animation-duration: var(--sheet-panel-animation-duration, 300ms);
    animation-timing-function: var(--sheet-panel-animation-easing, ease);
    animation-fill-mode: var(--sheet-panel-animation-fill-mode, both);
  }

  .sheet-panel[data-state='closing'] {
    animation-name: var(--sheet-panel-exit-animation-name, sheet-panel-fly-out-right);
    animation-duration: var(--sheet-panel-exit-animation-duration, 300ms);
    animation-timing-function: var(--sheet-panel-exit-animation-easing, ease);
    animation-fill-mode: var(--sheet-panel-exit-animation-fill-mode, both);
  }

  .sheet-panel.left,
  .sheet-panel.right {
    top: 0;
    bottom: 0;
    width: var(--sheet-width, 400px);
    max-width: var(--sheet-max-width, 100vw);
  }

  .sheet-panel.left {
    left: 0;
    border-right: var(--sheet-border, none);
    animation-name: var(--sheet-panel-animation-name, sheet-panel-fly-left);
  }

  .sheet-panel.left[data-state='closing'] {
    animation-name: var(--sheet-panel-exit-animation-name, sheet-panel-fly-out-left);
  }

  .sheet-panel.right {
    right: 0;
    border-left: var(--sheet-border, none);
    animation-name: var(--sheet-panel-animation-name, sheet-panel-fly-right);
  }

  .sheet-panel.right[data-state='closing'] {
    animation-name: var(--sheet-panel-exit-animation-name, sheet-panel-fly-out-right);
  }

  .sheet-panel.top,
  .sheet-panel.bottom {
    left: 0;
    right: 0;
    height: var(--sheet-height, 300px);
    max-height: var(--sheet-max-height, 100vh);
  }

  .sheet-panel.top {
    top: 0;
    border-bottom: var(--sheet-border, none);
    animation-name: var(--sheet-panel-animation-name, sheet-panel-fly-top);
  }

  .sheet-panel.top[data-state='closing'] {
    animation-name: var(--sheet-panel-exit-animation-name, sheet-panel-fly-out-top);
  }

  .sheet-panel.bottom {
    bottom: 0;
    border-top: var(--sheet-border, none);
    animation-name: var(--sheet-panel-animation-name, sheet-panel-fly-bottom);
  }

  .sheet-panel.bottom[data-state='closing'] {
    animation-name: var(--sheet-panel-exit-animation-name, sheet-panel-fly-out-bottom);
  }

  @keyframes sheet-panel-fly-right {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes sheet-panel-fly-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes sheet-panel-fly-top {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes sheet-panel-fly-bottom {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes sheet-panel-fly-out-right {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }

  @keyframes sheet-panel-fly-out-left {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes sheet-panel-fly-out-top {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-100%);
    }
  }

  @keyframes sheet-panel-fly-out-bottom {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .sheet-header {
    display: flex;
    align-items: center;
    padding: var(--sheet-header-padding, 16px 20px);
    background-color: var(--sheet-header-background, inherit);
    border-bottom: var(--sheet-header-border-bottom, 1px solid #e0e0e0);
    flex-shrink: 0;
  }

  .sheet-title {
    flex: 1;
    font-size: var(--sheet-title-font-size, 18px);
    font-weight: var(--sheet-title-font-weight, 600);
    font-family: var(--sheet-title-font-family, inherit);
    color: var(--sheet-title-color, #1a1a1a);
    line-height: var(--sheet-title-line-height, 1.4);
  }

  .sheet-close-button {
    --button-width: var(--sheet-close-button-size, 32px);
    --button-height: var(--sheet-close-button-size, 32px);
    --button-border: none;
    --button-border-radius: var(--sheet-close-button-border-radius, 4px);
    --button-color: var(--sheet-close-button-background, transparent);
    --button-text-color: var(--sheet-close-button-color, #666666);
    --button-font-size: var(--sheet-close-button-font-size, 16px);
    --button-padding: 0;
    --button-hover-color: var(--sheet-close-button-hover-background, #f0f0f0);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sheet-content {
    flex: 1;
    overflow-y: var(--sheet-content-overflow-y, auto);
    padding: var(--sheet-content-padding, 20px);
    scrollbar-width: var(--sheet-scrollbar-width, none);
  }

  .sheet-content::-webkit-scrollbar {
    display: none;
  }

  .sheet-footer {
    padding: var(--sheet-footer-padding, 16px 20px);
    background-color: var(--sheet-footer-background, inherit);
    border-top: var(--sheet-footer-border-top, 1px solid #e0e0e0);
    flex-shrink: 0;
  }
</style>
