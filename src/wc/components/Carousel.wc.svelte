<svelte:options
  customElement={{
    tag: 'sui-carousel',
    shadow: 'open',
    props: {
      views: { type: 'Object' },
      autoplay: { type: 'Boolean', reflect: true },
      autoplayInterval: { type: 'Number', reflect: true, attribute: 'autoplay-interval' },
      showDots: { type: 'Boolean', reflect: true, attribute: 'show-dots' },
      isScrollableLast: { type: 'Boolean', reflect: true, attribute: 'is-scrollable-last' },
      classes: { type: 'String' },
      onkeydown: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      dotsWrapperTestId: { type: 'String', attribute: 'dots-wrapper-test-id' },
      dotTestId: { type: 'String', attribute: 'dot-test-id' }
    }
  }}
/>

<script lang="ts">
  import Carousel from '$lib/Carousel/Carousel.svelte';
  let props = $props();
</script>

<Carousel {...props} />
