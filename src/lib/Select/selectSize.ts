import type { SelectSize } from './properties';

/**
 * Canonical size list, in the order documented in docs/Select.md and mirrored by the
 * `.size-*` rules in Select.svelte's `<style>` block.
 */
export const SELECT_SIZES: readonly SelectSize[] = ['sm', 'md', 'lg'];

/**
 * Resolves the CSS class Select.svelte applies for a given size. Pure and exported —
 * rather than inline `class:size-x={size === 'x'}` directives — so the mapping is
 * unit-testable without rendering: this repo's vitest suite runs no browser, so a
 * `.svelte` template's DOM output cannot be asserted on directly (see
 * `src/lib/Pill/pillTone.ts` and `src/lib/Table/normalizeColumns.ts` for the same pattern).
 *
 * `'md'` deliberately resolves to `''` rather than a `.size-md` class: it is the default,
 * and emitting no class keeps the rendered trigger byte-identical to what it was before
 * this prop existed. No size passed resolves to `''` for the same reason.
 */
export function selectSizeClass(size?: SelectSize): string {
  return typeof size === 'string' && size !== 'md' ? `size-${size}` : '';
}
