<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Loader from '../Loader/Loader.svelte';
  import { defaultButtonProperties } from './properties';
  export let properties = defaultButtonProperties;

  export let showProgressBar = false;

  const dispatch = createEventDispatcher();

  function handleButtonClick(): void {
    if (showProgressBar) {
      return;
    }
    dispatch('click');
    if (properties.showLoader && properties.loaderType === 'ProgressBar') {
      showProgressBar = true;
    }
  }
</script>

<div class="button-container">
  {#if showProgressBar}
    <div class="button-progress-bar" />
  {/if}
  <button
    style="
      --opacity: {properties.enable ? 1 : 0.4};
      --cursor: {properties.enable ? 'pointer' : 'not-allowed'};"
    on:click={handleButtonClick}
    disabled={!(properties.enable && !properties.showLoader)}
    type={properties.type}
  >
    {#if properties.showLoader && properties.loaderType === 'Circular'}
      <div class="button-loader"><Loader /></div>
    {/if}
    {#if $$slots.icon}
      <div class="button-icon"><slot name="icon" /></div>
    {/if}
    <div class="button-text">{properties.text}</div>
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
  }

  .button-loader {
    order: var(--button-loader-order, 1);
  }

  .button-icon {
    order: var(--button-icon-order, 2);
  }

  .button-text {
    order: var(--button-text-order, 3);
  }

  button:hover {
    background: var(--button-hover-color, var(--button-color, #3a4550));
    color: var(--button-hover-text-color, var(--button-text-color, white));
    border: var(--button-hover-border, var(--button-border, none));
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
