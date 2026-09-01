<script lang="ts">
  import BrandLoader from '$lib/BrandLoader/BrandLoader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>BrandLoader</h1>
</div>

<div class="demo-row">
  <BrandLoader
    brandLogoURL="/demo-media/placeholder-square.svg"
    brandText="Loading"
    subText="Please wait..."
  />
</div>
