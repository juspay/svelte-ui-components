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
  let props = $props();
</script>

<Browser {...props} title={props.browserTitle}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet lockIcon()}
    <slot name="lock-icon"></slot>
  {/snippet}
</Browser>
