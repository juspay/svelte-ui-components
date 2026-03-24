<svelte:options
  customElement={{
    tag: 'sui-toolbar',
    shadow: 'open',
    props: {
      showBackButton: { type: 'Boolean', reflect: true, attribute: 'show-back-button' },
      text: { type: 'String', reflect: true },
      backIcon: { type: 'String', attribute: 'back-icon' },
      classes: { type: 'String' },
      onbackClick: { type: 'Object' },
      onkeydown: { type: 'Object' }
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
