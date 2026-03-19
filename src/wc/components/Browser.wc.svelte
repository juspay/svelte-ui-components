<svelte:options
  customElement={{
    tag: 'sui-browser',
    shadow: 'open',
    props: {
      url: { type: 'String', reflect: true },
      title: { type: 'String', reflect: true },
      showAddressBar: { type: 'Boolean', reflect: true },
      showTabBar: { type: 'Boolean', reflect: true },
      variant: { type: 'String', reflect: true },
      shadow: { type: 'Boolean', reflect: true },
      rounded: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      lockIcon: { type: 'Object' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Browser from '$lib/Browser/Browser.svelte';
  let props = $props();
</script>

<Browser {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet lockIcon()}
    <slot name="lock-icon"></slot>
  {/snippet}
</Browser>
