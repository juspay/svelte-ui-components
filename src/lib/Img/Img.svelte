<script lang="ts">
  import type { ImgProperties } from './properties';

  let { src, alt, fallback, onerror, classes }: ImgProperties = $props();

  let currentSrc = $derived(src);

  function handleFallback(): void {
    if (typeof fallback === 'string' && fallback.length > 0 && currentSrc !== fallback) {
      currentSrc = fallback;
    } else {
      onerror?.();
    }
  }
</script>

<img class={classes ?? ''} src={currentSrc} {alt} onerror={handleFallback} />

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
