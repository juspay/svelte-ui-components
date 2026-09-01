<script lang="ts">
  import MediaUpload from '$lib/MediaUpload/MediaUpload.svelte';

  let files: File[] = $state([]);
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>MediaUpload</h1>
</div>

<div class="demo-row">
  <MediaUpload
    bind:files
    label="Attachments"
    addText="Add files"
    hintText="Up to 3 images, 2MB each"
    accept="image/*"
    maxFileSize={2 * 1024 * 1024}
    maxLength={3}
    multiple
    testId="media-upload-demo"
  />
</div>

<h3>Themed</h3>
<div class="demo-row">
  <MediaUpload
    label="Themed attachments"
    addText="Add files"
    hintText="CSS variable overrides"
    maxLength={3}
    classes="media-upload-themed"
    testId="media-upload-themed-demo"
  />
</div>

<style>
  :global(.media-upload-themed) {
    --media-upload-label-color: rgb(20, 90, 200);
    --media-upload-item-border-radius: 2px;
    --media-upload-item-width: 90px;
    --media-upload-item-height: 90px;
    --media-upload-add-background-color: rgb(255, 244, 214);
    --media-upload-add-border: 1.5px dashed rgb(210, 140, 10);
  }
</style>
