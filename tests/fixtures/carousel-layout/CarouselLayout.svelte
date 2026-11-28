<script lang="ts">
  import Book from '#lib/Book/Book.svelte';
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

{#snippet bookPage()}
  <p>Chapter preview</p>
{/snippet}

{#snippet svgLink()}
  <svg width="145" height="26" viewBox="0 0 145 26">
    <a href="#details" tabindex="0" aria-label="Slide details">
      <text x="0" y="18">Slide details</text>
    </a>
  </svg>
{/snippet}

<Button text="Shorten list" onclick={() => (views = slides.slice(0, 1))} />
<Button text="Empty list" onclick={() => (views = [])} />
<Button text="Restore list" onclick={() => (views = slides)} />
<div data-pw="carousel-host" style="width: 360px;">
  <Carousel {views} showDots testId="layout-carousel" />
</div>

<div style="width: 160px; --carousel-width: 100%;">
  <Book
    pages={Array.from({ length: 8 }, () => ({ content: bookPage }))}
    showPageIndicator
    testId="compact-book"
  />
  <Carousel
    views={Array.from({ length: 8 }, (_, index) => ({
      component: Card,
      properties: index === 0 ? { children: svgLink } : { title: `Slide ${index + 1}` }
    }))}
    autoplay
    autoplayInterval={1000}
    showDots
    testId="compact-carousel"
    dotsWrapperTestId="compact-carousel-indicators"
  />
</div>
