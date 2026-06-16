import type { Snippet } from 'svelte';

export type StatCardProperties = OptionalStatCardProperties & StatCardEventProperties;

export type MandatoryStatCardProperties = Record<string, never>;

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
  /** Renders as `data-pw` on the root element for Playwright test selection. */
  testId?: string;
  /** Extra CSS class names appended to the root element. */
  classes?: string;
};

export type StatCardEventProperties = {
  /** Makes the card interactive: adds `role="button"`, `tabindex=0`, and wires click/Enter/Space. */
  onclick?: (event: MouseEvent) => void;
};
