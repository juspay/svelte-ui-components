<svelte:options
  customElement={{
    tag: 'sui-loading-dots',
    shadow: 'open',
    props: {
      dots: { type: 'Number', reflect: true },
      animation: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import LoadingDots from '$lib/LoadingDots/LoadingDots.svelte';
  let props = $props();
</script>

<LoadingDots {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-loading-dots-display, inline-block);
  }
</style>
