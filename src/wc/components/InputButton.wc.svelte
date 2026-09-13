<svelte:options
  customElement={{
    tag: 'sui-input-button',
    shadow: 'open',
    props: {
      value: { type: 'String', reflect: true },
      inputProperties: { type: 'Object' },
      rightButtonProperties: { type: 'Object' },
      leftButtonProperties: { type: 'Object' },
      bottomButtonProperties: { type: 'Object' },
      classes: { type: 'String' },
      mandatory: { type: 'Boolean' },
      required: { type: 'Boolean', reflect: true },
      size: { type: 'String' },
      error: { type: 'String' },
      inputEventProperties: { type: 'Object' },
      rightButtonEventProperties: { type: 'Object' },
      leftButtonEventProperties: { type: 'Object' },
      bottomButtonEventProperties: { type: 'Object' },
      leftIcon: { type: 'Object' },
      rightIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import InputButton from '$lib/InputButton/InputButton.svelte';
  let props = $props();
</script>

<InputButton {...props}>
  {#snippet leftIcon()}
    <slot name="left-icon"></slot>
  {/snippet}
  {#snippet rightIcon()}
    <slot name="right-icon"></slot>
  {/snippet}
</InputButton>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-input-button-display, block);
  }
</style>
