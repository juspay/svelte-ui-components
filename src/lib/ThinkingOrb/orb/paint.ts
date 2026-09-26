/**
 * Turns one `Frame` into canvas calls. The only place that knows about
 * colour -- a mode never sees `tint`, only the 0..1 `ink` it assigns each
 * mark.
 */

import type { Rgb } from '../../types';
import type { Frame } from './types';

/** What `paintFrame` needs beyond the frame itself: the base colour. */
export type PaintOptions = {
  tint: Rgb;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Every mark draws in the tint colour itself -- an exact, testable colour
 * string that never changes with depth. Depth is expressed as transparency
 * instead (see `inkAlpha`), so a mark reads correctly against any
 * background rather than only a solid white or black one.
 */
export const inkColor = (tint: Rgb): string => `rgb(${tint.r} ${tint.g} ${tint.b})`;

/**
 * Maps `ink` (0 = fully opaque) to the opacity a mark paints at: it fades
 * toward fully transparent as `ink` rises, multiplied with the mark's own
 * `alpha` so the two fades compound rather than override each other.
 */
export const inkAlpha = (ink: number, alpha: number): number =>
  clamp01(1 - clamp01(ink)) * clamp01(alpha);

/**
 * Clears the canvas and draws a `Frame`: every stroke, then every dot, each
 * group sorted far-to-near by `depth` so nearer marks are painted last and
 * sit on top.
 */
export const paintFrame = (
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  options: PaintOptions
): void => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const color = inkColor(options.tint);

  const strokes = [...frame.strokes].sort((a, b) => a.depth - b.depth);
  for (const stroke of strokes) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = inkAlpha(stroke.ink, stroke.alpha);
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    ctx.stroke();
  }

  const dots = [...frame.dots].sort((a, b) => a.depth - b.depth);
  for (const dot of dots) {
    ctx.fillStyle = color;
    ctx.globalAlpha = inkAlpha(dot.ink, dot.alpha);
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};
