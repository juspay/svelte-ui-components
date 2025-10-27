<script lang="ts">
  import type { ImgProperties } from './properties';

  let { src, alt, fallback }: ImgProperties = $props();

  let currentSrc = $derived(src);

  function handleFallback(): void {
    if (fallback && currentSrc !== fallback) {
      currentSrc = fallback;
    }
  }
</script>

{#if currentSrc && alt}
  <img src={currentSrc} {alt} onerror={handleFallback} />
{/if}

<style>
  img {
    object-fit: var(--image-object-fit);
    height: var(--image-height, 24px);
    width: var(--image-width, 24px);
    padding: var(--image-padding, 0px);
    border-radius: var(--image-border-radius, 0px);
    margin: var(--image-margin, 0px);
    filter: var(--image-filter, none);
    background: var(--image-background);
    border: var(--image-border);
    transition: var(--image-transition);
  }

  img:hover {
    background: var(--image-hover-background, var(--image-background));
    border: var(--image-hover-border, var(--image-border));
  }
</style>
