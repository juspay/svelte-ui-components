<script lang="ts">
  import { asset } from '$app/paths';
  import GridItem from '$lib/GridItem/GridItem.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>GridItem</h1>
</div>

<div class="demo-row">
  <GridItem
    icon={asset('demo-media/placeholder-square.svg')}
    text="Photos"
    testId="grid-item-photos"
  />
  <GridItem icon={asset('demo-media/placeholder-square.svg')} text="Videos" />
  <GridItem icon={asset('demo-media/placeholder-square.svg')} text="Music" />
</div>

<h2>Loading</h2>
<p class="demo-caption">
  <code>showLoader</code> draws a sweeping ring around the tile while its content is on its way. The
  sweep is indefinite, so it stops under <code>prefers-reduced-motion: reduce</code> and settles on the
  complete ring.
</p>
<div class="demo-row">
  <GridItem
    icon={asset('demo-media/placeholder-square.svg')}
    text="Uploading"
    showLoader
    testId="grid-item-loading"
  />
</div>
