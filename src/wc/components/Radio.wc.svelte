<svelte:options
  customElement={{
    tag: 'sui-radio',
    shadow: 'open',
    props: {
      name: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      selectedValue: { type: 'String', reflect: true, attribute: 'selected-value' },
      text: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      onChange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';
  let props = $props();
</script>

<Radio {...props} />
