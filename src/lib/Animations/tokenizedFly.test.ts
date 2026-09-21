import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cubicOut } from 'svelte/easing';
import { parseCssEasing, tokenizedFly } from './tokenizedFly';

/*
 * Same fake matchMedia shape as Sheet.svelte.test.ts, so reduced-motion.svelte.ts's
 * one-time-at-import subscription has something real to attach to, and this file can
 * flip the live preference the same way an OS toggle would.
 */
type ReducedMotionChangeListener = (event: MediaQueryListEvent) => void;
const reducedMotionMedia = vi.hoisted(() => {
  let matches = false;
  const listeners = new Set<ReducedMotionChangeListener>();
  const fakeMatchMedia = (query: string): MediaQueryList =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: ReducedMotionChangeListener): void => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: ReducedMotionChangeListener): void => {
        listeners.delete(listener);
      },
      addListener: (): void => {},
      removeListener: (): void => {},
      dispatchEvent: (): boolean => false
    }) as MediaQueryList;
  (globalThis as unknown as { matchMedia: typeof fakeMatchMedia }).matchMedia = fakeMatchMedia;
  return {
    emit(next: boolean): void {
      matches = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    }
  };
});

function makeNode(styleText = ''): HTMLElement {
  const node = document.createElement('div');
  node.style.cssText = styleText;
  document.body.appendChild(node);
  return node;
}

