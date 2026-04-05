<svelte:options
  customElement={{
    tag: 'sui-empty-state',
    shadow: 'open',
    props: {
      title: { type: 'String', reflect: true },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import EmptyState from '$lib/EmptyState/EmptyState.svelte';
  let props = $props();
</script>

<EmptyState {...props}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</EmptyState>
