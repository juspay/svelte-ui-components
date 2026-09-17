<svelte:options
  customElement={{
    tag: 'sui-progress',
    shadow: 'open',
    props: {
      value: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      showLabel: { type: 'Boolean', reflect: true, attribute: 'show-label' },
      animateValue: { type: 'Boolean', reflect: true, attribute: 'animate-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Progress from '$lib/Progress/Progress.svelte';
  let props = $props();
</script>

<Progress {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-progress-display, block);
  }
</style>
