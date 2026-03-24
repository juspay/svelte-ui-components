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
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Carousel from '$lib/Carousel/Carousel.svelte';
  let props = $props();
</script>

<Carousel {...props} />
