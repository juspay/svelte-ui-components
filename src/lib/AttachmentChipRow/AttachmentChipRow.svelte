<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import Scroller from '../Scroller/Scroller.svelte';
  import { tooltip } from '../Tooltip/tooltip-action';
  import type { AttachmentChipRowProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  /**
   * The pending-attachment strip above a chat composer: image thumbnails, video
   * poster tiles (with a play badge) and file tiles, each with a floating remove
   * button, scrolling horizontally when they overflow. Renders NOTHING while
   * there are no attachments.
   */
  let {
    images = [],
    files = [],
    videos = [],
    onRemoveImage: onRemoveImageProp,
    onremoveimage,
    onRemoveFile: onRemoveFileProp,
    onremovefile,
    onRemoveVideo: onRemoveVideoProp,
    onremovevideo,
    onOpenImage: onOpenImageProp,
    onopenimage,
    onOpenVideo: onOpenVideoProp,
    onopenvideo,
    onOpenFile: onOpenFileProp,
    onopenfile,
    imageTooltip,
    videoTooltip,
    removeIcon,
    fileIcon,
    testId,
    classes
  }: AttachmentChipRowProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onRemoveImage = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onRemoveImage',
      'onremoveimage',
      onRemoveImageProp,
      onremoveimage
    )
  );
  const onRemoveFile = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onRemoveFile',
      'onremovefile',
      onRemoveFileProp,
      onremovefile
    )
  );
  const onRemoveVideo = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onRemoveVideo',
      'onremovevideo',
      onRemoveVideoProp,
      onremovevideo
    )
  );
  const onOpenImage = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onOpenImage',
      'onopenimage',
      onOpenImageProp,
      onopenimage
    )
  );
  const onOpenVideo = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onOpenVideo',
      'onopenvideo',
      onOpenVideoProp,
      onopenvideo
    )
  );
  const onOpenFile = $derived(
    resolveDeprecatedProp(
      'AttachmentChipRow',
      'onOpenFile',
      'onopenfile',
      onOpenFileProp,
      onopenfile
    )
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(
      onRemoveImage,
      onRemoveFile,
      onRemoveVideo,
      onOpenImage,
      onOpenVideo,
      onOpenFile
    );
  });
</script>

