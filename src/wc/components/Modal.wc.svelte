<svelte:options
  customElement={{
    tag: 'sui-modal',
    shadow: 'open',
    props: {
      size: { type: 'String', reflect: true },
      align: { type: 'String', reflect: true },
      showOverlay: { type: 'Boolean', reflect: true },
      supportHardwareBackPress: { type: 'Boolean' },
      enableTransition: { type: 'Boolean', reflect: true },
      transitionType: { type: 'String', reflect: true },
      header: { type: 'Object' },
      footer: { type: 'Object' },
      debounceTime: { type: 'Number' },
      leftImageTestId: { type: 'String' },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclose: { type: 'Object' },
      onheaderRightImageClick: { type: 'Object' },
      onheaderLeftImageClick: { type: 'Object' },
      onprimaryButtonClick: { type: 'Object' },
      onsecondaryButtonClick: { type: 'Object' },
      onoverlayClick: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  let props = $props();
</script>

<Modal {...props}>
  {#snippet content()}
    <slot></slot>
  {/snippet}
  {#snippet footerSnippet()}
    <slot name="footer"></slot>
  {/snippet}
</Modal>
