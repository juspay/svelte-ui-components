<script lang="ts">
  import type { BannerProperties } from './properties';
  import { slide } from 'svelte/transition';
  import Button from '../Button/Button.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    text,
    icon,
    linkText,
    dismissible = false,
    visible = $bindable(true),
    testId,
    rightContent,
    dismissIcon,
    onclick,
    ondismiss,
    classes,
    title,
    role = null
  }: BannerProperties = $props();

  let interactive = $derived(typeof onclick === 'function');

  let rootClass = $derived(['banner', classes ?? ''].filter((c) => c.length > 0).join(' '));

  function handleClick(event: MouseEvent): void {
    onclick?.(event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  }

  function handleDismiss(event: MouseEvent): void {
    event.stopPropagation();
    visible = false;
    ondismiss?.();
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class={rootClass}
    onclick={interactive ? handleClick : null}
    onkeydown={interactive ? handleKeydown : null}
    role={role !== null ? role : interactive ? 'button' : null}
    tabindex={interactive ? 0 : null}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
    transition:slide={{ duration: 300 }}
  >
    {#if typeof icon === 'function'}
      <div class="banner-icon">
        {@render icon()}
      </div>
    {/if}
    <div class="banner-body">
      {#if typeof title === 'function'}
        <div class="banner-title">
          {@render title()}
        </div>
      {/if}
      <div class="banner-text">
        {text}
        {#if typeof linkText === 'string' && linkText.length > 0}
          <span class="banner-link-text">{linkText}</span>
        {/if}
      </div>
    </div>
    {#if typeof rightContent === 'function'}
      <div class="banner-right">
        {@render rightContent()}
      </div>
    {/if}
    {#if dismissible}
      <div class="banner-dismiss">
        <Button
          onclick={handleDismiss}
          ariaLabel="Dismiss"
          {...typeof testId === 'string' ? { testId: `${testId}-dismiss` } : {}}
        >
          {#if typeof dismissIcon === 'function'}
            {@render dismissIcon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html closeSvg}
          {/if}
        </Button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    width: var(--banner-width, 100%);
    height: var(--banner-height);
    padding: var(--banner-padding, 10px 12px);
    gap: var(--banner-gap, 8px);
    justify-content: var(--banner-justify-content, center);
    background-color: var(--banner-background, #f0f4f8);
    color: var(--banner-color, #637c95);
    font-family: var(--banner-font-family);
    font-size: var(--banner-font-size, 14px);
    font-weight: var(--banner-font-weight, 500);
    line-height: var(--banner-line-height, 1.3);
    border-bottom: var(--banner-border-bottom, none);
    border: var(--banner-border);
    border-radius: var(--banner-border-radius, var(--radius, 4px));
    cursor: var(--banner-cursor, pointer);
    position: var(--banner-position, sticky);
    top: var(--banner-top, 0);
    z-index: var(--banner-z-index, 100);
    box-sizing: border-box;
  }

  .banner-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--banner-icon-color, currentColor);
  }

  .banner-icon :global(svg) {
    width: var(--banner-icon-size, 18px);
    height: var(--banner-icon-size, 18px);
  }

  .banner-body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: var(--banner-body-gap, 0);
  }

  .banner-title {
    font-weight: var(--banner-title-font-weight, inherit);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .banner-text {
    overflow: var(--banner-text-overflow, hidden);
    text-overflow: var(--banner-text-ellipsis, ellipsis);
    white-space: var(--banner-white-space, nowrap);
  }

  .banner-link-text {
    color: var(--banner-link-color, #0099ff);
    margin-left: var(--banner-link-gap, 4px);
  }

  .banner-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .banner-dismiss {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 2px;
    --button-border-radius: var(--banner-dismiss-border-radius, var(--radius, 4px));
    --button-text-color: var(--banner-dismiss-color, currentColor);
    --button-hover-color: var(--banner-dismiss-hover-background, rgba(0, 0, 0, 0.1));
    --cursor: inherit;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .banner-dismiss :global(svg) {
    width: var(--banner-dismiss-size, 14px);
    height: var(--banner-dismiss-size, 14px);
  }
</style>
