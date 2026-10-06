import type { Locator, Page } from '@playwright/test';

/**
 * Rendered-paint contrast for text, measured from real pixels in whatever engine
 * the test runs in -- not from style tokens.
 *
 * A token check cannot see the failure this exists for: `background-clip: text`
 * paints a shimmer GRADIENT through the glyphs, so the colour a reader gets is
 * decided by the gradient position at that instant, over whatever surface sits
 * behind it. Four captures of the same box answer it exactly:
 *
 *   backdrop  every glyph transparent                    -> the surface under the text
 *   mask      glyphs painted solid, in a contrasting ink -> exact glyph coverage
 *   paint     each text node's paint SOURCE (a flat fill, or the un-clipped
 *             gradient at the paused phase) filled into its own box
 *                                                        -> the exact glyph colour,
 *                                                           free of antialiasing
 *   ink       the element as actually painted            -> returned as evidence
 *
 * The score is WCAG contrast(paint pixel, backdrop pixel) over the pixels the mask
 * says the glyphs cover. The shimmer is sampled by PAUSING its Web Animation at
 * evenly spaced phases (`Animation.currentTime`) -- the page keeps native
 * `requestAnimationFrame` and CSS rendering; no clock is frozen.
 *
 * `p1` (1st percentile) is the pass criterion rather than the single worst pixel:
 * a lone pixel at the fractional edge of the paint box can read as the backdrop
 * itself, while a genuinely low-contrast shimmer band covers far more than 1% of
 * the glyph pixels (the audit's 1.88:1 phase was 100% of them).
 */

export type ContrastSample = {
  /** Fraction of the shimmer cycle (0..1), or null for a static paint. */
  readonly phase: number | null;
  readonly min: number;
  readonly p1: number;
  /** Share of glyph pixels under the threshold. */
  readonly fractionBelow: number;
  readonly worstPaint: readonly [number, number, number];
  readonly worstBackdrop: readonly [number, number, number];
};

export type PaintContrast = {
  readonly threshold: number;
  readonly glyphPixels: number;
  readonly animated: boolean;
  readonly samples: readonly ContrastSample[];
  /** Lowest `p1` across the sampled phases. */
  readonly p1: number;
  /** Lowest single-pixel ratio across the sampled phases. */
  readonly min: number;
  /** PNG captures of the worst-`p1` phase, for attaching to a report. */
  readonly evidence: { readonly ink: Buffer; readonly paint: Buffer };
};

export type PaintContrastOptions = {
  /** Shimmer samples per cycle for an animated label. Default 8. */
  readonly phases?: number;
};

type Layer = 'backdrop' | 'mask' | 'paint';

declare global {
  interface Window {
    /** Inline styles to put back after a layer capture (see `applyLayer` / `restoreLayer`). */
    __contrastSaved?: ReadonlyArray<readonly [Element, string | null]>;
  }
}

const pausePhase = async (target: Locator, fraction: number): Promise<void> => {
  await target.evaluate((element, phase) => {
    for (const animation of element.getAnimations()) {
      if (!(animation instanceof CSSAnimation) || !/shimmer/.test(animation.animationName)) {
        continue;
      }
      animation.pause();
      const duration = Number(animation.effect?.getComputedTiming().duration ?? 0);
      animation.currentTime = phase * duration;
    }
  }, fraction);
};

const isShimmering = async (target: Locator): Promise<boolean> =>
  target.evaluate((element) =>
    element
      .getAnimations()
      .some(
        (animation) => animation instanceof CSSAnimation && /shimmer/.test(animation.animationName)
      )
  );

