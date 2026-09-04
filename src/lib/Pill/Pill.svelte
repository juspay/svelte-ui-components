<script lang="ts">
  import type { PillProperties } from './properties';
  import Button from '../Button/Button.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    text,
    dismissible = false,
    disabled = false,
    testId,
    title,
    dismissIcon,
    dismissLabel,
    leadingIcon,
    onclick,
    ondismiss: ondismissLegacy,
    onDismiss,
    classes
  }: PillProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const ondismiss = $derived(onDismiss ?? ondismissLegacy);

  let interactive = $derived(typeof onclick === 'function');

  function handleClick(event: MouseEvent): void {
    if (disabled) {
      return;
    }
    onclick?.(event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  }

  function handleDismiss(event: MouseEvent): void {
    event.stopPropagation();
    if (disabled) {
      return;
    }
    ondismiss?.();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="pill {classes ?? ''}"
  class:disabled
  onclick={interactive ? handleClick : null}
  onkeydown={interactive ? handleKeydown : null}
  role={interactive ? 'button' : null}
  tabindex={interactive ? 0 : null}
  aria-disabled={interactive && disabled ? true : null}
  data-pw={typeof testId === 'string' ? testId : null}
  title={title ?? null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if typeof leadingIcon === 'function'}
    <span class="pill-leading-icon">{@render leadingIcon()}</span>
  {/if}
  <span class="pill-text">{text}</span>
  {#if dismissible}
    <div class="pill-dismiss">
      <!-- A dismiss action is a bare icon, not a primary call to action. -->
      <Button
        variant="ghost"
        {disabled}
        onclick={handleDismiss}
        ariaLabel={dismissLabel?.trim() || 'Dismiss'}
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

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    /* A pill is content-width by default. A caller stacking pills into a menu needs
       them to fill the column and align their labels left, which is a layout choice
       the call site owns — hence tokens rather than a variant. */
    width: var(--pill-width, auto);
    justify-content: var(--pill-justify-content, center);
    text-align: var(--pill-text-align, center);
    gap: var(--pill-gap, 4px);
    background-color: var(--pill-background, #e0e0e0);
    color: var(--pill-color, #333333);
    font-size: var(--pill-font-size, 13px);
    font-weight: var(--pill-font-weight, 500);
    font-family: var(--pill-font-family);
    padding: var(--pill-padding, 6px 10px);
    border-radius: var(--pill-border-radius, 999px);
    border: var(--pill-border, none);
    cursor: var(--pill-cursor, pointer);
    max-width: var(--pill-max-width);
    line-height: var(--pill-line-height, 1);
    flex-shrink: var(--pill-flex-shrink);
  }

  .pill:hover:not(.disabled) {
    background-color: var(--pill-hover-background, var(--pill-background, #d0d0d0));
    color: var(--pill-hover-color, var(--pill-color, #333333));
  }

  .pill.disabled {
    opacity: var(--pill-disabled-opacity, 0.4);
    cursor: var(--pill-disabled-cursor, not-allowed);
  }

  .pill-text {
    overflow: hidden;
    text-overflow: var(--pill-text-overflow, ellipsis);
    white-space: var(--pill-text-white-space, nowrap);
  }

  .pill-leading-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .pill-dismiss {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 0;
    --button-text-color: var(--pill-dismiss-color, currentColor);
    --button-hover-color: transparent;
    --button-hover-text-color: var(
      --pill-dismiss-hover-color,
      var(--pill-dismiss-color, currentColor)
    );
    --cursor: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Consumer themes can set Button tokens on its container, beating inherited
     wrapper values. Pin the painting element too so the chip owns its enabled
     glyph; leave disabled colours and focus indicators to the consumer theme. */
  .pill-dismiss :global(.button-container),
  .pill-dismiss :global(.button-el) {
    --button-color: transparent;
    --button-background: none;
    --button-active-background: transparent;
    --button-border: none;
    --button-padding: 0;
    --button-text-color: var(--pill-dismiss-color, currentColor);
    --button-hover-color: transparent;
    --button-hover-border: none;
    --button-hover-text-color: var(
      --pill-dismiss-hover-color,
      var(--pill-dismiss-color, currentColor)
    );
  }

  .pill-dismiss :global(svg) {
    width: var(--pill-dismiss-size, 14px);
    height: var(--pill-dismiss-size, 14px);
  }
</style>
