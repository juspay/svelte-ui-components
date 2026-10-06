import type { Locator } from '@playwright/test';

/**
 * Contrast measured from what the browser actually painted, not from the
 * declared colours.
 *
 * A style-only check reads `color` and `background` and cannot see a gradient,
 * an overlay, an opacity or a filter -- which is exactly where a label's real
 * contrast goes wrong. So the same box is captured twice, once as painted and
 * once with the glyphs made transparent, and each glyph pixel is scored against
 * the backdrop pixel painted underneath it.
 *
 * Only pixels the glyph fully covers are used as foreground. A partly covered
 * antialiased edge is a blend of ink and backdrop, and scoring it as ink reads
 * as low contrast on every label regardless of its colours.
 */
export type PairedContrast = {
  readonly width: number;
  readonly height: number;
  /** The colour the glyphs paint, taken from the pixels they cover most strongly. */
  readonly foregroundReference: readonly [number, number, number];
  /** How many fully covered glyph pixels were scored; a handful would be a weak sample. */
  readonly interiorPixels: number;
  /** Worst ratio over the fully covered glyph pixels. */
  readonly interiorMin: number;
  /** 5th percentile of the same, which ignores a stray pixel. */
  readonly interiorP5: number;
  /**
   * Worst ratio of the foreground reference against EVERY backdrop pixel in the
   * label box, glyph or not: the worst colour the label could meet if its text
   * or width changed.
   */
  readonly boxMin: number;
  /** Largest per-channel difference between any two backdrop pixels; 0 for a flat fill. */
  readonly backdropSpread: number;
};

type Analysis = PairedContrast | { readonly error: 'geometry-changed' | 'no-visible-ink' };

/**
 * Runs inside the page, so it must be self-contained: Playwright serialises it,
 * and nothing from this module's scope exists there.
 */
