<svelte:options
  customElement={{
    tag: 'sui-radio-group',
    shadow: 'open',
    props: {
      name: { type: 'String', reflect: true },
      items: { type: 'Object' },
      selectedValue: { type: 'String', reflect: true, attribute: 'selected-value' },
      variant: { type: 'String', reflect: true },
      direction: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import RadioGroup from '$lib/RadioGroup/RadioGroup.svelte';
  let props = $props();
</script>

<RadioGroup {...props} />
