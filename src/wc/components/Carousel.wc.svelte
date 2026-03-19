<svelte:options
  customElement={{
    tag: 'sui-carousel',
    shadow: 'open',
    props: {
      views: { type: 'Object' },
      autoplay: { type: 'Boolean', reflect: true },
      autoplayInterval: { type: 'Number', reflect: true },
      showDots: { type: 'Boolean', reflect: true },
      isScrollableLast: { type: 'Boolean', reflect: true },
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
