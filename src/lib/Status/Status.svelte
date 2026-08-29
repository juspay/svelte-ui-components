<script lang="ts">
  import type { StatusProperties } from './properties';
  import Button from '$lib/Button/Button.svelte';
  import Img from '$lib/Img/Img.svelte';

  let {
    statusIcon = 'icons/order-success-icon.svg',
    statusText = '',
    statusDescription = '',
    buttonProperties,
    classes,
    onbuttonClick,
    icon,
    descriptionSnippet,
    children,
    testId
  }: StatusProperties = $props();
</script>

<div
  class="background {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="order-status">
    <div class="status-image">
      {#if icon}
        {@render icon()}
      {:else}
        <Img inlineSvg src={statusIcon} alt="status" />
      {/if}
    </div>
    <div class="status-text">{statusText}</div>
    <div class="status-description">
      {#if typeof descriptionSnippet === 'function'}
        {@render descriptionSnippet()}
      {:else}
        <!-- eslint-disable-next-line -->
        {@html statusDescription}
      {/if}
    </div>
    {#if typeof buttonProperties === 'object'}
      <Button {...buttonProperties} onclick={onbuttonClick} />
    {/if}
    {#if typeof children === 'function'}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .status-text {
    font-weight: var(--status-font-weight, 600);
    color: var(--status-description-font-color, #2f3841);
    margin-bottom: 8px;
  }

  .status-description {
    font-weight: var(--status-font-weight, 400);
    color: var(--status-description-font-color, #436484cc);
    padding: 0px 42px;
    margin-bottom: 25px;
  }

  .status-image {
    color: var(--status-icon-color, inherit);
    display: flex;
    margin-bottom: 25px;
  }

  .background {
    min-height: var(--status-min-height, 100vh);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .order-status {
    flex-direction: column;
    display: flex;
    font-family: var(--order-font, inherit);
    font-size: var(--order-font-size, 14px);
    text-align: center;
  }
  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .order-status {
      background-color: var(--status-panel-background, rgba(255, 255, 255, 0.6));
      -webkit-backdrop-filter: var(--status-panel-backdrop-filter, blur(60px));
      backdrop-filter: var(--status-panel-backdrop-filter, blur(60px));
    }
  }
</style>
