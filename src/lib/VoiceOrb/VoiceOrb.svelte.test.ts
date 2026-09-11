import { render } from '@testing-library/svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * `generateOrbParticles` and `mulberry32` are spied on rather than replaced,
 * so the component still draws a real sphere -- only the call log is new.
 * This is what lets these tests prove *when* geometry is rebuilt (on mount
 * only, versus on every relevant prop change) without duplicating orbMath's
 * own coverage of *what* it produces.
 */
vi.mock('./orbMath', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./orbMath')>();
  return {
    ...actual,
    generateOrbParticles: vi.fn(actual.generateOrbParticles),
    mulberry32: vi.fn(actual.mulberry32),
    resolveMotionSpeed: vi.fn(actual.resolveMotionSpeed)
  };
});

import VoiceOrb from './VoiceOrb.svelte';
import { generateOrbParticles, mulberry32, resolveMotionSpeed } from './orbMath';

const generateOrbParticlesMock = vi.mocked(generateOrbParticles);
const mulberry32Mock = vi.mocked(mulberry32);
const resolveMotionSpeedMock = vi.mocked(resolveMotionSpeed);

/*
 * `particles` (the `$derived.by` this suite targets) is only ever read inside
 * `draw`'s particle loop -- never at mount, never from a template expression.
 * jsdom's `getContext('2d')` returns null, and the component bails out of
 * `draw` before that loop runs, so without a fake context these tests would
 * pass by accident (nothing reactive is ever read, mocked or not). Faking
 * just enough of `CanvasRenderingContext2D` to survive one pass through
 * `draw` -- and driving `requestAnimationFrame` by hand instead of a real
 * timer -- is what makes the regeneration actually observable, one frame at
 * a time, under our control rather than jsdom's.
 */
const createFakeContext = (): CanvasRenderingContext2D => {
  const context = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
  };
  return context as unknown as CanvasRenderingContext2D;
};

let rafCallback: FrameRequestCallback | null = null;
/** Runs exactly one `draw` frame, which is where `particles` gets read. */
const runOneFrame = (time = 0): void => {
  const callback = rafCallback;
  rafCallback = null;
  callback?.(time);
};

let getContextSpy: ReturnType<typeof vi.spyOn>;

/*
 * A real `matchMedia` gives the test no way to see how often it was asked, nor
 * any way to flip the preference mid-session -- and jsdom does not implement it
 * at all, so `prefersReducedMotion` would silently short-circuit and the
 * reduced-motion path would never run. This stand-in records every call and
 * lets a test emit a `change` the way a user toggling the OS setting would.
 */
let reduceMotionMatches = false;
const motionListeners = new Set<(event: MediaQueryListEvent) => void>();
const matchMediaMock = vi.fn(
  (query: string): MediaQueryList =>
    ({
      matches: reduceMotionMatches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
        motionListeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void
      ): void => {
        motionListeners.delete(listener);
      },
      addListener: (): void => {},
      removeListener: (): void => {},
      dispatchEvent: (): boolean => false
    }) as MediaQueryList
);

const emitMotionChange = (matches: boolean): void => {
  reduceMotionMatches = matches;
  motionListeners.forEach((listener) => {
    listener({ matches } as MediaQueryListEvent);
  });
};

/** The `reducedMotion` argument `draw` threaded into its most recent frame. */
const lastReducedMotionArg = (): boolean => {
  const calls = resolveMotionSpeedMock.mock.calls;
  return calls[calls.length - 1][4];
};

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    rafCallback = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', (): void => {
    rafCallback = null;
  });
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => createFakeContext());
  vi.stubGlobal('matchMedia', matchMediaMock);
});
afterAll(() => {
  getContextSpy.mockRestore();
  vi.unstubAllGlobals();
});

afterEach(() => {
  rafCallback = null;
});

beforeEach(() => {
  generateOrbParticlesMock.mockClear();
  mulberry32Mock.mockClear();
  resolveMotionSpeedMock.mockClear();
  matchMediaMock.mockClear();
  motionListeners.clear();
  reduceMotionMatches = false;
});

