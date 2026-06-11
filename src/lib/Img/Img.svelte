<script lang="ts">
  import type { ImgProperties } from './properties';

  let { src, alt, fallback, onerror, classes, inlineSvg, transformSvg }: ImgProperties = $props();

  let currentSrc = $derived(src);
  // Per-source failure marker: when inlining a given URL fails we fall back to
  // the plain <img> for that URL (which drives the regular fallback/onerror
  // chain), while a new src still gets a fresh inlining attempt.
  let failedInlineSrc: string | null = $state(null);

  function isSvgSource(source: string): boolean {
    if (source.startsWith('data:image/svg+xml')) {
      return true;
    }
    const path = source.split('?')[0] ?? '';
    return path.endsWith('.svg');
  }

  let shouldInline = $derived(
    (inlineSvg === true || typeof transformSvg === 'function') &&
      isSvgSource(currentSrc) &&
      failedInlineSrc !== currentSrc
  );

  function handleFallback(): void {
    if (typeof fallback === 'string' && fallback.length > 0 && currentSrc !== fallback) {
      currentSrc = fallback;
    } else {
      onerror?.();
    }
  }

  type InlineParams = {
    url: string;
    transform: ((svg: string) => string) | null;
  };

  async function loadInlineSvg(
    host: SVGSVGElement,
    url: string,
    transform: ((svg: string) => string) | null,
    signal: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        failedInlineSrc = url;
        return;
      }
      const rawSvg = await response.text();
      const markup = typeof transform === 'function' ? transform(rawSvg) : rawSvg;
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
      if (parsed.querySelector('parsererror') !== null) {
        failedInlineSrc = url;
        return;
      }
      const sourceSvg = parsed.querySelector('svg');
      if (sourceSvg === null) {
        failedInlineSrc = url;
        return;
      }
      // The action may have been torn down (or re-run) while awaiting the
      // body — bail before mutating so a stale fetch never paints over the
      // latest one.
      if (signal.aborted) {
        return;
      }
      while (host.firstChild !== null) {
        host.removeChild(host.firstChild);
      }
      for (const attribute of Array.from(sourceSvg.attributes)) {
        if (attribute.name === 'class') {
          continue;
        }
        host.setAttribute(attribute.name, attribute.value);
      }
      while (sourceSvg.firstChild !== null) {
        host.appendChild(sourceSvg.firstChild);
      }
    } catch {
      if (!signal.aborted) {
        failedInlineSrc = url;
      }
    }
  }

  function inlineSvgInto(host: SVGSVGElement, params: InlineParams) {
    let controller = new AbortController();

    function load(current: InlineParams): void {
      controller.abort();
      controller = new AbortController();
      void loadInlineSvg(host, current.url, current.transform, controller.signal);
    }

    load(params);

    return {
      update(next: InlineParams): void {
        load(next);
      },
      destroy(): void {
        controller.abort();
      }
    };
  }
</script>

{#if shouldInline}
  <svg
    use:inlineSvgInto={{ url: currentSrc, transform: transformSvg ?? null }}
    class={classes ?? ''}
    role={alt.length > 0 ? 'img' : null}
    aria-label={alt.length > 0 ? alt : null}
    aria-hidden={alt.length === 0 ? 'true' : null}
  ></svg>
{:else}
  <img class={classes ?? ''} src={currentSrc} {alt} onerror={handleFallback} />
{/if}

<style>
  img,
  svg {
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

  img:hover,
  svg:hover {
    background: var(--image-hover-background, var(--image-background));
    border: var(--image-hover-border, var(--image-border));
  }
</style>
