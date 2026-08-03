<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import type { FileDropzoneTriggerProperties } from './properties';

  let {
    icon,
    heading,
    caption,
    compact = false,
    onclick,
    testId,
    classes
  }: FileDropzoneTriggerProperties = $props();
</script>

{#if compact}
  <div class="file-dropzone-trigger-compact {classes ?? ''}">
    <div class="file-dropzone-trigger-icon-sm" aria-hidden="true">
      <Img src={icon} alt="" fallback="" classes="file-dropzone-trigger-icon-sm-img" />
    </div>
    <span class="file-dropzone-trigger-heading" data-pw={testId} testID={testId}>{heading}</span>
  </div>
{:else}
  <Button
    classes={`file-dropzone-trigger-button ${classes ?? ''}`}
    {onclick}
    {...typeof testId === 'string' ? { testId } : {}}
  >
    <div class="file-dropzone-trigger-icon" aria-hidden="true">
      <Img src={icon} alt="" fallback="" classes="file-dropzone-trigger-icon-img" />
    </div>
    <p class="file-dropzone-trigger-heading-wrap">
      <span class="file-dropzone-trigger-heading">{heading}</span>
    </p>
    {#if caption}
      <p class="file-dropzone-trigger-caption">{caption}</p>
    {/if}
  </Button>
{/if}

<style>
  .file-dropzone-trigger-compact {
    display: flex;
    flex-direction: var(--file-dropzone-trigger-compact-flex-direction, row);
    align-items: var(--file-dropzone-trigger-compact-align-items, center);
    gap: var(--file-dropzone-trigger-compact-gap, 8px);
  }

  .file-dropzone-trigger-icon-sm,
  .file-dropzone-trigger-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-dropzone-trigger-icon-sm :global(.file-dropzone-trigger-icon-sm-img) {
    --image-width: var(--file-dropzone-trigger-icon-sm-size, 16px);
    --image-height: var(--file-dropzone-trigger-icon-sm-size, 16px);
  }

  .file-dropzone-trigger-icon :global(.file-dropzone-trigger-icon-img) {
    --image-width: var(--file-dropzone-trigger-icon-size, 24px);
    --image-height: var(--file-dropzone-trigger-icon-size, 24px);
  }

  .file-dropzone-trigger-heading {
    color: var(--file-dropzone-trigger-heading-color, inherit);
    font-weight: var(--file-dropzone-trigger-heading-font-weight, 600);
  }

  .file-dropzone-trigger-heading-wrap {
    margin: var(--file-dropzone-trigger-heading-margin, 0);
  }

  .file-dropzone-trigger-caption {
    margin: var(--file-dropzone-trigger-caption-margin, 0);
    color: var(--file-dropzone-trigger-caption-color, #64748b);
    font-size: var(--file-dropzone-trigger-caption-font-size, 0.85em);
  }
</style>
