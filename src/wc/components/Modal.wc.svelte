<svelte:options
  customElement={{
    tag: 'sui-modal',
    shadow: 'open',
    props: {
      size: { type: 'String', reflect: true },
      align: { type: 'String', reflect: true },
      showOverlay: { type: 'Boolean', reflect: true, attribute: 'show-overlay' },
      supportHardwareBackPress: { type: 'Boolean', attribute: 'support-hardware-back-press' },
      enableTransition: { type: 'Boolean', reflect: true, attribute: 'enable-transition' },
      transitionType: { type: 'String', reflect: true, attribute: 'transition-type' },
      entryAnimation: { type: 'String', reflect: true, attribute: 'entry-animation' },
      header: { type: 'Object' },
      footer: { type: 'Object' },
      debounceTime: { type: 'Number', attribute: 'debounce-time' },
      leftImageTestId: { type: 'String', attribute: 'left-image-test-id' },
      leftImageAriaLabel: { type: 'String', attribute: 'left-image-aria-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' },
      onheaderRightImageClick: { type: 'Object' },
      onheaderLeftImageClick: { type: 'Object' },
      onprimaryButtonClick: { type: 'Object' },
      onsecondaryButtonClick: { type: 'Object' },
      onoverlayClick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      overlayBackdropFilter: { type: 'String', attribute: 'overlay-backdrop-filter' },
      overlayFadeIn: { type: 'Boolean', attribute: 'overlay-fade-in' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' }
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
