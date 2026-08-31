<svelte:options
  customElement={{
    tag: 'sui-checkbox',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      indeterminate: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      checkedIcon: { type: 'Object' },
      indeterminateIcon: { type: 'Object' },
      classes: { type: 'String' },
      ariaLabel: { type: 'String', attribute: 'aria-label' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  let props = $props();
</script>

<Checkbox {...props}>
  {#snippet checkedIcon()}
    <slot name="checked-icon"></slot>
  {/snippet}
  {#snippet indeterminateIcon()}
    <slot name="indeterminate-icon"></slot>
  {/snippet}
</Checkbox>
