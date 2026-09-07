<script lang="ts">
  import type { SheetProperties } from './properties';
  import { fly, fade } from 'svelte/transition';
  import { lockBodyScroll, unlockBodyScroll } from '../utils';
  import { tick } from 'svelte';
  import Button from '../Button/Button.svelte';

  let {
    open = $bindable(false),
    side = 'right',
    title,
    showOverlay = true,
    dismissOnOutsideClick = showOverlay,
    overlayAriaLabel,
    showCloseButton = true,
    headingLevel,
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
      // No edge to fly in from — a centered dialog only fades, so x/y stay
      // at 0 and `fly` degrades to exactly the overlay's own fade transition.
      case 'center':
        return { x: 0, y: 0, duration: 300 };
    }
  });

  function close() {
    open = false;
    onclose?.();
  }

  function handleOverlayClick(event: MouseEvent) {
    // Gate dismissal on dismissOnOutsideClick explicitly, not on the overlay's
    // pointer-events alone: a visible-but-non-dismissible overlay still needs to
    // catch (and swallow) the click to block the page underneath, without closing.
    if (event.target === overlayDiv && dismissOnOutsideClick) {
      close();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
      return;
    }

    // The overlay only carries role="button" while it is dismissible, and a
    // role="button" has to answer Enter/Space as well as click (WCAG 2.1
    // SC 2.1.1) -- tabindex="-1" keeps it out of the Tab sequence, but the
    // focus trap can still park focus here, and browse-mode AT reaches it.
    // The target check is what stops an Enter pressed on a focusable
    // descendant from bubbling up and reading as an activation of the overlay
    // itself, exactly as handleOverlayClick already guards the click case.
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      dismissOnOutsideClick &&
      event.target === overlayDiv
    ) {
      event.preventDefault();
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

  function scrollLockAction(_node: HTMLElement) {
    lockBodyScroll();
    tick().then(() => {
      if (sheetPanel !== null) {
        sheetPanel.focus();
      }
    });
    return {
      destroy() {
        unlockBodyScroll();
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

  // headingLevel's `1 | 2 | 3 | 4 | 5 | 6` union only constrains Svelte-import
  // consumers. Through the web component, attributes are untyped strings
  // coerced to Number — heading-level="7"/"0"/"-1"/"foo" would otherwise reach
  // `h${headingLevel}` unchecked and render an invalid tag (<h7>, <h0>, <h-1>,
  // <hNaN>). Validate at runtime and fall back to the existing <span>.
  const headingTag = $derived(
    typeof headingLevel === 'number' &&
      Number.isInteger(headingLevel) &&
      headingLevel >= 1 &&
      headingLevel <= 6
      ? `h${headingLevel}`
      : null
  );
</script>

{#if open}
  <!-- The overlay only carries role="button" -- and therefore an accessible
       name -- while it is actually dismissible (dismissOnOutsideClick):
       clicking it is already a guarded no-op otherwise (see
       handleOverlayClick), and announcing a no-op as a focusable "button" is
       worse for assistive tech than leaving it out of the accessibility tree
       entirely. Modal's overlay applies the same reasoning for the same
       shape of problem. When it IS dismissible, a role="button" node with no
       accessible name would be announced as an unlabelled button, so it gets
       one -- "Close sheet" by default, overridable via `overlayAriaLabel`.
       The fallback is `||` on a trimmed value rather than `??`: an empty or
       whitespace-only override is a name a screen reader cannot announce, so
       it has to fall back like an absent one. `??` would forward it and leave
       the overlay silently unnamed, which is the defect this whole block
       exists to prevent. -->
  <div
    bind:this={overlayDiv}
    use:scrollLockAction
    class="sheet-overlay {showOverlay ? 'overlay-visible' : 'overlay-invisible'} {showOverlay ||
    dismissOnOutsideClick
      ? 'overlay-interactive'
      : 'overlay-noninteractive'} {classes ?? ''}"
    onclick={handleOverlayClick}
    onkeydown={handleKeyDown}
    role={dismissOnOutsideClick ? 'button' : null}
    aria-label={dismissOnOutsideClick ? overlayAriaLabel?.trim() || 'Close sheet' : null}
    tabindex="-1"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
    transition:fade={{ duration: 200 }}
  >
    <div
      bind:this={sheetPanel}
      class="sheet-panel {side}"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Sheet'}
      tabindex="-1"
      data-pw={typeof testId === 'string' ? `${testId}-panel` : null}
      testID={typeof testId === 'string' ? `${testId}-panel` : null}
      transition:fly|global={flyParams}
      onintroend={handleIntroEnd}
      onoutroend={handleOutroEnd}
    >
      {#if typeof title === 'string' || showCloseButton}
        <div class="sheet-header">
          {#if typeof title === 'string'}
            {#if headingTag !== null}
              <svelte:element this={headingTag} class="sheet-title">{title}</svelte:element>
            {:else}
              <span class="sheet-title">{title}</span>
            {/if}
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

  .overlay-visible {
    background-color: var(--sheet-overlay-background, #00000066);
  }

  .overlay-invisible {
    background-color: transparent;
  }

  .overlay-interactive {
    pointer-events: auto;
  }

  .overlay-noninteractive {
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

  /* The panel itself is the initial focus target on open (scrollLockAction
     focuses it directly, and it's the Tab-trap's own boundary), so removing
     its outline unconditionally left a keyboard user with no visible sign
     focus had moved into the sheet at all -- particularly visible on the
     "Raw" variant, which has no focusable child for focus to land on
     instead. :focus-visible restores a ring precisely when the browser
     judges it's from keyboard/programmatic focus rather than a mouse click,
     so clicking the trigger still shows nothing new. outline-offset is
     negative (inset) rather than the usual positive offset other components
     in this library use, because left/right/top/bottom panels sit flush
     against a viewport edge -- a positive offset would clip there. */
  .sheet-panel:focus-visible {
    outline: var(--sheet-panel-focus-outline, 2px solid #2563eb);
    outline-offset: var(--sheet-panel-focus-outline-offset, -2px);
  }

  /* --sheet-top/-right/-bottom/-left all default to the previous hardcoded
     edge-to-edge values below, so an unconfigured Sheet renders unchanged.
     Overriding one (e.g. --sheet-top to clear a fixed header, or --sheet-bottom:
     auto to size to content) turns the panel from an edge-to-edge slide-in into
     an anchored floating panel, without needing a different component. */
  .sheet-panel.left,
  .sheet-panel.right {
    top: var(--sheet-top, 0);
    bottom: var(--sheet-bottom, 0);
    width: var(--sheet-width, 400px);
    max-width: var(--sheet-max-width, 100vw);
  }

  .sheet-panel.left {
    left: var(--sheet-left, 0);
    border-right: var(--sheet-border, none);
  }

  .sheet-panel.right {
    right: var(--sheet-right, 0);
    border-left: var(--sheet-border, none);
  }

  .sheet-panel.top,
  .sheet-panel.bottom {
    left: var(--sheet-left, 0);
    right: var(--sheet-right, 0);
    height: var(--sheet-height, 300px);
    max-height: var(--sheet-max-height, 100vh);
  }

  .sheet-panel.top {
    top: var(--sheet-top, 0);
    border-bottom: var(--sheet-border, none);
  }

  .sheet-panel.bottom {
    bottom: var(--sheet-bottom, 0);
    border-top: var(--sheet-border, none);
  }

  /* `side="center"` is a fixed-size floating dialog, not an edge-anchored
     panel: no top/bottom/left/right offset, sized by its own tokens rather
     than --sheet-width/--sheet-height (so an existing left/right/top/bottom
     theme is untouched by adding this variant), and centered with a
     transform instead of stretching to an edge. */
  .sheet-panel.center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: var(--sheet-center-width, 480px);
    max-width: var(--sheet-center-max-width, calc(100vw - 32px));
    max-height: var(--sheet-center-max-height, 90vh);
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
    --button-border-radius: var(--sheet-close-button-border-radius, var(--radius, 4px));
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
