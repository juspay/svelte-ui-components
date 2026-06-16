<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { ToastDirection, ToastProperties } from './properties';
  import type { FlyAnimationConfig } from '$lib/types';
  import Img from '../Img/Img.svelte';

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
    bottomContent,
    classes
  }: ToastProperties = $props();

  const animationConfig: FlyAnimationConfig = $derived(getAnimationConfig(overlapPage, direction));

  let showToast = $state(true);

  const rootClass = $derived(
    ['toast', type ?? '', classes ?? ''].filter((cls) => cls.length > 0).join(' ')
  );

  function hideToast() {
    showToast = false;
  }

  function handleAnimationEnd() {
    onToastHide?.();
  }

  function getAnimationConfig(
    overlapPage: boolean,
    toastDirection?: ToastDirection
  ): FlyAnimationConfig {
    let inX: number = 0;
    let inY: number = 0;
    let outX: number = 0;
    let outY: number = 0;

    switch (toastDirection) {
      case 'left-to-right':
        inX = -1 * (inAnimationOffset ?? 500);
        outX = -1 * (outAnimationOffset ?? 500);
        break;
      case 'right-to-left':
        inX = inAnimationOffset ?? 500;
        outX = outAnimationOffset ?? 500;
        break;
      case 'bottom-to-top':
        inY = inAnimationOffset ?? (overlapPage ? 500 : 20);
        outY = outAnimationOffset ?? (overlapPage ? 500 : 20);
        break;
      case 'top-to-bottom':
      default:
        inY = -1 * (inAnimationOffset ?? (overlapPage ? 500 : 20));
        outY = -1 * (outAnimationOffset ?? (overlapPage ? 100 : 20));
        break;
    }

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

  // Track `message` and `duration` as reactive dependencies so the timer
  // restarts whenever either prop changes. Writing `showToast = true` via
  // `untrack` prevents the assignment from enrolling `showToast` as a
  // dependency of this effect, which would create an unwanted reactive cycle.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    void message;
    void duration;

    untrack(() => {
      showToast = true;
    });

    const id = setTimeout(hideToast, duration);

    return () => {
      clearTimeout(id);
    };
  });
</script>

{#if showToast}
  <div
    class={rootClass}
    class:no-page-overlap={!overlapPage}
    role="alert"
    aria-live="assertive"
    in:fly={animationConfig.in}
    out:fly={animationConfig.out}
    onoutroend={handleAnimationEnd}
    data-pw={testId}
  >
    {#if typeof leftIcon === 'string' && leftIcon.length > 0}
      <div class="toast-icon-wrapper">
        <Img src={leftIcon} alt="" />
      </div>
    {/if}

    <div class="toast-message" data-pw={messageTestId}>
      {message}
      {#if typeof subtext === 'string' && subtext.length > 0}
        <div class="toast-subtext" data-pw={subTextTestId}>{subtext}</div>
      {/if}

      {#if typeof bottomContent === 'function'}
        {@render bottomContent()}
      {/if}
    </div>

    {#if typeof rightIcon === 'string' && rightIcon.length > 0}
      <div
        class="close-button"
        tabindex="0"
        role="button"
        onclick={hideToast}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            hideToast();
          }
        }}
        data-pw={closeIconTestId}
      >
        <Img src={rightIcon} alt="Close" />
      </div>
    {/if}
  </div>
{/if}

<style>
  .toast {
    padding: var(--toast-padding, 10px);
    font-size: var(--toast-font-size, 14px);
    font-family: var(--toast-font-family, inherit);
    font-weight: var(--toast-font-weight);
    height: var(--toast-height, fit-content);
    border-radius: var(--toast-border-radius, 0px);
    border: var(--toast-border, none);
    border-style: var(--toast-border-style);
    width: var(--toast-width, fit-content);
    align-items: var(--toast-align-items, center);
    margin: var(--toast-margin, 0px 10px 10px 10px);
    justify-content: var(--toast-justify-content, space-between);
    z-index: var(--toast-z-index, 1000);
    display: var(--toast-display, flex);
    position: var(--toast-position, absolute);
    top: var(--toast-top, 10px);
    left: var(--toast-left, 0);
    right: var(--toast-right, 0);
    background-color: var(--toast-background-color, #87ceeb);
    opacity: var(--toast-opacity, 1);
    box-sizing: var(--toast-box-sizing);
  }

  .no-page-overlap {
    position: var(--toast-position, relative);
  }

  .toast-icon-wrapper {
    display: flex;
    width: var(--toast-icon-wrapper-width, 20px);
    height: var(--toast-icon-wrapper-height, 20px);
    margin: var(--toast-icon-margin, 0px 6px 0px 0px);
    padding: var(--toast-icon-wrapper-padding, 1px);
    align-items: center;

    --image-height: var(--toast-icon-height, 100%);
    --image-width: fit-content;
    --image-filter: var(--toast-icon-filter, none);
    --image-border-radius: var(--toast-icon-border-radius, 50%);
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

    --image-height: var(--toast-icon-height, 100%);
    --image-width: fit-content;
    --image-filter: var(--toast-icon-filter, none);
    --image-border-radius: var(--toast-icon-border-radius, 50%);
  }

  .success {
    color: var(--toast-success-text, #fff);
    background-color: var(--toast-success-background-color, var(--toast-background-color, #24aa5a));
    --toast-border: var(--toast-success-border);
  }

  .info {
    color: var(--toast-info-text, #fff);
    background-color: var(--toast-info-background-color, var(--toast-background-color, #87ceeb));
    --toast-border: var(--toast-info-border);
  }

  .warn {
    color: var(--toast-warn-text, #fff);
    background-color: var(--toast-warn-background-color, var(--toast-background-color, #f3a42d));
    --toast-border: var(--toast-warn-border);
  }

  .error {
    color: var(--toast-error-text, #fff);
    background-color: var(--toast-error-background-color, var(--toast-background-color, #f04438));
    --toast-border: var(--toast-error-border);
  }
</style>
