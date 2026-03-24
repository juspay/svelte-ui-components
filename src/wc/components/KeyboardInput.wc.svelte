<svelte:options
  customElement={{
    tag: 'sui-keyboard-input',
    shadow: 'open',
    props: {
      keys: { type: 'Object', reflect: true },
      separator: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import KeyboardInput from '$lib/KeyboardInput/KeyboardInput.svelte';
  let props = $props();
</script>

<KeyboardInput {...props} />
