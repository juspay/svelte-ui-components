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
      // Complex props (arrays / objects / functions) cannot cross the HTML-attribute
      // boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-stat-card').rows = [{ heading: 'Revenue', value: '₹1.2Cr', change: 8.2 }];
      rows: { type: 'Object' },
      tooltip: { type: 'Object' },
      checkbox: { type: 'Object' },
      onCheckboxChange: { type: 'Object' },
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
  {#snippet headerRight()}
    <slot name="header-right"></slot>
  {/snippet}
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
  {#snippet valueSnippet()}
    <slot name="value-snippet"></slot>
  {/snippet}
  <slot></slot>
</StatCard>
