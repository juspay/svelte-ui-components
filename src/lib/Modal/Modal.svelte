<script lang="ts">
  import type { ModalProperties } from './properties';
  import { onMount, onDestroy } from 'svelte';
  import ModalAnimation from '$lib/Animations/ModalAnimation.svelte';
  import OverlayAnimation from '$lib/Animations/OverlayAnimation.svelte';
  import { createDebouncer } from '../utils';
  import Button from '$lib/Button/Button.svelte';
  import Img from '$lib/Img/Img.svelte';

  let overlayDiv: HTMLDivElement | null = $state(null);
  let backPressed = $state(false);

  let {
    size = 'fit-content',
    align = 'center',
    showOverlay = true,
    supportHardwareBackPress = false,
    enableTransition = true,
    transitionType = 'ALL',
    header = {},
    footer,
    debounceTime = 700,
    leftImageTestId,
    testId,
    content,
    footerSnippet,
    onclose,
    onheaderRightImageClick,
    onheaderLeftImageClick,
    onprimaryButtonClick,
    onsecondaryButtonClick,
    onoverlayClick,
    onkeydown,
    classes,
    overlayBackdropFilter,
    usePortal = false
  }: ModalProperties = $props();

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

  const handlePopstate = (): void => {
    backPressed = true;
    onclose?.();
  };

  const handleRightImageClick = (event: MouseEvent): void => {
    onheaderRightImageClick?.(event);
  };

  const handleLeftImageClick = (event: MouseEvent): void => {
    onheaderLeftImageClick?.(event);
  };

  const handlePrimaryButtonClick = (event: MouseEvent): void => {
    onprimaryButtonClick?.(event);
  };

  const handleSecondaryButtonClick = (event: MouseEvent): void => {
    onsecondaryButtonClick?.(event);
  };

  const handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === overlayDiv) {
      debounce(() => {
        onoverlayClick?.();
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    onkeydown?.(event);
    const key = event?.key;
    if (key === 'Escape') {
      onoverlayClick?.();
    }
  };

  // Fix [major]: role=button image divs need Enter/Space handlers for WCAG 2.1 SC 2.1.1.
  // Keyboard activation (Enter/Space) invokes the same prop callbacks as click.
  const handleLeftImageKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onheaderLeftImageClick?.(new MouseEvent('click'));
    }
  };

  const handleRightImageKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onheaderRightImageClick?.(new MouseEvent('click'));
    }
  };

  onMount(() => {
    document.body.style.overflow = 'hidden';
    if (supportHardwareBackPress) {
      history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopstate);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
      if (supportHardwareBackPress) {
        if (!backPressed) {
          history.back();
        }
        window.removeEventListener('popstate', handlePopstate);
      }
    }
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if typeof content === 'function'}
  <OverlayAnimation>
    <div
      bind:this={overlayDiv}
      use:portalAction={{ usePortal }}
      class="modal {align} {showOverlay ? 'overlay-active' : 'overlay-inactive'} {classes ?? ''}"
      style={overlayBackdropFilter != null
        ? `--modal-overlay-backdrop-filter: ${overlayBackdropFilter};`
        : null}
      onclick={handleOverlayClick}
      onkeydown={handleKeyDown}
      role="button"
      tabindex="0"
      data-pw={testId}
      testID={testId}
    >
      <ModalAnimation enable={enableTransition} {align} {transitionType}>
        <div class="modal-content {size}">
          {#if (typeof header?.leftImage === 'string' && header.leftImage.length > 0) || (typeof header?.text === 'string' && header.text.length > 0) || (typeof header?.rightImage === 'string' && header.rightImage.length > 0)}
            <div class="header">
              {#if typeof header.leftImage === 'string' && header.leftImage.length > 0}
                <div
                  onclick={handleLeftImageClick}
                  onkeydown={handleLeftImageKeyDown}
                  role="button"
                  tabindex="0"
                  data-pw={leftImageTestId}
                  testID={leftImageTestId}
                >
                  <!-- Inline SVGs so currentColor icons inherit the header text
                       colour; non-SVG URLs fall back to a plain <img>. -->
                  <Img
                    inlineSvg
                    src={header.leftImage}
                    alt=""
                    fallback=""
                    classes="header-left-img"
                  />
                </div>
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
