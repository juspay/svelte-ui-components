<svelte:options
  customElement={{
    tag: 'sui-card',
    shadow: 'open',
    props: {
      title: { type: 'String', reflect: true },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Card from '$lib/Card/Card.svelte';
  let props = $props();
</script>

<Card {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Card>
