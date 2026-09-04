<svelte:options
  customElement={{
    tag: 'sui-status',
    shadow: 'open',
    props: {
      statusIcon: { type: 'String', reflect: true, attribute: 'status-icon' },
      statusIconAlt: { type: 'String', reflect: true, attribute: 'status-icon-alt' },
      statusText: { type: 'String', reflect: true, attribute: 'status-text' },
      statusDescription: { type: 'String', reflect: true, attribute: 'status-description' },
      statusTextTag: { type: 'String', reflect: true, attribute: 'status-text-tag' },
      buttonProperties: { type: 'Object' },
      classes: { type: 'String' },
      onbuttonClick: { type: 'Object' },
      icon: { type: 'Object' },
      descriptionSnippet: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      onButtonClick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
  let props = $props();
</script>

<!-- Closes the review finding on #503 that `children` was unreachable from the
     custom element, without declaring it as a prop — declaring it leaves
     `element.children` undefined. Safe here because the component renders
     children inline with no wrapper element of its own, so an always-present
     snippet contributes nothing when the slot is empty. ChatHeader and StatCard
     deliberately do NOT get this: their `{#if}` *creates* the wrapping element
     (`.extra`, `.statcard-children`), so always supplying the snippet would
     render an empty div — StatCard's carries a 4px margin. Those two need
     light-DOM detection, which is a separate change. -->
<Status {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Status>
