<script lang="ts">
  import Loader from '../Loader/Loader.svelte';
  import type { ChatToolStatusProperties } from './properties';

  let { label, icon, testId, classes }: ChatToolStatusProperties = $props();
</script>

<div
  class="chat-tool-status {classes ?? ''}"
  aria-live="polite"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <span class="indicator">
    {#if typeof icon === 'function'}
      {@render icon()}
    {:else}
      <Loader />
    {/if}
  </span>
  <span class="label">{label}</span>
</div>

<style>
  .chat-tool-status {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--chat-tool-status-gap, 8px);
    width: fit-content;
    padding: var(--chat-tool-status-padding, 8px 14px);
    background: var(--chat-tool-status-background, #ffffff);
    border: var(--chat-tool-status-border, 1px solid #e4e4e7);
    border-radius: var(--chat-tool-status-border-radius, 999px);
    box-shadow: var(--chat-tool-status-box-shadow, 0 6px 20px rgba(0, 0, 0, 0.08));
    color: var(--chat-tool-status-color, #52525b);
    font-size: var(--chat-tool-status-font-size, 0.85rem);
    font-weight: var(--chat-tool-status-font-weight, 500);
    max-width: var(--chat-tool-status-max-width, 100%);
  }

  .indicator {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--chat-tool-status-indicator-color, currentColor);
    --loader-foreground: var(--chat-tool-status-spinner-color, currentColor);
    --loader-foreground-end: var(--chat-tool-status-spinner-color-end, transparent);
    --loader-width: var(--chat-tool-status-spinner-size, 14px);
    --loader-height: var(--chat-tool-status-spinner-size, 14px);
    --loader-before-width: 7px;
    --loader-before-height: 7px;
    --loader-after-width: 11px;
    --loader-after-height: 11px;
    --loader-background: var(--chat-tool-status-background, #ffffff);
  }

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
