<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { defaultToastProperties, type ToastProperties } from './properties';

  export let properties: ToastProperties = defaultToastProperties;
  const dispatch = createEventDispatcher();

  let showToast = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function hideToast() {
    showToast = false;
  }

  function handleAnimationEnd() {
    dispatch('onToastHide');
  }

  onMount(() => {
    showToast = true;
    timeoutId = setTimeout(hideToast, properties.duration);
  });

  onDestroy(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
</script>

{#if showToast}
  <div
    class="toast {properties.type ?? ''}"
    in:fly={{ x: 500, y: 0, duration: 400 }}
    out:fly={{ x: 500, y: 0, duration: 800 }}
    on:outroend={handleAnimationEnd}
  >
    {#if properties.leftIcon}
      <div class="toast-icon-wrapper">
        <img class="toast-icon" src={properties.leftIcon} alt="toast-icon" />
      </div>
    {/if}

    <div class="toast-message">
      {properties.message}
    </div>

    {#if properties.rightIcon}
      <div class="close-button" tabindex="0" role="button" on:click={hideToast} on:keypress>
        <img class="toast-icon" src={properties.rightIcon} alt="close-icon" />
      </div>
    {/if}
  </div>
{/if}

<style>
  .toast {
    padding: var(--toast-padding, 10px);
    font-size: var(--toast-font-size, 14px);
    height: var(--toast-height, auto);
    border-radius: var(--toast-border-radius, 0px);
    width: var(--toast-width, auto);
    align-items: var(--toast-align-items, center);
    margin: var(--toast-margin, 0px 10px 10px 10px);
    justify-content: var(--toast-justify-content, space-between);
    z-index: var(--toast-z-index, 1000);
    display: var(--taost-dispay, flex);
    position: var(--toast-position, absolute);
    left: var(--toast-left, 0);
    right: var(--toast-right, 0);
    background-color: var(--default-background-color, #87ceeb);
  }
  .toast-icon-wrapper {
    width: var(--toast-icon-wrapper-width, 20px);
    height: var(--toast-icon-wrapper-height, 20px);
    margin: var(--toast-icon-margin, 0 6px 0 0);
    padding: var(--toast-icon-wrapper-padding, 1px);
  }

  .toast-icon {
    height: var(--toast-icon-height, 100%);
    border-radius: var(--toast-icon-border-radius, 50%);
  }

  .toast-message {
    display: var(--toast-message-display, flex);
    flex: var(--taost-message-flex, 1);
    padding: var(--toast-message-padding, 1px);
  }

  .close-button {
    width: var(--toast-close-button-width, 20px);
    height: var(--toast-close-button-height, 20px);
    cursor: var(--toast-close-button-cursor, pointer);
    gap: var(--toast-close-button-gap, 6px);
    margin: var(--toast-close-button-margin, 0 0 0 10px);
    display: var(--toast-close-button-display, flex);
    align-items: var(--toast-close-button-align-items, center);
    justify-content: var(--toast-close-button-justify-content, center);
    padding: var(--toast-close-button-padding, 1px);
  }

  .success {
    color: var(--toast-success-text, #fff);
    background-color: var(--toast-background-color, #24aa5a);
  }

  .info {
    color: var(--toast-info-text, #fff);
    background-color: var(--toast-background-color, #87ceeb);
  }

  .warn {
    color: var(--toast-warn-text, #fff);
    background-color: var(--toast-background-color, #f3a42d);
  }

  .error {
    color: var(--toast-error-text, #fff);
    background-color: var(--toast-background-color, #f04438);
  }
</style>
