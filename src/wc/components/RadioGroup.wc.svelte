<svelte:options
  customElement={{
    tag: 'sui-radio-group',
    shadow: 'open',
    props: {
      options: { type: 'Array' },
      value: { type: 'String', reflect: true },
      name: { type: 'String', reflect: true },
      ariaLabel: { type: 'String', reflect: true, attribute: 'aria-label' },
      ariaLabelledBy: { type: 'String', reflect: true, attribute: 'aria-labelledby' },
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
