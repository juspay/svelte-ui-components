<svelte:options
  customElement={{
    tag: 'sui-empty-state',
    shadow: 'open',
    props: {
      emptyStateTitle: { type: 'String', reflect: true, attribute: 'title' },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      density: { type: 'String' },
      icon: { type: 'Object' },
      titleSnippet: { type: 'Object' },
      descriptionSnippet: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import EmptyState from '$lib/EmptyState/EmptyState.svelte';
  let { emptyStateTitle, ...props } = $props();
</script>

<EmptyState {...props} title={emptyStateTitle}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet titleSnippet()}
    <!-- Mirrors EmptyState.svelte's titleSnippet fallback: {title} -->
    <slot name="title-snippet">{emptyStateTitle}</slot>
  {/snippet}
  {#snippet descriptionSnippet()}
    <!-- Mirrors EmptyState.svelte's descriptionSnippet fallback: {description},
         shown only when `description` is a non-empty string. -->
    <slot name="description-snippet">
      {#if typeof props.description === 'string' && props.description.length > 0}
        {props.description}
      {/if}
    </slot>
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</EmptyState>
