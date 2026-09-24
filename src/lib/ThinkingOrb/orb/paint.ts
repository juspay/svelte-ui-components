/**
 * Turns one `Frame` into canvas calls. The only place that knows about theme
 * and colour -- a mode never sees `dark` or `tint`, only the 0..1 `ink` it
 * assigns each mark.
 */

import type { Rgb } from '../../types';
import type { Frame } from './types';

/** What `paintFrame` needs beyond the frame itself: the theme and the base colour. */
export type PaintOptions = {
  dark: boolean;
  tint: Rgb;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Maps `ink` (0 = full `tint`) to an exact, testable colour string: fading
 * toward white in light theme and toward black in dark theme, so a mark
 * further away can fade into either background without ever reading as the
 * wrong theme's ink.
 */
export const inkColor = (tint: Rgb, ink: number, dark: boolean): string => {
  const amount = clamp01(ink);
  const fadeTo = dark ? 0 : 255;
  const r = Math.round(tint.r + (fadeTo - tint.r) * amount);
  const g = Math.round(tint.g + (fadeTo - tint.g) * amount);
  const b = Math.round(tint.b + (fadeTo - tint.b) * amount);
  return `rgb(${r} ${g} ${b})`;
};

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

  const strokes = [...frame.strokes].sort((a, b) => a.depth - b.depth);
  for (const stroke of strokes) {
    ctx.strokeStyle = inkColor(options.tint, stroke.ink, options.dark);
    ctx.globalAlpha = clamp01(stroke.alpha);
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    ctx.stroke();
  }

  const dots = [...frame.dots].sort((a, b) => a.depth - b.depth);
  for (const dot of dots) {
    ctx.fillStyle = inkColor(options.tint, dot.ink, options.dark);
    ctx.globalAlpha = clamp01(dot.alpha);
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};
