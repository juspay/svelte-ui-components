<svelte:options
  customElement={{
    tag: 'sui-split-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      items: { type: 'Object' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      triggerAriaLabel: { type: 'String', attribute: 'trigger-aria-label' },
      onclick: { type: 'Object' },
      onselect: { type: 'Object' },
      dropdownIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SplitButton from '$lib/SplitButton/SplitButton.svelte';
  import chevronDownSmSvg from '$lib/assets/chevron-down-sm.svg?raw';
  let props = $props();
</script>

<SplitButton {...props}>
  {#snippet dropdownIcon()}
    <!-- Mirrors SplitButton.svelte's dropdownIcon fallback: {@html chevronDownSmSvg} -->
    <slot name="dropdown-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronDownSmSvg}
    </slot>
  {/snippet}
</SplitButton>
