<svelte:options
  customElement={{
    tag: 'sui-phone',
    shadow: 'open',
    props: {
      variant: { type: 'String', reflect: true },
      showStatusBar: { type: 'Boolean', reflect: true },
      showHomeBar: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
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
