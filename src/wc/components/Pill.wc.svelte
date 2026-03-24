<svelte:options
  customElement={{
    tag: 'sui-pill',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      dismissible: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      dismissIcon: { type: 'Object' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  let props = $props();
</script>

<Pill {...props}>
  {#snippet dismissIcon()}
    <slot name="dismiss-icon"></slot>
  {/snippet}
</Pill>
