<script lang="ts">
  import type { TooltipProperties } from './properties';

  let {
    text,
    position = 'top',
    delay = 0,
    testId,
    classes,
    children
  }: TooltipProperties = $props();

  let visible = $state(false);
  let delayTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

  function showTooltip() {
    if (delay > 0) {
      delayTimeout = setTimeout(() => {
        visible = true;
      }, delay);
    } else {
      visible = true;
    }
  }

  function hideTooltip() {
    if (delayTimeout !== null) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }
    visible = false;
  }
</script>

<div
  class="tooltip-container {classes ?? ''}"
  role="none"
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocusin={showTooltip}
  onfocusout={hideTooltip}
  data-pw={testId}
>
  {@render children()}
  {#if visible}
    <div class="tooltip-bubble {position}" role="tooltip">
      <div class="tooltip-arrow"></div>
      <span class="tooltip-text">{text}</span>
    </div>
  {/if}
</div>

<style>
  .tooltip-container {
    position: relative;
    display: var(--tooltip-container-display, inline-flex);
  }

  .tooltip-bubble {
    position: absolute;
    z-index: var(--tooltip-z-index, 1000);
    max-width: var(--tooltip-max-width, 200px);
    background: var(--tooltip-background, #333333);
    color: var(--tooltip-color, #ffffff);
    font-size: var(--tooltip-font-size, 12px);
    font-weight: var(--tooltip-font-weight, 400);
    font-family: var(--tooltip-font-family);
    padding: var(--tooltip-padding, 6px 10px);
    border-radius: var(--tooltip-border-radius, 4px);
    border: var(--tooltip-border, none);
    box-shadow: var(--tooltip-box-shadow, 0 2px 6px rgba(0, 0, 0, 0.15));
    white-space: normal;
    word-wrap: break-word;
    pointer-events: none;
    opacity: 1;
    transition: opacity var(--tooltip-opacity-duration, 0.15s) ease-in-out;
  }

  .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }

  /* Top position */
  .top {
    bottom: calc(100% + var(--tooltip-offset, 8px));
    left: 50%;
    transform: translateX(-50%);
  }

  .top .tooltip-arrow {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px) 0
      var(--tooltip-arrow-size, 5px);
    border-color: var(--tooltip-arrow-color, var(--tooltip-background, #333333)) transparent
      transparent transparent;
  }

  /* Bottom position */
  .bottom {
    top: calc(100% + var(--tooltip-offset, 8px));
    left: 50%;
    transform: translateX(-50%);
  }

  .bottom .tooltip-arrow {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px);
    border-color: transparent transparent
      var(--tooltip-arrow-color, var(--tooltip-background, #333333)) transparent;
  }

  /* Left position */
  .left {
    right: calc(100% + var(--tooltip-offset, 8px));
    top: 50%;
    transform: translateY(-50%);
  }

  .left .tooltip-arrow {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: var(--tooltip-arrow-size, 5px) 0 var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px);
    border-color: transparent transparent transparent
      var(--tooltip-arrow-color, var(--tooltip-background, #333333));
  }

  /* Right position */
  .right {
    left: calc(100% + var(--tooltip-offset, 8px));
    top: 50%;
    transform: translateY(-50%);
  }

  .right .tooltip-arrow {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px) 0;
    border-color: transparent var(--tooltip-arrow-color, var(--tooltip-background, #333333))
      transparent transparent;
  }
</style>
