<svelte:options
  customElement={{
    tag: 'sui-color-picker',
    shadow: 'open',
    props: {
      value: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showValue: { type: 'Boolean', reflect: true, attribute: 'show-value' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      oninput: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ColorPicker from '$lib/ColorPicker/ColorPicker.svelte';

  // `value` is $bindable on ColorPicker; see ChipInput.wc.svelte for why a one-way spread
  // leaves the host element's property stale.
  let { value = $bindable('#000000'), ...rest } = $props();
</script>

<ColorPicker {...rest} bind:value />
