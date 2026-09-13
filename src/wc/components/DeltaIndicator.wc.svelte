<svelte:options
  customElement={{
    tag: 'sui-delta-indicator',
    shadow: 'open',
    props: {
      value: { type: 'Number' },
      invertColors: { type: 'Boolean', attribute: 'invert-colors' },
      hideArrow: { type: 'Boolean', attribute: 'hide-arrow' },
      neutralThreshold: { type: 'Number', attribute: 'neutral-threshold' },
      format: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import DeltaIndicator from '$lib/DeltaIndicator/DeltaIndicator.svelte';
  let props = $props();
</script>

<DeltaIndicator {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-delta-indicator-display, inline-block);
  }
</style>
