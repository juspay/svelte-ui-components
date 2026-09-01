<!--
  A slide of the shape that was the ONLY usable one before `view.properties` was
  spread: it declares `properties` and reads the bag itself. Kept as a demo so the
  backward-compatibility guarantee in docs/Carousel.md is verifiable rather than
  merely asserted -- if Carousel ever stops passing `properties` alongside the
  spread, the carousel spec covering this instance fails.
-->
<script lang="ts">
  let { properties }: { properties?: Record<string, unknown> } = $props();
</script>

<div class="legacy-slide" data-pw="carousel-legacy-slide">
  {properties?.label ?? 'no properties received'}
</div>

<style>
  .legacy-slide {
    padding: 24px;
    text-align: center;
  }
</style>
