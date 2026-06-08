<svelte:options
  customElement={{
    tag: 'sui-select',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      value: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      manageOpenState: { type: 'Boolean', reflect: true, attribute: 'manage-open-state' },
      multiple: { type: 'Boolean', reflect: true },
      searchable: { type: 'Boolean', reflect: true },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      allowSelectAll: { type: 'Boolean', reflect: true, attribute: 'allow-select-all' },
      showSelectButton: { type: 'Boolean', reflect: true, attribute: 'show-select-button' },
      onchange: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Select from '$lib/Select/Select.svelte';
  let props = $props();
</script>

<Select {...props} />
