<script lang="ts">
  import type { ImgProperties } from './properties';

  let {
    src,
    alt,
    fallback,
    onerror,
    classes,
    testId,
    inlineSvg = false,
    transform
  }: ImgProperties = $props();

  let currentSrc = $derived(src);

  const isSvgMarkup = $derived(
    typeof currentSrc === 'string' && currentSrc.trimStart().startsWith('<svg')
  );
  const showInline = $derived(inlineSvg && isSvgMarkup);
  const svgContent = $derived(
    showInline && typeof transform === 'function' ? transform(currentSrc) : currentSrc
  );

  function handleFallback(): void {
    if (typeof fallback === 'string' && fallback.length > 0 && currentSrc !== fallback) {
      currentSrc = fallback;
    } else {
      onerror?.();
    }
  }
</script>

{#if showInline}
  <span class="img-inline-svg {classes ?? ''}" data-pw={testId} role="img" aria-label={alt}>
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html svgContent}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </span>
{:else}
  <img class={classes ?? ''} src={currentSrc} {alt} onerror={handleFallback} data-pw={testId} />
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
    flex-shrink: var(--img-flex-shrink);
  }

  img:hover {
    background: var(--image-hover-background, var(--image-background));
    border: var(--image-hover-border, var(--image-border));
  }

  .img-inline-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--image-height, 24px);
    width: var(--image-width, 24px);
    padding: var(--image-padding, 0px);
    border-radius: var(--image-border-radius, 0px);
    margin: var(--image-margin, 0px);
    filter: var(--image-filter, none);
    background: var(--image-background);
    border: var(--image-border);
    transition: var(--image-transition);
    flex-shrink: var(--img-flex-shrink);
  }

  .img-inline-svg:hover {
    background: var(--image-hover-background, var(--image-background));
    border: var(--image-hover-border, var(--image-border));
  }
</style>
