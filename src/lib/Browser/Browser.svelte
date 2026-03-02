<script lang="ts">
  import type { BrowserProperties } from './properties';
  import lockSvg from '$lib/assets/lock.svg?raw';

  let {
    url = '',
    title = '',
    showAddressBar = true,
    showTabBar = false,
    variant = 'light',
    shadow = true,
    rounded = true,
    testId,
    lockIcon,
    children,
    classes
  }: BrowserProperties = $props();
</script>

<div class="browser {variant} {classes ?? ''}" class:shadow class:rounded data-pw={testId}>
  <div class="chrome">
    <div class="titlebar">
      <div class="dots">
        <span class="dot close"></span>
        <span class="dot minimize"></span>
        <span class="dot maximize"></span>
      </div>
      {#if showTabBar}
        <div class="tab-bar">
          <div class="tab">{title}</div>
        </div>
      {/if}
    </div>
    {#if showAddressBar}
      <div class="addressbar-row">
        <div class="addressbar">
          {#if typeof lockIcon === 'function'}
            {@render lockIcon()}
          {:else}
            <span class="lock-icon">
              <!-- eslint-disable svelte/no-at-html-tags -->
              {@html lockSvg}
            </span>
          {/if}
          <span class="url-text">{url}</span>
        </div>
      </div>
    {/if}
  </div>
  <div class="content">
    {#if typeof children === 'function'}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .browser {
    width: var(--browser-width, 100%);
    max-width: var(--browser-max-width);
    border: var(--browser-border, 1px solid #d1d5db);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .browser.rounded {
    border-radius: var(--browser-border-radius, 12px);
  }

  .browser.shadow {
    box-shadow: var(--browser-shadow, 0 8px 32px rgba(0, 0, 0, 0.12));
  }

  /* Light variant */
  .browser.light .chrome {
    background-color: var(--browser-chrome-bg, #f3f4f6);
    color: var(--browser-chrome-color, #374151);
  }

  .browser.light .tab {
    background-color: var(--browser-tab-bg, #ffffff);
    color: var(--browser-tab-color, #374151);
  }

  .browser.light .addressbar {
    background-color: var(--browser-addressbar-bg, #ffffff);
    border: var(--browser-addressbar-border, 1px solid #e5e7eb);
  }

  /* Dark variant */
  .browser.dark .chrome {
    background-color: var(--browser-chrome-bg, #1f2937);
    color: var(--browser-chrome-color, #d1d5db);
  }

  .browser.dark .tab {
    background-color: var(--browser-tab-bg, #374151);
    color: var(--browser-tab-color, #d1d5db);
  }

  .browser.dark .addressbar {
    background-color: var(--browser-addressbar-bg, #111827);
    border: var(--browser-addressbar-border, 1px solid #374151);
  }

  .chrome {
    display: flex;
    flex-direction: column;
  }

  .titlebar {
    display: flex;
    align-items: center;
    padding: var(--browser-titlebar-padding, 12px 16px);
    gap: 12px;
  }

  .dots {
    display: flex;
    gap: var(--browser-dot-gap, 8px);
    flex-shrink: 0;
  }

  .dot {
    width: var(--browser-dot-size, 12px);
    height: var(--browser-dot-size, 12px);
    border-radius: 50%;
  }

  .dot.close {
    background-color: var(--browser-dot-close-bg, #ef4444);
  }

  .dot.minimize {
    background-color: var(--browser-dot-minimize-bg, #f59e0b);
  }

  .dot.maximize {
    background-color: var(--browser-dot-maximize-bg, #22c55e);
  }

  .tab-bar {
    display: flex;
    align-items: flex-end;
    flex: 1;
  }

  .tab {
    padding: var(--browser-tab-padding, 6px 16px);
    border-radius: var(--browser-tab-border-radius, 8px 8px 0 0);
    font-size: var(--browser-tab-font-size, 13px);
    font-family: var(--browser-tab-font-family, inherit);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .addressbar-row {
    padding: var(--browser-addressbar-padding, 8px 16px);
  }

  .addressbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    height: var(--browser-addressbar-height, 32px);
    border-radius: var(--browser-addressbar-border-radius, 6px);
    font-size: var(--browser-addressbar-font-size, 13px);
    font-family: var(--browser-addressbar-font-family, inherit);
  }

  .lock-icon {
    display: flex;
    flex-shrink: 0;
    color: var(--browser-lock-color, #6b7280);
  }

  .url-text {
    color: var(--browser-addressbar-color, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .content {
    background-color: var(--browser-content-bg, #ffffff);
    min-height: var(--browser-content-min-height, 200px);
    overflow: var(--browser-content-overflow, hidden);
  }
</style>
