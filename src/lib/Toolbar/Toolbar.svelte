<script lang="ts">
  import type { ToolbarProperties } from './properties';

  let {
    showBackButton = true,
    text,
    backIcon = 'https://sdk.breeze.in/gallery/icons/back.svg',
    leftContent,
    centerContent,
    rightContent,
    additionalContent,
    classes,
    onbackClick,
    onkeydown
  }: ToolbarProperties = $props();
</script>

<div class="toolbar {classes ?? ''}">
  <div class="content">
    {#if typeof leftContent === 'function'}
      {@render leftContent()}
    {:else if showBackButton && typeof backIcon === 'string' && backIcon.length > 0}
      <div class="back" onclick={onbackClick} {onkeydown} role="button" tabindex="0">
        <img src={backIcon} alt="Back" />
      </div>
    {/if}
    {#if typeof centerContent === 'function'}
      <div class="center-content">
        {@render centerContent()}
      </div>
    {:else if typeof text === 'string' && text.length > 0}
      <div class="text">
        {text}
      </div>
    {/if}
    {#if typeof rightContent === 'function'}
      <div class="right-content">
        {@render rightContent()}
      </div>
    {/if}
  </div>
  <div class="additional-content" class:hidden={!(typeof additionalContent === 'function')}>
    {#if typeof additionalContent === 'function'}
      {@render additionalContent()}
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    padding: var(--toolbar-padding, 0px);
    height: var(--toolbar-height, fit-content);
    width: var(--toolbar-width, 100vw);
    position: var(--toolbar-position, fixed);
    top: var(--toolbar-top, 0);
    left: var(--toolbar-left, 0);
    right: var(--toolbar-right, 0);
    background: var(--toolbar-background, #ffffff);
    box-shadow: var(--toolbar-box-shadow, 0px 2px 12px #55687c1a);
    z-index: var(--toolbar-z-index, 10);
    border-radius: var(--toolbar-border-radius, 0px);
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: var(--toolbar-content-padding, 0px);
    justify-content: var(--toolbar-justify-content, normal);
    visibility: var(--toolbar-content-visibility, visible);
  }

  .additional-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: var(--toolbar-additional-content-padding, 0px);
    height: var(--toolbar-additional-content-height, fit-content);
    justify-content: var(--toolbar-justify-additional-content, normal);
    visibility: var(--toolbar-additional-content-visibility, visible);
  }

  .hidden {
    display: none;
  }

  .back {
    height: var(--toolbar-back-button-height, 20px);
    width: var(--toolbar-back-button-width, 20px);
    padding: var(--toolbar-back-button-padding, 20px 14px);
    cursor: var(--toolbar-back-button-cursor, pointer);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .back img {
    height: var(--toolbar-back-image-height, 16px);
    width: var(--toolbar-back-image-width, 16px);
  }

  .center-content {
    display: flex;
    flex: 1;
  }

  .text {
    font-size: var(--toolbar-text-font-size, 18px);
    font-weight: var(--toolbar-text-font-weight, normal);
    padding: var(--toolbar-text-padding, 0px);
    margin: var(--toolbar-text-margin, 0px);
    color: var(--toolbar-text-color);
    flex: var(--toolbar-text-flex, 1);
  }
</style>
