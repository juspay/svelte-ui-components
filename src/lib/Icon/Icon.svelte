<script lang="ts">
  import type { IconProperties } from './properties';

  let { icon, text, onclick, onkeydown, classes }: IconProperties = $props();
</script>

<div class="icon-container {classes ?? ''}" {onclick} {onkeydown} role="button" tabindex="0">
  <img src={icon} alt="" />
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

  .icon-text {
    display: flex;
    padding: var(--icon-text-padding, 4px);
    flex-direction: var(--icon-text-direction, column);
    font-size: var(--icon-text-font-size, 12px);
  }
</style>
