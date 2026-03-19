<svelte:options
  customElement={{
    tag: 'sui-sheet',
    shadow: 'open',
    props: {
      open: { type: 'Boolean', reflect: true },
      side: { type: 'String', reflect: true },
      title: { type: 'String', reflect: true },
      showOverlay: { type: 'Boolean', reflect: true },
      showCloseButton: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Sheet from '$lib/Sheet/Sheet.svelte';
  let props = $props();
</script>

<Sheet {...props}>
  {#snippet content()}
    <slot></slot>
  {/snippet}
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
</Sheet>
