<script lang="ts">
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import FileDropzoneTrigger from '$lib/FileDropzoneTrigger/FileDropzoneTrigger.svelte';

  const uploadIcon =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2"><path d="M12 16V4M12 4l-5 5M12 4l5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );

  let acceptedFiles: File[] = $state([]);
  let compactFiles: File[] = $state([]);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>FileDropzoneTrigger</h1>
</div>

<h3>Non-compact, with caption (paired with FileInput)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput accept=".webp,.png,.jpg" onfiles={(files) => (acceptedFiles = files)}>
    {#snippet trigger({ openFilePicker })}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Update logo"
        caption=".webp"
        testId="update-logo"
        onclick={openFilePicker}
      />
    {/snippet}
  </FileInput>
  {#if acceptedFiles.length > 0}
    <p class="state-display">Accepted: {acceptedFiles.map((file) => file.name).join(', ')}</p>
  {/if}
</div>

<h3>Compact (inline/dense placement)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput accept="image/*" onfiles={(files) => (compactFiles = files)}>
    {#snippet trigger()}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Choose image"
        compact
        testId="jsonform-file-trigger-image"
      />
    {/snippet}
  </FileInput>
  {#if compactFiles.length > 0}
    <p class="state-display">Accepted: {compactFiles.map((file) => file.name).join(', ')}</p>
  {/if}
</div>

<h3>Muted caption (CSS variable recipe, no mutedCaption boolean)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput accept=".csv" onfiles={() => {}}>
    {#snippet trigger({ openFilePicker })}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Click to upload or drag and drop"
        caption="CSV (max. 10MB)"
        onclick={openFilePicker}
        classes="upload-trigger-muted"
      />
    {/snippet}
  </FileInput>
</div>

<style>
  :global(.upload-trigger-muted) {
    --file-dropzone-trigger-caption-color: #94a3b8;
  }
</style>
