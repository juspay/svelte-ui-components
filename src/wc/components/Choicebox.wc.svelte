<svelte:options
  customElement={{
    tag: 'sui-choicebox',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      selected: { type: 'Boolean', reflect: true },
      description: { type: 'String', reflect: true },
      mode: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';
  let props = $props();
</script>

<Choicebox {...props}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
</Choicebox>
