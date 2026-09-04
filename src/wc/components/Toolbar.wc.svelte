<svelte:options
  customElement={{
    tag: 'sui-toolbar',
    shadow: 'open',
    props: {
      showBackButton: { type: 'Boolean', reflect: true, attribute: 'show-back-button' },
      text: { type: 'String', reflect: true },
      backIcon: { type: 'String', attribute: 'back-icon' },
      backLabel: { type: 'String', attribute: 'back-label' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      headingTestId: { type: 'String', attribute: 'heading-test-id' },
      onbackClick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      leftContent: { type: 'Object' },
      centerContent: { type: 'Object' },
      rightContent: { type: 'Object' },
      additionalContent: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
  let props = $props();
</script>

<Toolbar {...props}>
  {#snippet leftContent()}
    <slot name="left-content"></slot>
  {/snippet}
  {#snippet centerContent()}
    <slot name="center-content"></slot>
  {/snippet}
  {#snippet rightContent()}
    <slot name="right-content"></slot>
  {/snippet}
  {#snippet additionalContent()}
    <slot name="additional-content"></slot>
  {/snippet}
</Toolbar>
