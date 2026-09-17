<svelte:options
  customElement={{
    tag: 'sui-proportion-bar',
    shadow: 'open',
    props: {
      segments: { type: 'Object' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      // `valueFormat` is a function and cannot cross the HTML-attribute boundary,
      // so it is exposed as a JS property only (no `attribute` mapping):
      //   document.querySelector('sui-proportion-bar').valueFormat = (v, p) => `${v} (${p}%)`;
      valueFormat: { type: 'Object' },
      trackHeight: { type: 'String', attribute: 'track-height' },
      animateValue: { type: 'Boolean', attribute: 'animate-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import ProportionBar from '$lib/ProportionBar/ProportionBar.svelte';
  let props = $props();
</script>

<ProportionBar {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-proportion-bar-display, block);
  }
</style>
