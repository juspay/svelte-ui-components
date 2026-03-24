<svelte:options
  customElement={{
    tag: 'sui-tooltip',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      position: { type: 'String', reflect: true },
      delay: { type: 'Number', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';
  let props = $props();
</script>

<Tooltip {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Tooltip>
