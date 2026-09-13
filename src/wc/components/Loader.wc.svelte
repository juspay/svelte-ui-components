<svelte:options
  customElement={{
    tag: 'sui-loader',
    shadow: 'open',
    props: {
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Loader from '$lib/Loader/Loader.svelte';
  let props = $props();
</script>

<Loader {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-loader-display, block);
  }
</style>
