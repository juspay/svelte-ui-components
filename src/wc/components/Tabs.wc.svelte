<svelte:options
  customElement={{
    tag: 'sui-tabs',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      activeIndex: { type: 'Number', reflect: true, attribute: 'active-index' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      scrollLeftIcon: { type: 'Object' },
      scrollRightIcon: { type: 'Object' },
      classes: { type: 'String' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';
  let props = $props();
</script>

<Tabs {...props}>
  {#snippet scrollLeftIcon()}
    <slot name="scroll-left-icon"></slot>
  {/snippet}
  {#snippet scrollRightIcon()}
    <slot name="scroll-right-icon"></slot>
  {/snippet}
</Tabs>
