<script lang="ts">
  import { base } from '$app/paths';
  import Gallery from '$lib/Gallery/Gallery.svelte';
  import type { GalleryImage } from '$lib/Gallery/properties';

  const images: GalleryImage[] = [
    {
      src: `${base}/demo-media/sunset-beach.jpg`,
      thumbnail: `${base}/demo-media/sunset-beach-thumb.jpg`,
      alt: 'Sunset over the beach',
      caption: 'Golden hour, low tide'
    },
    {
      src: `${base}/demo-media/promo-clip-poster.jpg`,
      alt: 'Promo clip poster frame',
      caption: 'First frame of the promo clip'
    },
    {
      src: `${base}/demo-media/assistant-avatar.png`,
      alt: 'Assistant avatar'
    }
  ];

  let removed: string[] = $state([]);

  function handleDelete(index: number): void {
    removed = [...removed, images[index].alt];
  }
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Gallery</h1>
</div>

<div class="demo-row">
  <Gallery
    {images}
    view="grid"
    testId="gallery-demo"
    onEditClick={() => {}}
    onDeleteClick={handleDelete}
  />
</div>

{#if removed.length > 0}
  <p class="demo-note">Delete clicked for: {removed.join(', ')}</p>
{/if}

<style>
  .demo-note {
    font-size: 13px;
    color: #6b7280;
  }
</style>
