<svelte:options
  customElement={{
    tag: 'sui-resizable',
    shadow: 'open',
    props: {
      width: { type: 'Number', reflect: true },
      height: { type: 'Number', reflect: true },
      minWidth: { type: 'Number', attribute: 'min-width' },
      maxWidth: { type: 'Number', attribute: 'max-width' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      handles: { type: 'Object' },
      step: { type: 'Number' },
      disabled: { type: 'Boolean', reflect: true },
      handleLabel: { type: 'String', attribute: 'handle-label' },
      children: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onresize: { type: 'Object' },
      onresizestart: { type: 'Object' },
      onresizeend: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Resizable from '$lib/Resizable/Resizable.svelte';
  let props = $props();
</script>

<Resizable {...props} />
