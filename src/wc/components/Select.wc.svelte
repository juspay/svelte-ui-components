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
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Select from '$lib/Select/Select.svelte';
  let props = $props();
</script>

<Select {...props} />
