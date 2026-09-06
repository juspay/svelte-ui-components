<svelte:options
  customElement={{
    tag: 'sui-file-dropzone-trigger',
    shadow: 'open',
    props: {
      icon: { type: 'String' },
      heading: { type: 'String' },
      caption: { type: 'String' },
      compact: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import FileDropzoneTrigger from '$lib/FileDropzoneTrigger/FileDropzoneTrigger.svelte';
  let props = $props();
</script>

<FileDropzoneTrigger {...props} />
