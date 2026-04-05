<script lang="ts">
  import type { IconProperties } from './properties';

  let { icon, svg, text, onclick, onkeydown, classes }: IconProperties = $props();
</script>

<div class="icon-container {classes ?? ''}" {onclick} {onkeydown} role="button" tabindex="0">
  {#if typeof svg === 'string' && svg.length > 0}
    <!-- eslint-disable svelte/no-at-html-tags -->
    <span class="icon-svg">{@html svg}</span>
  {:else if icon}
    <img src={icon} alt="" />
  {/if}
  {#if typeof text === 'string' && text.length > 0}
    <div class="icon-text">{text}</div>
  {/if}
</div>

<style>
  .icon-container {
    display: flex;
    padding: var(--icon-container-paddding, 4px);
    flex-direction: var(--icon-container-direction, column);
    align-items: center;
    cursor: pointer;
  }
  .icon-container img {
    height: var(--icon-height, 20px);
    width: var(--icon-width, 20px);
    padding: var(--icon-padding, 4px);
  }

  .icon-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-width, 20px);
    height: var(--icon-height, 20px);
    padding: var(--icon-padding, 4px);
    color: var(--icon-svg-color, currentColor);
  }

  .icon-svg :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon-text {
    display: flex;
    padding: var(--icon-text-padding, 4px);
    flex-direction: var(--icon-text-direction, column);
    font-size: var(--icon-text-font-size, 12px);
  }
</style>