{#if images.length > 0 || videos.length > 0 || files.length > 0}
  <Scroller
    direction="horizontal"
    showArrows={false}
    hideScrollbar={false}
    showGradient={false}
    classes={`attachment-chip-row ${classes ?? ''}`}
    {testId}
  >
    {#each images as image (image.id)}
      <div
        class="chip"
        data-pw={typeof testId === 'string' ? `${testId}-image-${image.id}` : null}
        testID={typeof testId === 'string' ? `${testId}-image-${image.id}` : null}
      >
        <svelte:element
          this={typeof onOpenImage === 'function' ? 'button' : 'div'}
          type={typeof onOpenImage === 'function' ? 'button' : null}
          role={typeof onOpenImage === 'function' ? 'button' : null}
          aria-label={typeof onOpenImage === 'function'
            ? `Open ${image.filename ?? 'image'}`
            : null}
          class="thumb"
          class:openable={typeof onOpenImage === 'function'}
          onclick={typeof onOpenImage === 'function' ? () => onOpenImage(image) : null}
          use:tooltip={{
            text: typeof imageTooltip === 'function' ? imageTooltip(image) : '',
            position: 'top'
          }}
        >
          <Img src={image.thumbnailData} alt={image.filename ?? 'Uploaded image'} fallback="" />
        </svelte:element>
        {#if typeof onRemoveImage === 'function'}
          <div class="remove-wrap">
            <Button
              variant="secondary"
              iconOnly={true}
              ariaLabel="Remove image"
              testId={testId && `${testId}-remove-image-${image.id}`}
              onclick={() => onRemoveImage(image.id)}
            >
              {#snippet icon()}
                {#if removeIcon}
                  {@render removeIcon()}
                {:else}
                  <svg class="cross" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4l8 8m0-8l-8 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                {/if}
              {/snippet}
            </Button>
          </div>
        {/if}
      </div>
    {/each}
    {#each videos as video (video.id)}
      <div
        class="chip"
        data-pw={typeof testId === 'string' ? `${testId}-video-${video.id}` : null}
        testID={typeof testId === 'string' ? `${testId}-video-${video.id}` : null}
      >
        <svelte:element
          this={typeof onOpenVideo === 'function' ? 'button' : 'div'}
          type={typeof onOpenVideo === 'function' ? 'button' : null}
          role={typeof onOpenVideo === 'function' ? 'button' : null}
          aria-label={typeof onOpenVideo === 'function'
            ? `Play ${video.filename ?? 'video'}`
            : null}
          class="thumb video-tile"
          class:openable={typeof onOpenVideo === 'function'}
          onclick={typeof onOpenVideo === 'function' ? () => onOpenVideo(video) : null}
          use:tooltip={{
            text: typeof videoTooltip === 'function' ? videoTooltip(video) : '',
            position: 'top'
          }}
        >
          {#if typeof video.thumbnailData === 'string' && video.thumbnailData.length > 0}
            <Img src={video.thumbnailData} alt={video.filename ?? 'Video attachment'} fallback="" />
          {/if}
          <span class="play-badge" aria-hidden="true">
            <svg class="play-glyph" viewBox="0 0 16 16" fill="none">
              <path d="M6 4.5v7l5.5-3.5z" fill="currentColor" />
            </svg>
          </span>
        </svelte:element>
        {#if typeof onRemoveVideo === 'function'}
          <div class="remove-wrap">
            <Button
              variant="secondary"
              iconOnly={true}
              ariaLabel="Remove video"
              testId={testId && `${testId}-remove-video-${video.id}`}
              onclick={() => onRemoveVideo(video.id)}
            >
              {#snippet icon()}
                {#if removeIcon}
                  {@render removeIcon()}
                {:else}
                  <svg class="cross" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4l8 8m0-8l-8 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                {/if}
              {/snippet}
            </Button>
          </div>
        {/if}
      </div>
    {/each}
    {#each files as file (file.id)}
      <div
        class="chip"
        data-pw={typeof testId === 'string' ? `${testId}-file-${file.id}` : null}
        testID={typeof testId === 'string' ? `${testId}-file-${file.id}` : null}
      >
        <svelte:element
          this={typeof onOpenFile === 'function' ? 'button' : 'div'}
          type={typeof onOpenFile === 'function' ? 'button' : null}
          role={typeof onOpenFile === 'function' ? 'button' : null}
          aria-label={typeof onOpenFile === 'function' ? `Open ${file.filename}` : null}
          class="thumb file-tile"
          class:openable={typeof onOpenFile === 'function'}
          onclick={typeof onOpenFile === 'function' ? () => onOpenFile(file) : null}
        >
          {#if fileIcon}
            {@render fileIcon()}
          {:else}
            <svg class="file-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                fill="currentColor"
              />
              <path
                d="M14 2v6h6"
                stroke="var(--attachment-chip-row-file-glyph-fold-color, #ffffff)"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
          <div class="file-info">
            <span class="file-name" use:tooltip={{ text: file.filename, position: 'top' }}>
              {file.filename}
            </span>
          </div>
        </svelte:element>
        {#if typeof onRemoveFile === 'function'}
          <div class="remove-wrap">
            <Button
              variant="secondary"
              iconOnly={true}
              ariaLabel="Remove file"
              testId={testId && `${testId}-remove-file-${file.id}`}
              onclick={() => onRemoveFile(file.id)}
            >
              {#snippet icon()}
                {#if removeIcon}
                  {@render removeIcon()}
                {:else}
                  <svg class="cross" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4l8 8m0-8l-8 8"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                {/if}
              {/snippet}
            </Button>
          </div>
        {/if}
      </div>
    {/each}
  </Scroller>
{/if}

<style>
  /* Keyed on a component-namespaced class passed to the Scroller root — the Scroller is
     this component's own root, so there is no scoped ancestor to hang the rule on. */
  :global(.attachment-chip-row) {
    --scroller-gap: var(--attachment-chip-row-gap, 0.5rem);
  }

  .chip {
    position: relative;
    flex-shrink: 0;

    /* Top/right padding is the room the floating remove button straddles into — it
       keeps the button inside the chip's own box, so a clipping ancestor (the
       Scroller viewport, a composer strip) can never cut it off. */
    padding-top: var(--attachment-chip-row-chip-padding-top, 0.25rem);
    padding-right: var(--attachment-chip-row-chip-padding-right, 0.25rem);
  }

  .thumb {
    display: block;
    width: var(--attachment-chip-row-chip-size, 4.5rem);
    height: var(--attachment-chip-row-chip-size, 4.5rem);
    padding: 0;
    border: 0;
    border-radius: var(--attachment-chip-row-chip-border-radius, 0.5rem);
    background-color: var(--attachment-chip-row-chip-background, #ffffff);
    overflow: hidden;
  }

  button.thumb {
    cursor: pointer;
    font: inherit;
    color: inherit;
    text-align: inherit;
  }

  .thumb :global(img) {
    width: var(--attachment-chip-row-thumb-img-width, 100%);
    height: var(--attachment-chip-row-thumb-img-height, 100%);
    object-fit: var(--attachment-chip-row-thumb-img-fit, cover);
  }

  .remove-wrap {
    position: absolute;
    top: var(--attachment-chip-row-remove-offset, 0);
    right: var(--attachment-chip-row-remove-offset, 0);
    --button-width: var(--attachment-chip-row-remove-size, 1.25rem);
    --button-height: var(--attachment-chip-row-remove-size, 1.25rem);
    --button-min-width: 0;
    --button-padding: 0;
    --button-border-radius: var(--attachment-chip-row-remove-border-radius, 999px);

    /* Self-contained colors, readable on both themes: a dark disc with a white
       glyph and a white ring — never inherited from the ambient --button-* scope,
       which flips with the host theme and can go dark-on-dark. */
    --button-color: var(--attachment-chip-row-remove-background, #18181b);
    --button-text-color: var(--attachment-chip-row-remove-color, #ffffff);
    --button-hover-color: var(--attachment-chip-row-remove-hover-background, #3f3f46);
    --button-border: var(--attachment-chip-row-remove-ring, 1.5px solid #ffffff);
    --button-hover-border: var(--attachment-chip-row-remove-ring, 1.5px solid #ffffff);
    --button-box-shadow: var(--attachment-chip-row-remove-box-shadow, 0 1px 3px rgb(0 0 0 / 30%));
  }

  .cross {
    width: var(--attachment-chip-row-remove-glyph-size, 0.625rem);
    height: var(--attachment-chip-row-remove-glyph-size, 0.625rem);
  }

  .video-tile {
    position: relative;
    background-color: var(--attachment-chip-row-video-tile-background, #18181b);
  }

  .play-badge {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .play-glyph {
    width: var(--attachment-chip-row-play-glyph-size, 1.25rem);
    height: var(--attachment-chip-row-play-glyph-size, 1.25rem);
    color: var(--attachment-chip-row-play-glyph-color, #ffffff);
    filter: var(--attachment-chip-row-play-glyph-shadow, drop-shadow(0 1px 2px rgb(0 0 0 / 45%)));
  }

  .file-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--attachment-chip-row-file-tile-gap, 0.25rem);
    padding: var(--attachment-chip-row-file-tile-padding, 0.25rem 2px);
    background-color: var(--attachment-chip-row-file-tile-background, #ededed);
    border: var(--attachment-chip-row-file-tile-border, 1px solid #e1e1e1);
    box-shadow: var(--attachment-chip-row-file-tile-box-shadow, 0 2px 0.25rem rgb(0 0 0 / 10%));
    box-sizing: border-box;
  }

  .file-glyph {
    width: var(--attachment-chip-row-file-glyph-size, 1.5rem);
    height: var(--attachment-chip-row-file-glyph-size, 1.5rem);
    color: var(--attachment-chip-row-file-glyph-color, #858585);
    flex-shrink: 0;
  }

  .file-info {
    width: 100%;
    text-align: center;
    min-width: 0;
  }

  .file-name {
    display: block;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    font-size: var(--attachment-chip-row-file-name-font-size, 0.75rem);
    font-weight: var(--attachment-chip-row-file-name-font-weight, 400);
    letter-spacing: var(--attachment-chip-row-file-name-letter-spacing, normal);
    line-height: var(--attachment-chip-row-file-name-line-height, 1.25rem);
    color: var(--attachment-chip-row-file-name-color, #52525b);
  }

  @media (width <= 767px) {
    .remove-wrap {
      --button-width: var(--attachment-chip-row-remove-size, 1.125rem);
      --button-height: var(--attachment-chip-row-remove-size, 1.125rem);
    }
  }
</style>
