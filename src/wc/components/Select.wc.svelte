<svelte:options
  customElement={{
    tag: 'sui-select',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      value: { type: 'Object' },
      multiple: { type: 'Boolean', reflect: true },
      searchable: { type: 'Boolean', reflect: true },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      open: { type: 'Boolean', reflect: true },
      dropdownAlign: { type: 'String', attribute: 'dropdown-align' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Select from '$lib/Select/Select.svelte';
  let props = $props();
</script>

<Select {...props}>
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</Select>
