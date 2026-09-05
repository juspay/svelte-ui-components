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
  /**
   * Comparison-period value rendered inline after the metric as "/ <value>"
   * (e.g. "₹60k / ₹10L") in a muted denominator style. Omit to hide.
   */
  comparisonValue?: string;
  /**
   * Numeric change for the delta indicator. A number renders the delta
   * (0 renders the neutral "— 0%" treatment); `null` means a comparison was
   * expected but not computable and renders "N/A"; `undefined` renders nothing.
   */
  change?: number | null;
  /** Invert delta colors for lower-is-better metrics on this row. */
  invertChangeColors?: boolean;
  /**
   * Additional descriptive text rendered after the value/delta. By default it
   * flows inline and only wraps if it does not fit (e.g. a short unit suffix
   * like "%" or "ms"). Set `additionalContentBreak` to force it onto its own
   * line regardless of available width.
   */
  additionalContent?: string;
  /**
   * Forces `additionalContent` onto its own line below the value/delta,
   * regardless of available width. Omit to keep the default inline flow.
   */
  additionalContentBreak?: boolean;
  /** Tints this row's value text for a warning or success state. Omit for the default color. */
  valueVariant?: 'success' | 'warning';
  /**
   * Secondary label rendered below this row's value line (e.g. a per-row
   * comparison-period caption). Independent of the card-level `subtitle` —
   * both may be set at once, e.g. when different rows compare against
   * different baselines.
   *
   * Renders after the value line by default (heading → value → subtitle in
   * markup order). A consumer that needs title → subtitle → value can
   * reorder without touching markup via `--statcard-row-subtitle-order` /
   * `--statcard-row-value-line-order` — see `testId` below.
   */
  subtitle?: string;
  /** Tooltip shown on the row heading. */
  tooltip?: StatCardTooltip;
  /** Heading rendered above the breakdown grid. */
  breakdownHeading?: string;
  /** Breakdown items rendered in a grid below the row value. */
  breakdown?: StatCardBreakdownItem[];
  /**
   * Test selector for the row root element, rendered as `data-pw`/`testID`.
   * Also the CSS scoping anchor for per-row typography and layout: target
   * `[data-pw="<testId>"]` to set `--statcard-row-value-font-size`,
   * `--statcard-row-value-font-weight`, `--statcard-row-heading-font-size`,
   * `--statcard-row-heading-font-weight`, or the row's flex `order` overrides
   * (`--statcard-row-heading-order`, `--statcard-row-value-line-order`,
   * `--statcard-row-subtitle-order`) for just this row, independent of its
   * siblings — see the CSS Variables table in the component docs.
   *
   * The row's three sub-elements (heading wrap, value line, subtitle) render
   * in that markup order and each default to `order: 0`, so an untouched row
   * is byte-identical to today. Set the three order hooks to reorder them —
   * e.g. subtitle before the value line for a title → subtitle → value
   * layout — the same pattern the card-level `--statcard-subtitle-order` /
   * `--statcard-value-row-order` hooks already use for the card's own
   * sections. `.statcard-row` is a `display: flex; flex-direction: column`
   * container, so `order` applies directly with no other CSS needed.
   */
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
  oncheckboxchange?: (checked: boolean) => void;
  /** @deprecated Use `oncheckboxchange` instead; both work until 4.0.0. */
  onCheckboxChange?: (checked: boolean) => void;
};
