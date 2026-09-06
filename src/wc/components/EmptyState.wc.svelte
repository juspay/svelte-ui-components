<svelte:options
  customElement={{
    tag: 'sui-empty-state',
    shadow: 'open',
    props: {
      emptyStateTitle: { type: 'String', reflect: true, attribute: 'title' },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      icon: { type: 'Object' },
      titleSnippet: { type: 'Object' },
      descriptionSnippet: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import EmptyState from '$lib/EmptyState/EmptyState.svelte';
  let props = $props();
</script>

<EmptyState {...props} title={props.emptyStateTitle}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet titleSnippet()}
    <slot name="title-snippet"></slot>
  {/snippet}
  {#snippet descriptionSnippet()}
    <slot name="description-snippet"></slot>
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</EmptyState>
