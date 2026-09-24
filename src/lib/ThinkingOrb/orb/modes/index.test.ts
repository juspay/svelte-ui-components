import { describe, expect, it } from 'vitest';
import { MODES } from './index';
import type { ModeContext, ModeSize } from '../types';

const SIZES: readonly ModeSize[] = [64, 32, 20];

const contextFor = (size: ModeSize): ModeContext => ({ size, density: 1, dotScale: 1 });

// sphere.test.ts and form.test.ts each only check pairwise difference within
// their own family (10 of the 36 possible pairs across all nine states).
// This covers the remaining cross-family pairs too, so e.g. a sphere state
// and a form state can never silently converge on the same frame.
describe('every pair of the nine states', () => {
  it('paints a different frame from every other state at the same instant', () => {
    const entries = Object.entries(MODES);
    for (const size of SIZES) {
      const ctx = contextFor(size);
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const [, modeA] = entries[i];
          const [, modeB] = entries[j];
          expect(modeA(1, ctx)).not.toEqual(modeB(1, ctx));
        }
      }
    }
  });
});
