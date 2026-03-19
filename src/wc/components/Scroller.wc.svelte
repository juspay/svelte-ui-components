<svelte:options
  customElement={{
    tag: 'sui-scroller',
    shadow: 'open',
    props: {
      direction: { type: 'String', reflect: true },
      scrollAmount: { type: 'Number' },
      showArrows: { type: 'Boolean', reflect: true },
      showGradient: { type: 'Boolean', reflect: true },
      dragToScroll: { type: 'Boolean', reflect: true },
      snapToItem: { type: 'Boolean', reflect: true },
      hideScrollbar: { type: 'Boolean', reflect: true },
      hideArrowsOnTouch: { type: 'Boolean' },
      smoothScroll: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onscrollposition: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Scroller from '$lib/Scroller/Scroller.svelte';
  let props = $props();
</script>

<Scroller {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet arrowPrevious()}
    <slot name="arrow-previous"></slot>
  {/snippet}
  {#snippet arrowNext()}
    <slot name="arrow-next"></slot>
  {/snippet}
</Scroller>
