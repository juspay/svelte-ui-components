<svelte:options
  customElement={{
    tag: 'sui-separator',
    shadow: 'open',
    props: {
      orientation: { type: 'String', reflect: true },
      decorative: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Separator from '$lib/Separator/Separator.svelte';
  let props = $props();
</script>

<Separator {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-separator-display, block);
  }
</style>
