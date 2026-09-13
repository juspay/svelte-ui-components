<script lang="ts">
  import { base } from '$app/paths';
  import Button from '$lib/Button/Button.svelte';
  import Gallery from '$lib/Gallery/Gallery.svelte';
  import Modal from '$lib/Modal/Modal.svelte';
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

  // Nested-lock demo: the lightbox opened from inside a still-open Modal, so the
  // shared, reference-counted body scroll lock (lockBodyScroll/unlockBodyScroll)
  // can be exercised the same way the Modal page's own nested-Modal demo does.
  let nestedLockModalOpen = $state(false);
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
    oneditclick={() => {}}
    ondeleteclick={handleDelete}
  />
</div>

{#if removed.length > 0}
  <p class="demo-note">Delete clicked for: {removed.join(', ')}</p>
{/if}

<h3>Themed grid</h3>
<p class="demo-note">
  <code>--gallery-columns</code>, <code>--gallery-gap</code>, and
  <code>--gallery-item-border-radius</code> control the grid layout.
</p>
<div class="demo-row themed-gallery">
  <Gallery {images} view="grid" testId="gallery-themed-demo" />
</div>

<h3>Nested scroll lock — lightbox opened inside a Modal</h3>
<p class="demo-note">
  Closing only the lightbox must not release the Modal's lock: both draw on the library's shared,
  reference-counted lockBodyScroll/unlockBodyScroll.
</p>
<div class="demo-row">
  <Button
    text="Open outer modal"
    testId="gallery-nested-lock-open-outer"
    onclick={() => (nestedLockModalOpen = true)}
  />
</div>
{#if nestedLockModalOpen}
  <Modal
    testId="gallery-nested-lock-modal"
    header={{ text: 'Outer modal' }}
    onoverlayclick={() => (nestedLockModalOpen = false)}
  >
    {#snippet content()}
      <Gallery {images} view="grid" testId="gallery-nested-lock-gallery" />
      <Button
        text="Close outer modal"
        testId="gallery-nested-lock-close-outer"
        onclick={() => (nestedLockModalOpen = false)}
      />
    {/snippet}
  </Modal>
{/if}

<style>
  .demo-note {
    font-size: 13px;
    color: var(--doc-text-muted, #6b7280);
  }

  .themed-gallery {
    --gallery-columns: 2;
    --gallery-gap: 24px;
    --gallery-item-border-radius: 16px;
  }
</style>
