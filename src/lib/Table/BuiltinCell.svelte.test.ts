import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BuiltinCell from './BuiltinCell.svelte';
import type { TableColumn } from './properties';

/**
 * The `%` lives INSIDE `AnimatedNumber`'s accessible name, so nothing should be
 * left beside it. Asserted by removing the odometer's subtree and reading what
 * remains, rather than by scraping textContent: every column keeps all ten
 * glyphs in the DOM for the roll, and Svelte leaves `{#if}`/`{:else}` anchor
 * comments as sibling nodes, so neither textContent nor `nextSibling` says
 * anything useful on its own.
 */
const textOutsideOdometer = (element: Element | null): string => {
  if (!element) {
    return 'ELEMENT NOT FOUND';
  }
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelector('[role="img"]')?.remove();
  return clone.textContent?.trim() ?? '';
};

/**
 * `compare.animateTrend` is new, additive, per-cell data — off by default —
 * so this pins both halves of that contract: unset, the trend row is
 * unchanged byte-for-byte plain text; set, `trendPercent` renders through
 * `AnimatedNumber` instead. jsdom has no `Element.animate`, no CSS global and
 * no `matchMedia` (see `AnimatedNumber.svelte.test.ts`), so this only asserts
 * DOM structure/text, never the roll itself.
 */
// `testId` is required for BuiltinCell to emit a `data-pw` at all
// (`generatedTestId` returns early without it), so it is set here purely to
// give these tests a selector — the same idiom other builtin-cell fixtures
// in this file's sibling tests use.
const compareColumn: TableColumn = {
  id: 'revenue',
  label: 'Revenue',
  type: 'compare',
  testId: 'revenue'
};

describe('BuiltinCell compare — animateTrend default (off)', () => {
  it('renders trendPercent as plain text next to the up arrow, with no AnimatedNumber in the DOM', () => {
    const { container } = render(BuiltinCell, {
      column: compareColumn,
      value: { primary: '₹4,938.10', comparison: '₹4,100.00', trendPercent: 20 },
      rowIndex: 0,
      originalIndex: 0
    });

    const trendUp = container.querySelector('[data-pw="revenue-trend-up"]');
    expect(trendUp?.textContent?.trim()).toBe('20%');
    expect(container.querySelector('.animated-number')).toBeNull();
  });

  it('renders a negative trendPercent as plain text next to the down arrow', () => {
    const { container } = render(BuiltinCell, {
      column: compareColumn,
      value: { trendPercent: -8 },
      rowIndex: 0,
      originalIndex: 0
    });

    const trendDown = container.querySelector('[data-pw="revenue-trend-down"]');
    expect(trendDown?.textContent?.trim()).toBe('-8%');
    expect(container.querySelector('.animated-number')).toBeNull();
  });
});

describe('BuiltinCell compare — animateTrend: true', () => {
  it('renders trendPercent through AnimatedNumber, still beside the up arrow and literal %', () => {
    const { container } = render(BuiltinCell, {
      column: compareColumn,
      value: {
        primary: '₹4,938.10',
        comparison: '₹4,100.00',
        trendPercent: 20,
        animateTrend: true
      },
      rowIndex: 0,
      originalIndex: 0
    });

    const trendUp = container.querySelector('[data-pw="revenue-trend-up"]');
    const animatedNumber = trendUp?.querySelector('.animated-number');
    expect(animatedNumber).not.toBeNull();
    // The odometer's own accessible name carries the formatted digits --
    // asserted rather than trendUp's raw textContent, which also picks up
    // AnimatedNumber's off-screen glyph columns (every 0-9, per column, is
    // always present in the DOM; CSS alone selects which one shows). The
    // literal "%" is a sibling node right after the odometer, not text
    // inside it.
    expect(animatedNumber?.getAttribute('aria-label')).toBe('20%');
    // No '%' sibling: it lives inside the odometer's accessible name now, so a
    // screen-reader user navigating by graphic gets the unit with the number.
    expect(textOutsideOdometer(trendUp)).toBe('');
  });

  it('renders a negative trendPercent through AnimatedNumber beside the down arrow', () => {
    const { container } = render(BuiltinCell, {
      column: compareColumn,
      value: { trendPercent: -8, animateTrend: true },
      rowIndex: 0,
      originalIndex: 0
    });

    const trendDown = container.querySelector('[data-pw="revenue-trend-down"]');
    const animatedNumber = trendDown?.querySelector('.animated-number');
    expect(animatedNumber).not.toBeNull();
    expect(animatedNumber?.getAttribute('aria-label')).toBe('-8%');
    // No '%' sibling: it lives inside the odometer's accessible name now, so a
    // screen-reader user navigating by graphic gets the unit with the number.
    expect(textOutsideOdometer(trendDown)).toBe('');
  });

  it('leaves the flat (trendPercent: 0) case as its existing literal text, unaffected by animateTrend', () => {
    const { container, getByText } = render(BuiltinCell, {
      column: compareColumn,
      value: { trendPercent: 0, animateTrend: true },
      rowIndex: 0,
      originalIndex: 0
    });

    expect(getByText('↔ 0%')).toBeTruthy();
    expect(container.querySelector('.animated-number')).toBeNull();
  });

  it('does not disturb other compare fields (primary/comparison) or a trendLabel-only row', () => {
    const { container, getByText } = render(BuiltinCell, {
      column: compareColumn,
      value: { primary: 'A', comparison: 'B', trendLabel: 'Steady', animateTrend: true },
      rowIndex: 0,
      originalIndex: 0
    });

    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('Steady')).toBeTruthy();
    expect(container.querySelector('.animated-number')).toBeNull();
  });
});
