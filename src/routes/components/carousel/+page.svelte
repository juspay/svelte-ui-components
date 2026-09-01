<script lang="ts">
  import Carousel from '$lib/Carousel/Carousel.svelte';
  import Card from '$lib/Card/Card.svelte';
  import type { CarouselView } from '$lib/Carousel/properties';

  const promoViews: CarouselView[] = [
    {
      component: Card,
      properties: { title: 'Summer Sale', description: 'Up to 40% off select styles.' }
    },
    {
      component: Card,
      properties: { title: 'New Arrivals', description: 'This week’s drop just landed.' }
    },
    {
      component: Card,
      properties: { title: 'Free Shipping', description: 'On every order over $50.' }
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Carousel</h1>
</div>

<h2>Auto-playing, with dot indicators</h2>
<div class="demo-row">
  <Carousel
    views={promoViews}
    autoplay
    autoplayInterval={2500}
    showDots
    testId="carousel-autoplay-demo"
  />
</div>

<p class="demo-note">
  Each slide is a <code>CarouselView</code> — a Svelte component reference plus the properties to
  pass it. This demo reuses <code>Card</code> as the slide content; any component works. Built for
  rotating promotional content that auto-advances — for a manually-paginated reading or onboarding
  flow, see <code>Book</code> instead.
</p>

<h2>Manual, no autoplay</h2>
<div class="demo-row">
  <Carousel
    views={promoViews}
    showDots
    testId="carousel-manual-demo"
    dotsWrapperTestId="carousel-manual-dots"
    dotTestId="carousel-manual-dot"
  />
</div>

<style>
  .demo-row {
    --carousel-width: 320px;
    --carousel-height: 140px;
    --carousel-border-radius: 12px;
  }
</style>
