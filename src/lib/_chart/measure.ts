export type FontSpec = {
  /** Font size in px. */
  size: number;
  family?: string | null;
  weight?: number | string;
};

const DEFAULT_FAMILY = 'system-ui, -apple-system, sans-serif';
// Average glyph width ≈ 0.6em for UI sans fonts — only used when canvas is
// unavailable (SSR / unit tests); the client always re-measures after mount.
const HEURISTIC_WIDTH_PER_CHAR = 0.6;
const LINE_HEIGHT_FACTOR = 1.2;
const CACHE_LIMIT = 4000;

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

function context(): CanvasRenderingContext2D | null {
  if (ctx !== null) {
    return ctx;
  }
  if (typeof document === 'undefined') {
    return null;
  }
  ctx = document.createElement('canvas').getContext('2d');
  return ctx;
}

export function measureText(text: string, font: FontSpec): { width: number; height: number } {
  const height = font.size * LINE_HEIGHT_FACTOR;
  // NUL-delimited so free-form family/text strings (which may contain any
  // printable character, e.g. "12,000 | 100%") can never collide across fields.
  const key = [font.weight ?? 400, font.size, font.family ?? '', text].join('\u0000');
  const cached = cache.get(key);
  if (typeof cached !== 'undefined') {
    return { width: cached, height };
  }
  const c = context();
  const width =
    c === null
      ? text.length * font.size * HEURISTIC_WIDTH_PER_CHAR
      : ((c.font = `${font.weight ?? 400} ${font.size}px ${font.family ?? DEFAULT_FAMILY}`),
        c.measureText(text).width);
  if (cache.size >= CACHE_LIMIT) {
    cache.clear();
  }
  cache.set(key, width);
  return { width, height };
}

/** Reads a px-valued CSS custom property off an element, with an SSR-safe fallback. */
export function readCssVarPx(el: Element | null, name: string, fallback: number): number {
  if (typeof window === 'undefined' || el === null) {
    return fallback;
  }
  const parsed = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isNaN(parsed) ? fallback : parsed;
}
