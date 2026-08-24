<svelte:options
  customElement={{
    tag: 'sui-attachment-chip-row',
    shadow: 'open',
    props: {
      images: { type: 'Object' },
      files: { type: 'Object' },
      videos: { type: 'Object' },
      onRemoveImage: { type: 'Object' },
      onRemoveFile: { type: 'Object' },
      onRemoveVideo: { type: 'Object' },
      onOpenImage: { type: 'Object' },
      onOpenVideo: { type: 'Object' },
      onOpenFile: { type: 'Object' },
      imageTooltip: { type: 'Object' },
      videoTooltip: { type: 'Object' },
      removeIcon: { type: 'Object' },
      fileIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import AttachmentChipRow from '$lib/AttachmentChipRow/AttachmentChipRow.svelte';
  let props = $props();
</script>

<AttachmentChipRow {...props} />
