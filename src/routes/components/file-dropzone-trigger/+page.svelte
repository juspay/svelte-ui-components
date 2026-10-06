<script lang="ts">
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import FileDropzoneTrigger from '$lib/FileDropzoneTrigger/FileDropzoneTrigger.svelte';
  import { createUploadFeedback } from '../_upload-feedback.svelte';

  const uploadIcon =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 16V4M12 4l-5 5M12 4l5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );

  const logo = createUploadFeedback();
  const compact = createUploadFeedback();
  const muted = createUploadFeedback();
  const owned = createUploadFeedback();
</script>

{#snippet result(testId: string, files: readonly File[])}
  <!-- Always rendered, so the live region exists before it has anything to say. -->
  <div role="status" data-pw={testId}>
    {#if files.length > 0}
      <p class="state-display">Accepted: {files.map((file) => file.name).join(', ')}</p>
    {/if}
  </div>
{/snippet}

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>FileDropzoneTrigger</h1>
</div>

<p>
  Inside a <code>FileInput</code> the drop region is the single control (one Tab stop; click, Enter or
  Space opens the chooser), so the trigger is plain content there — the same button-styled surface with
  no button inside it. Each example reports its own result under itself.
</p>

<h3>Non-compact, with caption (paired with FileInput)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    accept=".webp,.png,.jpg"
    errorMessage={logo.error}
    onfiles={logo.onfiles}
    onerror={logo.onerror}
  >
    {#snippet trigger()}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Update logo"
        caption=".webp"
        testId="update-logo"
      />
    {/snippet}
  </FileInput>
  {@render result('file-dropzone-trigger-accepted', logo.files)}
</div>

<h3>Compact (inline/dense placement)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    accept="image/*"
    errorMessage={compact.error}
    onfiles={compact.onfiles}
    onerror={compact.onerror}
  >
    {#snippet trigger()}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Choose image"
        compact
        testId="jsonform-file-trigger-image"
      />
    {/snippet}
  </FileInput>
  {@render result('file-dropzone-trigger-compact-accepted', compact.files)}
</div>

<h3>Muted caption (CSS variable recipe, no mutedCaption boolean)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    accept=".csv"
    errorMessage={muted.error}
    onfiles={muted.onfiles}
    onerror={muted.onerror}
  >
    {#snippet trigger()}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Click to upload or drag and drop"
        caption="CSV (max. 10MB)"
        classes="upload-trigger-muted"
      />
    {/snippet}
  </FileInput>
  {@render result('file-dropzone-trigger-muted-accepted', muted.files)}
</div>

<h3>The trigger owns the action (activation="trigger" + onclick)</h3>
<p>
  Handing the action to the trigger makes it a real button and the region a passive drop target —
  still exactly one control.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    activation="trigger"
    accept=".csv"
    errorMessage={owned.error}
    onfiles={owned.onfiles}
    onerror={owned.onerror}
  >
    {#snippet trigger({ openFilePicker })}
      <FileDropzoneTrigger
        icon={uploadIcon}
        heading="Choose a CSV"
        caption="CSV (max. 10MB)"
        testId="owned-trigger"
        onclick={openFilePicker}
      />
    {/snippet}
  </FileInput>
  {@render result('file-dropzone-trigger-owned-accepted', owned.files)}
</div>

<style>
  :global(.upload-trigger-muted) {
    --file-dropzone-trigger-caption-color: #cbd5e1;
  }
</style>
