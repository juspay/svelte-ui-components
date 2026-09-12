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
      ondismiss: { type: 'Object' },
      // ariaLabel and role themselves are HOST_RESERVED_PROPS (see
      // scripts/wc-parity) -- declaring them here would replace the custom
      // element's own ARIAMixin `role`/`ariaLabel` accessors, and worse, the
      // host they'd reflect onto is the shadow root's whole full-screen
      // wrapper, not the `.modal-content` panel that actually needs the
      // accessible name (that panel is nested two levels inside the shadow
      // tree -- see Modal.svelte). `role="alertdialog"` set directly on
      // `<sui-modal>` looks like it works (the attribute is right there) and
      // does not: it names the enclosing host, not the dialog panel assistive
      // tech is looking for. Same fix as Toggle.wc.svelte's `inputAriaLabel` --
      // a prefixed alias that reaches the inner element the reserved name
      // cannot.
      modalAriaLabel: { type: 'String', attribute: 'modal-aria-label' },
      modalRole: { type: 'String', attribute: 'modal-role' }
    }
  }}
/>

<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  import Button from '$lib/Button/Button.svelte';

  // Pulled out so they forward to the panel under Modal's own `ariaLabel`/`role`
  // names instead of the host-reserved ones. Unset by default, so a consumer
  // who sets neither sees today's unnamed, unroled panel unchanged.
  let { modalAriaLabel, modalRole, ...props } = $props();
</script>

<!-- Property-assigned snippets win; the slots are the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Modal {...props} ariaLabel={modalAriaLabel} role={modalRole}>
  {#snippet content()}
    {#if props.content}{@render props.content()}{:else}<slot></slot>{/if}
  {/snippet}
  {#snippet footerSnippet()}
    {#if props.footerSnippet}
      {@render props.footerSnippet()}
    {:else}
      <!-- Mirrors Modal.svelte's footerSnippet fallback: the primary/secondary
           button pair built from `footer.primaryButton`/`footer.secondaryButton`.
           The `.footer-content` wrapper is already supplied unconditionally by
           Modal.svelte's function branch, so only the inner buttons are reproduced
           here. -->
      <slot name="footer">
        {#if typeof props.footer?.primaryButton === 'object' || typeof props.footer?.secondaryButton === 'object'}
          <div class="footer-action-buttons">
            {#if props.footer.secondaryButton}
              <div class="footer-secondary-button">
                <Button {...props.footer.secondaryButton} onclick={props.onsecondarybuttonclick} />
              </div>
            {/if}
            {#if props.footer.primaryButton}
              <div class="footer-primary-button">
                <Button {...props.footer.primaryButton} onclick={props.onprimarybuttonclick} />
              </div>
            {/if}
          </div>
        {/if}
      </slot>
    {/if}
  {/snippet}
</Modal>
