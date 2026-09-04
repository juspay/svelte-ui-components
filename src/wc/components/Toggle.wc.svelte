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
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Toggle from '$lib/Toggle/Toggle.svelte';
  let props = $props();
</script>

<Toggle {...props} />
