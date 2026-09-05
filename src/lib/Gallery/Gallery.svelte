<script lang="ts">
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { GalleryImage, GalleryProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import Img from '../Img/Img.svelte';
  import Button from '../Button/Button.svelte';
  import Icon from '../Icon/Icon.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';
  import chevronLeftSvg from '$lib/assets/chevron-left-lg.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right-lg.svg?raw';
  import editSvg from '$lib/assets/edit.svg?raw';
  import deleteSvg from '$lib/assets/delete.svg?raw';

  let {
    images,
    view = 'grid',
    open = $bindable(false),
    activeIndex = $bindable(0),
    enableLightbox = true,
    loop = false,
    showCounter = true,
    showCaption = true,
    previousIcon,
    nextIcon,
    closeIcon,
    editIcon,
    deleteIcon,
    itemFooter,
    testId,
    onImageClick: onImageClickProp,
    onimageclick,
    onEditClick: onEditClickProp,
    oneditclick,
    onDeleteClick: onDeleteClickProp,
    ondeleteclick,
    onOpen: onOpenProp,
    onopen,
    onDismiss: onDismissProp,
    onclose,
    onIndexChange: onIndexChangeProp,
    onchange,
    onkeydown,
    classes
  }: GalleryProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onImageClick = $derived(
    resolveDeprecatedProp('Gallery', 'onImageClick', 'onimageclick', onImageClickProp, onimageclick)
  );
  const onEditClick = $derived(
    resolveDeprecatedProp('Gallery', 'onEditClick', 'oneditclick', onEditClickProp, oneditclick)
  );
  const onDeleteClick = $derived(
    resolveDeprecatedProp(
      'Gallery',
      'onDeleteClick',
      'ondeleteclick',
      onDeleteClickProp,
      ondeleteclick
    )
  );
  const onOpen = $derived(resolveDeprecatedProp('Gallery', 'onOpen', 'onopen', onOpenProp, onopen));
  const onDismiss = $derived(
    resolveDeprecatedProp('Gallery', 'onDismiss', 'onclose', onDismissProp, onclose)
  );
  const onIndexChange = $derived(
    resolveDeprecatedProp('Gallery', 'onIndexChange', 'onchange', onIndexChangeProp, onchange)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onImageClick, onEditClick, onDeleteClick, onOpen, onDismiss, onIndexChange);
  });

  let lightboxDiv: HTMLDivElement | null = $state(null);
  let closeButtonWrap: HTMLDivElement | null = $state(null);
  let previousButtonWrap: HTMLDivElement | null = $state(null);
  let nextButtonWrap: HTMLDivElement | null = $state(null);
  let openerElement: HTMLElement | null = null;

  let activeImage = $derived(images.at(activeIndex));
  let hasPrevious = $derived(loop ? images.length > 1 : activeIndex > 0);
  let hasNext = $derived(loop ? images.length > 1 : activeIndex < images.length - 1);
  let itemsAreInteractive = $derived(enableLightbox || typeof onImageClick === 'function');
  let hasItemFooter = $derived(view === 'grid' && typeof itemFooter === 'function');
  let showEditButton = $derived(typeof onEditClick === 'function');
  let showDeleteButton = $derived(typeof onDeleteClick === 'function');
  let showItemActions = $derived(showEditButton || showDeleteButton);

  function lightboxAction(node: HTMLElement) {
    if (openerElement === null && document.activeElement instanceof HTMLElement) {
      openerElement = document.activeElement;
    }
    document.body.style.overflow = 'hidden';
    tick().then(() => {
      node.focus();
    });
    return {
      destroy() {
        document.body.style.overflow = '';
        if (openerElement !== null) {
          openerElement.focus();
          openerElement = null;
        }
      }
    };
  }

  function openLightbox(index: number, opener: EventTarget | null): void {
    if (opener instanceof HTMLElement) {
      openerElement = opener;
    }
    activeIndex = index;
    open = true;
    onOpen?.(index);
  }

  function closeLightbox(): void {
    open = false;
    onDismiss?.();
  }

  async function goToIndex(index: number): Promise<void> {
    if (index < 0 || index >= images.length) {
      return;
    }
    activeIndex = index;
    onIndexChange?.(activeIndex);
    await tick();
    if (lightboxDiv !== null && !lightboxDiv.contains(document.activeElement)) {
      lightboxDiv.focus();
    }
  }

  function showPrevious(): void {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    } else if (loop && images.length > 1) {
      goToIndex(images.length - 1);
    }
  }

  function showNext(): void {
    if (activeIndex < images.length - 1) {
      goToIndex(activeIndex + 1);
    } else if (loop && images.length > 1) {
      goToIndex(0);
    }
  }

  function handleImageClick(index: number, event: MouseEvent): void {
    onImageClick?.(index, event);
    if (enableLightbox) {
      openLightbox(index, event.currentTarget);
    }
  }

  function handleEditClick(index: number, event: MouseEvent): void {
    onEditClick?.(index, event);
  }

  function handleDeleteClick(index: number, event: MouseEvent): void {
    onDeleteClick?.(index, event);
  }

  function trapFocus(event: KeyboardEvent): void {
    const first = closeButtonWrap?.querySelector('button') ?? null;
    const last =
      (nextButtonWrap ?? previousButtonWrap ?? closeButtonWrap)?.querySelector('button') ?? null;
    if (first === null || last === null) {
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === lightboxDiv)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleLightboxKeydown(event: KeyboardEvent): void {
    onkeydown?.(event);
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToIndex(images.length - 1);
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === lightboxDiv) {
      closeLightbox();
    }
  }
