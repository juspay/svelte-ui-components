<svelte:options
  customElement={{
    tag: 'sui-scroller',
    shadow: 'open',
    props: {
      direction: { type: 'String', reflect: true },
      scrollAmount: { type: 'Number', attribute: 'scroll-amount' },
      showArrows: { type: 'Boolean', reflect: true, attribute: 'show-arrows' },
      showGradient: { type: 'Boolean', reflect: true, attribute: 'show-gradient' },
      dragToScroll: { type: 'Boolean', reflect: true, attribute: 'drag-to-scroll' },
      snapToItem: { type: 'Boolean', reflect: true, attribute: 'snap-to-item' },
      hideScrollbar: { type: 'Boolean', reflect: true, attribute: 'hide-scrollbar' },
      hideArrowsOnTouch: { type: 'Boolean', attribute: 'hide-arrows-on-touch' },
      smoothScroll: { type: 'Boolean', reflect: true, attribute: 'smooth-scroll' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onscrollposition: { type: 'Object' },
      arrowPrevious: { type: 'Object' },
      arrowNext: { type: 'Object' }
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
