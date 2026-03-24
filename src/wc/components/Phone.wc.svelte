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
