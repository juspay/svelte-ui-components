<svelte:options
  customElement={{
    tag: 'sui-phone',
    shadow: 'open',
    props: {
      variant: { type: 'String', reflect: true },
      showStatusBar: { type: 'Boolean', reflect: true, attribute: 'show-status-bar' },
      showHomeBar: { type: 'Boolean', reflect: true, attribute: 'show-home-bar' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Phone from '$lib/Phone/Phone.svelte';
  let props = $props();
</script>

<Phone {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Phone>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-phone-display, block);
  }
</style>
