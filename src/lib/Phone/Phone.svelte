<script lang="ts">
  import type { PhoneProperties } from './properties';
  import signalSvg from '$lib/assets/signal.svg?raw';
  import wifiSvg from '$lib/assets/wifi.svg?raw';
  import batterySvg from '$lib/assets/battery.svg?raw';

  let {
    children,
    variant = 'modern',
    showStatusBar = true,
    showHomeBar = true,
    testId,
    classes
  }: PhoneProperties = $props();

  let isModern = $derived(variant === 'modern');
</script>

<div class="phone-wrapper {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  <div class="side-buttons-left">
    <div class="side-button volume-up"></div>
    <div class="side-button volume-down"></div>
  </div>

  <div class="side-buttons-right">
    <div class="side-button power"></div>
  </div>

  <div class="phone-frame">
    <div class="phone-screen" class:modern={isModern} class:classic={!isModern}>
      {#if showStatusBar}
        <div class="status-bar">
          <div class="status-bar-left">
            <span class="status-time">9:41</span>
          </div>
          <!-- eslint-disable svelte/no-at-html-tags -->
          <div class="status-bar-right">
            <span class="status-icon">{@html signalSvg}</span>
            <span class="status-icon">{@html wifiSvg}</span>
            <span class="status-icon battery-icon">{@html batterySvg}</span>
          </div>
        </div>
      {/if}

      {#if isModern}
        <div class="notch"></div>
      {/if}

      <div class="screen-content">
        {#if typeof children === 'function'}
          {@render children()}
        {/if}
      </div>

      {#if isModern && showHomeBar}
        <div class="home-bar-container">
          <div class="home-bar"></div>
        </div>
      {/if}
    </div>

    {#if !isModern}
      <div class="home-button-container">
        <div class="home-button"></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .phone-wrapper {
    display: inline-block;
    position: relative;
    transform-origin: top left;
    transform: scale(var(--phone-scale, 1));
    rotate: var(--phone-rotation, 0deg);
  }

  .phone-frame {
    position: relative;
    width: var(--phone-frame-width, 375px);
    border-radius: var(--phone-frame-border-radius, 50px);
    padding: var(--phone-frame-padding, 12px);
    box-sizing: border-box;
    background: var(--phone-frame-color, black);
    box-shadow: var(
      --phone-frame-shadow,
      0 20px 60px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(0, 0, 0, 0.1)
    );
  }

  .phone-screen {
    position: relative;
    border-radius: var(--phone-screen-border-radius, 38px);
    background: var(--phone-screen-background, #000);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .phone-screen.modern {
    aspect-ratio: var(--phone-screen-aspect-ratio, 9 / 19.5);
  }

  .phone-screen.classic {
    aspect-ratio: var(--phone-screen-aspect-ratio, 9 / 16);
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: var(--phone-status-bar-height, 44px);
    padding: 0 24px;
    color: var(--phone-status-bar-color, #fff);
    font-size: var(--phone-status-bar-font-size, 14px);
    background: var(--phone-status-bar-background, transparent);
    flex-shrink: 0;
    z-index: 2;
    position: relative;
  }

  .status-bar-left {
    display: flex;
    align-items: center;
  }

  .status-time {
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .status-bar-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-icon {
    display: inline-flex;
    width: 16px;
    height: 12px;
    color: inherit;
  }

  .status-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .battery-icon {
    width: 24px;
  }

  .notch {
    width: var(--phone-notch-width, 120px);
    height: var(--phone-notch-height, 32px);
    background: var(--phone-notch-background, var(--phone-frame-color, black));
    border-radius: var(--phone-notch-border-radius, 20px);
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
  }

  .screen-content {
    flex: 1;
    overflow: var(--phone-content-overflow, hidden);
    position: relative;
  }

  .home-bar-container {
    display: flex;
    justify-content: center;
    padding: 8px 0;
    flex-shrink: 0;
  }

  .home-bar {
    width: var(--phone-home-bar-width, 134px);
    height: var(--phone-home-bar-height, 5px);
    background: var(--phone-home-bar-color, #fff);
    border-radius: var(--phone-home-bar-radius, 3px);
  }

  .home-button-container {
    display: flex;
    justify-content: center;
    padding: 10px 0;
  }

  .home-button {
    width: var(--phone-home-button-size, 50px);
    height: var(--phone-home-button-size, 50px);
    border-radius: 50%;
    border: 2px solid var(--phone-home-button-border-color, #555);
    background: transparent;
  }

  .side-buttons-left {
    position: absolute;
    top: 120px;
    left: -3px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1;
  }

  .side-buttons-right {
    position: absolute;
    top: 140px;
    right: -3px;
    z-index: 1;
  }

  .side-button {
    background: var(--phone-side-button-color, var(--phone-frame-color, black));
    border-radius: 2px;
  }

  .side-button.volume-up,
  .side-button.volume-down {
    width: 3px;
    height: 30px;
  }

  .side-button.power {
    width: 3px;
    height: 40px;
  }
</style>
