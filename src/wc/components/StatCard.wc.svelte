<svelte:options
  customElement={{
    tag: 'sui-stat-card',
    shadow: 'open',
    props: {
      title: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      delta: { type: 'String', reflect: true },
      deltaPositive: { type: 'Boolean', attribute: 'delta-positive', reflect: true },
      subtitle: { type: 'String', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import StatCard from '$lib/StatCard/StatCard.svelte';
  let props = $props();
</script>

<StatCard {...props}>
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
  {#snippet valueSnippet()}
    <slot name="value-snippet"></slot>
  {/snippet}
</StatCard>
