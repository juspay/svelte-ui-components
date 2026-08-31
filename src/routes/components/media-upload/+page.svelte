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
