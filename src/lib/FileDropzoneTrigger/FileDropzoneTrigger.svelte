<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import { useFileInputOwner } from '../FileInput/context';
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

  /* An upload action gets one interactive control, never two. Inside a FileInput
     the region is that control (one Tab stop, Enter/Space/click open the chooser),
     so a native <button> in here would be a second stop announcing the same
     action. The button is therefore rendered only when this trigger is the owner:
     it was handed an `onclick` and nothing around it already owns activation.
     Otherwise it is the same surface as plain content. */
  const owner = useFileInputOwner();
  const ownsActivation = $derived(
    typeof onclick === 'function' && owner?.regionOwnsActivation !== true
  );
</script>

{#snippet body()}
  <div class="file-dropzone-trigger-icon" aria-hidden="true">
    <Img inlineSvg src={icon} alt="" fallback="" classes="file-dropzone-trigger-icon-img" />
  </div>
  <p class="file-dropzone-trigger-heading-wrap">
    <span class="file-dropzone-trigger-heading">{heading}</span>
  </p>
  {#if caption}
    <p class="file-dropzone-trigger-caption">{caption}</p>
  {/if}
{/snippet}

{#if compact}
  <div class="file-dropzone-trigger-compact {classes ?? ''}">
    <div class="file-dropzone-trigger-icon-sm" aria-hidden="true">
      <Img inlineSvg src={icon} alt="" fallback="" classes="file-dropzone-trigger-icon-sm-img" />
    </div>
    <span class="file-dropzone-trigger-heading" data-pw={testId} testID={testId}>{heading}</span>
  </div>
{:else if ownsActivation}
  <Button
    classes={`file-dropzone-trigger-button ${classes ?? ''}`}
    {onclick}
    {...typeof testId === 'string' ? { testId } : {}}
  >
    {@render body()}
  </Button>
{:else}
  <div
    class="file-dropzone-trigger-surface file-dropzone-trigger-button {classes ?? ''}"
    data-pw={testId}
    testID={testId}
  >
    {@render body()}
  </div>
{/if}

<style>
  .file-dropzone-trigger-compact {
    display: flex;
    flex-direction: var(--file-dropzone-trigger-compact-flex-direction, row);
    align-items: var(--file-dropzone-trigger-compact-align-items, center);
    gap: var(--file-dropzone-trigger-compact-gap, 8px);
  }

  /* The non-interactive form of the trigger. It reproduces the primary, medium Button
     this component rendered before, hook for hook -- same `--button-*` tokens, same
     fallbacks -- so a consumer's `classes` override and the demo's look carry over to
     the one place the button is no longer rendered: inside a FileInput region, which
     is already the control. Button cannot do this itself: it always renders a native
     <button> (or <a>). Keep this in step with Button's `.button-el` rules. */
  .file-dropzone-trigger-surface {
    /* The primary variant fill, behind the same internal name Button uses, which is
       how it is recorded as dark in both themes rather than as a light default. */
    --_btn-color: #3a4550;

    position: relative;
    max-height: var(--button-max-height, none);
    max-width: var(--button-max-width, none);
    min-width: var(--button-min-width, auto);
    font-family: var(--button-font-family, inherit);
    font-weight: var(--button-font-weight, 500);
    font-size: var(--button-font-size, 14px);
    background-color: var(--button-color, var(--_btn-color));
    background-image: var(--button-background, none);
    color: var(--button-text-color, #ffffff);
    height: var(--button-height, fit-content);
    padding: var(--button-padding, 16px);
    margin: var(--button-margin, 0);
    border-radius: var(--button-border-radius, var(--radius, 6px));
    width: var(--button-width, fit-content);
    cursor: var(--cursor, pointer);
    opacity: var(--opacity, 1);
    border: var(--button-border, none);
    box-sizing: border-box;
    text-align: center;
    text-decoration: var(--button-text-decoration, none);
    line-height: var(--button-line-height, normal);
    display: flex;
    justify-content: var(--button-justify-content, center);
    align-items: center;
    flex-direction: var(--button-content-flex-direction, row);
    gap: var(--button-content-gap, 16px);
    visibility: var(--button-visibility, visible);
    box-shadow: var(--button-box-shadow, none);
    transition: var(--button-transition, none);
    white-space: var(--button-white-space, nowrap);
  }

  .file-dropzone-trigger-surface:hover {
    background: var(
      --button-hover-color,
      var(--button-background, var(--button-color, var(--_btn-color)))
    );
    color: var(--button-hover-text-color, var(--button-text-color, #ffffff));
    border: var(--button-hover-border, var(--button-border, none));
    transform: var(--button-hover-transform, none);
    box-shadow: var(--button-hover-box-shadow, var(--button-box-shadow, none));
  }

  .file-dropzone-trigger-surface:active {
    transform: var(--button-active-transform, none);
    background: var(
      --button-active-background,
      var(--button-background, var(--button-color, var(--_btn-color)))
    );
    box-shadow: var(--button-active-box-shadow, var(--button-box-shadow, none));
  }

  @media (prefers-reduced-motion: reduce) {
    .file-dropzone-trigger-surface {
      transition: none;
    }
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

    color: var(--file-dropzone-trigger-icon-color, inherit);
  }

  .file-dropzone-trigger-icon :global(.file-dropzone-trigger-icon-img) {
    --image-width: var(--file-dropzone-trigger-icon-size, 24px);
    --image-height: var(--file-dropzone-trigger-icon-size, 24px);

    /* Both sizes share one colour token deliberately: they are the same icon at two
       scales, and splitting them would invite the two to drift apart. */
    color: var(--file-dropzone-trigger-icon-color, inherit);
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
    color: var(--file-dropzone-trigger-caption-color, #f1f5f9);
    font-size: var(--file-dropzone-trigger-caption-font-size, 0.85em);
  }
</style>
