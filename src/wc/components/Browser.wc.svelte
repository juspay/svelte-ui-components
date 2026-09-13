<svelte:options
  customElement={{
    tag: 'sui-browser',
    shadow: 'open',
    props: {
      url: { type: 'String', reflect: true },
      browserTitle: { type: 'String', reflect: true, attribute: 'title' },
      showAddressBar: { type: 'Boolean', reflect: true, attribute: 'show-address-bar' },
      showTabBar: { type: 'Boolean', reflect: true, attribute: 'show-tab-bar' },
      variant: { type: 'String', reflect: true },
      shadow: { type: 'Boolean', reflect: true },
      rounded: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      lockIcon: { type: 'Object' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Browser from '$lib/Browser/Browser.svelte';
  // Mirrors Browser.svelte's own lockIcon default, wrapper span included.
  import lockSvg from '$lib/assets/lock.svg?raw';
  let { browserTitle, ...props } = $props();
</script>

<Browser {...props} title={browserTitle}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet lockIcon()}
    <!--
      A snippet declared here is always a function, so Browser.svelte's own
      `{#if typeof lockIcon === 'function'} ... {:else}<span class="lock-icon">{@html lockSvg}</span>{/if}`
      would always take the true branch and never show its default lock glyph. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="lock-icon">
      <span class="lock-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html lockSvg}
      </span>
    </slot>
  {/snippet}
</Browser>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-browser-display, block);
  }
</style>
