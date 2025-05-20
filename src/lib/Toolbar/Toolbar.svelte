<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { defaultToolbarProperties } from './properties';
  import type { ToolbarProperties } from './properties';

  let {
    properties = defaultToolbarProperties,
    leftContent,
    centerContent,
    rightContent,
    additionalContent,
    ...rest
  } = $props<{
    properties?: ToolbarProperties;
    leftContent?: any;
    centerContent?: any;
    rightContent?: any;
    additionalContent?: any;
  }>();

  const dispatch = createEventDispatcher();

  function handleBackClick() {
    dispatch('backClick');
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      dispatch('backClick');
    }
  }
</script>

<div class="toolbar">
  <div class="content">
    {#if leftContent}
      {@render leftContent()}
    {:else if properties.showBackButton && properties.backIcon !== null}
      <div class="back" onclick={handleBackClick} onkeydown={handleKeyDown} role="button" tabindex="0">
        <img src={properties.backIcon} alt="Back" />
      </div>
    {/if}
    {#if centerContent}
      <div class="center-content">
        {@render centerContent()}
      </div>
    {:else if properties.text !== null}
      <div class="text">
        {properties.text}
      </div>
    {/if}
    {#if rightContent}
      <div class="right-content">
        {@render rightContent()}
      </div>
    {/if}
  </div>
  <div class="additional-content">
    {#if additionalContent}
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

  .back {
    height: var(--toolbar-back-button-height, 20px);
    width: var(--toolbar-back-button-width, 20px);
    padding: var(--toolbar-back-button-padding, 20px 14px);
    cursor: var(--toolbar-back-button-cursor, pointer);
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
    font-size: 18px;
  }
</style>
