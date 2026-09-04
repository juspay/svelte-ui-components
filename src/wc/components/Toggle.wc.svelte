<svelte:options
  customElement={{
    tag: 'sui-toggle',
    shadow: 'open',
    props: {
      checked: { type: 'Boolean', reflect: true },
      text: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      onClick: { type: 'Object' },
      inputId: { type: 'String', attribute: 'input-id' },
      inputAriaLabel: { type: 'String', attribute: 'input-aria-label' },
      inputAriaLabelledby: { type: 'String', attribute: 'input-aria-labelledby' }
    }
  }}
/>

<script lang="ts">
  import Toggle from '$lib/Toggle/Toggle.svelte';

  // Keep the host's native identity and ARIA accessors independent of its shadow input.
  let { inputId = '', inputAriaLabel = '', inputAriaLabelledby = '', ...props } = $props();
</script>

<Toggle {...props} id={inputId} ariaLabel={inputAriaLabel} ariaLabelledby={inputAriaLabelledby} />
