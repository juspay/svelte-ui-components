<svelte:options
  customElement={{
    tag: 'sui-split-input',
    shadow: 'open',
    props: {
      values: { type: 'Array' },
      fields: { type: 'Array' },
      length: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      autoAdvance: { type: 'Boolean', reflect: true, attribute: 'auto-advance' },
      separator: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      oninput: { type: 'Object' },
      oncomplete: { type: 'Object' },
      onChange: { type: 'Object' },
      onInput: { type: 'Object' },
      onComplete: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SplitInput from '$lib/SplitInput/SplitInput.svelte';

  // `values` is $bindable on SplitInput; see ChipInput.wc.svelte for the rationale.
  let { values = $bindable([]), ...rest } = $props();
</script>

<SplitInput {...rest} bind:values />
