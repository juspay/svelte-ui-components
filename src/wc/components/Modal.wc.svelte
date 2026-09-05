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
      overlayAriaLabel: { type: 'String', attribute: 'overlay-aria-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' },
      onkeydown: { type: 'Object' },
      overlayBackdropFilter: { type: 'String', attribute: 'overlay-backdrop-filter' },
      overlayFadeIn: { type: 'Boolean', attribute: 'overlay-fade-in' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' },
      content: { type: 'Object' },
      footerSnippet: { type: 'Object' },
      lockScroll: { type: 'Boolean', attribute: 'lock-scroll' },
      autoDismissAfter: { type: 'Number', attribute: 'auto-dismiss-after' },
      onheaderrightimageclick: { type: 'Object' },
      onheaderleftimageclick: { type: 'Object' },
      onprimarybuttonclick: { type: 'Object' },
      onsecondarybuttonclick: { type: 'Object' },
      onoverlayclick: { type: 'Object' },
      ondismiss: { type: 'Object' }
      // ariaLabel and role are declared on the Svelte component (#529) but not
      // here -- both are HOST_RESERVED_PROPS (see scripts/wc-parity), since
      // declaring them would replace the custom element's own ARIAMixin `role`/
      // `ariaLabel` accessors. A web-component consumer sets the native
      // attribute (role="alertdialog") on <sui-modal> directly instead.
    }
  }}
/>

<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  let props = $props();
</script>

<!-- Property-assigned snippets win; the slots are the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Modal {...props}>
  {#snippet content()}
    {#if props.content}{@render props.content()}{:else}<slot></slot>{/if}
  {/snippet}
  {#snippet footerSnippet()}
    {#if props.footerSnippet}{@render props.footerSnippet()}{:else}<slot name="footer"></slot>{/if}
  {/snippet}
</Modal>
