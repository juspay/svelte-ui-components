<script lang="ts">
  import FileInput from '../FileInput/FileInput.svelte';
  import type { NativeFileInputProperties } from './properties';

  let {
    element = $bindable<HTMLInputElement | null>(),
    onfileerror,
    name,
    required,
    nativeAttrs,
    accept,
    multiple,
    maxSizeBytes,
    disabled,
    testId,
    classes,
    errorMessage,
    infoMessage,
    invalid,
    onfiles,
    ...props
  }: NativeFileInputProperties = $props();
  let control = $state<{ openFilePicker: () => void }>();

  export function openFilePicker(): void {
    control?.openFilePicker();
  }
</script>

{#snippet emptyTrigger()}{/snippet}

<FileInput
  {...props}
  native
  {name}
  {required}
  {nativeAttrs}
  {accept}
  {multiple}
  {maxSizeBytes}
  {disabled}
  {testId}
  {classes}
  {errorMessage}
  {infoMessage}
  {invalid}
  {onfiles}
  onerror={onfileerror}
  trigger={emptyTrigger}
  bind:element
  bind:this={control}
/>
