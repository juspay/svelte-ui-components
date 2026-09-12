import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from './index';

// The helper existed and was used twice internally, but was not on the public
// surface, so a consumer driving motion from JavaScript could not reach the one
// answer the library already had.
describe('prefersReducedMotion is part of the public API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is exported alongside the other shared helpers', () => {
    expect(typeof library.prefersReducedMotion).toBe('function');
  });

  it('reports what the OS preference actually says', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    expect(library.prefersReducedMotion()).toBe(true);

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    expect(library.prefersReducedMotion()).toBe(false);
  });
});
