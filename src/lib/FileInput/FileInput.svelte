<script lang="ts">
  import type { FileInputProperties } from './properties';

  let {
    trigger,
    accept,
    multiple = false,
    maxSizeBytes,
    disabled = false,
    testId,
    classes,
    onfiles,
    onerror
  }: FileInputProperties = $props();

  let dragOver = $state(false);
  let inputEl: HTMLInputElement | null = $state(null);

  export const openFilePicker = (): void => {
    if (!disabled) {
      inputEl?.click();
    }
  };

  function isAccepted(file: File): boolean {
    if (typeof accept !== 'string' || accept.length === 0) {
      return true;
    }
    const tokens = accept.split(',').map((token) => token.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileMime = file.type.toLowerCase();

    return tokens.some((token) => {
      if (token.startsWith('.')) {
        return fileName.endsWith(token);
      }
      if (token.endsWith('/*')) {
        const baseType = token.slice(0, -2);
        return fileMime.startsWith(baseType + '/');
      }
      return fileMime === token;
    });
  }

  function processFiles(rawFiles: FileList | null): void {
    if (rawFiles === null || rawFiles.length === 0) {
      return;
    }

    const fileArray = Array.from(rawFiles);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of fileArray) {
      if (!isAccepted(file)) {
        rejected.push(`"${file.name}" has an unsupported type.`);
        continue;
      }
      if (typeof maxSizeBytes === 'number' && file.size > maxSizeBytes) {
        const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        rejected.push(`"${file.name}" exceeds the ${limitMb} MB limit.`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      onerror?.(rejected.join(' '));
    }
    if (accepted.length > 0) {
      onfiles?.(accepted);
    }
  }

  function handleInputChange(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    processFiles(target.files);
    target.value = '';
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!disabled) {
      dragOver = true;
    }
  }

  function handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    if (!disabled) {
      processFiles(event.dataTransfer?.files ?? null);
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }
</script>

<div
  class="file-input {classes ?? ''}"
  class:file-input-dragover={dragOver}
  class:file-input-disabled={disabled}
  data-pw={testId}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-disabled={disabled}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onkeydown={handleKeyDown}
>
  <input
    bind:this={inputEl}
    type="file"
    class="file-input-hidden"
    {accept}
    {multiple}
    {disabled}
    data-pw={typeof testId === 'string' ? `${testId}-input` : null}
    onchange={handleInputChange}
    tabindex="-1"
    aria-hidden="true"
  />

  {@render trigger({ openFilePicker, dragOver, disabled })}
</div>

<style>
  .file-input {
    display: var(--file-input-display, inline-flex);
    flex-direction: var(--file-input-flex-direction, column);
    align-items: var(--file-input-align-items, center);
    justify-content: var(--file-input-justify-content, center);
    padding: var(--file-input-padding);
    border: var(--file-input-border);
    border-radius: var(--file-input-radius);
    background: var(--file-input-background);
    gap: var(--file-input-gap);
    text-align: var(--file-input-text-align, center);
    transition: var(--file-input-transition);
    cursor: pointer;
  }

  .file-input:focus-visible {
    outline: var(--file-input-focus-outline);
    outline-offset: var(--file-input-focus-outline-offset);
  }

  .file-input-dragover {
    background: var(--file-input-dragover-background);
    border-color: var(--file-input-dragover-border-color);
  }

  .file-input-disabled {
    opacity: var(--file-input-disabled-opacity, 0.5);
    cursor: var(--file-input-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .file-input-hidden {
    display: none;
  }
</style>