const analysePair = async (input: { inkB64: string; backB64: string }): Promise<Analysis> => {
  const decode = async (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) {
      throw new Error('2d canvas context unavailable');
    }
    context.drawImage(bitmap, 0, 0);
    return {
      width: bitmap.width,
      height: bitmap.height,
      data: context.getImageData(0, 0, bitmap.width, bitmap.height).data
    };
  };
  const linear = (value: number): number => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (r: number, g: number, b: number): number =>
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const ratio = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  const ink = await decode(input.inkB64);
  const back = await decode(input.backB64);
  if (ink.width !== back.width || ink.height !== back.height) {
    return { error: 'geometry-changed' };
  }

  const count = ink.width * ink.height;
  const diff = new Float32Array(count);
  let maxDiff = 0;
  for (let index = 0; index < count; index++) {
    const offset = index * 4;
    const delta = Math.max(
      Math.abs(ink.data[offset] - back.data[offset]),
      Math.abs(ink.data[offset + 1] - back.data[offset + 1]),
      Math.abs(ink.data[offset + 2] - back.data[offset + 2])
    );
    diff[index] = delta;
    maxDiff = Math.max(maxDiff, delta);
  }
  if (maxDiff <= 8) {
    return { error: 'no-visible-ink' };
  }

  // Foreground reference: the modal colour among the strongest-ink pixels.
  const painted = Array.from(diff)
    .filter((value) => value > 8)
    .sort((a, b) => a - b);
  const cut = painted[Math.floor(painted.length * 0.99)];
  const tally = new Map<string, number>();
  for (let index = 0; index < count; index++) {
    if (diff[index] >= cut) {
      const offset = index * 4;
      const key = `${ink.data[offset]},${ink.data[offset + 1]},${ink.data[offset + 2]}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  const [reference] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const [fr, fg, fb] = reference.split(',').map(Number);
  const foregroundLuminance = luminance(fr, fg, fb);

  const interior: number[] = [];
  let boxMin = Infinity;
  const low = [255, 255, 255];
  const high = [0, 0, 0];
  for (let index = 0; index < count; index++) {
    const offset = index * 4;
    const r = back.data[offset];
    const g = back.data[offset + 1];
    const b = back.data[offset + 2];
    const backdropLuminance = luminance(r, g, b);
    boxMin = Math.min(boxMin, ratio(foregroundLuminance, backdropLuminance));
    [r, g, b].forEach((channel, position) => {
      low[position] = Math.min(low[position], channel);
      high[position] = Math.max(high[position], channel);
    });
    const coversFully =
      diff[index] > 8 &&
      Math.abs(ink.data[offset] - fr) <= 4 &&
      Math.abs(ink.data[offset + 1] - fg) <= 4 &&
      Math.abs(ink.data[offset + 2] - fb) <= 4;
    if (coversFully) {
      interior.push(
        ratio(
          luminance(ink.data[offset], ink.data[offset + 1], ink.data[offset + 2]),
          backdropLuminance
        )
      );
    }
  }
  interior.sort((a, b) => a - b);
  const percentile = (fraction: number): number =>
    interior[Math.min(interior.length - 1, Math.floor(interior.length * fraction))];
  const round = (value: number): number => Math.round(value * 1000) / 1000;

  return {
    width: ink.width,
    height: ink.height,
    foregroundReference: [fr, fg, fb],
    interiorPixels: interior.length,
    interiorMin: interior.length > 0 ? round(interior[0]) : 0,
    interiorP5: interior.length > 0 ? round(percentile(0.05)) : 0,
    boxMin: round(boxMin),
    backdropSpread: Math.max(...high.map((channel, position) => channel - low[position]))
  };
};

/** Waits until the element has stopped moving, so both captures see one geometry. */
const waitForStableBox = async (target: Locator): Promise<void> => {
  let previous = '';
  let stableReads = 0;
  for (let attempt = 0; attempt < 40 && stableReads < 3; attempt++) {
    const box = JSON.stringify(await target.boundingBox());
    stableReads = box === previous ? stableReads + 1 : 0;
    previous = box;
    await target.page().waitForTimeout(100);
  }
  if (stableReads < 3) {
    throw new Error('element never stopped moving; a capture pair would compare two geometries');
  }
};

/**
 * Captures `target` as painted and with its glyphs hidden, and scores the pair.
 * `target` is the element that holds the text (its box is the label extent).
 * Whatever state the page is in (hover, focus, pressed) is what gets measured,
 * so the caller sets it up first.
 */
export const measurePairedContrast = async (target: Locator): Promise<PairedContrast> => {
  await waitForStableBox(target);
  const svgBox = await target.evaluate((node) => {
    if (!(node instanceof SVGElement)) {
      return null;
    }
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  // WebKit's element screenshot box for SVG text can differ from its native
  // DOM rectangle. Use that actual rectangle for both captures, as the
  // calibrated rendered-contrast probe does; HTML measurements stay unchanged.
  const capture = () =>
    svgBox === null
      ? target.screenshot({ animations: 'disabled' })
      : target.page().screenshot({ animations: 'disabled', clip: svgBox });
  const ink = await capture();

  const previousStyle = await target.evaluate((node) => {
    const previous = node.getAttribute('style');
    node.style.setProperty('color', 'transparent', 'important');
    node.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
    node.style.setProperty('text-shadow', 'none', 'important');
    if (node instanceof SVGElement) {
      node.style.setProperty('fill', 'transparent', 'important');
      node.style.setProperty('stroke', 'transparent', 'important');
    }
    return previous;
  });
  let backdrop: Buffer;
  try {
    backdrop = await capture();
  } finally {
    await target.evaluate((node, previous) => {
      if (previous === null) {
        node.removeAttribute('style');
      } else {
        node.setAttribute('style', previous);
      }
    }, previousStyle);
  }

  const result = await target.page().evaluate(analysePair, {
    inkB64: ink.toString('base64'),
    backB64: backdrop.toString('base64')
  });
  if ('error' in result) {
    throw new Error(`paired capture could not be scored: ${result.error}`);
  }
  return result;
};
