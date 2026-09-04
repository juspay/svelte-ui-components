<svelte:options
  customElement={{
    tag: 'sui-file-input',
    shadow: 'open',
    props: {
      accept: { type: 'String', reflect: true },
      multiple: { type: 'Boolean', reflect: true },
      maxSizeBytes: { type: 'Number', attribute: 'max-size-bytes' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onfiles: { type: 'Object' },
      onerror: { type: 'Object' },
      trigger: { type: 'Object' },
      onFiles: { type: 'Object' },
      onError: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import FileInput from '$lib/FileInput/FileInput.svelte';
  let props = $props();
</script>

<FileInput {...props}>
  {#snippet trigger({ openFilePicker, dragOver, disabled })}
    <slot name="trigger">
      <button onclick={openFilePicker} {disabled} style="cursor: pointer;">
        {dragOver ? 'Drop files here' : 'Choose file'}
      </button>
    </slot>
  {/snippet}
</FileInput>
