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

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-empty-state-display, block);
  }
</style>