const applyLayer = async (target: Locator, layer: Layer): Promise<void> => {
  await target.evaluate((root, mode) => {
    const nodes: (HTMLElement | SVGElement)[] = [root];
    for (const descendant of Array.from(root.querySelectorAll('*'))) {
      if (descendant instanceof HTMLElement || descendant instanceof SVGElement) {
        nodes.push(descendant);
      }
    }
    const alphaOf = (colour: string): number => {
      const match = /rgba?\(([^)]+)\)/.exec(colour);
      if (match === null) {
        return 1;
      }
      const parts = match[1].split(',').map(Number);
      return typeof parts[3] === 'number' ? parts[3] : 1;
    };

    // Snapshot first: making an ancestor transparent changes what its descendants inherit.
    const snapshot = nodes.map((node) => {
      const style = getComputedStyle(node);
      const clip = style.getPropertyValue('-webkit-background-clip') || style.backgroundClip;
      const fill = style.getPropertyValue('-webkit-text-fill-color');
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        clipText: clip.includes('text'),
        fill: fill && fill !== 'currentcolor' ? fill : style.color,
        svgFill: style.fill,
        svgStroke: style.stroke,
        borders: ['top', 'bottom', 'left', 'right'].map((edge) =>
          style.getPropertyValue(`border-${edge}-color`)
        ),
        ownsText: Array.from(node.childNodes).some(
          (child) => child.nodeType === 3 && (child.textContent ?? '').trim().length > 0
        )
      };
    });

    let maskInk = '#000';
    if (mode === 'mask') {
      let probe: Element | null = root;
      let surface: number[] | null = null;
      while (probe !== null && surface === null) {
        const colour = getComputedStyle(probe).backgroundColor;
        const match = /rgba?\(([^)]+)\)/.exec(colour);
        if (match !== null) {
          const parts = match[1].split(',').map(Number);
          if ((typeof parts[3] === 'number' ? parts[3] : 1) > 0.5) {
            surface = parts;
          }
        }
        probe = probe.parentElement;
      }
      const luminance =
        surface === null ? 255 : 0.2126 * surface[0] + 0.7152 * surface[1] + 0.0722 * surface[2];
      maskInk = luminance > 128 ? '#000' : '#fff';
    }

    window.__contrastSaved = nodes.map((node) => [node, node.getAttribute('style')] as const);

    nodes.forEach((node, index) => {
      const state = snapshot[index];
      const set = (property: string, value: string): void =>
        node.style.setProperty(property, value, 'important');
      ['top', 'bottom', 'left', 'right'].forEach((edge, k) =>
        set(`border-${edge}-color`, state.borders[k])
      );
      const isSvgShape =
        node instanceof SVGElement && !['text', 'tspan'].includes(node.tagName.toLowerCase());
      if (isSvgShape) {
        set('fill', state.svgFill);
        set('stroke', state.svgStroke);
        return;
      }

      if (mode === 'paint') {
        const keepSurface = (): void => {
          set('background-color', state.clipText ? 'transparent' : state.backgroundColor);
          set('background-image', state.clipText ? 'none' : state.backgroundImage);
        };
        if (!state.ownsText) {
          keepSurface();
        } else {
          set('background-clip', 'border-box');
          set('-webkit-background-clip', 'border-box');
          if (alphaOf(state.fill) > 0.5) {
            set('background-image', 'none');
            set('background-color', state.fill);
          } else if (state.clipText) {
            set('background-color', 'transparent');
          } else {
            keepSurface();
          }
        }
        set('color', 'transparent');
        set('-webkit-text-fill-color', 'transparent');
        set('text-shadow', 'none');
        return;
      }

      set('background-color', state.clipText ? 'transparent' : state.backgroundColor);
      set('background-image', state.clipText ? 'none' : state.backgroundImage);
      const ink = mode === 'mask' ? maskInk : 'transparent';
      set('color', ink);
      set('-webkit-text-fill-color', ink);
      set('text-shadow', 'none');
      set('animation', 'none');
      if (node instanceof SVGElement) {
        set('fill', ink);
      }
    });
  }, layer);
};

const restoreLayer = async (target: Locator): Promise<void> => {
  await target.evaluate(() => {
    for (const [node, style] of window.__contrastSaved ?? []) {
      if (style === null) {
        node.removeAttribute('style');
      } else {
        node.setAttribute('style', style);
      }
    }
    delete window.__contrastSaved;
  });
};

const capture = async (target: Locator): Promise<Buffer> =>
  target.screenshot({ animations: 'allow' });

const captureLayer = async (target: Locator, layer: Layer): Promise<Buffer> => {
  await applyLayer(target, layer);
  try {
    return await capture(target);
  } finally {
    await restoreLayer(target);
  }
};

type Scored = {
  glyphPixels: number;
  min: number;
  p1: number;
  fractionBelow: number;
  worstPaint: [number, number, number];
  worstBackdrop: [number, number, number];
};

