<script lang="ts">
  import { onMount } from 'svelte';
  import Img from '$lib/Img/Img.svelte';
  import HostKinds from './HostKinds.svelte';

  // 400x200 grey PNG: a raster with an intrinsic size and a 2:1 ratio.
  const rasterSrc =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADICAAAAADjfug+AAABJklEQVR42u3RMQEAAAzCMOQjGxM7dqQSmlSvigVABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRABASIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAiIgAARECACAkRAgAgIEAERECACAkRAgAgIEAERECACAkRAgAgIEAERECACAkSXDdp5DbvKhy9mAAAAAElFTkSuQmCC';
  // The same size as a document, which the component inlines into an <svg> host.
  const svgSrc = `data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='400' height='200' fill='#888'/></svg>"
  )}`;

  type Case = {
    id: string;
    path: 'img' | 'svg';
    // Custom properties an app sets on an ancestor of the image.
    tokens: string;
  };

  const INTRINSIC = '--image-width: auto; --image-height: auto;';
  const SIZED = '--image-width: 300px; --image-height: 150px;';

  // Cases that set no new token. They must render exactly as they did before the
  // tokens existed, so they are the ones a before/after run compares.
  const unsetCases: readonly Case[] = [
    { id: 'unset-img-default', path: 'img', tokens: '' },
    { id: 'unset-img-intrinsic', path: 'img', tokens: INTRINSIC },
    { id: 'unset-img-fill', path: 'img', tokens: '--image-width: 100%; --image-height: 100%;' },
    { id: 'unset-svg-default', path: 'svg', tokens: '' },
    { id: 'unset-svg-sized', path: 'svg', tokens: SIZED },
    { id: 'unset-svg-intrinsic', path: 'svg', tokens: INTRINSIC },
    {
      id: 'unset-svg-fill',
      path: 'svg',
      tokens: '--image-width: 100%; --image-height: 100%;'
    }
  ];

  const setCases: readonly Case[] = [
    { id: 'img-max-width-percent', path: 'img', tokens: `${INTRINSIC} --image-max-width: 100%;` },
    { id: 'img-max-height-length', path: 'img', tokens: `${INTRINSIC} --image-max-height: 50px;` },
    {
      id: 'img-max-both',
      path: 'img',
      tokens: `${INTRINSIC} --image-max-width: 100px; --image-max-height: 100px;`
    },
    { id: 'img-max-width-length', path: 'img', tokens: `${INTRINSIC} --image-max-width: 120px;` },
    {
      id: 'img-max-height-percent',
      path: 'img',
      tokens: `${INTRINSIC} --image-max-height: 100%;`
    },
    {
      id: 'img-max-larger-than-image',
      path: 'img',
      tokens: `${INTRINSIC} --image-max-width: 1000px; --image-max-height: 1000px;`
    },
    {
      id: 'img-max-none',
      path: 'img',
      tokens: `${INTRINSIC} --image-max-width: none; --image-max-height: none;`
    },
    { id: 'img-default-size-max-width', path: 'img', tokens: '--image-max-width: 12px;' },
    { id: 'img-default-size-max-height', path: 'img', tokens: '--image-max-height: 10px;' },
    {
      id: 'img-max-width-beats-width-token',
      path: 'img',
      tokens: '--image-width: 300px; --image-max-width: 120px;'
    },
    {
      id: 'img-max-width-contain',
      path: 'img',
      tokens: `${SIZED} --image-max-width: 100px; --image-object-fit: contain;`
    },
    { id: 'img-token-50', path: 'img', tokens: `${INTRINSIC} --image-max-width: 50px;` },
    {
      id: 'svg-max-width',
      path: 'svg',
      tokens: `${SIZED} --image-max-width: 100px;`
    },
    { id: 'svg-max-height', path: 'svg', tokens: `${SIZED} --image-max-height: 60px;` },
    {
      id: 'svg-max-both',
      path: 'svg',
      tokens: `${SIZED} --image-max-width: 100px; --image-max-height: 60px;`
    },
    {
      id: 'svg-max-width-percent',
      path: 'svg',
      tokens: `${SIZED} --image-max-width: 50%;`
    },
    {
      id: 'svg-max-none',
      path: 'svg',
      tokens: `${SIZED} --image-max-width: none; --image-max-height: none;`
    },
    { id: 'svg-token-50', path: 'svg', tokens: `${SIZED} --image-max-width: 50px;` }
  ];

  const params = new URLSearchParams(window.location.search);

  // An app's own reset, placed the way an app's stylesheet really sits relative to the
  // library's: ahead of it or behind it, with a specificity of (0,0,1), (0,0,0) from a
  // universal rule or from :where() (as Open Props writes its reset), or in a cascade
  // layer (Tailwind 4 keeps its preflight in one). A layer is ordered by where it is
  // first named, so `layer` names it ahead of the library's layer and `layer-after`
  // behind it.
  const BOTH_AXES = 'max-width: 100%; max-height: 100%;';
  const RESETS: Readonly<Record<string, { css: string; where: 'before' | 'after' }>> = {
    before: { css: `img, svg { ${BOTH_AXES} }`, where: 'before' },
    after: { css: `img, svg { ${BOTH_AXES} }`, where: 'after' },
    'star-before': { css: `* { ${BOTH_AXES} }`, where: 'before' },
    'star-after': { css: `* { ${BOTH_AXES} }`, where: 'after' },
    'where-before': { css: `:where(img, svg) { ${BOTH_AXES} }`, where: 'before' },
    'where-after': { css: `:where(img, svg) { ${BOTH_AXES} }`, where: 'after' },
    layer: { css: `@layer base { img, svg { ${BOTH_AXES} } }`, where: 'before' },
    'layer-after': { css: `@layer base { img, svg { ${BOTH_AXES} } }`, where: 'after' }
  };
  const requestedReset = params.get('reset');
  if (requestedReset !== null) {
    const reset = RESETS[requestedReset] ?? null;
    if (reset === null) {
      throw new Error(`Unknown reset "${requestedReset}"`);
    }
    const resetSheet = document.createElement('style');
    resetSheet.setAttribute('data-pw', 'fixture-reset');
    resetSheet.textContent = reset.css;
    if (reset.where === 'before') {
      document.head.prepend(resetSheet);
    } else {
      document.head.append(resetSheet);
    }
  }

  // The grid of host kinds is a second, larger matrix, so it is only on the page when asked for.
  const showHostKinds = params.get('hosts') === '1';

  onMount(() => {
    // An inlined <svg> is empty until its fetch resolves and an <img> has no size
    // until it has decoded; the page is ready once every one of them has. A page that
    // never settles says so, because a broken image measures 0x0 on both sides of a
    // comparison and a comparison of two zeros passes.
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const hosts = Array.from(document.querySelectorAll('svg[data-pw]'));
      const pictures = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-pw]'));
      const settled =
        hosts.every((host) => host.childElementCount > 0) &&
        pictures.every((picture) => picture.complete && picture.naturalWidth > 0);
      if (settled || Date.now() - startedAt > 10000) {
        window.clearInterval(timer);
        document.documentElement.dataset.fixtureReady = settled ? 'true' : 'timeout';
      }
    }, 20);
    return () => window.clearInterval(timer);
  });
