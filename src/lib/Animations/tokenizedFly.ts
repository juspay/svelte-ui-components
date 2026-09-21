import { cubicOut } from 'svelte/easing';
import type { EasingFunction, TransitionConfig } from 'svelte/transition';
import { reducedMotion } from '../reduced-motion.svelte';

// `Number.parseFloat` on a unit with no numeric prefix (a malformed token
// value like `--foo-duration: s;`, not just an unset one) returns NaN, and
// `??` does not catch NaN the way it catches null/undefined -- Number.isFinite
// is what keeps a typo'd token from flowing straight through as a duration or
// distance instead of falling back the way an unset token already does.
const parseCssTime = (raw: string): number | null => {
  const value = raw.trim();
  if (value.endsWith('ms')) {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) ? amount : null;
  }
  if (value.endsWith('s')) {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) ? amount * 1000 : null;
  }
  return null;
};

const parseCssLength = (raw: string): number | null => {
  const value = raw.trim();
  if (!value.endsWith('px')) {
    return null;
  }
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : null;
};

const CSS_KEYWORD_EASINGS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

// Standard WebKit UnitBezier approach: express the Bezier x(u)/y(u) curves in
// polynomial form, Newton-Raphson solve x(u) = x for u, then evaluate y(u).
// Verified against a published reference value for CSS `ease` and against an
// independent brute-force (dense sampling) implementation before this was
// wired into any live component -- both matched to 6+ significant figures.
function cubicBezierEasing(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  const a = (n1: number, n2: number) => 1 - 3 * n2 + 3 * n1;
  const b = (n1: number, n2: number) => 3 * n2 - 6 * n1;
  const c = (n1: number) => 3 * n1;
  const calc = (t: number, n1: number, n2: number) => ((a(n1, n2) * t + b(n1, n2)) * t + c(n1)) * t;
  const slope = (t: number, n1: number, n2: number) =>
    3 * a(n1, n2) * t * t + 2 * b(n1, n2) * t + c(n1);
  const solveT = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) {
        break;
      }
      t -= (calc(t, x1, x2) - x) / s;
    }
    return t;
  };
  return (x: number) => {
    if (x <= 0) {
      return 0;
    }
    if (x >= 1) {
      return 1;
    }
    return calc(solveT(x), y1, y2);
  };
}

const BEZIER_PATTERN =
  /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/;

export function parseCssEasing(raw: string): EasingFunction | null {
  const value = raw.trim();
  if (value === '') {
    return null;
  }
  if (value === 'linear') {
    return (t: number) => t;
  }
  const known = CSS_KEYWORD_EASINGS[value];
  if (known) {
    return cubicBezierEasing(...known);
  }
  const match = BEZIER_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const [x1, y1, x2, y2] = match.slice(1).map(Number.parseFloat);
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    return null;
  } // invalid per CSS spec: not a function of x
  return cubicBezierEasing(x1, y1, x2, y2);
}

// Consumers read tokens via getComputedStyle rather than CSS var(), which has
// no native cascade -- this walks an element-token -> named-tier -> root-token
// fallback chain manually, returning the first token that actually resolves.
const resolveToken = (styles: CSSStyleDeclaration, tokens: string[]): string | null => {
  for (const name of tokens) {
    const raw = styles.getPropertyValue(name).trim();
    if (raw !== '') {
      return raw;
    }
  }
  return null;
};

export type TokenizedFlyParams = {
  x?: number;
  y?: number;
  durationTokens: string[];
  fallbackDuration: number;
  distanceTokens?: string[];
  fallbackDistance?: number;
  easingTokens?: string[];
  easing?: EasingFunction; // ultimate fallback when no easing token resolves; today's default
};

// TransitionConfig declares `css`/`easing` optional (Svelte's own transition
// functions don't always return either), but this one always does -- narrowing
// the return type here means callers (this module's own tests included) don't
// need an unsafe non-null assertion to call them.
export type ResolvedTokenizedFly = TransitionConfig & {
  css: NonNullable<TransitionConfig['css']>;
  easing: NonNullable<TransitionConfig['easing']>;
};

export function tokenizedFly(node: Element, params: TokenizedFlyParams): ResolvedTokenizedFly {
  const styles = getComputedStyle(node);

  const durationRaw = resolveToken(styles, params.durationTokens);
  let duration =
    (durationRaw !== null ? parseCssTime(durationRaw) : null) ?? params.fallbackDuration;

  let x = params.x ?? 0;
  let y = params.y ?? 0;
  if (params.distanceTokens) {
    const distRaw = resolveToken(styles, params.distanceTokens);
    const resolvedDist =
      (distRaw !== null ? parseCssLength(distRaw) : null) ??
      params.fallbackDistance ??
      Math.max(Math.abs(x), Math.abs(y));
    // Math.abs, not the raw resolved value: a negative distance (a theming
    // mistake -- `--distance-overlay: -60px`, say -- rather than anything a
    // normal interaction can trigger) must resize the magnitude only, same as
    // any other distance. Without it, Math.sign(x) * dist below would flip the
    // travel DIRECTION too, silently contradicting the next comment's own
    // stated invariant.
    const dist = Math.abs(resolvedDist);
    // Preserve the sign/direction the caller specified, resize the magnitude only --
    // a 0 (no travel on that axis) must stay exactly 0 regardless of any token or
    // fallback, since Math.sign(0) is 0 anyway but this keeps the intent explicit.
    x = x === 0 ? 0 : Math.sign(x) * dist;
    y = y === 0 ? 0 : Math.sign(y) * dist;
  }

  const easingRaw = params.easingTokens ? resolveToken(styles, params.easingTokens) : null;
  const parsedEasing = easingRaw !== null ? parseCssEasing(easingRaw) : null;
  // svelte/transition's own `fly` defaults to cubicOut, but the runtime
  // (transitions.js) falls back to *linear* for any TransitionConfig that
  // omits `easing` -- so this default has to be supplied explicitly to stay
  // byte-identical to the `fly` calls this replaces. Fade-shaped call sites
  // (no distanceTokens, x/y at 0) pass `easing: linear` themselves to match
  // `fade`'s own default instead.
  const easing = parsedEasing ?? params.easing ?? cubicOut;

  // A consumer-set duration token can otherwise revive non-instant motion even
  // under prefers-reduced-motion -- reducedMotion.current is the live OS
  // preference, so this backstop applies regardless of what the token chain
  // above resolved to. 0.001 rather than a hard 0: still visually instant, but
  // keeps this a real (non-zero-duration) transition for Svelte's own
  // lifecycle/event handling instead of a degenerate edge case.
  if (reducedMotion.current) {
    duration = 0.001;
  }

  const targetOpacity = +styles.opacity;
  const transform = styles.transform === 'none' ? '' : styles.transform;

  return {
    duration,
    easing,
    css: (t: number) => `
      transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
      opacity: ${targetOpacity * t};
    `
  };
}
