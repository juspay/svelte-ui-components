<script lang="ts">
  import Button from '#lib/Button/Button.svelte';
  import Card from '#lib/Card/Card.svelte';
  import Carousel from '#lib/Carousel/Carousel.svelte';
  import type { CarouselView } from '#lib/Carousel/properties.js';

  const slides: CarouselView[] = [
    { component: Card, properties: { title: 'First' } },
    { component: Card, properties: { title: 'Second' } },
    { component: Card, properties: { title: 'Third' } }
  ];
  let views = $state(slides);
</script>

<Button text="Shorten list" onclick={() => (views = slides.slice(0, 1))} />
<Button text="Empty list" onclick={() => (views = [])} />
<Button text="Restore list" onclick={() => (views = slides)} />
<div data-pw="carousel-host" style="width: 360px;">
  <Carousel {views} showDots testId="layout-carousel" />
</div>
