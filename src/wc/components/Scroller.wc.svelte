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
  // Mirrors Scroller.svelte's own arrowPrevious/arrowNext defaults, which pick their
  // glyph from `direction` the same way.
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  let props = $props();
</script>

<Scroller {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet arrowPrevious()}
    <!--
      A snippet declared here is always a function, so Scroller.svelte's own
      `{#if typeof arrowPrevious === 'function'} ... {:else}<span class="arrow-icon">...</span>{/if}`
      would always take the true branch and never show its default chevron. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="arrow-previous">
      <span class="arrow-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html props.direction === 'horizontal' ? chevronLeftSvg : chevronUpSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet arrowNext()}
    <slot name="arrow-next">
      <span class="arrow-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html props.direction === 'horizontal' ? chevronRightSvg : chevronDownSvg}
      </span>
    </slot>
  {/snippet}
</Scroller>