beforeEach(() => {
  reducedMotionMedia.emit(false);
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('parseCssEasing', () => {
  it('returns null for an empty string (nothing resolved)', () => {
    expect(parseCssEasing('')).toBeNull();
  });

  it('returns the identity function for linear', () => {
    const easing = parseCssEasing('linear');
    expect(easing).not.toBeNull();
    expect(easing?.(0)).toBeCloseTo(0);
    expect(easing?.(0.37)).toBeCloseTo(0.37);
    expect(easing?.(1)).toBeCloseTo(1);
  });

  it('resolves a known keyword against the CSS ease published reference value', () => {
    // https://www.w3.org/TR/css-easing-1/ ease = cubic-bezier(0.25, 0.1, 0.25, 1);
    // 0.5 is the widely-cited reference sample point (~0.8024).
    const easing = parseCssEasing('ease');
    expect(easing).not.toBeNull();
    expect(easing?.(0)).toBeCloseTo(0, 5);
    expect(easing?.(1)).toBeCloseTo(1, 5);
    expect(easing?.(0.5)).toBeCloseTo(0.8024, 3);
  });

  it('resolves a raw cubic-bezier() string, endpoints exact', () => {
    const easing = parseCssEasing('cubic-bezier(0.23, 1, 0.32, 1)');
    expect(easing).not.toBeNull();
    expect(easing?.(0)).toBeCloseTo(0, 6);
    expect(easing?.(1)).toBeCloseTo(1, 6);
    // Heavily front-loaded curve -- most of the travel happens early, confirmed
    // against an independent brute-force check before this shipped (see
    // tokenizedFly.ts's own comment). 0.1 lands meaningfully above linear (0.1).
    expect(easing?.(0.1)).toBeGreaterThan(0.3);
  });

  it('an identity-control-point bezier behaves like linear', () => {
    const easing = parseCssEasing('cubic-bezier(0, 0, 1, 1)');
    expect(easing?.(0.25)).toBeCloseTo(0.25, 3);
    expect(easing?.(0.5)).toBeCloseTo(0.5, 3);
    expect(easing?.(0.75)).toBeCloseTo(0.75, 3);
  });

  it('rejects an out-of-range x control point -- not a valid function of x per the CSS spec', () => {
    expect(parseCssEasing('cubic-bezier(-0.1, 1, 0.32, 1)')).toBeNull();
    expect(parseCssEasing('cubic-bezier(0.23, 1, 1.5, 1)')).toBeNull();
  });

  it('returns null for garbage input rather than throwing', () => {
    expect(parseCssEasing('not-a-curve')).toBeNull();
    expect(parseCssEasing('cubic-bezier(1, 2)')).toBeNull();
  });
});

describe('tokenizedFly duration resolution', () => {
  it('falls through to the literal fallback when no token is set anywhere', () => {
    const node = makeNode();
    const config = tokenizedFly(node, {
      durationTokens: ['--x-transition-duration', '--duration-base', '--motion-duration'],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(380);
  });

  it('prefers the element-level token over the named tier and the root token', () => {
    const node = makeNode(
      '--x-transition-duration: 500ms; --duration-base: 200ms; --motion-duration: 100ms;'
    );
    const config = tokenizedFly(node, {
      durationTokens: ['--x-transition-duration', '--duration-base', '--motion-duration'],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(500);
  });

  it('falls through to the named tier when only the element token is unset', () => {
    const node = makeNode('--duration-base: 200ms; --motion-duration: 100ms;');
    const config = tokenizedFly(node, {
      durationTokens: ['--x-transition-duration', '--duration-base', '--motion-duration'],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(200);
  });

  it('accepts seconds and converts to milliseconds', () => {
    const node = makeNode('--x-transition-duration: 0.5s;');
    const config = tokenizedFly(node, {
      durationTokens: ['--x-transition-duration'],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(500);
  });
});

describe('tokenizedFly distance resolution', () => {
  it('resolves a non-zero axis to the resolved distance, preserving sign', () => {
    const node = makeNode();
    const configRight = tokenizedFly(node, {
      x: 400,
      durationTokens: [],
      fallbackDuration: 300,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    expect(configRight.css(0, 1)).toContain('translate(60px, 0px)');

    const configLeft = tokenizedFly(node, {
      x: -400,
      durationTokens: [],
      fallbackDuration: 300,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    expect(configLeft.css(0, 1)).toContain('translate(-60px, 0px)');
  });

  it('a negative resolved distance (a theming mistake) resizes magnitude only, never flips direction', () => {
    const node = makeNode('--x-distance: -60px;');
    const config = tokenizedFly(node, {
      x: 400,
      durationTokens: [],
      fallbackDuration: 300,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    // x started positive; a negative token must not flip it negative too.
    expect(config.css(0, 1)).toContain('translate(60px, 0px)');
  });

  it('keeps a zero axis at exactly zero regardless of the resolved distance', () => {
    const node = makeNode('--x-distance: 999px;');
    const config = tokenizedFly(node, {
      x: 0,
      y: 400,
      durationTokens: [],
      fallbackDuration: 300,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    // x stays 0 (never had a direction to preserve); y resizes to the token's 999.
    expect(config.css(0, 1)).toContain('translate(0px, 999px)');
  });

  it('a CSS token overrides the fallback distance', () => {
    const node = makeNode('--x-distance: 24px;');
    const config = tokenizedFly(node, {
      y: 400,
      durationTokens: [],
      fallbackDuration: 300,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    expect(config.css(0, 1)).toContain('translate(0px, 24px)');
  });
});

describe('tokenizedFly easing resolution', () => {
  it('defaults to cubicOut when nothing is set and no override is passed, matching the fly() it replaces', () => {
    const node = makeNode();
    const config = tokenizedFly(node, { durationTokens: [], fallbackDuration: 300 });
    expect(config.easing).toBe(cubicOut);
  });

  it('honours an explicit params.easing override (the fade-shaped call sites use this for linear)', () => {
    const node = makeNode();
    const linear = (t: number) => t;
    const config = tokenizedFly(node, {
      durationTokens: [],
      fallbackDuration: 300,
      easing: linear
    });
    expect(config.easing).toBe(linear);
  });

  it('a resolved CSS easing token wins over the params.easing default', () => {
    const node = makeNode('--x-ease: linear;');
    const config = tokenizedFly(node, {
      durationTokens: [],
      fallbackDuration: 300,
      easingTokens: ['--x-ease']
    });
    expect(config.easing).not.toBe(cubicOut);
    expect(config.easing(0.4)).toBeCloseTo(0.4, 5);
  });
});

describe('tokenizedFly reduced-motion backstop', () => {
  it('is a no-op when reduced motion is off', () => {
    const node = makeNode();
    const config = tokenizedFly(node, {
      durationTokens: [],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(380);
  });

  it('collapses duration to 0.001 when reduced motion is on, even with no token set', () => {
    reducedMotionMedia.emit(true);
    const node = makeNode();
    const config = tokenizedFly(node, {
      durationTokens: [],
      fallbackDuration: 380
    });
    expect(config.duration).toBe(0.001);
  });

  it(
    'collapses duration to 0.001 even when a consumer-set duration token resolves to a large value ' +
      '-- the exact gap flagged during the motion-token migration: a theme-level override must not ' +
      'be able to revive motion the OS preference says to suppress',
    () => {
      reducedMotionMedia.emit(true);
      const node = makeNode('--x-transition-duration: 2000ms;');
      const config = tokenizedFly(node, {
        durationTokens: ['--x-transition-duration'],
        fallbackDuration: 380
      });
      expect(config.duration).toBe(0.001);
    }
  );

  it('does not fight the caller-side zeroing of distance -- x/y already 0 stay 0', () => {
    reducedMotionMedia.emit(true);
    const node = makeNode('--x-distance: 400px;');
    const config = tokenizedFly(node, {
      x: 0,
      y: 0,
      durationTokens: [],
      fallbackDuration: 380,
      distanceTokens: ['--x-distance'],
      fallbackDistance: 60
    });
    expect(config.duration).toBe(0.001);
    expect(config.css(0, 1)).toContain('translate(0px, 0px)');
  });
});
