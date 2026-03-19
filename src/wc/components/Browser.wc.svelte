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
</Browser>
