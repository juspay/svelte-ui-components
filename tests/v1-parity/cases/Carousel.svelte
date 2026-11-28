<script context="module">
  const dot = (n) => ['click', `.dots-wrapper > div:nth-child(${n})`];
  const settle = ['wait', 900];

  export const cases = [
    { name: 'default', allowBlank: true },
    { name: 'empty-views-dots', allowBlank: true },
    { name: 'one-view' },
    { name: 'one-view-dots' },
    { name: 'two-views-dots' },
    { name: 'three-views-dots' },
    { name: 'views-null-properties' },
    { name: 'views-null-properties-second', actions: [dot(2), settle] },
    { name: 'dots-off-three-views' },
    { name: 'scrollable-last-true' },
    { name: 'scrollable-last-false' },
    { name: 'click-dot-2', actions: [dot(2), settle] },
    { name: 'click-dot-3', actions: [dot(3), settle] },
    { name: 'click-dot-3-then-1', actions: [dot(3), settle, dot(1), settle] },
    { name: 'click-dot-2-twice', actions: [dot(2), settle, dot(2), settle] },
    { name: 'click-dot-1-first', actions: [dot(1), settle] },
    { name: 'click-carousel', actions: [['click', '.carousel'], settle] },
    { name: 'hover-dot', actions: [['hover', '.dots-wrapper > div:nth-child(2)']] },
    { name: 'autoplay-long-interval', actions: [['wait', 300]] },
    { name: 'autoplay-single-view-never-moves', actions: [['wait', 1500]] },
    { name: 'autoplay-stops-at-last-view', actions: [['wait', 3000]] },
    { name: 'autoplay-stops-at-last-of-three', actions: [['wait', 4000]] },
    { name: 'css-ancestor' },
    { name: 'css-ancestor-second', actions: [dot(2), settle] },
    { name: 'css-dots' },
    { name: 'css-dots-click', actions: [dot(3), settle] },
    { name: 'style-props' },
    { name: 'style-props-click', actions: [dot(2), settle] },
    { name: 'width-percent', actions: [dot(2), settle] },
    { name: 'width-rem', actions: [dot(2), settle] },
    { name: 'no-width-variable-click', actions: [dot(2), settle] }
  ];
</script>

<script>
  import { Carousel, defaultCarouselProperties } from 'sui-v1-under-test';
  import SlideA from './parts/SlideA.svelte';
  import SlideB from './parts/SlideB.svelte';
  export let name;

  const a = { component: SlideA, properties: { label: 'One', color: '#1d4ed8' } };
  const b = { component: SlideB, properties: { label: 'Two', color: '#b91c1c' } };
  const c = { component: SlideA, properties: { label: 'Three', color: '#047857' } };
  const bare = [
    { component: SlideA, properties: null },
    { component: SlideB, properties: null }
  ];
  const base = { ...defaultCarouselProperties, views: [a, b, c], showDots: true };
</script>

{#if name === 'default'}
  <div class="size"><Carousel /></div>
{:else if name === 'empty-views-dots'}
  <div class="size"><Carousel properties={{ ...base, views: [] }} /></div>
{:else if name === 'one-view'}
  <div class="size"><Carousel properties={{ ...base, views: [a], showDots: false }} /></div>
{:else if name === 'one-view-dots'}
  <div class="size"><Carousel properties={{ ...base, views: [a] }} /></div>
{:else if name === 'two-views-dots'}
  <div class="size"><Carousel properties={{ ...base, views: [a, b] }} /></div>
{:else if name === 'three-views-dots'}
  <div class="size"><Carousel properties={base} /></div>
{:else if name === 'views-null-properties' || name === 'views-null-properties-second'}
  <div class="size"><Carousel properties={{ ...base, views: bare }} /></div>
{:else if name === 'dots-off-three-views'}
  <div class="size"><Carousel properties={{ ...base, showDots: false }} /></div>
{:else if name === 'scrollable-last-true'}
  <div class="size"><Carousel properties={{ ...base, isScrollableLast: true }} /></div>
{:else if name === 'scrollable-last-false'}
  <div class="size"><Carousel properties={{ ...base, isScrollableLast: false }} /></div>
{:else if name === 'click-dot-2' || name === 'click-dot-3' || name === 'click-dot-3-then-1' || name === 'click-dot-2-twice' || name === 'click-dot-1-first' || name === 'click-carousel' || name === 'hover-dot'}
  <div class="size"><Carousel properties={base} /></div>
{:else if name === 'autoplay-long-interval'}
  <div class="size">
    <Carousel properties={{ ...base, autoplay: true, autoplayInterval: 600000 }} />
  </div>
{:else if name === 'autoplay-single-view-never-moves'}
  <div class="size">
    <Carousel properties={{ ...base, views: [a], autoplay: true, autoplayInterval: 300 }} />
  </div>
{:else if name === 'autoplay-stops-at-last-view'}
  <div class="size">
    <Carousel properties={{ ...base, views: [a, b], autoplay: true, autoplayInterval: 300 }} />
  </div>
{:else if name === 'autoplay-stops-at-last-of-three'}
  <div class="size">
    <Carousel properties={{ ...base, autoplay: true, autoplayInterval: 300 }} />
  </div>
{:else if name === 'css-ancestor' || name === 'css-ancestor-second'}
  <div class="themed"><Carousel properties={base} /></div>
{:else if name === 'css-dots' || name === 'css-dots-click'}
  <div class="size dots-theme"><Carousel properties={base} /></div>
{:else if name === 'style-props' || name === 'style-props-click'}
  <Carousel
    properties={base}
    --carousel-width="240px"
    --carousel-height="140px"
    --carousel-border-radius="20px"
    --carousel-shadow="0 4px 12px rgba(0, 0, 0, 0.4)"
    --dot-width="12px"
    --dot-height="12px"
    --dot-gap="16px"
    --dot-padding-top="20px"
  />
{:else if name === 'width-percent'}
  <div style="width: 360px; --carousel-width: 100%; --carousel-height: 100px;">
    <Carousel properties={base} />
  </div>
{:else if name === 'width-rem'}
  <div style="--carousel-width: 15rem; --carousel-height: 6rem;">
    <Carousel properties={base} />
  </div>
{:else if name === 'no-width-variable-click'}
  <Carousel properties={base} />
{/if}

<style>
  .size {
    --carousel-width: 300px;
    --carousel-height: 100px;
  }
  .themed {
    --carousel-width: 260px;
    --carousel-height: 160px;
    --carousel-border-radius: 16px;
    --carousel-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
    --dot-gap: 14px;
    --dot-padding-top: 16px;
  }
  .dots-theme {
    --dot-width: 14px;
    --dot-height: 8px;
    --dot-gap: 24px;
    --dot-padding-top: 24px;
  }
</style>
