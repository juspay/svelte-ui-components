import type { Snippet } from 'svelte';

export type StatCardProperties = OptionalStatCardProperties & StatCardEventProperties;

export type MandatoryStatCardProperties = Record<string, never>;

export type StatCardTooltip = {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  testId?: string;
};

export type StatCardBreakdownItem = {
  label: string;
  value: string;
  change?: number;
  invertChangeColors?: boolean;
};

/**
 * A single metric row inside a multi-row StatCard.
 *
 * @example
 * ```ts
 * const row: StatCardRow = {
 *   heading: 'Gross Revenue',
 *   value: '₹12.4Cr',
 *   change: 8.2,
 *   tooltip: { text: 'Revenue before returns' }
 * };
 * ```
 */
export type StatCardRow = {
  /** The metric value string for this row (e.g. "₹1.23Cr", "98.4%"). */
  value: string;
  /** Optional row-level heading label. */
  heading?: string;
  /** Numeric change for the delta indicator. */
  change?: number;
  /** Invert delta colors for lower-is-better metrics on this row. */
  invertChangeColors?: boolean;
  /** Additional descriptive text rendered after the delta. */
  additionalContent?: string;
  /** Tooltip shown on the row heading. */
  tooltip?: StatCardTooltip;
  /** Heading rendered above the breakdown grid. */
  breakdownHeading?: string;
  /** Breakdown items rendered in a grid below the row value. */
  breakdown?: StatCardBreakdownItem[];
  /** Test selector for the row root element. */
  testId?: string;
};

export type OptionalStatCardProperties = {
  /** Card heading label. */
  title?: string;
  /** Pre-formatted metric value string (e.g. "₹1.23Cr", "98.4%"). */
  value?: string;
  /** Pre-formatted delta string (e.g. "+12.5%", "-3.2%"). Auto-infers `deltaPositive` from leading sign when `deltaPositive` is not provided. */
  delta?: string;
  /** Overrides automatic sign-based inference for delta colour. `true` = positive (green), `false` = negative (red). */
  deltaPositive?: boolean;
  /** Secondary label rendered below the value row. */
  subtitle?: string;
  /** Snippet rendered in the card footer area. */
  footer?: Snippet;
  /** Replaces the string `value` with a custom snippet for advanced value rendering. */
  valueSnippet?: Snippet;
  /**
   * Multiple metric rows. When provided, replaces the single value/delta row with
   * a column of rows separated by dividers.
   */
  rows?: StatCardRow[];
  /**
   * Layout direction for `rows`. `'column'` (default) stacks rows vertically with
   * horizontal dividers; `'row'` lays the sections side by side with vertical
   * dividers, each section flexing to share the width equally.
   */
  rowsDirection?: 'column' | 'row';
  /** Tooltip shown on the card title. */
  tooltip?: StatCardTooltip;
  /** Checkbox rendered next to the title. */
  checkbox?: { text: string; checked?: boolean };
  /** Snippet rendered at the right edge of the header row. */
  headerRight?: Snippet;
  /** Snippet rendered inside the card body, after any rows. */
  children?: Snippet;
  /** Renders as `data-pw` on the root element for Playwright test selection. */
  testId?: string;
  /** Extra CSS class names appended to the root element. */
  classes?: string;
};

export type StatCardEventProperties = {
  /** Makes the card interactive: adds `role="button"`, `tabindex=0`, and wires click/Enter/Space. */
  onclick?: (event: MouseEvent) => void;
  /** Fired when the header checkbox changes. */
  onCheckboxChange?: (checked: boolean) => void;
};
