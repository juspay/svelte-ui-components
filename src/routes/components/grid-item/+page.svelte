<script lang="ts">
  import { base } from '$app/paths';
  import GridItem from '$lib/GridItem/GridItem.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>GridItem</h1>
</div>

<div class="demo-row">
  <GridItem
    icon="{base}/demo-media/placeholder-square.svg"
    text="Photos"
    testId="grid-item-photos"
  />
  <GridItem icon="{base}/demo-media/placeholder-square.svg" text="Videos" />
  <GridItem icon="{base}/demo-media/placeholder-square.svg" text="Music" />
</div>
