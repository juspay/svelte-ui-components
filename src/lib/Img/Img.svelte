<script lang="ts">
  import type { ImgProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    src,
    alt,
    fallback,
    onerror: onerrorProp,
    onError,
    classes,
    inlineSvg,
    transformSvg,
    testId
  }: ImgProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onerror = $derived(
    resolveDeprecatedProp('Img', 'onError', 'onerror', onError, onerrorProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onerror);
  });

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

  /**
   * The host attributes this component writes itself. A fetched root may
   * legitimately overwrite one (an icon set's own role/aria-label), and the
   * src-change cleanup then has to put the component's value back rather than
   * just remove it: Svelte only re-applies its own attribute when `alt` or
   * `testId` changes, so a bare removal would leave the host with no role
   * until the next re-render.
   */
  /**
   * `alt` is a required `string` in `properties.ts`, which settles it for a
   * Svelte consumer and settles nothing for a web-component one: `<sui-img>`
   * takes its props from JavaScript, so an omitted `alt` arrives as undefined
   * and every `alt.length` below would throw where the compiler cannot see it.
   */
  const label = $derived(alt ?? '');

  function restoreHostOwnedAttribute(host: SVGSVGElement, name: string): boolean {
    const named = label.length > 0;
    switch (name.toLowerCase()) {
      case 'role':
        return setOrRemove(host, name, named ? 'img' : null);
      case 'aria-label':
        return setOrRemove(host, name, named ? label : null);
      case 'aria-hidden':
        return setOrRemove(host, name, named ? null : 'true');
      case 'data-pw':
      case 'testid':
        return setOrRemove(host, name, testId ?? null);
      default:
        return false;
    }
  }

  function setOrRemove(host: SVGSVGElement, name: string, value: string | null): boolean {
    if (value === null) {
      host.removeAttribute(name);
    } else {
      host.setAttribute(name, value);
    }
    return true;
  }

  function isSafeInlineRootAttribute(lowerCaseName: string): boolean {
    return SAFE_INLINE_ROOT_ATTRIBUTES.has(lowerCaseName) || lowerCaseName.startsWith('aria-');
  }

  /**
   * Descendants removed outright, because nothing static artwork needs is
   * expressed with them.
   *
   * `script` and `foreignObject` are the obvious two. The SMIL animation
   * elements are here because SMIL animates *any* attribute by name — `<set
   * attributeName="onclick" to="…">` plants an event handler, and `<animate
   * attributeName="xlink:href" values="javascript:…">` plants a URL — so a
   * guard that strips `on*` and bad hrefs at adoption time but keeps SMIL
   * only moves the same vector one element deeper, to be applied a frame
   * later. `use` stays: it is how real icon sets reference their own `defs`,
   * and where it points is handled by the URL rule below.
   */
  const REMOVED_ELEMENTS =
    'script, foreignObject, animate, animateMotion, animateTransform, set, mpath, discard';

  const URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'xlink:href', 'src']);

  /**
   * Whether a URL attribute points inside this same document (`#gradient`).
   *
   * Only a fragment survives. A `javascript:` URL is the classic vector, but
   * an ordinary remote URL is not safe either: on `<image href>` or `<use
   * href>` it fetches on adoption, which is a request the consumer's page
   * never asked to make, from markup the consumer did not write. A same
   * document reference can do neither.
   */
  function isSameDocumentReference(value: string): boolean {
    return value.trim().startsWith('#');
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
   * scripting elements, SMIL animation, `on*` handlers, and URL attributes
   * that leave this document.
   */
  function sanitizeInlinedSubtree(root: SVGSVGElement): void {
    for (const element of Array.from(root.querySelectorAll(REMOVED_ELEMENTS))) {
      element.remove();
    }
    for (const element of Array.from(root.querySelectorAll('*'))) {
      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        if (name.startsWith('on')) {
          element.removeAttribute(attribute.name);
          continue;
        }
        if (URL_ATTRIBUTES.has(name) && !isSameDocumentReference(attribute.value)) {
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

  /**
   * Resolves to the root attribute names this load copied onto the host, so
   * the next load can remove them first. Without that, an attribute the
   * previous file supplied (say `fill`) outlives a `src` change to a file that
   * does not, and the two icons blend. Early exits hand back `previouslyCopied`
   * untouched: nothing was painted, so nothing is owed.
   */
  async function loadInlineSvg(
    host: SVGSVGElement,
    url: string,
    transform: ((svg: string) => string) | null,
    signal: AbortSignal,
    previouslyCopied: readonly string[]
  ): Promise<readonly string[]> {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        failedInlineSrc = url;
        return previouslyCopied;
      }
      const rawSvg = await response.text();
      const hasTransform = typeof transform === 'function';
      const markup = hasTransform ? transform(rawSvg) : rawSvg;
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
      if (parsed.querySelector('parsererror') !== null) {
        failedInlineSrc = url;
        return previouslyCopied;
      }
      const sourceSvg = parsed.querySelector('svg');
      if (sourceSvg === null) {
        failedInlineSrc = url;
        return previouslyCopied;
      }
      // The action may have been torn down (or re-run) while awaiting the
      // body — bail before mutating so a stale fetch never paints over the
      // latest one.
      if (signal.aborted) {
        return previouslyCopied;
      }
      while (host.firstChild !== null) {
        host.removeChild(host.firstChild);
      }
      for (const name of previouslyCopied) {
        if (!restoreHostOwnedAttribute(host, name)) {
          host.removeAttribute(name);
        }
      }
      // With no transform the parsed root IS the fetched root, so every name
      // is network-supplied and only the allowlist applies. With a transform,
      // names absent from the raw payload were added by the caller's own hook
      // and pass through; if the raw payload only parses after the transform,
      // nothing can be attributed to the caller and the allowlist applies to
      // everything.
      const fetchedRootNames = hasTransform ? collectRootAttributeNames(rawSvg) : null;
      const accepted = Array.from(sourceSvg.attributes).filter((attribute) => {
        const name = attribute.name.toLowerCase();
        const addedByTransform = fetchedRootNames !== null && !fetchedRootNames.has(name);
        return name !== 'class' && (isSafeInlineRootAttribute(name) || addedByTransform);
      });
      for (const attribute of accepted) {
        host.setAttribute(attribute.name, attribute.value);
      }
      const copied = accepted.map((attribute) => attribute.name);
      // Before adoption, not after: an event-handler attribute becomes a live
      // handler as soon as its element enters the document.
      sanitizeInlinedSubtree(sourceSvg);
      while (sourceSvg.firstChild !== null) {
        host.appendChild(sourceSvg.firstChild);
      }
      return copied;
    } catch {
      if (!signal.aborted) {
        failedInlineSrc = url;
      }
      return previouslyCopied;
    }
  }

  function inlineSvgInto(host: SVGSVGElement, params: InlineParams) {
    let controller = new AbortController();
    let copied: readonly string[] = [];

    function load(current: InlineParams): void {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      void loadInlineSvg(host, current.url, current.transform, signal, copied).then((names) => {
        // A superseded load resolves after the one that replaced it may
        // already have recorded its own names; only the live load may write.
        if (!signal.aborted) {
          copied = names;
        }
      });
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
    role={label.length > 0 ? 'img' : null}
    aria-label={label.length > 0 ? label : null}
    aria-hidden={label.length === 0 ? 'true' : null}
    data-pw={testId}
    testID={testId}
  ></svg>
{:else}
  <img
    class={classes ?? ''}
    src={currentSrc}
    alt={label}
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
