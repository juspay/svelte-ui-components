import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// SOURCE-LEVEL CHECK, not a behavioural one -- see Button/reduced-motion.test.ts
// for the full explanation of why a rendered/computed-style test would not
// actually exercise this (jsdom does not evaluate `@media` conditions, and
// this is pure CSS with no JS branch).
//
// Unlike Button's and ListItem's loaders, ThemeSwitcher's transitions all move
// between two independently-meaningful end states (which icon is shown, where
// the indicator sits, which label is active) -- there is no in-between frame
// that could be misread as a different state, so the fix here is the simple
// `transition: none` form, not a stepped animation. Four separate selectors
// declare a non-`none` transition by default: `.toggle-button` (background),
// `.icon` (opacity/transform), `.segment-indicator` (left/width), and
// `.segment-button` (color). This checks all four are covered, not just the
// two the task description named -- an incomplete guard would leave part of
// the component animating under the OS preference.
const source = readFileSync(join(import.meta.dirname, 'ThemeSwitcher.svelte'), 'utf8');

const GUARDED_SELECTORS = ['.toggle-button', '.icon', '.segment-indicator', '.segment-button'];

describe('ThemeSwitcher transitions — prefers-reduced-motion guard (source-level check)', () => {
  it.each(GUARDED_SELECTORS)('%s has a non-none transition by default', (selector) => {
    const escaped = selector.replace('.', '\\.');
    const pattern = new RegExp(`${escaped}\\s*{[^}]*transition:\\s*[^;]*[a-zA-Z][^;]*;`);
    expect(source).toMatch(pattern);
  });

  it('is guarded by a single @media (prefers-reduced-motion: reduce) block declared after every base rule it covers', () => {
    const mediaIndex = source.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(mediaIndex).toBeGreaterThan(-1);

    for (const selector of GUARDED_SELECTORS) {
      // `.toggle-button {` / `.icon {` / etc. -- the base rule's own opening
      // brace. Each guarded selector's base declaration must precede the
      // guard so the guard wins the equal-specificity tie via source order.
      const baseIndex = source.indexOf(`${selector} {`);
      expect(baseIndex, `${selector} base rule not found`).toBeGreaterThan(-1);
      expect(baseIndex, `${selector} base rule must precede the reduced-motion guard`).toBeLessThan(
        mediaIndex
      );
    }
  });

  it('sets transition: none for all four selectors inside the guard, in one rule', () => {
    const mediaBlock = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));

    for (const selector of GUARDED_SELECTORS) {
      expect(mediaBlock).toContain(selector);
    }
    expect(mediaBlock).toMatch(/transition:\s*none;/);
  });
});
