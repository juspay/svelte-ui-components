<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { ToastDirection, ToastProperties } from './properties';
  import type { FlyAnimationConfig } from '$lib/types';
  import { onMount } from 'svelte';

  let {
    duration = 2000,
    leftIcon,
    message = '',
    subtext,
    rightIcon,
    type,
    direction,
    overlapPage = true,
    inAnimationOffset,
    inAnimationDuration,
    outAnimationOffset,
    outAnimationDuration,
    testId,
    messageTestId,
    subTextTestId,
    closeIconTestId,
    onToastHide,
    bottomContent
  }: ToastProperties = $props();

  const animationConfig: FlyAnimationConfig = $derived(getAnimationConfig(overlapPage, direction));

  let showToast = $state(false);
  let timeoutId = $state<ReturnType<typeof setTimeout> | null>(null);

  function hideToast() {
    showToast = false;
  }

  function handleAnimationEnd() {
    onToastHide?.();
  }

  /**
   * Function to generate animation configuration for toast animations.
   * @param {ToastDirection | null} toastDirection - Direction of the toast animation.
   * @param {boolean} overlapPage - Flag indicating whether toast should overlap page content.
   * @returns {FlyAnimationConfig} Animation configuration object.
   */
  function getAnimationConfig(
    overlapPage: boolean,
    toastDirection?: ToastDirection,
  ): FlyAnimationConfig {
    // Initializing variables to store animation offsets
    let inX: number = 0;
    let inY: number = 0;
    let outX: number = 0;
    let outY: number = 0;

    // Determining animation offsets based on toast direction
    // Multiplying by -1 effectively flips the direction of movement along the specified axis, ensuring that the toast animation moves in the intended direction based on the chosen toast direction.
    switch (toastDirection) {
      case 'left-to-right':
        // Calculating horizontal offsets for left-to-right animation
        inX = -1 * (inAnimationOffset ?? 500);
        outX = -1 * (outAnimationOffset ?? 500);
        break;
      case 'right-to-left':
        // Calculating horizontal offsets for right-to-left animation
        inX = inAnimationOffset ?? 500;
        outX = outAnimationOffset ?? 500;
        break;
      case 'bottom-to-top':
        // Calculating vertical offsets for bottom-to-top animation
        inY = inAnimationOffset ?? (overlapPage ? 500 : 20);
        outY = outAnimationOffset ?? (overlapPage ? 500 : 20);
        break;
      case 'top-to-bottom':
      default:
        // Calculating vertical offsets for top-to-bottom animation
        inY = -1 * (inAnimationOffset ?? (overlapPage ? 500 : 20));
        outY = -1 * (outAnimationOffset ?? (overlapPage ? 100 : 20));
        break;
    }
    // Returning animation configuration object
    return {
      in: {
        x: inX,
        y: inY,
        duration: inAnimationDuration ?? 400
      },
      out: {
        x: outX,
        y: outY,
        duration: outAnimationDuration ?? 800
      }
    };
  }

  onMount(() => {
    showToast = true;
    timeoutId = setTimeout(hideToast, duration);

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  });
</script>

{#if showToast}
  <div
    class="toast {type ?? ''}"
    class:no-page-overlap={!overlapPage}
    in:fly={animationConfig.in}
    out:fly={animationConfig.out}
    onoutroend={handleAnimationEnd}
    data-pw={testId}
  >
    {#if leftIcon}
      <div class="toast-icon-wrapper">
        <img class="toast-icon" src={leftIcon} alt="toast-icon" />
      </div>
    {/if}

    <div class="toast-message" data-pw={messageTestId}>
      {message}
      {#if subtext}
        <div class="toast-subtext" data-pw={subTextTestId}>{subtext}</div>
      {/if}

      {#if bottomContent}
        {@render bottomContent()}
      {/if}
    </div>

    {#if rightIcon}
      <div
        class="close-button"
        tabindex="0"
        role="button"
        onclick={hideToast}
        onkeypress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hideToast();
          }
        }}
        data-pw={closeIconTestId}
      >
        <img class="toast-icon" src={rightIcon} alt="close-icon" />
      </div>
    {/if}
  </div>
{/if}

<style>
  .toast {
    padding: var(--toast-padding, 10px);
    font-size: var(--toast-font-size, 14px);
    font-family: var(--toast-font-family);
    font-weight: var(--toast-font-weight);
    height: var(--toast-height, auto);
    border-radius: var(--toast-border-radius, 0px);
    border: var(--toast-border, none);
    border-style: var(--toast-border-style);
    width: var(--toast-width, auto);
    align-items: var(--toast-align-items, center);
    margin: var(--toast-margin, 0px 10px 10px 10px);
    justify-content: var(--toast-justify-content, space-between);
    z-index: var(--toast-z-index, 1000);
    display: var(--toast-display, flex);
    position: var(--toast-position, absolute);
    top: var(--toast-top, 10px);
    left: var(--toast-left, 0);
    right: var(--toast-right, 0);
    background-color: var(--default-background-color, #87ceeb);
  }

  .no-page-overlap {
    position: var(--toast-position, relative);
  }

  .toast-icon-wrapper {
    width: var(--toast-icon-wrapper-width, 20px);
    height: var(--toast-icon-wrapper-height, 20px);
    margin: var(--toast-icon-margin, 0px 6px 0px 0px);
    padding: var(--toast-icon-wrapper-padding, 1px);
  }

  .toast-icon {
    height: var(--toast-icon-height, 100%);
    border-radius: var(--toast-icon-border-radius, 50%);
  }

  .toast-message {
    display: var(--toast-message-display, flex);
    flex: var(--toast-message-flex, 1);
    padding: var(--toast-message-padding, 1px);
    flex-direction: column;
  }

  .toast-subtext {
    color: var(--toast-subtext-color, #c7c7c7);
    font-size: var(--toast-subtext-font-size, 10px);
    font-weight: var(--toast-subtext-font-weight, 400);
    margin: var(--toast-subtext-margin, 10px 0px 0px 0px);
  }

  .close-button {
    width: var(--toast-close-button-width, 20px);
    height: var(--toast-close-button-height, 20px);
    cursor: var(--toast-close-button-cursor, pointer);
    gap: var(--toast-close-button-gap, 6px);
    margin: var(--toast-close-button-margin, 0px 0px 0px 10px);
    display: var(--toast-close-button-display, flex);
    align-items: var(--toast-close-button-align-items, center);
    justify-content: var(--toast-close-button-justify-content, center);
    padding: var(--toast-close-button-padding, 1px);
  }

  .success {
    color: var(--toast-success-text, #fff);
    background-color: var(--toast-background-color, #24aa5a);
    --toast-border: var(--toast-success-border);
  }

  .info {
    color: var(--toast-info-text, #fff);
    background-color: var(--toast-background-color, #87ceeb);
    --toast-border: var(--toast-info-border);
  }

  .warn {
    color: var(--toast-warn-text, #fff);
    background-color: var(--toast-background-color, #f3a42d);
    --toast-border: var(--toast-warn-border);
  }

  .error {
    color: var(--toast-error-text, #fff);
    background-color: var(--toast-background-color, #f04438);
    --toast-border: var(--toast-error-border);
  }
</style>
