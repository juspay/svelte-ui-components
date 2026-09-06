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
      menuAriaLabel: { type: 'String', attribute: 'aria-label' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      trigger: { type: 'Object' },
      interactiveTrigger: { type: 'Boolean', attribute: 'interactive-trigger' },
      selectedValue: { type: 'String', attribute: 'selected-value' },
      placement: { type: 'String', attribute: 'placement' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' }
    }
  }}
/>

<script lang="ts">
  import Menu from '$lib/Menu/Menu.svelte';
  import type { MenuProperties } from '$lib/Menu/properties';
  // The element renames `ariaLabel` to `menuAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    menuAriaLabel,
    ...props
  }: Omit<MenuProperties, 'ariaLabel'> & { menuAriaLabel?: MenuProperties['ariaLabel'] } = $props();
</script>

<!-- A property-assigned trigger wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Menu {...props} ariaLabel={menuAriaLabel}>
  {#snippet trigger(triggerProps)}
    {#if props.trigger}{@render props.trigger(triggerProps)}{:else}<slot name="trigger"></slot>{/if}
  {/snippet}
</Menu>
