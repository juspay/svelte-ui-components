<script lang="ts">
  import type { ModalProperties } from './properties';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import ModalAnimation from '$lib/Animations/ModalAnimation.svelte';
  import OverlayAnimation from '$lib/Animations/OverlayAnimation.svelte';
  import { defaultModalProperties } from './properties';
  import { createDebouncer } from '../utils';
  import Button from '$lib/Button/Button.svelte';

  const dispatch = createEventDispatcher();
  let overlayDiv: HTMLDivElement;
  let backPressed = false;

  export let properties: ModalProperties = defaultModalProperties;

  const debounce = createDebouncer(properties.debounceTime);

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

  function handlePrimaryButtonClick(): void {
    dispatch('primaryButtonClick');
  }

  function handleSecondaryButtonClick(): void {
    dispatch('secondaryButtonClick');
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target && event.target === overlayDiv) {
      debounce(() => {
        dispatch('overlayClick');
      });
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
          {#if $$slots.footer}
            <div class="footer-content">
              <slot name="footer" />
            </div>
          {:else if properties.footer?.primaryButton || properties.footer?.secondaryButton}
            <div class="footer-content">
              <div class="footer-action-buttons">
                {#if properties.footer.secondaryButton}
                  <div class="footer-secondary-button">
                    <Button
                      properties={properties.footer.secondaryButton}
                      on:click={handleSecondaryButtonClick}
                    />
                  </div>
                {/if}
                {#if properties.footer.primaryButton}
                  <div class="footer-primary-button">
                    <Button
                      properties={properties.footer.primaryButton}
                      on:click={handlePrimaryButtonClick}
                    />
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
    overflow: var(--modal-content-overflow, auto);
  }

  .slot-content {
    display: var(--modal-display, flex);
    overflow-y: var(--modal-overflow-y, scroll);
    scrollbar-width: var(--modal-scrollbar-width, none);
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
    border-bottom: var(--modal-header-border-bottom, none);
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
    width: var(--modal-footer-action-buttons-width, auto);
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
    --button-border-radius: var(--modal-footer-secondary-button-border-radius, 0px);
    --button-width: var(--modal-footer-secondary-button-width, fit-content);
    --cursor: var(--modal-footer-secondary-button-cursor, pointer);
    --opacity: var(--modal-footer-secondary-button-opacity, 1);
    --button-border: var(--modal-footer-secondary-button-border, none);
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
    --button-border-radius: var(--modal-footer-primary-button-border-radius, 0px);
    --button-width: var(--modal-footer-primary-button-width, fit-content);
    --cursor: var(--modal-footer-primary-button-cursor, pointer);
    --opacity: var(--modal-footer-primary-button-opacity, 1);
    --button-border: var(--modal-footer-primary-button-border, none);
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
