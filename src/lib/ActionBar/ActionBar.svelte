<script lang="ts">
  import type { ActionBarProperties } from './properties';
  import Button from '../Button/Button.svelte';

  let {
    testId,
    classes,
    divider = true,
    primaryButton,
    secondaryButton,
    children
  }: ActionBarProperties = $props();
</script>

<div class="action-bar {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  {#if divider}
    <div class="action-bar-divider"></div>
  {/if}
  <div class="action-bar-buttons">
    {#if typeof children === 'function'}
      {@render children()}
    {:else}
      {#if secondaryButton}
        <Button {...secondaryButton} />
      {/if}
      {#if primaryButton}
        <Button {...primaryButton} />
      {/if}
    {/if}
  </div>
</div>

<style>
  .action-bar {
    background: var(--action-bar-background, #fff);
    position: var(--action-bar-position, fixed);
    bottom: var(--action-bar-bottom, 0);
    left: var(--action-bar-left, 0);
    right: var(--action-bar-right, 0);
    padding: var(--action-bar-padding, 12px 16px);
    z-index: var(--action-bar-z-index, 50);
    box-sizing: border-box;
  }

  .action-bar-divider {
    height: var(--action-bar-divider-thickness, 1px);
    background: var(--action-bar-divider-color, rgba(0, 0, 0, 0.08));
  }

  .action-bar-buttons {
    display: flex;
    gap: var(--action-bar-gap, 8px);
    justify-content: var(--action-bar-justify-content, flex-end);
  }
</style>
