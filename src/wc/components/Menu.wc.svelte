<svelte:options
  customElement={{
    tag: 'sui-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      transformSvg: { type: 'Object' },
      triggerAriaLabel: { type: 'String', attribute: 'trigger-aria-label' },
      ariaLabel: { type: 'String', attribute: 'aria-label' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      trigger: { type: 'Object' },
      interactiveTrigger: { type: 'Boolean', attribute: 'interactive-trigger' },
      selectedValue: { type: 'String', attribute: 'selected-value' },
      placement: { type: 'String', attribute: 'placement' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' },
      onSelect: { type: 'Object' },
      onOpen: { type: 'Object' },
      onClose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Menu from '$lib/Menu/Menu.svelte';
  let props = $props();
</script>

<!-- A property-assigned trigger wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Menu {...props}>
  {#snippet trigger()}
    {#if props.trigger}{@render props.trigger()}{:else}<slot name="trigger"></slot>{/if}
  {/snippet}
</Menu>
