<script lang="ts">
  import type { ModalProperties } from './properties';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import ModalAnimation from '$lib/Animations/ModalAnimation.svelte';
  import OverlayAnimation from '$lib/Animations/OverlayAnimation.svelte';
  import { defaultModalProperties } from './properties';

  const dispatch = createEventDispatcher();
  let overlayDiv: HTMLDivElement;
  let backPressed = false;

  export let properties: ModalProperties = defaultModalProperties;

  function handlePopstate() {
    backPressed = true;
    dispatch('close');
  }

  function handleRightImageClick(): void {
    dispatch('headerRightImageClick');
  }

  function handleLeftImageClick(): void {
    dispatch('headerLeftImageClick');
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target && event.target === overlayDiv) {
      dispatch('overlayClick');
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    let key = event?.key;
    if (key === 'Escape') {
      dispatch('overlayClick');
    }
  }

  onMount(() => {
    document.body.style.overflow = 'hidden';
    if (properties.supportHardwareBackPress) {
      history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopstate);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
      if (properties.supportHardwareBackPress) {
        if (!backPressed) {
          history.back();
        }
        window.removeEventListener('popstate', handlePopstate);
      }
    }
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $$slots.content}
  <OverlayAnimation>
    <div
      bind:this={overlayDiv}
      class="modal {properties.align} {properties.showOverlay
        ? 'overlay-active'
        : 'overlay-inactive'}"
      on:click={handleOverlayClick}
      on:keydown
      role="button"
      tabindex="0"
    >
      <ModalAnimation
        enable={properties.enableTransition}
        align={properties.align}
        transitionType={properties.transitionType}
      >
        <div class="modal-content {properties.size}">
          {#if properties.header.leftImage !== null || properties.header.text !== null || properties.header.rightImage !== null}
            <div class="header">
              {#if properties.header.leftImage}
                <div on:click={handleLeftImageClick} on:keydown role="button" tabindex="0">
                  <img class="header-left-img" src={properties.header.leftImage} alt="" />
                </div>
              {/if}
              {#if properties.header.text}
                <div class="header-text">
                  {properties.header.text}
                </div>
              {/if}
              {#if properties.header.rightImage}
                <div role="button" tabindex="0" on:click={handleRightImageClick} on:keydown>
                  <img class="header-right-img" src={properties.header.rightImage} alt="" />
                </div>
              {/if}
            </div>
          {/if}
          <div class="slot-content">
            <slot name="content" />
          </div>
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
    background-color: var(--background-color, #00000066);
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
    border-radius: var(--modal-border-radius, 0px);
  }

  .slot-content {
    display: flex;
    overflow-y: scroll;
    scrollbar-width: none;
  }

  .slot-content::-webkit-scrollbar {
    display: none;
  }

  .center {
    justify-content: center;
    align-items: center;
  }

  .bottom {
    justify-content: flex-end;
  }

  .top {
    justify-content: flex-start;
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
  }

  .header-text {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: var(--header-text-size, 16px);
  }

  .header-left-img,
  .header-right-img {
    padding-top: var(--header-img-top-padding, 5px);
    cursor: pointer;
  }

  .header-left-img {
    margin: var(--header-left-image-margin, 0px 18px 0px 0px);
    width: var(--header-left-image-width, 25px);
    height: var(--header-left-image-height, 25px);
  }

  .header-right-img {
    width: var(--header-right-image-width, 25px);
    height: var(--header-right-image-height, 25px);
  }
</style>
