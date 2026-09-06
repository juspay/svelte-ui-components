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
      onclick: { type: 'Object' },
      onselect: { type: 'Object' },
      dropdownIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SplitButton from '$lib/SplitButton/SplitButton.svelte';
  let props = $props();
</script>

<SplitButton {...props}>
  {#snippet dropdownIcon()}
    <slot name="dropdown-icon"></slot>
  {/snippet}
</SplitButton>
