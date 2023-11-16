<script lang="ts">
  import { defaultIconProperties } from './properties';
  import type { IconProperties } from './properties';

  export let properties: IconProperties = defaultIconProperties;
</script>

<div class="icon-container" on:click on:keydown role="button" tabindex="0">
  <img src={properties.icon} alt="" />
  {#if properties.text !== ''}
    <div class="icon-text">{properties.text}</div>
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
