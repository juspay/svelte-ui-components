<script lang="ts">
  import type { SheetProperties } from './properties';
  import { fly, fade } from 'svelte/transition';
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
    onafteropen,
    onafterclose,
    classes
  }: SheetProperties = $props();

  let overlayDiv: HTMLDivElement | null = $state(null);
  let sheetPanel: HTMLDivElement | null = $state(null);

  let flyParams = $derived.by(() => {
    switch (side) {
      case 'left':
        return { x: -400, y: 0, duration: 300 };
      case 'right':
        return { x: 400, y: 0, duration: 300 };
      case 'top':
        return { x: 0, y: -400, duration: 300 };
      case 'bottom':
        return { x: 0, y: 400, duration: 300 };
    }
  });

  function close() {
    open = false;
    onclose?.();
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

  function handleIntroEnd() {
    if (typeof onafteropen === 'function') {
      onafteropen();
    }
  }

  function handleOutroEnd() {
    if (typeof onafterclose === 'function') {
      onafterclose();
    }
  }
</script>

{#if open}
  <div
    bind:this={overlayDiv}
    use:scrollLockAction
    class="sheet-overlay {showOverlay ? 'overlay-active' : 'overlay-inactive'} {classes ?? ''}"
    onclick={handleOverlayClick}
    onkeydown={handleKeyDown}
    role="button"
    tabindex="-1"
    data-pw={typeof testId === 'string' ? testId : null}
    transition:fade={{ duration: 200 }}
  >
    <div
      bind:this={sheetPanel}
      class="sheet-panel {side}"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Sheet'}
      tabindex="-1"
      transition:fly|global={flyParams}
      onintroend={handleIntroEnd}
      onoutroend={handleOutroEnd}
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
  }

  .sheet-panel.right {
    right: 0;
    border-left: var(--sheet-border, none);
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
  }

  .sheet-panel.bottom {
    bottom: 0;
    border-top: var(--sheet-border, none);
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
