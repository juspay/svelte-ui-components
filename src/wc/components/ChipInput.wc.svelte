<svelte:options
  customElement={{
    tag: 'sui-chip-input',
    shadow: 'open',
    props: {
      values: { type: 'Array' },
      ariaLabel: { type: 'String', attribute: 'aria-label' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      editable: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onadd: { type: 'Object' },
      ondismiss: { type: 'Object' },
      onedit: { type: 'Object' },
      onchange: { type: 'Object' },
      onAdd: { type: 'Object' },
      onDismiss: { type: 'Object' },
      onEdit: { type: 'Object' },
      onChange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ChipInput from '$lib/ChipInput/ChipInput.svelte';

  // `values` is $bindable on ChipInput and is reassigned when a chip is added or dismissed.
  // Spreading it one-way leaves the host element's property frozen at whatever the consumer
  // last set, so `document.querySelector('sui-chip-input').values` never sees the new chip.
  let { values = $bindable([]), ...rest } = $props();
</script>

<ChipInput {...rest} bind:values />
