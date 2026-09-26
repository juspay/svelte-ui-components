import { describe, expect, it } from 'vitest';
import { inkAlpha, inkColor, paintFrame } from './paint';
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
  it('is always exactly the tint colour, with no fade of its own', () => {
    expect(inkColor(TINT)).toBe('rgb(100 150 200)');
  });
});

describe('inkAlpha', () => {
  it('is exactly the mark alpha at ink 0', () => {
    expect(inkAlpha(0, 1)).toBe(1);
    expect(inkAlpha(0, 0.4)).toBe(0.4);
  });

  it('is exactly zero at ink 1, regardless of the mark alpha', () => {
    expect(inkAlpha(1, 1)).toBe(0);
    expect(inkAlpha(1, 0.4)).toBe(0);
  });

  it('is exactly the midpoint at ink 0.5', () => {
    expect(inkAlpha(0.5, 1)).toBe(0.5);
    expect(inkAlpha(0.5, 0.4)).toBeCloseTo(0.2);
  });

  it("multiplies ink's fade with the mark's own alpha rather than overriding it", () => {
    expect(inkAlpha(0.75, 0.4)).toBeCloseTo(0.1);
  });

  it('clamps ink outside 0..1 to the same endpoints', () => {
    expect(inkAlpha(-1, 1)).toBe(inkAlpha(0, 1));
    expect(inkAlpha(2, 1)).toBe(inkAlpha(1, 1));
  });

  it('clamps alpha outside 0..1 to the same endpoints', () => {
    expect(inkAlpha(0, -1)).toBe(0);
    expect(inkAlpha(0, 2)).toBe(1);
  });
});

describe('paintFrame', () => {
  it('clears using the context canvas size, before anything else', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    paintFrame(ctx, { dots: [], strokes: [] }, { tint: TINT });
    expect(calls).toEqual([{ type: 'clear', width: 64, height: 64 }]);
  });

  it('draws every stroke before any dot', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({})],
      dots: [dot({})]
    };
    paintFrame(ctx, frame, { tint: TINT });
    const kinds = calls.map((call) => call.type);
    expect(kinds).toEqual(['clear', 'stroke', 'dot']);
  });

  it('draws dots sorted far-to-near by depth, regardless of input order', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [],
      dots: [dot({ x: 1, depth: 0.9 }), dot({ x: 2, depth: 0.1 }), dot({ x: 3, depth: 0.5 })]
    };
    paintFrame(ctx, frame, { tint: TINT });
    const order = calls.filter((call) => call.type === 'dot').map((call) => call.x);
    expect(order).toEqual([2, 3, 1]);
  });

  it('draws strokes sorted far-to-near by depth, regardless of input order', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({ x1: 1, depth: 0.9 }), stroke({ x1: 2, depth: 0.1 })],
      dots: []
    };
    paintFrame(ctx, frame, { tint: TINT });
    const order = calls.filter((call) => call.type === 'stroke').map((call) => call.x1);
    expect(order).toEqual([2, 1]);
  });

  it('paints every mark in the tint colour itself, regardless of its own ink', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({ ink: 1 })],
      dots: [dot({ ink: 0 }), dot({ x: 1, ink: 1 })]
    };
    paintFrame(ctx, frame, { tint: TINT });
    for (const call of calls) {
      if (call.type !== 'clear') {
        expect(call.color).toBe('rgb(100 150 200)');
      }
    }
  });

  it('fades a dot fully transparent as its ink rises to 1, at the unchanged tint colour', () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [],
      dots: [dot({ ink: 0 }), dot({ x: 1, ink: 0.5 }), dot({ x: 2, ink: 1 })]
    };
    paintFrame(ctx, frame, { tint: TINT });
    const drawn = calls.filter((call) => call.type === 'dot');
    expect(drawn.map((call) => call.alpha)).toEqual([1, 0.5, 0]);
    expect(drawn.every((call) => call.color === 'rgb(100 150 200)')).toBe(true);
  });

  it("is at full tint and full mark alpha at ink 0, whatever the mark's own alpha", () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ ink: 0, alpha: 0.4, radius: 3 })] };
    paintFrame(ctx, frame, { tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'dot');
    expect(drawn).toMatchObject({ color: 'rgb(100 150 200)', alpha: 0.4, radius: 3 });
  });

  it("compounds a dot's ink fade with its own alpha rather than overriding it", () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ ink: 0.5, alpha: 0.4 })] };
    paintFrame(ctx, frame, { tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'dot');
    expect(drawn.alpha).toBeCloseTo(0.2);
  });

  it("carries a stroke's own end points and width through to the draw call", () => {
    const { ctx, calls } = createRecordingContext(64, 64);
    const frame: Frame = {
      strokes: [stroke({ x1: 1, y1: 2, x2: 3, y2: 4, width: 2.5, alpha: 0.6 })],
      dots: []
    };
    paintFrame(ctx, frame, { tint: TINT });
    const [drawn] = calls.filter((call) => call.type === 'stroke');
    expect(drawn).toMatchObject({ x1: 1, y1: 2, x2: 3, y2: 4, width: 2.5 });
  });

  it('leaves globalAlpha at 1 once finished, so it never leaks into the next painter', () => {
    const { ctx } = createRecordingContext(64, 64);
    const frame: Frame = { strokes: [], dots: [dot({ alpha: 0.2 })] };
    paintFrame(ctx, frame, { tint: TINT });
    expect(ctx.globalAlpha).toBe(1);
  });

  it('never mutates the input frame', () => {
    const { ctx } = createRecordingContext(64, 64);
    const dots = [dot({ x: 1, depth: 0.9 }), dot({ x: 2, depth: 0.1 })];
    const strokes = [stroke({ x1: 1, depth: 0.9 }), stroke({ x1: 2, depth: 0.1 })];
    const frame: Frame = { dots, strokes };
    paintFrame(ctx, frame, { tint: TINT });
    expect(frame.dots).toBe(dots);
    expect(frame.strokes).toBe(strokes);
    expect(dots.map((d) => d.x)).toEqual([1, 2]);
    expect(strokes.map((s) => s.x1)).toEqual([1, 2]);
  });
});
