<svelte:options
  customElement={{
    tag: 'sui-card',
    shadow: 'open',
    props: {
      title: { type: 'String', reflect: true },
      description: { type: 'String', reflect: true },
      classes: { type: 'String' },
      stretch: { type: 'Boolean', reflect: true },
      scrollable: { type: 'Boolean', reflect: true },
      cssVars: { type: 'Object' },
      titleSnippet: { type: 'Object' },
      descriptionSnippet: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' },
      href: { type: 'String', attribute: 'href' },
      target: { type: 'String', attribute: 'target' },
      rel: { type: 'String', attribute: 'rel' },
      headerRight: { type: 'Object' },
      footer: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Card from '$lib/Card/Card.svelte';
  let props = $props();
</script>

<Card {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Card>