describe('VoiceOrb geometry regeneration', () => {
  it('builds geometry once on mount', () => {
    render(VoiceOrb, { particleCount: 50, radius: 100 });
    runOneFrame();

    expect(generateOrbParticlesMock).toHaveBeenCalledTimes(1);
  });

  it('regenerates when particleCount changes', async () => {
    const { rerender } = render(VoiceOrb, { particleCount: 50, radius: 100 });
    runOneFrame();

    await rerender({ particleCount: 80 });
    runOneFrame();

    expect(generateOrbParticlesMock).toHaveBeenCalledTimes(2);
    expect(generateOrbParticlesMock.mock.calls[1][0]).toBe(80);
  });

  it('regenerates when radius changes', async () => {
    const { rerender } = render(VoiceOrb, { particleCount: 50, radius: 100 });
    runOneFrame();

    await rerender({ radius: 250 });
    runOneFrame();

    expect(generateOrbParticlesMock).toHaveBeenCalledTimes(2);
    expect(generateOrbParticlesMock.mock.calls[1][1]).toBe(250);
  });

  it('regenerates with a different seed integer when seed changes', async () => {
    const { rerender } = render(VoiceOrb, { seed: 1 });
    runOneFrame();
    const firstSeedArg = mulberry32Mock.mock.calls[0][0];

    await rerender({ seed: 2 });
    runOneFrame();

    expect(generateOrbParticlesMock).toHaveBeenCalledTimes(2);
    expect(mulberry32Mock.mock.calls[1][0]).not.toBe(firstSeedArg);
  });

  // Not tested here: that an unrelated prop change (e.g. `speedMultiplier`)
  // leaves geometry untouched. `@testing-library/svelte`'s `rerender` backs
  // the whole props bag with one `$state.raw` (see its `props.svelte.js`),
  // so *every* rerender bumps *every* prop's read together, independent of
  // which key actually changed -- a harness artifact this suite cannot see
  // past. A real caller's per-prop expressions don't share that box, so
  // Svelte's ordinary `$derived` dependency tracking (unchanged here, and
  // not part of what Finding 2 reported) still applies. Finding 2 was
  // under-invalidation -- geometry never updating -- which the four tests
  // above pin; this harness has no way to also pin the absence of
  // over-invalidation without a false failure on a correct implementation.

  // Finding 2's fix (a `$derived.by` keyed on particleCount/radius/seed) could
  // overcorrect by re-rolling an unseeded orb's randomness on every one of
  // those re-renders too. `unseededSeed` is what this pins: one random draw
  // per mount, reused, so an unseeded orb only looks different across an
  // actual remount, never across a `particleCount`/`radius` change alone.
  it('keeps one resolved random seed for an unseeded orb across a particleCount change', async () => {
    const { rerender } = render(VoiceOrb, { particleCount: 50, radius: 100 });
    runOneFrame();
    const firstSeedArg = mulberry32Mock.mock.calls[0][0];

    await rerender({ particleCount: 80 });
    runOneFrame();

    expect(mulberry32Mock.mock.calls[1][0]).toBe(firstSeedArg);
  });
});

/*
 * `matchMedia` builds a fresh `MediaQueryList` on every call and `draw` runs on
 * every animation frame, so reading the preference inside `draw` makes that
 * work scale with frame rate. These two pin the shape that avoids it: read the
 * preference once, and let the query's own `change` event keep it current --
 * the second test is what stops the first from being satisfied by a value that
 * is cached and then never updated.
 */
describe('VoiceOrb reduced-motion preference', () => {
  it('does not re-query matchMedia as frames go by', () => {
    render(VoiceOrb, { particleCount: 20 });
    runOneFrame(0);
    const afterFirstFrame = matchMediaMock.mock.calls.length;

    runOneFrame(16);
    runOneFrame(32);
    runOneFrame(48);

    expect(matchMediaMock.mock.calls.length).toBe(afterFirstFrame);
  });

  it('still follows the preference when it changes mid-session', () => {
    render(VoiceOrb, { particleCount: 20 });
    runOneFrame(0);
    expect(lastReducedMotionArg()).toBe(false);

    emitMotionChange(true);
    runOneFrame(16);

    expect(lastReducedMotionArg()).toBe(true);
  });
});
