<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import Shimmer from '../Shimmer/Shimmer.svelte';
  import addSvg from '$lib/assets/add.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  import fileSvg from '$lib/assets/file.svg?raw';
  import type { MediaUploadItem, MediaUploadProperties, MediaUploadRejection } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    label,
    description,
    addText,
    hintText,
    maxLength = 3,
    accept = 'image/*',
    maxFileSize = 0,
    multiple = false,
    dragAndDrop = true,
    disabled = false,
    showCounter = true,
    showFileName = true,
    showFileSize = true,
    addIcon,
    removeIcon,
    fileIcon,
    errorMessages,
    files = $bindable([]),
    onFilesChange: onFilesChangeProp,
    onchange,
    onRemove: onRemoveProp,
    onremove,
    onRejected: onRejectedProp,
    onerror,
    testId,
    classes
  }: MediaUploadProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onFilesChange = $derived(
    resolveDeprecatedProp('MediaUpload', 'onFilesChange', 'onchange', onFilesChangeProp, onchange)
  );
  const onRemove = $derived(
    resolveDeprecatedProp('MediaUpload', 'onRemove', 'onremove', onRemoveProp, onremove)
  );
  const onRejected = $derived(
    resolveDeprecatedProp('MediaUpload', 'onRejected', 'onerror', onRejectedProp, onerror)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onFilesChange, onRemove, onRejected);
  });

  let items: MediaUploadItem[] = $state([]);
  let error: string = $state('');
  let dragging: boolean = $state(false);
  let inputId = $props.id();

  let atCapacity = $derived(items.length >= maxLength);
  let showDropTile = $derived(!atCapacity && !disabled);

  function syncFiles(): void {
    files = items.map((item) => item.file);
    onFilesChange?.(files);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units.at(unit) ?? ''}`;
  }

  function isAccepted(file: File): boolean {
    if (accept.length === 0 || accept === '*' || accept === '*/*') {
      return true;
    }
    const patterns = accept.split(',').map((pattern) => pattern.trim().toLowerCase());
    const name = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    return patterns.some((pattern) => {
      if (pattern.startsWith('.')) {
        return name.endsWith(pattern);
      }
      if (pattern.endsWith('/*')) {
        return mime.startsWith(pattern.slice(0, -1));
      }
      return mime === pattern;
    });
  }

  function appendItem(file: File): void {
    const isImage = file.type.startsWith('image/');
    const item: MediaUploadItem = {
      file,
      src: '',
      name: file.name,
      size: file.size,
      isImage
    };
    items = [...items, item];
    const updatedItem = items[items.length - 1];

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          updatedItem.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function buildError(rejections: MediaUploadRejection[]): string {
    const reason = rejections.at(0)?.reason;
    if (reason === 'type') {
      return errorMessages?.type ?? 'Some files were skipped — unsupported file type.';
    }
    if (reason === 'size') {
      const limit = maxFileSize > 0 ? ` (max ${formatSize(maxFileSize)})` : '';
      return errorMessages?.size ?? `Some files were too large${limit}.`;
    }
    return errorMessages?.max ?? `You can attach up to ${maxLength} files.`;
  }

  function addFiles(selected: File[]): void {
    if (disabled) {
      return;
    }
    const rejections: MediaUploadRejection[] = [];

    for (const file of selected) {
      if (items.length >= maxLength) {
        rejections.push({ file, reason: 'max' });
        continue;
      }
      if (!isAccepted(file)) {
        rejections.push({ file, reason: 'type' });
        continue;
      }
      if (maxFileSize > 0 && file.size > maxFileSize) {
        rejections.push({ file, reason: 'size' });
        continue;
      }
      appendItem(file);
    }

    error = rejections.length > 0 ? buildError(rejections) : '';
    if (rejections.length > 0) {
      onRejected?.(rejections);
    }
    syncFiles();
  }

  function handleInputChange(event: Event & { currentTarget: HTMLInputElement }): void {
    const target = event.currentTarget;
    addFiles(Array.from(target.files ?? []));
    target.value = '';
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragging = false;
    if (disabled || !dragAndDrop) {
      return;
    }
    addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  function handleDragOver(event: DragEvent): void {
    if (disabled || !dragAndDrop) {
      return;
    }
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave(): void {
    dragging = false;
  }

  function removeImage(index: number): void {
    const removed = items.at(index);
    items = items.filter((_, position) => position !== index);
    error = '';
    syncFiles();
    if (typeof removed === 'object') {
      onRemove?.(removed.file);
    }
  }
</script>

<div
  class="media-upload {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if (typeof label === 'string' && label.length > 0) || showCounter}
    <div class="header">
      {#if typeof label === 'string' && label.length > 0}
        <div class="label">{label}</div>
      {/if}
      {#if showCounter}
        <div class="counter">{items.length} / {maxLength}</div>
      {/if}
    </div>
  {/if}
  {#if typeof description === 'string' && description.length > 0}
    <div class="description">{description}</div>
  {/if}

  <div class="grid">
    {#each items as item, index (item.file.name + index)}
      <div class="card" class:is-file={!item.isImage}>
        {#if item.isImage}
          {#if item.src.length > 0}
            <span class="thumb">
              <Img src={item.src} alt={item.name} />
            </span>
          {:else}
            <span class="thumb-loading">
              <Shimmer />
            </span>
          {/if}
        {:else}
          <div class="file-icon">
            {#if typeof fileIcon === 'function'}
              {@render fileIcon()}
            {:else}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html fileSvg}
            {/if}
          </div>
        {/if}

        {#if (showFileName || showFileSize) && (showFileName || item.size > 0)}
          <div class="meta">
            {#if showFileName}
              <span class="meta-name">{item.name}</span>
            {/if}
            {#if showFileSize && item.size > 0}
              <span class="meta-size">{formatSize(item.size)}</span>
            {/if}
          </div>
        {/if}

        {#if !disabled}
          <div class="remove">
            <Button onclick={() => removeImage(index)} ariaLabel="Remove {item.name}">
              {#if typeof removeIcon === 'function'}
                {@render removeIcon()}
              {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html closeSvg}
              {/if}
            </Button>
          </div>
        {/if}
      </div>
    {/each}

    {#if showDropTile}
      <label
        for={inputId}
        class="drop-tile"
        class:dragging
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
      >
        <span class="drop-icon">
          {#if typeof addIcon === 'function'}
            {@render addIcon()}
          {:else}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html addSvg}
          {/if}
        </span>
        {#if typeof addText === 'string' && addText.length > 0}
          <span class="drop-text">{addText}</span>
        {/if}
        {#if typeof hintText === 'string' && hintText.length > 0}
          <span class="drop-hint">{hintText}</span>
        {/if}
        <input
          id={inputId}
          type="file"
          {accept}
          {multiple}
          {disabled}
          class="file-input"
          onchange={handleInputChange}
          hidden
        />
      </label>
    {/if}
  </div>

  {#if error.length > 0}
    <div class="error" role="alert">{error}</div>
  {/if}
</div>

<style>
  .media-upload {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: var(--media-upload-width, fit-content);
    font-family: var(--media-upload-font-family, inherit);
    color: var(--media-upload-color, inherit);
  }

  .media-upload.disabled {
    opacity: var(--media-upload-disabled-opacity, 0.55);
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--media-upload-header-gap, 12px);
    margin: var(--media-upload-label-margin, 0 0 4px 0);
  }

  .label {
    font-size: var(--media-upload-label-font-size, 14px);
    font-weight: var(--media-upload-label-font-weight, 600);
    color: var(--media-upload-label-color, #242833);
  }

  .counter {
    font-size: var(--media-upload-counter-font-size, 12px);
    font-weight: var(--media-upload-counter-font-weight, 500);
    color: var(--media-upload-counter-color, #8a8f98);
    font-variant-numeric: tabular-nums;
  }

  .description {
    font-size: var(--media-upload-description-font-size, 12px);
    color: var(--media-upload-description-color, #656565);
    margin: var(--media-upload-description-margin, 0);
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: var(--media-upload-gap, 12px);
    margin: var(--media-upload-content-margin, 12px 0 0 0);
  }

  .card,
  .drop-tile {
    box-sizing: border-box;
    height: var(--media-upload-item-height, 110px);
    width: var(--media-upload-item-width, 110px);
    border-radius: var(--media-upload-item-border-radius, 14px);
  }

  .card {
    position: relative;
    overflow: hidden;
    border: var(--media-upload-item-border, 1px solid #e4e4e7);
    background-color: var(--media-upload-item-background-color, #fafafa);
    box-shadow: var(--media-upload-item-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.06));
    transition: var(--media-upload-item-transition, box-shadow 0.2s ease, transform 0.2s ease);
  }

  .card:hover {
    box-shadow: var(--media-upload-item-hover-box-shadow, 0 6px 18px rgba(0, 0, 0, 0.14));
    transform: var(--media-upload-item-hover-transform, translateY(-2px));
  }

  .thumb {
    display: contents;
    --image-width: 100%;
    --image-height: 100%;
    --image-object-fit: var(--media-upload-item-object-fit, cover);
    --image-border-radius: 0px;
    --image-padding: 0px;
    --image-margin: 0px;
  }

  .thumb-loading {
    display: contents;
    --shimmer-width: 100%;
    --shimmer-height: 100%;
    --shimmer-border-radius: 0px;
  }

  .file-icon {
    display: flex;
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    color: var(--media-upload-file-icon-color, #8a8f98);
  }

  .file-icon :global(svg),
  .file-icon :global(img) {
    height: var(--media-upload-file-icon-size, 36px);
    width: var(--media-upload-file-icon-size, 36px);
    object-fit: contain;
  }

  .meta {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
    padding: var(--media-upload-meta-padding, 6px 8px);
    background: var(
      --media-upload-meta-background,
      linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0))
    );
    color: var(--media-upload-meta-color, #ffffff);
  }

  .is-file .meta {
    background: var(--media-upload-file-meta-background, transparent);
    color: var(--media-upload-file-meta-color, #52525b);
  }

  .meta-name {
    font-size: var(--media-upload-meta-name-font-size, 11px);
    font-weight: var(--media-upload-meta-name-font-weight, 500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-size {
    font-size: var(--media-upload-meta-size-font-size, 10px);
    opacity: var(--media-upload-meta-size-opacity, 0.85);
    font-variant-numeric: tabular-nums;
  }

  .remove {
    position: absolute;
    top: var(--media-upload-remove-inset, 6px);
    right: var(--media-upload-remove-inset, 6px);
    opacity: var(--media-upload-remove-opacity, 0);
    transition: var(--media-upload-remove-transition, opacity 0.18s ease);
    --button-width: var(--media-upload-remove-size, 24px);
    --button-height: var(--media-upload-remove-size, 24px);
    --button-padding: var(--media-upload-remove-padding, 4px);
    --button-border: var(--media-upload-remove-border, none);
    --button-border-radius: var(--media-upload-remove-border-radius, 50%);
    --button-color: var(--media-upload-remove-background-color, rgba(0, 0, 0, 0.55));
    --button-text-color: var(--media-upload-remove-color, #ffffff);
    --button-content-gap: 0px;
    --button-hover-color: var(--media-upload-remove-hover-background-color, rgba(0, 0, 0, 0.78));
    --button-hover-text-color: var(
      --media-upload-remove-hover-color,
      var(--media-upload-remove-color, #ffffff)
    );
  }

  .card:hover .remove,
  .remove:focus-within {
    opacity: 1;
  }

  .remove :global(svg),
  .remove :global(img) {
    height: var(--media-upload-remove-icon-size, 100%);
    width: var(--media-upload-remove-icon-size, 100%);
    object-fit: contain;
  }

  .drop-tile {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--media-upload-add-gap, 6px);
    box-sizing: border-box;
    padding: var(--media-upload-add-padding, 12px);
    text-align: center;
    background-color: var(--media-upload-add-background-color, #fafafa);
    border: var(--media-upload-add-border, 1.5px dashed #c8ccd2);
    color: var(--media-upload-add-color, #6b7280);
    cursor: pointer;
    transition: var(
      --media-upload-add-transition,
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease
    );
  }

  .drop-tile:hover {
    background-color: var(--media-upload-add-hover-background-color, #f1f5ff);
    border: var(--media-upload-add-hover-border, 1.5px dashed #6d8eff);
    color: var(--media-upload-add-hover-color, #3b5bdb);
  }

  .drop-tile.dragging {
    background-color: var(--media-upload-add-dragging-background-color, #e7efff);
    border: var(--media-upload-add-dragging-border, 1.5px solid #3b5bdb);
    color: var(--media-upload-add-dragging-color, #3b5bdb);
  }

  .drop-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .drop-icon :global(svg),
  .drop-icon :global(img) {
    height: var(--media-upload-add-icon-size, 22px);
    width: var(--media-upload-add-icon-size, 22px);
    object-fit: contain;
  }

  .drop-text {
    font-size: var(--media-upload-add-text-font-size, 11px);
    line-height: var(--media-upload-add-text-line-height, 1.3);
  }

  .drop-hint {
    font-size: var(--media-upload-add-hint-font-size, 10px);
    color: var(--media-upload-add-hint-color, #9aa0a8);
  }

  .error {
    font-size: var(--media-upload-error-font-size, 12px);
    color: var(--media-upload-error-color, #e0334b);
    margin: var(--media-upload-error-margin, 8px 0 0 0);
  }
</style>
