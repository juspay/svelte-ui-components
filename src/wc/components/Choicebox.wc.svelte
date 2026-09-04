<svelte:options
  customElement={{
    tag: 'sui-choicebox',
    shadow: 'open',
    props: {
      selected: { type: 'Boolean', reflect: true },
      mode: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showIndicator: { type: 'Boolean', reflect: true, attribute: 'show-indicator' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onClick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';
  let props = $props();
</script>

<Choicebox {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Choicebox>
