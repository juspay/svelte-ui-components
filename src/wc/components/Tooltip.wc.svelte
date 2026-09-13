<svelte:options
  customElement={{
    tag: 'sui-tooltip',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      position: { type: 'String', reflect: true },
      delay: { type: 'Number', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' },
      icon: { type: 'Object' },
      iconPosition: { type: 'String', attribute: 'icon-position' },
      content: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';
  let props = $props();
</script>

<Tooltip {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet content()}
    <!-- Mirrors Tooltip.svelte's content fallback: <span class="tooltip-text">{text}</span> -->
    <slot name="content">
      <span class="tooltip-text">{props.text}</span>
    </slot>
  {/snippet}
</Tooltip>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-tooltip-display, block);
  }
</style>
