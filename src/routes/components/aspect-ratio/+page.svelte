<script lang="ts">
  import AspectRatio from '$lib/AspectRatio/AspectRatio.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>AspectRatio</h1>
</div>

<div class="demo-row" style="max-width: 480px; flex-direction: column; gap: 12px;">
  <AspectRatio ratio={16 / 9} testId="aspect-ratio-16-9-demo">
    <img
      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=480&q=60"
      alt="Landscape"
      style="width: 100%; height: 100%; object-fit: cover;"
    />
  </AspectRatio>
</div>

<h2>Square (default ratio)</h2>
<div class="demo-row" style="max-width: 240px;">
  <AspectRatio testId="aspect-ratio-square-demo">
    <img
      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&q=60"
      alt="Square crop"
      style="width: 100%; height: 100%; object-fit: cover;"
    />
  </AspectRatio>
</div>

<h2>4 / 3</h2>
<div class="demo-row" style="max-width: 320px;">
  <AspectRatio ratio={4 / 3} testId="aspect-ratio-4-3-demo">
    <img
      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=320&q=60"
      alt="4 by 3 crop"
      style="width: 100%; height: 100%; object-fit: cover;"
    />
  </AspectRatio>
</div>

<h2>Empty (reserved layout space, no content loaded yet)</h2>
<div class="demo-row" style="max-width: 320px;">
  <AspectRatio ratio={16 / 9} testId="aspect-ratio-empty-demo" classes="aspect-ratio-placeholder" />
</div>

<h2>Invalid ratio (falls back to a 1:1 square, not broken CSS)</h2>
<div class="demo-row" style="max-width: 320px; flex-direction: column; gap: 12px;">
  <AspectRatio ratio={0} testId="aspect-ratio-zero-demo" classes="aspect-ratio-placeholder" />
  <AspectRatio ratio={-2} testId="aspect-ratio-negative-demo" classes="aspect-ratio-placeholder" />
  <AspectRatio ratio={NaN} testId="aspect-ratio-nan-demo" classes="aspect-ratio-placeholder" />
</div>

<h2>Overridden via CSS custom property, not the ratio prop</h2>
<div class="demo-row" style="max-width: 320px;">
  <AspectRatio
    ratio={16 / 9}
    testId="aspect-ratio-css-override-demo"
    classes="aspect-ratio-css-override"
  >
    <img
      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=320&q=60"
      alt="Overridden to 1:1 via CSS"
      style="width: 100%; height: 100%; object-fit: cover;"
    />
  </AspectRatio>
</div>

<style>
  :global(.aspect-ratio-placeholder) {
    --aspect-ratio-container-overflow: visible;
    background: repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px);
  }

  /* Demonstrates that a consumer can retheme the ratio purely through CSS,
     without touching the `ratio` prop -- here it overrides the 16/9 passed
     above back down to a 1:1 square. */
  :global(.aspect-ratio-css-override) {
    --aspect-ratio-container-aspect-ratio: 1;
  }
</style>
