import type { Snippet } from 'svelte';

export type KeyValueProperties = MandatoryKeyValueProperties & OptionalKeyValueProperties;

export type KeyValueItem = {
  /** The field label (the "key"). */
  label: string;
  /**
   * The field value. May be `null`/`undefined`/empty — such items are skipped when
   * `hideEmpty` is `true` (the default), or rendered as `emptyText` otherwise.
   */
  value?: string | number | null;
  /** Optional per-item test id, emitted as `data-pw` on the item wrapper. */
  testId?: string;
};

export type KeyValueLayout = 'vertical' | 'horizontal';

/** Size preset scaling the label/value typography. Mirrors Blend's KeyValuePair sizes. */
export type KeyValueSize = 'sm' | 'md' | 'lg';

export type MandatoryKeyValueProperties = {
  items: KeyValueItem[];
};

export type OptionalKeyValueProperties = {
  /**
   * Number of columns the pairs flow across (row-major). Defaults to `2`. The grid
   * collapses to a single column below the `--keyvalue-collapse-width` breakpoint.
   */
  columns?: number;
  /**
   * `'vertical'` (default) stacks the value beneath the label; `'horizontal'` places the
   * label and value side-by-side (label width set by `--keyvalue-label-width`).
   */
  layout?: KeyValueLayout;
  /**
   * Typography size preset. `'sm'` (12/14px), `'md'` (13/16px, default), `'lg'` (14/18px) —
   * label/value font sizes respectively. Individual `--keyvalue-label-size` /
   * `--keyvalue-value-size` overrides always take precedence over the preset.
   */
  size?: KeyValueSize;
  /**
   * When `true` (default), items whose value is `null`, `undefined`, or an empty/whitespace
   * string are omitted. Set `false` to render them as `emptyText` instead.
   */
  hideEmpty?: boolean;
  /** Placeholder rendered for empty values when `hideEmpty` is `false`. Defaults to `'—'`. */
  emptyText?: string;
  /** Custom renderer for the value cell, receiving `(item, index)`. Falls back to plain text. */
  valueSnippet?: Snippet<[KeyValueItem, number]>;
  /** Custom renderer for the label cell, receiving `(item, index)`. Falls back to plain text. */
  labelSnippet?: Snippet<[KeyValueItem, number]>;
  /** Test selector applied as the `data-pw` attribute on the root grid. */
  testId?: string;
  /** Additional CSS classes for theming the root grid. */
  classes?: string;
};
