import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * `reduced-motion.svelte.ts` decides once, at module-evaluation time, whether
 * `window.matchMedia` exists and (if so) takes out its one `change`
 * subscription right then -- there is no per-call re-check to intercept
 * later. Stubbing `matchMedia` from inside a test body, after the module has
 * already been imported once by a previous test, would do nothing: the
 * module-level `query` binding was already resolved. `vi.resetModules()` plus
 * a dynamic re-import after stubbing is what forces a fresh module instance
 * to evaluate against that test's own stub -- the same shape
 * `Tooltip/tooltip-action.test.ts` uses for its own module-singleton action,
 * for the same reason.
 */

type ChangeListener = (event: MediaQueryListEvent) => void;

const stubMatchMedia = (initialMatches: boolean) => {
  let matches = initialMatches;
  const listeners = new Set<ChangeListener>();
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: ChangeListener): void => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: ChangeListener): void => {
          listeners.delete(listener);
        },
        addListener: (): void => {},
        removeListener: (): void => {},
        dispatchEvent: (): boolean => false
      }) as MediaQueryList
  );
  return {
    emit(next: boolean): void {
      matches = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    }
  };
};

const loadReducedMotion = async () => {
  const mod = await import('./reduced-motion.svelte');
  return mod.reducedMotion;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('reducedMotion', () => {
  it('mirrors the OS preference already in effect at first read', async () => {
    stubMatchMedia(true);
    const reducedMotion = await loadReducedMotion();
    expect(reducedMotion.current).toBe(true);
  });

  it('starts false when the preference is not set', async () => {
    stubMatchMedia(false);
    const reducedMotion = await loadReducedMotion();
    expect(reducedMotion.current).toBe(false);
  });

  it('follows a change fired after the module has already loaded', async () => {
    const media = stubMatchMedia(false);
    const reducedMotion = await loadReducedMotion();
    expect(reducedMotion.current).toBe(false);

    media.emit(true);
    expect(reducedMotion.current).toBe(true);

    media.emit(false);
    expect(reducedMotion.current).toBe(false);
  });

  it('defaults to false, without throwing, when matchMedia is unavailable', async () => {
    // No stubMatchMedia call -- jsdom does not implement matchMedia itself,
    // so this simulates both SSR (no `window`) and a browser lacking the API.
    const reducedMotion = await loadReducedMotion();
    expect(reducedMotion.current).toBe(false);
  });
});
