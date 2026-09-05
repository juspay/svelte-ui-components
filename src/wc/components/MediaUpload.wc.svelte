<svelte:options
  customElement={{
    tag: 'sui-media-upload',
    shadow: 'open',
    props: {
      label: { type: 'String' },
      description: { type: 'String' },
      addText: { type: 'String', attribute: 'add-text' },
      hintText: { type: 'String', attribute: 'hint-text' },
      maxLength: { type: 'Number', attribute: 'max-length' },
      accept: { type: 'String' },
      maxFileSize: { type: 'Number', attribute: 'max-file-size' },
      multiple: { type: 'Boolean' },
      dragAndDrop: { type: 'Boolean', attribute: 'drag-and-drop' },
      disabled: { type: 'Boolean', reflect: true },
      showCounter: { type: 'Boolean', attribute: 'show-counter' },
      showFileName: { type: 'Boolean', attribute: 'show-file-name' },
      showFileSize: { type: 'Boolean', attribute: 'show-file-size' },
      addIcon: { type: 'Object' },
      removeIcon: { type: 'Object' },
      fileIcon: { type: 'Object' },
      errorMessages: { type: 'Object' },
      files: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onFilesChange: { type: 'Object' },
      onRemove: { type: 'Object' },
      onRejected: { type: 'Object' },
      onchange: { type: 'Object' },
      onremove: { type: 'Object' },
      onerror: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import MediaUpload from '$lib/MediaUpload/MediaUpload.svelte';
  let props = $props();
</script>

<MediaUpload {...props} />
