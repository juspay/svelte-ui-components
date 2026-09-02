<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';
  import type { ChatHeaderProperties } from './properties';

  let {
    title = '',
    subtitle = '',
    image,
    imageAlt = '',
    avatar,
    actions,
    closeIcon,
    closeLabel = 'Close',
    showClose,
    onclose: oncloseLegacy,
    onClose,
    children,
    testId,
    classes
  }: ChatHeaderProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onclose = $derived(onClose ?? oncloseLegacy);

  let displayClose = $derived(showClose ?? typeof onclose === 'function');
</script>

<header
  class="chat-header {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="bar">
    <div class="brand">
      {#if typeof avatar === 'function'}
        <div class="avatar">{@render avatar()}</div>
      {:else if typeof image === 'string' && image.length > 0}
        <span class="image">
          <Img src={image} alt={imageAlt} />
        </span>
      {/if}
      {#if title.length > 0 || subtitle.length > 0}
        <div class="titles">
          {#if title.length > 0}
            <span class="title">{title}</span>
          {/if}
          {#if subtitle.length > 0}
            <span class="subtitle">{subtitle}</span>
          {/if}
        </div>
      {/if}
    </div>

    <div class="trailing">
      {#if typeof actions === 'function'}
        {@render actions()}
      {/if}
      {#if displayClose}
        <div class="close">
          <Button onclick={() => onclose?.()} ariaLabel={closeLabel}>
            {#if typeof closeIcon === 'function'}
              {@render closeIcon()}
            {:else}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html closeSvg}
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  </div>

  {#if typeof children === 'function'}
    <div class="extra">{@render children()}</div>
  {/if}
</header>

<style>
  .chat-header {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--chat-header-extra-gap, 8px);
    width: var(--chat-header-width, 100%);
    padding: var(--chat-header-padding, 0.75rem 1.5rem);
    background: var(--chat-header-background, transparent);
    border-bottom: var(--chat-header-border-bottom, none);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--chat-header-gap, 12px);
    width: 100%;
  }

  .extra {
    width: 100%;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--chat-header-brand-gap, 10px);
    min-width: 0;
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .image {
    display: contents;
    --image-height: var(--chat-header-image-size, 28px);
    --image-width: var(--chat-header-image-size, 28px);
    --image-object-fit: var(--chat-header-image-object-fit, cover);
    --image-border-radius: var(--chat-header-image-border-radius, 50%);
    --image-padding: 0px;
    --image-margin: 0px;
  }

  .titles {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .title {
    font-size: var(--chat-header-title-font-size, 0.95rem);
    font-weight: var(--chat-header-title-font-weight, 600);
    color: var(--chat-header-title-color, #18181b);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    font-size: var(--chat-header-subtitle-font-size, 0.7rem);
    font-weight: var(--chat-header-subtitle-font-weight, 500);
    color: var(--chat-header-subtitle-color, #71717a);
    text-transform: var(--chat-header-subtitle-text-transform, none);
    letter-spacing: var(--chat-header-subtitle-letter-spacing, normal);
  }

  .trailing {
    display: flex;
    align-items: center;
    gap: var(--chat-header-trailing-gap, 8px);
    flex-shrink: 0;
  }

  .close {
    --button-width: var(--chat-header-close-size, 36px);
    --button-height: var(--chat-header-close-size, 36px);
    --button-padding: var(--chat-header-close-padding, 8px);
    --button-border-radius: var(--chat-header-close-border-radius, 50%);
    --button-color: var(--chat-header-close-background-color, transparent);
    --button-text-color: var(--chat-header-close-color, #52525b);
    --button-content-gap: 0px;
    --button-hover-color: var(--chat-header-close-hover-background-color, #f4f4f5);
  }

  .close :global(svg) {
    height: 100%;
    width: 100%;
  }
</style>
