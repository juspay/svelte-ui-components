<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let icon: string = '';
  export let text: string = '';
  export let headerIcon: string = '';
  export let showLoader: boolean = false;

  const dispatch = createEventDispatcher();

  function onClick() {
    showLoader = !showLoader;
    dispatch('click');
  }
</script>

<div class="container" on:click={onClick} on:keydown role="button" tabindex="0">
  <div class="grid-header">
    <img src={headerIcon} alt="" class="grid-item-header-icon" />
  </div>
  <div class:grid-body-loader={showLoader}>
    <div class="grid-item-body">
      <img src={icon} alt="" class="grid-item-icon" />
    </div>
  </div>
  <div class="grid-item-footer">{text}</div>
</div>

<style>
  .container {
    box-sizing: border-box;
    height: var(--grid-item-height, 98px);
    width: var(--grid-item-width, 66px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    cursor: pointer;
    /** Remove button tap effect */
    -webkit-tap-highlight-color: transparent;
  }

  .grid-header {
    display: flex;
    width: var(--grid-header-width, 100%);
    justify-content: var(--grid-header-justify-content, end);
    position: var(--grid-header-position, absolute);
    top: var(--grid-header-top, 5px);
    z-index: var(--grid-header-z-index, 100);
  }

  .grid-item-header-icon {
    height: var(--grid-item-header-icon-height, 16px);
    width: var(--grid-item-header-icon-width, auto);
    object-fit: var(--grid-item-header-icon-object-fit, contain);
    z-index: var(--grid-item-header-icon-z-index, 2);
  }

  .grid-item-body {
    height: var(--grid-item-body-height, 64px);
    width: var(--grid-item-body-width, 64px);
    background-color: var(--grid-item-background-color, #faf9f9);
    border: var(--grid-item-border, 1px solid #eaeaea);
    border-radius: var(--grid-item-border-radius, 4px);
    margin: var(--grid-item-margin, 8px 0 0 0);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .grid-item-icon {
    height: var(--grid-item-icon-height, 32px);
    width: var(--grid-item-icon-width, auto);
    object-fit: var(--grid-item-icon-object-fit, contain);
    z-index: var(--grid-item-icon-z-index, 100);
  }

  .grid-item-footer {
    margin: var(--grid-item-footer-margin, 8px 0 0 0);
    font-size: var(--grid-item-font-size, 14px);
    color: var(--grid-item-color, #333);
    text-overflow: var(--grid-item-footer-text-overflow, ellipsis);
    white-space: var(--grid-item-footer-white-space, nowrap);
    overflow: var(--grid-item-footer-overflow, hidden);
    width: var(--grid-item-footer-width, 100%);
    text-align: var(--grid-item-footer-text-align, center);
    height: var(--grid-item-footer-height, fit-content);
  }

  .grid-body-loader {
    position: relative;
  }

  .grid-body-loader::before {
    content: '';
    box-sizing: border-box;
    position: absolute;
    inset: 0px;
    margin: var(--grid-item-margin, 8px 0 0 0);
    border-radius: var(--grid-item-border-radius, 4px);
    border: var(--animation-version, 32px solid #cbcccf66);
    animation: clipperAnimation var(--loader-animation-duration, 3s) infinite linear;
  }

  @keyframes clipperAnimation {
    0% {
      clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
    }
    25% {
      clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0);
    }
    50% {
      clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%);
    }
    75% {
      clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%);
    }
    100% {
      clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0);
    }
  }
</style>
