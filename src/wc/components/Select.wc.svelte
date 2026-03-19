<svelte:options
  customElement={{
    tag: 'sui-select',
    shadow: 'open',
    props: {
      dropDownIconAlt: { type: 'String' },
      placeholder: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      allItems: { type: 'Object' },
      selectedItem: { type: 'Object', reflect: true },
      selectedItemLabel: { type: 'Object' },
      showSelectedItemInDropdown: { type: 'Boolean' },
      selectMultipleItems: { type: 'Boolean', reflect: true },
      hideDropDownIcon: { type: 'Boolean' },
      dropDownIcon: { type: 'String' },
      leftIcon: { type: 'Object' },
      showSingleSelectButton: { type: 'Boolean' },
      showSelectedItem: { type: 'Boolean' },
      showSelectedItemCount: { type: 'Boolean' },
      testId: { type: 'String' },
      labelTestId: { type: 'String' },
      itemTestId: { type: 'String' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      ondropdownClick: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Select from '$lib/Select/Select.svelte';
  let props = $props();
</script>

<Select {...props}>
  {#snippet leftContent()}
    <slot name="left-content"></slot>
  {/snippet}
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</Select>
