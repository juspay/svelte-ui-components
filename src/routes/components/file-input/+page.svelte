<script lang="ts">
  import FileInput from '$lib/FileInput/FileInput.svelte';

  let acceptedFiles: File[] = $state([]);
  let errorMessage: string = $state('');
  let multiFiles: File[] = $state([]);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>FileInput</h1>
</div>

<h3>Basic drop zone</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    testId="file-input-basic"
    onfiles={(files) => {
      acceptedFiles = files;
      errorMessage = '';
    }}
    onerror={(msg) => {
      errorMessage = msg;
      acceptedFiles = [];
    }}
  >
    {#snippet trigger({ openFilePicker, dragOver })}
      <button
        class="toggle-btn"
        onclick={openFilePicker}
        style="border-style: dashed; padding: 24px 48px;"
      >
        {dragOver ? 'Drop files here' : 'Click or drag a file here'}
      </button>
    {/snippet}
  </FileInput>
  {#if acceptedFiles.length > 0}
    <p class="state-display">Accepted: {acceptedFiles.map((file) => file.name).join(', ')}</p>
  {/if}
  {#if errorMessage}
    <p class="state-display" style="color: #ef4444;">{errorMessage}</p>
  {/if}
</div>

<h3>Accept images only + size limit (1 MB)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    accept="image/*"
    maxSizeBytes={1048576}
    testId="file-input-images"
    onerror={(msg) => (errorMessage = msg)}
    onfiles={(files) => (acceptedFiles = files)}
  >
    {#snippet trigger({ openFilePicker })}
      <button class="toggle-btn" onclick={openFilePicker}>Upload image (max 1 MB)</button>
    {/snippet}
  </FileInput>
</div>

<h3>Multiple files</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput multiple testId="file-input-multi" onfiles={(files) => (multiFiles = files)}>
    {#snippet trigger({ openFilePicker, dragOver })}
      <button
        class="toggle-btn"
        onclick={openFilePicker}
        style="border-style: dashed; padding: 24px 48px;"
      >
        {dragOver ? 'Drop files here' : 'Select multiple files'}
      </button>
    {/snippet}
  </FileInput>
  {#if multiFiles.length > 0}
    <p class="state-display">
      {multiFiles.length} file(s): {multiFiles.map((file) => file.name).join(', ')}
    </p>
  {/if}
</div>

<h3>Card trigger (click-to-open via the wrapper — no inner button)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput testId="file-input-card" onfiles={(files) => (acceptedFiles = files)}>
    {#snippet trigger({ dragOver })}
      <div
        class="card-trigger"
        style="border: 1px dashed #cccccc; border-radius: 8px; padding: 24px 48px;"
      >
        {dragOver ? 'Drop files here' : 'A plain card — click anywhere to open'}
      </div>
    {/snippet}
  </FileInput>
</div>

<h3>Disabled</h3>
<div class="demo-row">
  <FileInput disabled testId="file-input-disabled">
    {#snippet trigger({ disabled: isDisabled })}
      <button class="toggle-btn" disabled={isDisabled} style="opacity: 0.5; cursor: not-allowed;">
        File upload disabled
      </button>
    {/snippet}
  </FileInput>
</div>

<h2>Validity messaging</h2>
<p>
  <code>errorMessage</code> and <code>infoMessage</code> are referenced by
  <code>aria-describedby</code> on the drop zone. It deliberately does not set
  <code>aria-invalid</code> — ARIA does not define that attribute on <code>role="button"</code> — so
  the error text itself, through <code>role="alert"</code>, is the announcement.
</p>
<div
  class="demo-row"
  data-pw="fileinput-field-contract"
  style="flex-direction: column; align-items: flex-start; gap: 12px;"
>
  <FileInput errorMessage="Only images under 1 MB are accepted." testId="fileinput-described">
    {#snippet trigger({ openFilePicker })}
      <button class="toggle-btn" onclick={openFilePicker}>Upload (described)</button>
    {/snippet}
  </FileInput>
  <FileInput infoMessage="PNG or JPG, up to 5 MB." testId="fileinput-info-only">
    {#snippet trigger({ openFilePicker })}
      <button class="toggle-btn" onclick={openFilePicker}>Upload (info only)</button>
    {/snippet}
  </FileInput>
  <FileInput testId="fileinput-undescribed">
    {#snippet trigger({ openFilePicker })}
      <button class="toggle-btn" onclick={openFilePicker}>Upload (no messages)</button>
    {/snippet}
  </FileInput>
</div>
