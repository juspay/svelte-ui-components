import type { PillTone } from './properties';

/**
 * Canonical tone list, in the order documented in docs/Pill.md and mirrored by the
 * `.tone-*` rules in Pill.svelte's `<style>` block.
 */
export const PILL_TONES: readonly PillTone[] = ['accent', 'ok', 'warn', 'danger', 'muted'];

/**
 * Resolves the CSS class Pill.svelte applies for a given tone. Pure and exported — rather
 * than five inline `class:tone-x={tone === 'x'}` directives — so the mapping is unit-testable
 * without rendering: this repo's vitest suite runs no browser, so a `.svelte` template's DOM
 * output cannot be asserted on directly (see `src/lib/Table/normalizeColumns.ts` for the same
 * pattern). No tone passed resolves to `''`, so the class list — and therefore the rendered
 * background/color — is unchanged from before this prop existed.
 */
export function pillToneClass(tone?: PillTone): string {
  return typeof tone === 'string' ? `tone-${tone}` : '';
}