</script>

<h1>Img max size</h1>

<!-- Every host is 200x100 and every image inside is 400x200 unless a token says otherwise. -->
{#each [...unsetCases, ...setCases] as scenario (scenario.id)}
  <div
    class="host"
    data-pw="host-{scenario.id}"
    data-unset={unsetCases.includes(scenario) ? 'true' : 'false'}
    style={scenario.tokens}
  >
    <Img
      src={scenario.path === 'svg' ? svgSrc : rasterSrc}
      alt=""
      inlineSvg={scenario.path === 'svg'}
      testId={scenario.id}
    />
  </div>
{/each}

<!-- Bare elements, not the component: what the page's own rules do to an image with no library CSS. -->
<div class="host" data-pw="host-twin-img">
  <img src={rasterSrc} alt="" data-pw="twin-img" style="width: auto; height: auto;" />
</div>
<div class="host" data-pw="host-twin-svg">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 200"
    width="400"
    height="200"
    data-pw="twin-svg"
  >
    <rect width="400" height="200" fill="#888" />
  </svg>
</div>

{#if showHostKinds}
  <HostKinds {rasterSrc} {svgSrc} />
{/if}

<!-- The shape of the app's own preview: a flex body with a definite box and an image capped to it. -->
<div
  class="preview-body"
  data-pw="preview-tokens"
  style="--image-max-width: 100%; --image-max-height: 100%; --image-object-fit: contain;"
>
  <Img src={rasterSrc} alt="" classes="preview-image-tokens" testId="preview-tokens-img" />
</div>
<div class="preview-body" data-pw="preview-class">
  <Img src={rasterSrc} alt="" classes="preview-image-class" testId="preview-class-img" />
</div>

<style>
  .host {
    width: 200px;
    height: 100px;
    margin: 0 0 8px;
  }

  .preview-body {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    height: 100px;
    margin: 0 0 8px;
    overflow: auto;
  }

  :global(.preview-image-tokens) {
    --image-width: auto;
    --image-height: auto;
  }

  /* The workaround an app writes today, for the tokens above to be measured against. */
  :global(.preview-image-class) {
    --image-width: auto;
    --image-height: auto;

    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
</style>
