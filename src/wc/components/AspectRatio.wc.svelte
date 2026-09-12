<svelte:options
  customElement={{
    tag: 'sui-aspect-ratio',
    shadow: 'open',
    props: {
      ratio: { type: 'Number', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import AspectRatio from '$lib/AspectRatio/AspectRatio.svelte';
  let props = $props();
</script>

<AspectRatio {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</AspectRatio>
