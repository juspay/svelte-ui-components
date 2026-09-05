<script lang="ts">
  import type { ModalProperties } from './properties';
  import { onMount, onDestroy, tick } from 'svelte';
  import ModalAnimation from '$lib/Animations/ModalAnimation.svelte';
  import OverlayAnimation from '$lib/Animations/OverlayAnimation.svelte';
  import { createDebouncer, lockBodyScroll, unlockBodyScroll } from '../utils';
  import { focusEntryPoint, focusTrapTabTarget } from './focus-trap';
  import Button from '$lib/Button/Button.svelte';
  import Img from '$lib/Img/Img.svelte';

  let overlayDiv: HTMLDivElement | null = $state(null);
  let modalContent: HTMLDivElement | null = $state(null);
  let backPressed = $state(false);
  // Captured in onMount right before focus moves in, restored in onDestroy.
  // Not $state: it's read-once bookkeeping for the mount/destroy pair, not
  // something the template reacts to.
  let previouslyFocusedElement: HTMLElement | null = null;

  let {
    size = 'fit-content',
    align = 'center',
    showOverlay = true,
    supportHardwareBackPress = false,
    enableTransition = true,
    transitionType = 'ALL',
    entryAnimation,
    header = {},
    footer,
    debounceTime = 700,
    leftImageTestId,
    leftImageAriaLabel,
    testId,
    content,
    footerSnippet,
    onclose,
    onheaderrightimageclick,
    onheaderleftimageclick,
    onprimarybuttonclick,
    onsecondarybuttonclick,
    onoverlayclick,
    onkeydown,
    ondismiss,
    classes,
    overlayBackdropFilter,
    overlayFadeIn = false,
    usePortal = false,
    lockScroll = true,
    autoDismissAfter = null,
    ariaLabel,
    role,
    overlayAriaLabel
  }: ModalProperties = $props();

  // The overlay only takes role="button" and becomes keyboard-reachable when a
  // click on it would actually do something. Without either handler, clicking
  // or activating it is already a no-op (see handleOverlayClick's guard) --
  // announcing it as a focusable "button" in that case is worse for assistive
  // tech than leaving it unannounced, same reasoning already applied to the
  // header images below.
  const overlayDismissible = $derived(
    typeof onoverlayclick === 'function' || typeof ondismiss === 'function'
  );

  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  // Fix [major]: plain const so the debouncer closure retains its internal lastCallTime state
  // across re-renders. $derived would recreate the debouncer on every reactive re-evaluation,
  // resetting the timer and breaking debounce correctness.
  const debounce = createDebouncer(debounceTime);

  // Fix [minor]: portalAction with null guard + update hook so usePortal toggles work post-mount.
  const portalAction = (node: HTMLElement, params: { usePortal: boolean }) => {
    if (!params.usePortal || typeof document === 'undefined' || !document.body) {
      return;
    }
    const target = document.body;
    target.appendChild(node);
    return {
      update(updatedParams: { usePortal: boolean }) {
        if (updatedParams.usePortal && !node.parentElement?.isSameNode(document.body)) {
          document.body.appendChild(node);
        }
      },
      destroy() {
        node.parentNode?.removeChild(node);
      }
    };
  };

  // Resolves the real focused element regardless of whether modalContent sits
  // in the light DOM or inside Modal.wc.svelte's open shadow root.
  // document.activeElement stops at a shadow boundary and returns the shadow
  // host itself, never the element actually focused inside it -- getRootNode()
  // returns that shadow root directly when modalContent is shadow-hosted, and
  // the owner Document otherwise.
  const getActiveElement = (): Element | null => {
    if (modalContent === null) {
      return null;
    }
    const root = modalContent.getRootNode();
    if (root instanceof Document || root instanceof ShadowRoot) {
      return root.activeElement;
    }
    return null;
  };

  const handlePopstate = (): void => {
    backPressed = true;
    onclose?.();
    ondismiss?.();
  };

  const handleRightImageClick = (event: MouseEvent): void => {
    onheaderrightimageclick?.(event);
  };

  const handleLeftImageClick = (event: MouseEvent): void => {
    onheaderleftimageclick?.(event);
  };

  const handlePrimaryButtonClick = (event: MouseEvent): void => {
    onprimarybuttonclick?.(event);
  };

  const handleSecondaryButtonClick = (event: MouseEvent): void => {
    onsecondarybuttonclick?.(event);
  };

  const handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === overlayDiv) {
      debounce(() => {
        onoverlayclick?.();
        ondismiss?.();
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    onkeydown?.(event);
    const key = event?.key;
    if (key === 'Escape') {
      onoverlayclick?.();
      ondismiss?.();
      return;
    }
    if (key === 'Tab') {
      const target = focusTrapTabTarget({
        container: modalContent,
        activeElement: getActiveElement(),
        shiftKey: event.shiftKey
      });
      if (target !== null) {
        event.preventDefault();
        target.focus();
      }
    }
  };

  // The overlay's own Enter/Space activation, additional to the shared
  // handleKeyDown (Escape/Tab/onkeydown-prop) that svelte:window already
  // delivers here via bubbling -- this handler must not also call
  // handleKeyDown itself, or every keydown on/under the overlay would run it
  // twice (once from this direct call, once from the window listener seeing
  // the same event bubble past it), double-firing onkeydown and, on Escape,
  // the dismiss callbacks. Enter/Space activation is scoped to this handler,
  // not folded into handleKeyDown itself, because handleKeyDown also runs
  // from the window listener for a keypress anywhere in the modal (e.g. an
  // input field) -- it must not treat every Enter/Space in the modal as an
  // overlay dismissal. This handler is bound to the overlay div, so a keydown
  // on any focusable descendant (the back button, a footer button, an input
  // field) bubbles up and reaches it too -- the target check below is what
  // actually stops that bubbled Enter/Space from being read as an activation
  // of the overlay itself, mirroring the guard handleOverlayClick already has
  // for the click case.
  const handleOverlayKeyDown = (event: KeyboardEvent): void => {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      overlayDismissible &&
      event.target === overlayDiv
    ) {
      event.preventDefault();
      debounce(() => {
        onoverlayclick?.();
        ondismiss?.();
      });
    }
  };

  // Fix [major]: role=button image divs need Enter/Space handlers for WCAG 2.1 SC 2.1.1.
  // Keyboard activation (Enter/Space) invokes the same prop callbacks as click.
  const handleLeftImageKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onheaderleftimageclick?.(new MouseEvent('click'));
    }
  };

  const handleRightImageKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onheaderrightimageclick?.(new MouseEvent('click'));
    }
  };

  onMount(() => {
    if (lockScroll) {
      lockBodyScroll();
    }
    if (typeof autoDismissAfter === 'number') {
      dismissTimer = setTimeout(() => onclose?.(), autoDismissAfter);
    }
    if (supportHardwareBackPress) {
      history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopstate);
    }
    // Focus starts inside the dialog once it exists, same as Sheet's trap --
    // otherwise Tab from wherever the trigger was leaves focus behind it,
    // outside the trap that was just installed.
    void tick().then(() => {
      // Capture whatever had focus (the trigger, typically) right before
      // moving focus in, so onDestroy can put it back. Shadow-aware for the
      // same reason the Tab trap is: inside Modal.wc.svelte's open shadow
      // root, document.activeElement would return the shadow host instead.
      const active = getActiveElement();
      previouslyFocusedElement = active instanceof HTMLElement ? active : null;
      focusEntryPoint(modalContent);
    });
  });

  onDestroy(() => {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer);
    }
    if (typeof window !== 'undefined') {
      if (lockScroll) {
        unlockBodyScroll();
      }
      if (supportHardwareBackPress) {
        if (!backPressed) {
          history.back();
        }
        window.removeEventListener('popstate', handlePopstate);
      }
    }
    // Restore focus to wherever it was before the modal took it. Guarded on
    // isConnected: the trigger can have been unmounted while the modal was
    // open (e.g. the page navigated), and .focus() on a detached element is
    // a silent no-op at best.
    if (previouslyFocusedElement !== null && previouslyFocusedElement.isConnected) {
      previouslyFocusedElement.focus();
    }
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if typeof content === 'function'}
  <OverlayAnimation fadeIn={overlayFadeIn}>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={overlayDiv}
      use:portalAction={{ usePortal }}
      class="modal {align} {showOverlay ? 'overlay-active' : 'overlay-inactive'} {classes ?? ''}"
      style={overlayBackdropFilter != null
        ? `--modal-overlay-backdrop-filter: ${overlayBackdropFilter};`
        : null}
      onclick={handleOverlayClick}
      onkeydown={handleOverlayKeyDown}
      role={overlayDismissible ? 'button' : null}
      tabindex={overlayDismissible ? 0 : null}
      aria-label={overlayAriaLabel ?? null}
      data-pw={testId}
      testID={testId}
    >
      <ModalAnimation enable={enableTransition} {align} {transitionType} {entryAnimation}>
        <div
          bind:this={modalContent}
          class="modal-content {size}"
          role={role ?? null}
          aria-modal={role != null ? 'true' : null}
          aria-label={ariaLabel ?? null}
          tabindex="-1"
        >
          {#if (typeof header?.leftImage === 'string' && header.leftImage.length > 0) || (typeof header?.text === 'string' && header.text.length > 0) || (typeof header?.rightImage === 'string' && header.rightImage.length > 0)}
            <div class="header">
              {#if typeof header.leftImage === 'string' && header.leftImage.length > 0}
                {@const leftImageSrc = header.leftImage}
                {#snippet leftImage()}
                  <!-- Inline SVGs so currentColor icons inherit the header text
                       colour; non-SVG URLs fall back to a plain <img>. -->
                  <Img inlineSvg src={leftImageSrc} alt="" fallback="" classes="header-left-img" />
                {/snippet}
                <!-- The left image is only a control when a click handler is actually supplied.
                     Consumers pass a decorative brand/source logo here far more often than a back
                     button, and announcing those as a focusable "button" that does nothing when
                     activated is worse for assistive tech than leaving them unannounced. The two
                     branches are written out rather than computed so the role/tabindex pairing
                     stays statically checkable. -->
                {#if typeof onheaderleftimageclick === 'function'}
                  <div
                    onclick={handleLeftImageClick}
                    onkeydown={handleLeftImageKeyDown}
                    role="button"
                    tabindex="0"
                    aria-label={leftImageAriaLabel ?? null}
                    data-pw={leftImageTestId}
                    testID={leftImageTestId}
                  >
                    {@render leftImage()}
                  </div>
                {:else}
                  <div data-pw={leftImageTestId} testID={leftImageTestId}>
                    {@render leftImage()}
                  </div>
                {/if}
              {/if}
              {#if typeof header.text === 'string' && header.text.length > 0}
                <div class="header-text" data-pw={header.testId} testID={header.testId}>
                  {header.text}
                </div>
              {/if}
              {#if typeof header.rightImage === 'string' && header.rightImage.length > 0}
                <div
                  role="button"
                  tabindex="0"
                  onclick={handleRightImageClick}
                  onkeydown={handleRightImageKeyDown}
                  aria-label={header.buttonAriaLabel ?? null}
                  data-pw={header.buttonTestId}
                  testID={header.buttonTestId}
                >
                  <Img
                    inlineSvg
                    src={header.rightImage}
                    alt=""
                    fallback=""
                    classes="header-right-img"
                  />
                </div>
              {/if}
            </div>
          {/if}
          <div class="slot-content">
            {@render content?.()}
          </div>
          {#if typeof footerSnippet === 'function'}
            <div class="footer-content">
              {@render footerSnippet?.()}
            </div>
          {:else if typeof footer?.primaryButton === 'object' || typeof footer?.secondaryButton === 'object'}
            <div class="footer-content">
              <div class="footer-action-buttons">
                {#if footer.secondaryButton}
                  <div class="footer-secondary-button">
                    <Button {...footer.secondaryButton} onclick={handleSecondaryButtonClick} />
                  </div>
                {/if}
                {#if footer.primaryButton}
                  <div class="footer-primary-button">
                    <Button {...footer.primaryButton} onclick={handlePrimaryButtonClick} />
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </ModalAnimation>
    </div>
  </OverlayAnimation>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: var(--modal-width, 100vw);
    height: var(--modal-height, 100vh);
    display: flex;
    flex-direction: column;
    z-index: var(--modal-z-index, 15);
    -webkit-tap-highlight-color: transparent;
    margin: var(--modal-margin);
  }

  .overlay-active {
    /* Prefer the modal-specific token; fall back to the legacy generic
       --background-color (kept for backward compatibility), then the default.
       The generic name collides with app-level --background-color tokens, which
       silently override the overlay; --modal-overlay-background-color lets a
       consumer theme the backdrop without that collision. */
    background-color: var(--modal-overlay-background-color, var(--background-color, #00000066));
    backdrop-filter: var(--modal-overlay-backdrop-filter, none);
    -webkit-backdrop-filter: var(--modal-overlay-backdrop-filter, none);
    pointer-events: auto;
  }

  .overlay-inactive {
    pointer-events: none;
  }

  .modal-content {
    pointer-events: auto;
    background-color: var(--modal-content-background-color, #ffffff);
    cursor: auto;
    display: flex;
    flex-direction: column;
    border-radius: var(--modal-border-radius, var(--radius, 4px));
    overflow: var(--modal-content-overflow, auto);
    border-top: var(--modal-content-border-top);
    /* tabindex="-1" makes this the focus-trap's fallback target when the modal
       has no focusable content of its own (see focus-trap.ts); it is never in
       the Tab order itself, so it needs no visible focus ring the way a real
       focusable element would. Matches Sheet's sheet-panel. */
    outline: none;
    /* Viewport containment for every size class: only .fit-content used to carry
       a max-height, so a size whose height var is overridden to fit-content (or
       anything taller than the screen) grew past the viewport and pushed its
       footer and bottom rounding off-screen. dvh tracks the real visible
       viewport on mobile; the vh line is the fallback for engines without dvh. */
    max-height: var(--modal-max-height, calc(100vh - 32px));
    max-height: var(--modal-max-height, calc(100dvh - 32px));
  }

  .slot-content {
    display: var(--modal-display, flex);
    /* Flex children default to min-height: auto and refuse to shrink below their
       content, which defeats the overflow-y scroll once modal-content is
       height-capped — the content spills instead of scrolling and the footer is
       pushed out. 0 lets the slot shrink so its own scrollbar engages and the
       header/footer stay pinned inside the viewport. */
    min-height: var(--modal-slot-content-min-height, 0);
    overflow-y: var(--modal-overflow-y, scroll);
    scrollbar-width: var(--modal-scrollbar-width, none);
    padding: var(--modal-content-padding, 0);
  }

  .slot-content::-webkit-scrollbar {
    display: none;
  }

  .center {
    justify-content: var(--modal-center-justify-content, center);
    align-items: var(--modal-center-align-items, center);
  }

  .bottom {
    justify-content: var(--modal-bottom-justify-content, flex-end);
    align-items: var(--modal-bottom-align-items);
  }

  .top {
    justify-content: var(--modal-top-justify-content, flex-start);
    align-items: var(--modal-top-align-items);
  }

  .small {
    height: var(--modal-small-height, 20vh);
    width: var(--modal-small-width);
  }

  .medium {
    height: var(--modal-medium-height, 50vh);
    width: var(--modal-medium-width);
  }

  .large {
    height: var(--modal-large-height, 80vh);
    width: var(--modal-large-width);
  }

  .fit-content {
    height: fit-content;
    max-height: var(--modal-fit-content-max-height, 80vh);
  }

  .header {
    display: flex;
    background-color: var(--modal-header-background-color, #f6f7f9);
    padding: var(--modal-header-padding, 18px 20px);
    border-radius: var(--modal-header-border-radius, 0px);
    border-bottom: var(--modal-header-border-bottom, none);
    align-items: var(--modal-header-align-items, center);
  }

  .footer-content {
    display: flex;
    background-color: var(--modal-footer-background-color, #f6f7f9);
    padding: var(--modal-footer-padding, 18px 20px);
    border-radius: var(--modal-footer-border-radius, 0px);
    border-top: var(--modal-footer-border-top, none);
    justify-content: var(--modal-footer-justify-content, none);
  }

  .footer-action-buttons {
    display: flex;
    gap: var(--modal-footer-gap, 0px);
    width: var(--modal-footer-action-buttons-width, fit-content);
  }

  .footer-secondary-button {
    --button-max-height: var(--modal-footer-secondary-button-max-height);
    --button-max-width: var(--modal-footer-secondary-button-max-width);
    --button-font-family: var(--modal-footer-secondary-button-font-family);
    --button-font-weight: var(--modal-footer-secondary-button-font-weight, 500);
    --button-font-size: var(--modal-footer-secondary-button-font-size, 14px);
    --button-color: var(--modal-footer-secondary-button-color, #3a4550);
    --button-text-color: var(--modal-footer-secondary-button-text-color, white);
    --button-height: var(--modal-footer-secondary-button-height, fit-content);
    --button-padding: var(--modal-footer-secondary-button-padding, 16px);
    --button-margin: var(--modal-footer-secondary-button-margin);
    --button-border-radius: var(--modal-footer-secondary-button-border-radius, var(--radius, 4px));
    --button-width: var(--modal-footer-secondary-button-width, fit-content);
    --cursor: var(--modal-footer-secondary-button-cursor, pointer);
    --opacity: var(--modal-footer-secondary-button-opacity, 1);
    --button-border: var(--modal-footer-secondary-button-border, none);
    --disabled-background-color: var(
      --modal-footer-secondary-button-disabled-color,
      var(--modal-footer-secondary-button-color, #3a4550)
    );
    --disabled-text-color: var(
      --modal-footer-secondary-button-disabled-text-color,
      var(--modal-footer-secondary-button-text-color, white)
    );
    --disabled-border: var(
      --modal-footer-secondary-button-disabled-border,
      var(--modal-footer-secondary-button-border, none)
    );
    --disabled-opacity: var(--modal-footer-secondary-button-disabled-opacity, 0.4);
    --button-justify-content: var(--modal-footer-secondary-button-justify-content, center);
    --button-content-flex-direction: var(
      --modal-footer-secondary-button-content-flex-direction,
      row
    );
    --button-content-gap: var(--modal-footer-secondary-button-content-gap, 16px);
    --button-visibility: var(--modal-footer-secondary-button-visibility, visible);
    --button-box-shadow: var(--modal-footer-secondary-button-box-shadow, none);
    order: var(--modal-secondary-button-order, none);
    flex: var(--modal-footer-secondary-button-flex-value, none);
  }

  .footer-primary-button {
    --button-max-height: var(--modal-footer-primary-button-max-height);
    --button-max-width: var(--modal-footer-primary-button-max-width);
    --button-font-family: var(--modal-footer-primary-button-font-family);
    --button-font-weight: var(--modal-footer-primary-button-font-weight, 500);
    --button-font-size: var(--modal-footer-primary-button-font-size, 14px);
    --button-color: var(--modal-footer-primary-button-color, #3a4550);
    --button-text-color: var(--modal-footer-primary-button-text-color, white);
    --button-height: var(--modal-footer-primary-button-height, fit-content);
    --button-padding: var(--modal-footer-primary-button-padding, 16px);
    --button-margin: var(--modal-footer-primary-button-margin);
    --button-border-radius: var(--modal-footer-primary-button-border-radius, var(--radius, 4px));
    --button-width: var(--modal-footer-primary-button-width, fit-content);
    --cursor: var(--modal-footer-primary-button-cursor, pointer);
    --opacity: var(--modal-footer-primary-button-opacity, 1);
    --button-border: var(--modal-footer-primary-button-border, none);
    --disabled-background-color: var(
      --modal-footer-primary-button-disabled-color,
      var(--modal-footer-primary-button-color, #3a4550)
    );
    --disabled-text-color: var(
      --modal-footer-primary-button-disabled-text-color,
      var(--modal-footer-primary-button-text-color, white)
    );
    --disabled-border: var(
      --modal-footer-primary-button-disabled-border,
      var(--modal-footer-primary-button-border, none)
    );
    --disabled-opacity: var(--modal-footer-primary-button-disabled-opacity, 0.4);
    --button-justify-content: var(--modal-footer-primary-button-justify-content, center);
    --button-content-flex-direction: var(--modal-footer-primary-button-content-flex-direction, row);
    --button-content-gap: var(--modal-footer-primary-button-content-gap, 16px);
    --button-visibility: var(--modal-footer-primary-button-visibility, visible);
    --button-box-shadow: var(--modal-footer-primary-button-box-shadow, none);
    order: var(--modal-primary-button-order, none);
    flex: var(--modal-footer-primary-button-flex-value, none);
  }

  .header-text {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: var(--header-text-size, 16px);
    font-weight: var(--modal-header-text-weight);
    line-height: var(--modal-header-text-line-height);
    letter-spacing: var(--modal-header-text-letter-spacing);
  }

  /* The header images render through the Img component (inline svg or img), so
     these classes ride on Img's element — match them via :global under the
     scoped .header to keep the sizing contract. */
  .header :global(.header-left-img),
  .header :global(.header-right-img) {
    padding-top: var(--header-img-top-padding, 5px);
    cursor: pointer;
  }

  .header :global(.header-left-img) {
    margin: var(--header-left-image-margin, 0px 18px 0px 0px);
    width: var(--header-left-image-width, 25px);
    height: var(--header-left-image-height, 25px);
  }

  .header :global(.header-right-img) {
    width: var(--header-right-image-width, 25px);
    height: var(--header-right-image-height, 25px);
    padding: var(--header-right-image-padding);
  }
</style>
