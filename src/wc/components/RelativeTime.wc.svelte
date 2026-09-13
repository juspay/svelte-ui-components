<svelte:options
  customElement={{
    tag: 'sui-relative-time',
    shadow: 'open',
    props: {
      date: { type: 'Object' },
      locale: { type: 'String', reflect: true },
      format: { type: 'String', reflect: true },
      updateInterval: { type: 'Number', reflect: true, attribute: 'update-interval' },
      tooltip: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import RelativeTime from '$lib/RelativeTime/RelativeTime.svelte';
  let props = $props();
</script>

<RelativeTime {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-relative-time-display, block);
  }
</style>
