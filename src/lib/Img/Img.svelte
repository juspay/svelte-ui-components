<script lang="ts">
  import type { ImgProperties } from './properties';

  let {
    src,
    alt,
    fallback,
    onerror: onerrorLegacy,
    onError,
    classes,
    inlineSvg,
    transformSvg,
    testId
  }: ImgProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onerror = $derived(onError ?? onerrorLegacy);

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

  // Root attributes that may be copied from fetched SVG markup onto the live
  // <svg> host. The fetched document is remote, untrusted content — copying
  // every attribute (the previous behaviour) let it plant executable `on*`
  // handlers on an element in the host page, clobber the data-pw/testID test
  // hooks, or override the component's CSS sizing contract with an inline
  // style. An allowlist rather than an `on*` denylist is deliberate: a
  // denylist misses vectors like `xlink:href="javascript:…"` and whatever
  // attribute ships in browsers next. The names kept are what inlining
  // actually needs — geometry/scaling, the namespace declarations exporters
  // emit, the inheritable paint attributes that keep the icon's authored
  // defaults while page CSS/currentColor themes it, and the accessibility
  // metadata real icon sets ship (role, focusable, aria-*). `class` stays
  // caller-owned via the `classes` prop, as before. Compared lowercased, so
  // entries are lowercase (viewBox → 'viewbox') while the authored casing is
  // preserved when the attribute is written to the host.
  const SAFE_INLINE_ROOT_ATTRIBUTES: ReadonlySet<string> = new Set([
    'xmlns',
    'xmlns:xlink',
    'viewbox',
    'width',
    'height',
    'x',
    'y',
    'preserveaspectratio',
    'fill',
    'fill-opacity',
    'fill-rule',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'clip-rule',
    'color',
    'opacity',
    'overflow',
    'role',
    'focusable'
  ]);

  function isSafeInlineRootAttribute(lowerCaseName: string): boolean {
    return SAFE_INLINE_ROOT_ATTRIBUTES.has(lowerCaseName) || lowerCaseName.startsWith('aria-');
  }

  /**
   * Strips executable content from a fetched SVG's descendants.
   *
   * The root allowlist above only guards the root. Children are adopted into
   * the live document wholesale, and an event-handler content attribute
   * becomes a live handler the moment its element is adopted — so
   * `<image onerror="…">` two levels down runs exactly like `onerror` on the
   * root would. A root-only guard would look like a fix while leaving the same
   * vector open one element deeper.
   *
   * A denylist rather than an allowlist here, deliberately: descendants
   * legitimately carry the entire SVG geometry and paint vocabulary (`d`,
   * `transform`, `gradientUnits`, …), so enumerating what is permitted would
   * break real artwork. What is dangerous is narrow and well understood:
   * scripting elements, `on*` handlers, and URL attributes pointing at
   * `javascript:`.
   */
  function sanitizeInlinedSubtree(root: SVGSVGElement): void {
    for (const element of Array.from(root.querySelectorAll('script, foreignObject'))) {
      element.remove();
    }
    for (const element of Array.from(root.querySelectorAll('*'))) {
      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        if (name.startsWith('on')) {
          element.removeAttribute(attribute.name);
          continue;
        }
        // `href`, `xlink:href` and `src` accept a javascript: URL, which runs
        // on activation of an <a> wrapper or on load of a nested resource.
        const isUrlAttribute = name === 'href' || name === 'xlink:href' || name === 'src';
        if (isUrlAttribute && /^\s*javascript:/i.test(attribute.value)) {
          element.removeAttribute(attribute.name);
        }
      }
    }
  }

  // Root attribute names of the raw fetched markup, lowercased — or null when
  // that markup does not parse as SVG on its own. Distinguishes what arrived
  // over the network (untrusted, the allowlist applies) from what the caller's
  // transformSvg hook added (caller intent, passes through).
  function collectRootAttributeNames(markup: string): ReadonlySet<string> | null {
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (parsed.querySelector('parsererror') !== null) {
      return null;
    }
    const root = parsed.querySelector('svg');
    if (root === null) {
      return null;
    }
    return new Set(Array.from(root.attributes, (attribute) => attribute.name.toLowerCase()));
  }

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
      const hasTransform = typeof transform === 'function';
      const markup = hasTransform ? transform(rawSvg) : rawSvg;
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
      // With no transform the parsed root IS the fetched root, so every name
      // is network-supplied and only the allowlist applies. With a transform,
      // names absent from the raw payload were added by the caller's own hook
      // and pass through; if the raw payload only parses after the transform,
      // nothing can be attributed to the caller and the allowlist applies to
      // everything.
      const fetchedRootNames = hasTransform ? collectRootAttributeNames(rawSvg) : null;
      for (const attribute of Array.from(sourceSvg.attributes)) {
        const name = attribute.name.toLowerCase();
        if (name === 'class') {
          continue;
        }
        const addedByTransform = fetchedRootNames !== null && !fetchedRootNames.has(name);
        if (isSafeInlineRootAttribute(name) || addedByTransform) {
          host.setAttribute(attribute.name, attribute.value);
        }
      }
      // Before adoption, not after: an event-handler attribute becomes a live
      // handler as soon as its element enters the document.
      sanitizeInlinedSubtree(sourceSvg);
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
    data-pw={testId}
    testID={testId}
  ></svg>
{:else}
  <img
    class={classes ?? ''}
    src={currentSrc}
    {alt}
    onerror={handleFallback}
    data-pw={testId}
    testID={testId}
  />
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
