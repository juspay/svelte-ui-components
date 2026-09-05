import { describe, it, expect } from 'vitest';
import { PILL_TONES, pillToneClass } from './pillTone';
import type { PillTone } from './properties';

// Regression coverage for #520: Pill had no semantic tone prop, so every consumer wanting a
// status colour (accent/ok/warn/danger/muted) hand-rolled its own `tone-*` class per call site
// instead of passing one prop. `pillToneClass` is the exact function Pill.svelte's root `class`
// attribute calls — see `class="pill {pillToneClass(tone)} {classes ?? ''}"` — so this proves
// the mapping the component actually renders, without needing a browser to assert on DOM output
// (this repo's vitest suite runs no browser; see src/lib/Table/normalizeColumns.ts for the same
// pure-function-extracted-for-testability pattern backing a .svelte template).
describe('pillToneClass', () => {
  it('resolves to no class at all when no tone is passed (default: unchanged rendering)', () => {
    expect(pillToneClass()).toBe('');
  });

  it('resolves each documented tone to its own tone-{tone} class', () => {
    const expected: Record<PillTone, string> = {
      accent: 'tone-accent',
      ok: 'tone-ok',
      warn: 'tone-warn',
      danger: 'tone-danger',
      muted: 'tone-muted'
    };
    for (const tone of PILL_TONES) {
      expect(pillToneClass(tone)).toBe(expected[tone]);
    }
  });

  it('documents exactly the five tones the issue asked for, in a stable order', () => {
    expect(PILL_TONES).toEqual(['accent', 'ok', 'warn', 'danger', 'muted']);
  });
});
