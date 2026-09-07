<svelte:options
  customElement={{
    tag: 'sui-sheet',
    shadow: 'open',
    props: {
      open: { type: 'Boolean', reflect: true },
      side: { type: 'String', reflect: true },
      sheetTitle: { type: 'String', reflect: true, attribute: 'title' },
      showOverlay: { type: 'Boolean', reflect: true, attribute: 'show-overlay' },
      overlayAriaLabel: { type: 'String', reflect: true, attribute: 'overlay-aria-label' },
      showCloseButton: { type: 'Boolean', reflect: true, attribute: 'show-close-button' },
      headingLevel: { type: 'Number', reflect: true, attribute: 'heading-level' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' },
      onafteropen: { type: 'Object' },
      onafterclose: { type: 'Object' },
      dismissOnOutsideClick: { type: 'Boolean', attribute: 'dismiss-on-outside-click' },
      content: { type: 'Object' },
      footer: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Sheet from '$lib/Sheet/Sheet.svelte';
  let { sheetTitle, ...props } = $props();
</script>

<Sheet {...props} title={sheetTitle}>
  {#snippet content()}
    <slot></slot>
  {/snippet}
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
</Sheet>
