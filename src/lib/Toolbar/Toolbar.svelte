<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { defaultToolbarProperties } from './properties';
  import type { ToolbarProperties } from './properties';

  export let properties: ToolbarProperties = defaultToolbarProperties;

  const dispatch = createEventDispatcher();

  function handleBackClick() {
    dispatch('backClick');
  }
</script>

<div class="toolbar">
  <div class="content">
    {#if $$slots.leftContent}
      <slot name="leftContent" />
    {:else if properties.showBackButton && properties.backIcon !== null}
      <div class="back" on:click={handleBackClick} on:keydown role="button" tabindex="0">
        <img src={properties.backIcon} alt="Back" />
      </div>
    {/if}
    {#if $$slots.centerContent}
      <div class="center-content">
        <slot name="centerContent" />
      </div>
    {:else if properties.text !== null}
      <div class="text">
        {properties.text}
      </div>
    {/if}
    {#if $$slots.rightContent}
      <div class="right-content">
        <slot name="rightContent" />
      </div>
    {/if}
  </div>
  <div class="additional-content">
    {#if $$slots.additionalContent}
      <slot name="additionalContent" />
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    padding: var(--toolbar-padding, 0px);
    height: fit-content;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--toolbar-background, #ffffff);
    box-shadow: var(--toolbar-box-shadow, 0px 2px 12px #55687c1a);
    z-index: var(--toolbar-z-index, 10);
  }

  .content {
    display: flex;
    flex-direction: row;
    padding: var(--toolbar-content-padding, 0px);
    align-items: center;
    justify-content: var(--toolbar-justify-content, normal);
    visibility: var(--toolbar-content-visibility, visible);
  }

  .additional-content {
    display: flex;
    flex-direction: row;
    padding: var(--toolbar-additional-content-padding, 0px);
    align-items: center;
    height: var(--toolbar-additional-content-height, fit-content);
    justify-content: var(--toolbar-justify-additional-content, normal);
    visibility: var(--toolbar-additional-content-visibility, visible);
  }

  .back {
    height: var(--toolbar-back-button-height, 20px);
    width: var(--toolbar-back-button-width, 20px);
    padding: var(--toolbar-back-button-padding, 20px 14px);
    cursor: var(--toolbar-back-button-cursor, pointer);
  }

  .back img{
    height: var(--toolbar-back-image-height, 16px);
    width: var(--toolbar-back-image-width, 16px);
  }

  .center-content {
    display: flex;
    flex: 1;
  }

  .text {
    font-size: 18px;
  }

  .right-content {
    margin-left: auto;
  }
</style>
