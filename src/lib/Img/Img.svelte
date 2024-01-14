<script lang="ts">
  export let src: string;
  export let alt: string;
  export let fallback: string | null = null;

  function handleFallback(): void {
    if (fallback !== null) {
      src = fallback;
    }
  }
</script>

{#if typeof src === 'string' && typeof alt === 'string'}
  <img {src} {alt} on:error|once={handleFallback} />
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
