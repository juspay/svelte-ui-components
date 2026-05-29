<script lang="ts">
  import type { PillProperties } from './properties';
  import Button from '../Button/Button.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';

  let {
    text,
    dismissible = false,
    disabled = false,
    testId,
    dismissIcon,
    onclick,
    ondismiss,
    classes,
    variant,
    showDot = false,
    leadingIcon,
    size = 'md'
  }: PillProperties = $props();

  let interactive = $derived(typeof onclick === 'function');

  const handleClick = (event: MouseEvent): void => {
    if (disabled) {
      return;
    }
    onclick?.(event);
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  };

  const handleDismiss = (event: MouseEvent): void => {
    event.stopPropagation();
    if (disabled) {
      return;
    }
    ondismiss?.();
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="pill pill-size-{size} {variant ? `pill-variant-${variant}` : ''} {classes ?? ''}"
  class:disabled
  onclick={interactive ? handleClick : null}
  onkeydown={interactive ? handleKeydown : null}
  role={interactive ? 'button' : null}
  tabindex={interactive ? 0 : null}
  aria-disabled={interactive && disabled ? true : null}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if showDot}
    <span class="pill-dot" aria-hidden="true"></span>
  {/if}
  {#if typeof leadingIcon === 'function'}
    <span class="pill-leading-icon">{@render leadingIcon()}</span>
  {/if}
  <span class="pill-text">{text}</span>
  {#if dismissible}
    <div class="pill-dismiss">
      <Button
        {disabled}
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

<style>
  .pill {
    display: inline-flex;
    align-items: center;
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
    line-height: 1;
  }

  .pill:hover:not(.disabled) {
    background-color: var(--pill-hover-background, var(--pill-background, #d0d0d0));
    color: var(--pill-hover-color, var(--pill-color, #333333));
  }

  .pill.disabled {
    opacity: var(--pill-disabled-opacity, 0.4);
    cursor: var(--pill-disabled-cursor, not-allowed);
  }

  /* size='sm' preset — tighter padding and gap */
  .pill-size-sm {
    padding: var(--pill-sm-padding, 3px 8px);
    gap: var(--pill-sm-gap, 3px);
  }

  /* size='md' is the default; explicit class allows consumer overrides */

  .pill-text {
    overflow: hidden;
    text-overflow: var(--pill-text-overflow, ellipsis);
    white-space: nowrap;
  }

  /* Leading dot rendered when showDot=true */
  .pill-dot {
    display: inline-block;
    flex-shrink: 0;
    width: var(--pill-dot-size, 6px);
    height: var(--pill-dot-size, 6px);
    border-radius: 50%;
    background-color: var(--pill-dot-color, currentColor);
  }

  /* Wrapper for the leadingIcon snippet */
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

  .pill-dismiss :global(svg) {
    width: var(--pill-dismiss-size, 14px);
    height: var(--pill-dismiss-size, 14px);
  }
</style>
