<script lang="ts">
  import Loader from '../Loader/Loader.svelte';
  import type { ButtonProperties } from './properties';

  let {
    text,
    enable = true,
    disabled = false,
    showLoader = false,
    loaderType,
    type = 'button',
    testId,
    ariaLabel,
    ariaExpanded,
    ariaSelected,
    role,
    onclick,
    onkeydown,
    onkeyup = () => {},
    onmousedown,
    onmouseup,
    onmouseleave,
    ontouchstart,
    ontouchend,
    showProgressBar = $bindable(false),
    icon,
    children,
    classes
  }: ButtonProperties = $props();

  let isDisabled = $derived(!enable || disabled || showLoader);

  function handleButtonClick(event: MouseEvent): void {
    if (showProgressBar) {
      return;
    }
    onclick?.(event);
    if (showLoader && loaderType === 'ProgressBar') {
      showProgressBar = true;
    }
  }
</script>

<div class="button-container {classes ?? ''}">
  {#if showProgressBar}
    <div class="button-progress-bar"></div>
  {/if}
  <button
    class:disabled={isDisabled}
    onclick={handleButtonClick}
    {onkeydown}
    {onkeyup}
    {onmousedown}
    {onmouseup}
    {onmouseleave}
    {ontouchstart}
    {ontouchend}
    disabled={isDisabled}
    {type}
    data-pw={testId}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    aria-selected={ariaSelected}
    {role}
  >
    {#if showLoader && loaderType === 'Circular'}
      <div class="button-loader"><Loader /></div>
    {/if}
    {#if typeof icon === 'function'}
      <div class="button-icon">{@render icon()}</div>
    {/if}
    {#if typeof text === 'string' && text.length > 0}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="button-text">{@html text}</div>
    {/if}
    {#if typeof children === 'function'}
      {@render children()}
    {/if}
  </button>
</div>

<style>
  .button-container {
    position: relative;
    width: var(--button-width, fit-content);
  }
  button {
    max-height: var(--button-max-height);
    max-width: var(--button-max-width);
    font-family: var(--button-font-family);
    font-weight: var(--button-font-weight, 500);
    font-size: var(--button-font-size, 14px);
    background-color: var(--button-color, #3a4550);
    color: var(--button-text-color, white);
    height: var(--button-height, fit-content);
    padding: var(--button-padding, 16px);
    margin: var(--button-margin);
    border-radius: var(--button-border-radius, 0px);
    width: var(--button-width, fit-content);
    cursor: var(--cursor, pointer);
    opacity: var(--opacity, 1);
    border: var(--button-border, none);
    display: flex;
    justify-content: var(--button-justify-content, center);
    align-items: center;
    flex-direction: var(--button-content-flex-direction, row);
    gap: var(--button-content-gap, 16px);
    visibility: var(--button-visibility, visible);
    box-shadow: var(--button-box-shadow, none);
  }

  .disabled {
    cursor: var(--disabled-cursor, not-allowed);
    opacity: var(--disabled-opacity, 0.4);
    color: var(--disabled-text-color, var(--button-text-color, white));
    font-size: var(--disabled-font-size);
    font-weight: var(--disabled-font-weight);
    border: var(--disabled-border);
    background: var(--disabled-background-color, var(--button-color, #3a4550));
    box-shadow: var(--button-disabled-box-shadow, var(--button-box-shadow, none));
  }

  .button-loader {
    order: var(--button-loader-order, 1);
  }

  .button-icon {
    order: var(--button-icon-order, 2);
    display: var(--button-icon-display);
  }

  .button-text {
    order: var(--button-text-order, 3);
    display: var(--button-text-display);
  }

  button:hover {
    background: var(--button-hover-color, var(--button-color, #3a4550));
    color: var(--button-hover-text-color, var(--button-text-color, white));
    border: var(--button-hover-border, var(--button-border, none));
    transform: var(--button-hover-transform);
    box-shadow: var(--button-hover-box-shadow, var(--button-box-shadow, none));
  }

  button:active {
    transform: var(--button-active-transform);
    background: var(--button-active-background, var(--button-color, #3a4550));
    box-shadow: var(--button-active-box-shadow, var(--button-box-shadow, none));
  }

  button:focus-visible {
    box-shadow: var(--button-focus-visible-box-shadow, var(--button-box-shadow, none));
  }

  .button-progress-bar {
    position: absolute;
    height: 100%;
    width: 100%;
    background: var(--button-progress-loader-background-color, #00000030);
    animation: fill-loader var(--button-progress-loader-duration, 8s) forwards;
    z-index: 2;
  }

  @keyframes fill-loader {
    0% {
      width: 0;
    }

    100% {
      width: 100%;
    }
  }
</style>