/** Decodes the PNGs inside the page (any engine can) and scores glyph pixels. */
const score = async (
  page: Page,
  backdrop: Buffer,
  mask: Buffer,
  paint: Buffer,
  threshold: number
): Promise<Scored> =>
  page.evaluate(
    async ({ backdropB64, maskB64, paintB64, limit }) => {
      const decode = async (base64: string): Promise<ImageData> => {
        const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context === null) {
          throw new Error('2d canvas unavailable');
        }
        context.drawImage(bitmap, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const [back, maskImage, paintImage] = await Promise.all([
        decode(backdropB64),
        decode(maskB64),
        decode(paintB64)
      ]);
      if (
        back.width !== maskImage.width ||
        back.width !== paintImage.width ||
        back.height !== maskImage.height ||
        back.height !== paintImage.height
      ) {
        throw new Error('layer captures differ in size: the element reflowed between captures');
      }

      const linear = (channel: number): number => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (r: number, g: number, b: number): number =>
        0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

      // Mask ink: the extreme furthest from the backdrop's median brightness.
      const brightness: number[] = [];
      for (let i = 0; i < back.data.length; i += 4) {
        brightness.push(luminance(back.data[i], back.data[i + 1], back.data[i + 2]));
      }
      brightness.sort((a, b) => a - b);
      const maskIsBlack = brightness[Math.floor(brightness.length / 2)] > 0.4;
      const inkValue = maskIsBlack ? 0 : 255;

      const ratios: number[] = [];
      const worst: {
        ratio: number;
        paint: [number, number, number];
        backdrop: [number, number, number];
      } = { ratio: Infinity, paint: [0, 0, 0], backdrop: [0, 0, 0] };
      for (let i = 0; i < back.data.length; i += 4) {
        let coverage = 0;
        let used = 0;
        for (let c = 0; c < 3; c += 1) {
          const denominator = Math.abs(back.data[i + c] - inkValue);
          if (denominator > 40) {
            coverage += Math.abs(back.data[i + c] - maskImage.data[i + c]) / denominator;
            used += 1;
          }
        }
        if (used === 0 || coverage / used < 0.5) {
          continue;
        }
        const lp = luminance(paintImage.data[i], paintImage.data[i + 1], paintImage.data[i + 2]);
        const lb = luminance(back.data[i], back.data[i + 1], back.data[i + 2]);
        const ratio = (Math.max(lp, lb) + 0.05) / (Math.min(lp, lb) + 0.05);
        ratios.push(ratio);
        if (ratio < worst.ratio) {
          worst.ratio = ratio;
          worst.paint = [paintImage.data[i], paintImage.data[i + 1], paintImage.data[i + 2]];
          worst.backdrop = [back.data[i], back.data[i + 1], back.data[i + 2]];
        }
      }
      if (ratios.length === 0) {
        throw new Error('no glyph pixels found: the target has no painted text');
      }
      ratios.sort((a, b) => a - b);
      const percentile = (p: number): number =>
        ratios[Math.min(ratios.length - 1, Math.floor((p / 100) * ratios.length))];
      return {
        glyphPixels: ratios.length,
        min: ratios[0],
        p1: percentile(1),
        fractionBelow: ratios.filter((ratio) => ratio < limit).length / ratios.length,
        worstPaint: worst.paint,
        worstBackdrop: worst.backdrop
      };
    },
    {
      backdropB64: backdrop.toString('base64'),
      maskB64: mask.toString('base64'),
      paintB64: paint.toString('base64'),
      limit: threshold
    }
  );

/**
 * Measures the text inside `target` (the element itself, plus descendants). Pass the
 * element that owns the glyphs -- the label span, not a distant ancestor -- so the
 * capture box is tight and the backdrop is the surface the reader actually has.
 */
export const measurePaintContrast = async (
  page: Page,
  target: Locator,
  options: PaintContrastOptions = {}
): Promise<PaintContrast> => {
  await target.scrollIntoViewIfNeeded();
  const animated = await isShimmering(target);
  const phaseCount = options.phases ?? 8;
  const fractions = animated
    ? Array.from({ length: phaseCount }, (_, index) => index / phaseCount)
    : [null];

  const fontSize = Number.parseFloat(
    await target.evaluate((element) => getComputedStyle(element).fontSize)
  );
  const fontWeight =
    Number.parseInt(await target.evaluate((element) => getComputedStyle(element).fontWeight), 10) ||
    400;
  const threshold = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;

  // Ink first: lifting the `animation: none` the backdrop/mask layers set restarts a
  // finite entrance animation, and a capture right after would catch it mid-fade.
  const phased: { fraction: number | null; ink: Buffer; paint: Buffer }[] = [];
  for (const fraction of fractions) {
    if (fraction !== null) {
      await pausePhase(target, fraction);
    }
    const ink = await capture(target);
    const paint = await captureLayer(target, 'paint');
    phased.push({ fraction, ink, paint });
  }
  const backdrop = await captureLayer(target, 'backdrop');
  const mask = await captureLayer(target, 'mask');

  const samples: ContrastSample[] = [];
  let glyphPixels = 0;
  let worstIndex = 0;
  for (const [index, entry] of phased.entries()) {
    const scored = await score(page, backdrop, mask, entry.paint, threshold);
    glyphPixels = Math.max(glyphPixels, scored.glyphPixels);
    samples.push({
      phase: entry.fraction,
      min: scored.min,
      p1: scored.p1,
      fractionBelow: scored.fractionBelow,
      worstPaint: scored.worstPaint,
      worstBackdrop: scored.worstBackdrop
    });
    if (scored.p1 < samples[worstIndex].p1) {
      worstIndex = index;
    }
  }

  return {
    threshold,
    glyphPixels,
    animated,
    samples,
    p1: Math.min(...samples.map((sample) => sample.p1)),
    min: Math.min(...samples.map((sample) => sample.min)),
    evidence: { ink: phased[worstIndex].ink, paint: phased[worstIndex].paint }
  };
};

/** True when the shimmer keyframes are present on the element (used to assert motion survives). */
export const hasRunningShimmer = async (target: Locator): Promise<boolean> =>
  target.evaluate((element) =>
    element
      .getAnimations()
      .some(
        (animation) =>
          animation instanceof CSSAnimation &&
          /shimmer/.test(animation.animationName) &&
          animation.playState === 'running'
      )
  );
