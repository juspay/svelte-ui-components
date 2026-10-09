<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import { createUploadFeedback } from '../_upload-feedback.svelte';

  const basic = createUploadFeedback();
  const images = createUploadFeedback();
  const multi = createUploadFeedback();
  const card = createUploadFeedback();
  const owned = createUploadFeedback();
</script>

{#snippet result(testId: string, files: readonly File[], summary: 'names' | 'count')}
  <!-- Always rendered, so the live region exists before it has anything to say. -->
  <div role="status" data-pw={testId}>
    {#if files.length > 0}
      <p class="state-display">
        {#if summary === 'count'}
          {files.length} file(s): {files.map((file) => file.name).join(', ')}
        {:else}
          Accepted: {files.map((file) => file.name).join(', ')}
        {/if}
      </p>
    {/if}
  </div>
{/snippet}

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>FileInput</h1>
</div>

<h2 class="demo-examples-heading">Examples</h2>

<p>
  The drop region is the single control for each upload action: one Tab stop, announced as a button
  named by its content, opening the chooser on a click, Enter or Space. Its content is therefore
  plain content, never a nested button. Each example below reports its own result directly under
  itself.
</p>

<h3>Basic drop zone</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput testId="file-input-basic" onfiles={basic.onfiles}>
    {#snippet trigger({ dragOver })}
      <span class="toggle-btn" style="border-style: dashed; padding: 24px 48px;">
        {dragOver ? 'Drop files here' : 'Click or drag a file here'}
      </span>
    {/snippet}
  </FileInput>
  {@render result('file-input-basic-result', basic.files, 'names')}
</div>

<h3>Accept images only + size limit (1 MB)</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput
    accept="image/*"
    maxSizeBytes={1048576}
    testId="file-input-images"
    errorMessage={images.error}
    onerror={images.onerror}
    onfiles={images.onfiles}
  >
    {#snippet trigger()}
      <span class="toggle-btn">Upload image (max 1 MB)</span>
    {/snippet}
  </FileInput>
  {@render result('file-input-images-result', images.files, 'names')}
</div>

<h3>Multiple files</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput multiple testId="file-input-multi" onfiles={multi.onfiles}>
    {#snippet trigger({ dragOver })}
      <span class="toggle-btn" style="border-style: dashed; padding: 24px 48px;">
        {dragOver ? 'Drop files here' : 'Select multiple files'}
      </span>
    {/snippet}
  </FileInput>
  {@render result('file-input-multi-result', multi.files, 'count')}
</div>

<h3>Card trigger</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput testId="file-input-card" onfiles={card.onfiles}>
    {#snippet trigger({ dragOver })}
      <div
        class="card-trigger"
        style="border: 1px dashed #cccccc; border-radius: 8px; padding: 24px 48px;"
      >
        {dragOver ? 'Drop files here' : 'A plain card — click anywhere to open'}
      </div>
    {/snippet}
  </FileInput>
  {@render result('file-input-card-result', card.files, 'names')}
</div>

<h3>Your own control (activation="trigger")</h3>
<p>
  When the control inside should be the one interactive element — a <code>Button</code> with its own
  states — <code>activation="trigger"</code> hands the action to it. The region keeps accepting drops
  but is no longer a second control.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <FileInput activation="trigger" testId="file-input-owned" onfiles={owned.onfiles}>
    {#snippet trigger({ openFilePicker, disabled })}
      <Button text="Choose file" variant="secondary" {disabled} onclick={openFilePicker} />
    {/snippet}
  </FileInput>
  {@render result('file-input-owned-result', owned.files, 'names')}
</div>

<h3>Disabled</h3>
<div class="demo-row">
  <FileInput disabled testId="file-input-disabled">
    {#snippet trigger()}
      <span class="toggle-btn" style="opacity: 0.5; cursor: not-allowed;">File upload disabled</span
      >
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
    {#snippet trigger()}
      <span class="toggle-btn">Upload (described)</span>
    {/snippet}
  </FileInput>
  <FileInput infoMessage="PNG or JPG, up to 5 MB." testId="fileinput-info-only">
    {#snippet trigger()}
      <span class="toggle-btn">Upload (info only)</span>
    {/snippet}
  </FileInput>
  <FileInput testId="fileinput-undescribed">
    {#snippet trigger()}
      <span class="toggle-btn">Upload (no messages)</span>
    {/snippet}
  </FileInput>
</div>