</script>

{#snippet controlIcon(fallbackMarkup: string, custom?: Snippet)}
  {#if typeof custom === 'function'}
    {@render custom()}
  {:else}
    <Icon svg={fallbackMarkup} />
  {/if}
{/snippet}

{#snippet itemContent(image: GalleryImage, index: number)}
  {#if hasItemFooter}
    <span class="grid-image-wrap">
      <Img src={image.thumbnail ?? image.src} alt={image.alt} fallback={image.fallback} />
    </span>
    {#if typeof itemFooter === 'function'}
      {@render itemFooter(image, index)}
    {/if}
  {:else}
    <Img src={image.thumbnail ?? image.src} alt={image.alt} fallback={image.fallback} />
    {#if view === 'list'}
      <span class="list-text">
        <span class="list-title">{image.alt}</span>
        {#if typeof image.caption === 'string' && image.caption.length > 0}
          <span class="list-caption">{image.caption}</span>
        {/if}
      </span>
    {/if}
  {/if}
{/snippet}

<div
  class="gallery {view} {hasItemFooter ? 'has-item-footer' : ''} {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  role="list"
>
  {#each images as image, index (index)}
    <div class="gallery-item" role="listitem">
      {#if itemsAreInteractive}
        <button
          class="gallery-item-content"
          onclick={(event) => handleImageClick(index, event)}
          aria-label={enableLightbox
            ? `View image ${index + 1} of ${images.length}: ${image.alt}`
            : image.alt}
        >
          {@render itemContent(image, index)}
        </button>
      {:else}
        <div class="gallery-item-content">
          {@render itemContent(image, index)}
        </div>
      {/if}
      {#if showItemActions}
        <div class="gallery-item-actions">
          {#if showEditButton}
            <div class="gallery-item-action">
              <Button
                ariaLabel={`Edit image ${index + 1}: ${image.alt}`}
                onclick={(event) => handleEditClick(index, event)}
              >
                {@render controlIcon(editSvg, editIcon)}
              </Button>
            </div>
          {/if}
          {#if showDeleteButton}
            <div class="gallery-item-action">
              <Button
                ariaLabel={`Delete image ${index + 1}: ${image.alt}`}
                onclick={(event) => handleDeleteClick(index, event)}
              >
                {@render controlIcon(deleteSvg, deleteIcon)}
              </Button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

{#if open}
  <div
    class="lightbox {classes ?? ''}"
    role="dialog"
    aria-modal="true"
    aria-label={typeof activeImage === 'object' ? activeImage.alt : 'Image gallery'}
    tabindex="-1"
    bind:this={lightboxDiv}
    use:lightboxAction
    onclick={handleBackdropClick}
    onkeydown={handleLightboxKeydown}
    transition:fade={{ duration: 200 }}
  >
    <div class="lightbox-close" bind:this={closeButtonWrap}>
      <Button ariaLabel="Close gallery" onclick={closeLightbox}>
        {@render controlIcon(closeSvg, closeIcon)}
      </Button>
    </div>
    {#if hasPrevious}
      <div class="lightbox-previous" bind:this={previousButtonWrap}>
        <Button ariaLabel="Previous image" onclick={showPrevious}>
          {@render controlIcon(chevronLeftSvg, previousIcon)}
        </Button>
      </div>
    {/if}
    {#if typeof activeImage === 'object'}
      <figure class="lightbox-figure">
        <Img src={activeImage.src} alt={activeImage.alt} fallback={activeImage.fallback} />
        {#if showCaption && typeof activeImage.caption === 'string' && activeImage.caption.length > 0}
          <figcaption class="lightbox-caption">{activeImage.caption}</figcaption>
        {/if}
      </figure>
    {/if}
    {#if hasNext}
      <div class="lightbox-next" bind:this={nextButtonWrap}>
        <Button ariaLabel="Next image" onclick={showNext}>
          {@render controlIcon(chevronRightSvg, nextIcon)}
        </Button>
      </div>
    {/if}
    {#if showCounter && typeof activeImage === 'object'}
      <div class="lightbox-counter" aria-live="polite">
        {activeIndex + 1} / {images.length}
      </div>
    {/if}
  </div>
{/if}

<style>
  .gallery {
    width: var(--gallery-width, 100%);
    padding: var(--gallery-padding, 0px);
    margin: var(--gallery-margin, 0px);
    background: var(--gallery-background, transparent);
  }

  .gallery.grid {
    display: grid;
    grid-template-columns: var(
      --gallery-grid-template-columns,
      repeat(var(--gallery-columns, 3), 1fr)
    );
    gap: var(--gallery-gap, 8px);
  }

  .gallery.list {
    display: flex;
    flex-direction: column;
    gap: var(--gallery-gap, 8px);
  }

  .gallery-item {
    position: relative;
  }

  .grid .gallery-item {
    aspect-ratio: var(--gallery-item-aspect-ratio, 1);
    border-radius: var(--gallery-item-border-radius, 0px);
    overflow: hidden;
    --image-width: 100%;
    --image-height: 100%;
    --image-object-fit: var(--gallery-item-image-fit, cover);
    --image-border-radius: var(--gallery-item-border-radius, 0px);
    --image-transition: var(--gallery-item-image-transition);
  }

  .grid.has-item-footer .gallery-item {
    aspect-ratio: auto;
    overflow: visible;
    border-radius: 0px;
  }

  .list .gallery-item {
    display: flex;
    align-items: center;
    border-radius: var(--gallery-list-item-border-radius, 0px);
    background: var(--gallery-list-item-background, transparent);
    --image-width: var(--gallery-list-thumbnail-width, 56px);
    --image-height: var(--gallery-list-thumbnail-height, 56px);
    --image-object-fit: var(--gallery-list-thumbnail-fit, cover);
    --image-border-radius: var(--gallery-list-thumbnail-border-radius, 0px);
    --image-transition: var(--gallery-item-image-transition);
    --image-flex-shrink: 0;
  }

  .gallery-item-content {
    font: inherit;
    color: inherit;
    border: var(--gallery-item-border, none);
    background: transparent;
  }

  button.gallery-item-content {
    cursor: var(--gallery-item-cursor, pointer);
    transition: var(--gallery-item-transition);
  }

  .grid .gallery-item-content {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border-radius: var(--gallery-item-border-radius, 0px);
  }

  .grid.has-item-footer .gallery-item-content {
    display: flex;
    flex-direction: column;
    height: auto;
    border-radius: var(--gallery-item-border-radius, 0px);
    overflow: hidden;
  }

  .grid-image-wrap {
    display: block;
    aspect-ratio: var(--gallery-item-aspect-ratio, 1);
    overflow: hidden;
    --image-width: 100%;
    --image-height: 100%;
    --image-object-fit: var(--gallery-item-image-fit, cover);
    --image-border-radius: 0px;
    --image-transition: var(--gallery-item-image-transition);
  }

  .list .gallery-item-content {
    display: flex;
    align-items: center;
    text-align: left;
    flex: 1;
    min-width: 0;
    gap: var(--gallery-list-item-gap, 12px);
    padding: var(--gallery-list-item-padding, 8px);
  }

  .grid button.gallery-item-content:hover {
    opacity: var(--gallery-item-hover-opacity, 1);
    transform: var(--gallery-item-hover-transform);
  }

  .grid button.gallery-item-content:focus-visible {
    outline: var(--gallery-item-focus-outline, 2px solid currentColor);
    outline-offset: var(--gallery-item-focus-outline-offset, 2px);
  }

  .list button.gallery-item-content:focus-visible {
    outline: none;
  }

  .list .gallery-item:has(button.gallery-item-content):hover {
    background: var(--gallery-list-item-hover-background, transparent);
  }

  .list .gallery-item:has(button.gallery-item-content:focus-visible) {
    outline: var(--gallery-item-focus-outline, 2px solid currentColor);
    outline-offset: var(--gallery-item-focus-outline-offset, 2px);
  }

  .list-text {
    display: flex;
    flex-direction: column;
    gap: var(--gallery-list-text-gap, 2px);
    min-width: 0;
  }

  .list-title,
  .list-caption {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .list-title {
    color: var(--gallery-list-title-color, inherit);
    font-size: var(--gallery-list-title-font-size, 14px);
    font-weight: var(--gallery-list-title-font-weight, 500);
    font-family: var(--gallery-list-title-font-family);
  }

  .list-caption {
    color: var(--gallery-list-caption-color, inherit);
    font-size: var(--gallery-list-caption-font-size, 12px);
    font-family: var(--gallery-list-caption-font-family);
  }

  .gallery-item-actions {
    display: flex;
    align-items: center;
    gap: var(--gallery-item-actions-gap, 4px);
  }

  .grid .gallery-item-actions {
    position: absolute;
    top: var(--gallery-item-actions-top, 8px);
    right: var(--gallery-item-actions-right, 8px);
  }

  .list .gallery-item-actions {
    flex-shrink: 0;
    padding-right: var(--gallery-item-actions-right, 8px);
  }

  .gallery-item-action {
    border-radius: var(--gallery-item-action-border-radius, 8px);
    --button-color: transparent;
    --button-hover-color: transparent;
    --button-padding: var(--gallery-item-action-padding, 6px);
    --button-border-radius: var(--gallery-item-action-border-radius, 8px);
    --icon-container-padding: 0px;
    --icon-padding: 0px;
    --icon-width: var(--gallery-item-action-icon-size, 16px);
    --icon-height: var(--gallery-item-action-icon-size, 16px);
  }

  .grid .gallery-item-action {
    background: var(--gallery-item-action-background, #00000066);
    -webkit-backdrop-filter: var(--gallery-item-action-backdrop-filter, blur(8px));
    backdrop-filter: var(--gallery-item-action-backdrop-filter, blur(8px));
    --button-text-color: var(--gallery-item-action-color, #ffffff);
  }

  .grid .gallery-item-action:hover {
    background: var(--gallery-item-action-hover-background, #00000099);
  }

  .list .gallery-item-action {
    background: var(--gallery-item-action-background, transparent);
    --button-text-color: var(--gallery-item-action-color, currentColor);
  }

  .list .gallery-item-action:hover {
    background: var(--gallery-item-action-hover-background, #80808026);
  }

  .lightbox {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--gallery-lightbox-z-index, 15);
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--gallery-lightbox-background, #000000e6);
    -webkit-tap-highlight-color: transparent;
  }

  .lightbox:focus {
    outline: none;
  }

  .lightbox-figure {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gallery-lightbox-caption-gap, 12px);
    margin: 0;
    pointer-events: none;
    --image-width: var(--gallery-lightbox-image-width, 85vw);
    --image-height: var(--gallery-lightbox-image-height, 75vh);
    --image-object-fit: var(--gallery-lightbox-image-fit, contain);
    --image-border-radius: var(--gallery-lightbox-image-border-radius, 0px);
  }

  .lightbox-caption {
    color: var(--gallery-lightbox-caption-color, #ffffff);
    font-size: var(--gallery-lightbox-caption-font-size, 14px);
    font-family: var(--gallery-lightbox-caption-font-family);
    text-align: center;
    max-width: var(--gallery-lightbox-image-width, 85vw);
  }

  .lightbox-counter {
    position: absolute;
    bottom: var(--gallery-lightbox-counter-bottom, 16px);
    left: 50%;
    transform: translateX(-50%);
    color: var(--gallery-lightbox-counter-color, #ffffff);
    font-size: var(--gallery-lightbox-counter-font-size, 13px);
    font-family: var(--gallery-lightbox-counter-font-family);
  }

  .lightbox-close,
  .lightbox-previous,
  .lightbox-next {
    position: absolute;
    --button-color: var(--gallery-lightbox-control-background, transparent);
    --button-text-color: var(--gallery-lightbox-control-color, #ffffff);
    --button-hover-color: var(--gallery-lightbox-control-hover-background, #ffffff1f);
    --button-padding: var(--gallery-lightbox-control-padding, 8px);
    --button-border-radius: var(--gallery-lightbox-control-border-radius, 50%);
    --icon-container-padding: 0px;
    --icon-padding: 0px;
    --icon-width: var(--gallery-lightbox-control-icon-size, 24px);
    --icon-height: var(--gallery-lightbox-control-icon-size, 24px);
  }

  .lightbox-close {
    top: var(--gallery-lightbox-close-top, 16px);
    right: var(--gallery-lightbox-close-right, 16px);
  }

  .lightbox-previous,
  .lightbox-next {
    top: 50%;
    transform: translateY(-50%);
  }

  .lightbox-previous {
    left: var(--gallery-lightbox-nav-inset, 16px);
  }

  .lightbox-next {
    right: var(--gallery-lightbox-nav-inset, 16px);
  }
</style>
