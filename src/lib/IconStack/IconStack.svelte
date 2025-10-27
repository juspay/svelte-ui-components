<script lang="ts">
  import type { IconStackProperties } from './properties';

  let { icons }: IconStackProperties = $props();
</script>

<div class="stack-container">
  {#each icons as icon, i}
    <div class="stack-icon" style:z-index={icons.length - i}>
      {#if icon.type === 'image'}
        <img src={icon.content} alt="icon" />
      {:else}
        <div class="text-container">
          <span>{icon.content}</span>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .stack-container {
    display: flex;
    margin: var(--stack-container-margin, 0px);
  }
  .stack-icon {
    display: flex;
    width: var(--stack-icon-width, 36px);
    height: var(--stack-icon-height, 36px);
    background: var(--stack-icon-bg, white);
    border-radius: var(--stack-icon-radius, 50%);
    margin: var(--stack-icon-margin, 0px 0px 0px -14px);
    align-items: var(--stack-icon-align-items, center);
    border: var(--stack-icon-border, 1px solid #ffffff40);
    justify-content: var(--stack-icon-justify-content, center);
    box-shadow: var(--stack-icon-shadow, 0 2px 4px #00000026);
  }
  .stack-icon img {
    width: var(--stack-img-width, 36px);
    height: var(--stack-img-height, 36px);
  }
  .text-container {
    display: flex;
    width: var(--text-conatiner-width, 36px);
    height: var(--text-conatiner-height, 36px);
    align-items: var(--text-container-align-items, center);
    justify-content: var(--text-container-justify-content, center);
  }
  .text-container span {
    color: var(--text-color, #666);
    font-size: var(--text-size, 13px);
    font-weight: var(--text-weight, 500);
    text-align: var(--text-align, center);
  }
</style>
