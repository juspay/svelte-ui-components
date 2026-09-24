import { describe, expect, it } from 'vitest';
import { inkColor, paintFrame } from './paint';
import type { Dot, Frame, Stroke } from './types';

type RecordedCall =
  | { type: 'clear'; width: number; height: number }
  | {
      type: 'stroke';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      alpha: number;
      color: string;
    }
  | { type: 'dot'; x: number; y: number; radius: number; alpha: number; color: string };

/**
 * Just enough of `CanvasRenderingContext2D` for `paintFrame` to run against,
 * recording each finished draw call (not each individual method) in the
 * order it happened -- which is what lets these tests assert on draw order
 * and on exact colour strings without a real canvas.
 */
const createRecordingContext = (
  width: number,
  height: number
): { ctx: CanvasRenderingContext2D; calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];
  const path = { moveX: 0, moveY: 0, lineX: 0, lineY: 0, arcX: 0, arcY: 0, arcRadius: 0 };

  const ctx = {
    canvas: { width, height },
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    clearRect(_x: number, _y: number, w: number, h: number): void {
      calls.push({ type: 'clear', width: w, height: h });
    },
    beginPath(): void {},
    moveTo(x: number, y: number): void {
      path.moveX = x;
      path.moveY = y;
    },
    lineTo(x: number, y: number): void {
      path.lineX = x;
      path.lineY = y;
    },
    stroke(): void {
      calls.push({
        type: 'stroke',
        x1: path.moveX,
        y1: path.moveY,
        x2: path.lineX,
        y2: path.lineY,
        width: ctx.lineWidth,
        alpha: ctx.globalAlpha,
        color: ctx.strokeStyle
      });
    },
    arc(x: number, y: number, radius: number): void {
      path.arcX = x;
      path.arcY = y;
      path.arcRadius = radius;
    },
    fill(): void {
      calls.push({
        type: 'dot',
        x: path.arcX,
        y: path.arcY,
        radius: path.arcRadius,
        alpha: ctx.globalAlpha,
        color: ctx.fillStyle
      });
    }
  };

  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
};

const dot = (overrides: Partial<Dot>): Dot => ({
  x: 0,
  y: 0,
  depth: 0.5,
  radius: 2,
  ink: 0,
  alpha: 1,
  ...overrides
});

const stroke = (overrides: Partial<Stroke>): Stroke => ({
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  depth: 0.5,
  width: 1,
  ink: 0,
  alpha: 1,
  ...overrides
});

const TINT = { r: 100, g: 150, b: 200 };

describe('inkColor', () => {
  it('is exactly the tint at ink 0, regardless of theme', () => {
    expect(inkColor(TINT, 0, false)).toBe('rgb(100 150 200)');
    expect(inkColor(TINT, 0, true)).toBe('rgb(100 150 200)');
  });

  it('fades to exactly white at ink 1 in light theme', () => {
    expect(inkColor(TINT, 1, false)).toBe('rgb(255 255 255)');
  });

  it('fades to exactly black at ink 1 in dark theme', () => {
    expect(inkColor(TINT, 1, true)).toBe('rgb(0 0 0)');
  });

  it('is exactly the midpoint at ink 0.5', () => {
    expect(inkColor(TINT, 0.5, false)).toBe('rgb(178 203 228)');
    expect(inkColor(TINT, 0.5, true)).toBe('rgb(50 75 100)');
  });

  it('clamps ink outside 0..1 to the same endpoints', () => {
    expect(inkColor(TINT, -1, false)).toBe(inkColor(TINT, 0, false));
    expect(inkColor(TINT, 2, false)).toBe(inkColor(TINT, 1, false));
  });
});

describe('paintFrame', () => {
  it('clears using the context canvas size, before anything else', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    paintFrame(ctx, { dots: [], strokes: [] }, { dark: false, tint: TINT });
    expect(calls).toEqual([{ type: 'clear', width: 64, height: 64 }]);
  });

  it('draws every stroke before any dot', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({})],
      dots: [dot({})]
    };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    const kinds = calls.map((call) => call.type);
    expect(kinds).toEqual(['clear', 'stroke', 'dot']);
  });

  it('draws dots sorted far-to-near by depth, regardless of input order', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [],
      dots: [dot({ x: 1, depth: 0.9 }), dot({ x: 2, depth: 0.1 }), dot({ x: 3, depth: 0.5 })]
    };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    const order = calls.filter((call) => call.type === 'dot').map((call) => call.x);
    expect(order).toEqual([2, 3, 1]);
  });

  it('draws strokes sorted far-to-near by depth, regardless of input order', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({ x1: 1, depth: 0.9 }), stroke({ x1: 2, depth: 0.1 })],
      dots: []
    };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    const order = calls.filter((call) => call.type === 'stroke').map((call) => call.x1);
    expect(order).toEqual([2, 1]);
  });

  it('paints each dot with its own ink turned into an exact colour', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ ink: 1 })] };
    paintFrame(ctx, frame, { dark: true, tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'dot');
    expect(drawn).toMatchObject({ color: 'rgb(0 0 0)' });
  });

  it("carries a dot's own alpha and radius through to the draw call", () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ alpha: 0.4, radius: 3 })] };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'dot');
    expect(drawn).toMatchObject({ alpha: 0.4, radius: 3 });
  });

  it("carries a stroke's own end points, width and alpha through to the draw call", () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({ x1: 1, y1: 2, x2: 3, y2: 4, width: 2.5, alpha: 0.6 })],
      dots: []
    };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'stroke');
    expect(drawn).toMatchObject({ x1: 1, y1: 2, x2: 3, y2: 4, width: 2.5, alpha: 0.6 });
  });

  it('leaves globalAlpha at 1 once finished, so it never leaks into the next painter', () => {
    const { ctx } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ alpha: 0.2 })] };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    expect(ctx.globalAlpha).toBe(1);
  });

  it('never mutates the input frame', () => {
    const { ctx } = createRecordingContext(64, 64);
    const dots = [dot({ x: 1, depth: 0.9 }), dot({ x: 2, depth: 0.1 })];
    const strokes = [stroke({ x1: 1, depth: 0.9 }), stroke({ x1: 2, depth: 0.1 })];
    const frame: Frame = { dots, strokes };
    paintFrame(ctx, frame, { dark: false, tint: TINT });
    expect(frame.dots).toBe(dots);
    expect(frame.strokes).toBe(strokes);
    expect(dots.map((d) => d.x)).toEqual([1, 2]);
    expect(strokes.map((s) => s.x1)).toEqual([1, 2]);
  });
});
