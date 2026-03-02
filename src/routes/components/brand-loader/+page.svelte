<script lang="ts">
  import BrandLoader from '$lib/BrandLoader/BrandLoader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>BrandLoader</h1>
</div>

<div class="demo-row">
  <BrandLoader
    brandLogoURL="https://picsum.photos/64/64?random=40"
    brandText="Loading"
    subText="Please wait..."
  />
</div>
