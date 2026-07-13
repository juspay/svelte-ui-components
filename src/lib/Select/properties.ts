import type { Snippet } from 'svelte';

export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
  /** Optional per-option test id, emitted as `data-pw` on the option element. */
  testId?: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[] | string[];
};

export type SelectHierarchy = 'default' | 'ghost';

export type OptionalSelectProperties = {
  value?: string[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  bottomContent?: Snippet;
  /**
   * Snippet for rendering a custom multi-select option indicator, receiving `{ checked, indeterminate }`.
   * `indeterminate` is `true` only for the `showSelectAll` row when some — but not all — listed options
   * are selected; it is always `false` for individual option rows. When omitted, multiple-mode options
   * render a design-system checkbox box (bordered
   * square that fills and shows a checkmark when selected, or a centred dash when indeterminate),
   * themeable via the `--select-option-indicator-*` CSS variables: `-size` (18px), `-border`,
   * `-border-radius`, `-background`, `-checked-background`, `-checked-border-color`, `-check-size`,
   * `-check-color`, `-dash-size`, `-dash-thickness`, `-dash-color`. Provide this snippet to fully
   * replace the indicator (e.g. to restore the legacy ☑/☐ glyph).
   */
  optionIndicator?: Snippet<[{ checked: boolean; indeterminate?: boolean }]>;
  /**
   * Multiple mode only. When `true`, renders a "Select all" row at the top of the dropdown that
   * toggles every currently-listed (search-filtered) option. The row shows an indeterminate
   * indicator when only some of the listed options are selected. No effect outside `multiple` mode.
   */
  showSelectAll?: boolean;
  /** Label for the `showSelectAll` row. Defaults to `'Select all'`. */
  selectAllLabel?: string;
  /**
   * Single-select only: when `true`, the currently selected option shows a
   * checkmark at its right edge. No effect in `multiple` mode (which already
   * renders a checkbox indicator). Themeable via `--select-option-tick-size`
   * and `--select-option-tick-color`. Defaults to `false`.
   */
  showSelectedTick?: boolean;
  testId?: string;
  /** Fallback per-option test id prefix. Each option emits `data-pw="{itemTestId}-{id}"` when its own `item.testId` is not set. */
  itemTestId?: string;
  classes?: string;
  /** Bindable. Controls whether the dropdown is open; the component writes back on open/close so parents can `bind:open` to observe or drive it. Unbound, the component manages its own state. */
  open?: boolean;
  /** Horizontal anchor of the dropdown panel. `'left'` (default) anchors to the trigger's left edge; `'right'` anchors to the right edge so a content-wider panel hangs leftward instead of overflowing. */
  dropdownAlign?: 'left' | 'right';
  /** Snippet for rendering a compact trigger summary in multiple mode instead of one Pill per selected value. Receives `{ value, items }` so the consumer can compute e.g. "All" / "3 selected". When not provided the default Pill-per-value behaviour is used. */
  triggerSummary?: import('svelte').Snippet<[{ value: string[]; items: SelectItem[] }]>;
  /** Visual hierarchy of the trigger. `'ghost'` renders a transparent, borderless trigger — useful when the Select is embedded in a toolbar or header where a full bordered input would be visually heavy. Defaults to `'default'`. */
  hierarchy?: SelectHierarchy;
  /** Optional image src (URL or data URI) rendered at the left of the trigger. Size is controlled by the `--select-left-icon-size` CSS variable (default 16px). */
  leftIcon?: string;
  /** `data-pw` test id forwarded to the leading icon `<Img>` element. */
  leftIconTestId?: string;
  /**
   * When `true`, the dropdown panel is portaled to `document.body` and positioned
   * `fixed` relative to the trigger, so an ancestor with `overflow: hidden` or a
   * scroll container (e.g. a table cell) cannot clip it. Placement follows the
   * trigger on scroll/resize and flips above the trigger when there is no room
   * below. Defaults to `false` (in-flow `position: absolute`), which preserves the
   * existing behaviour — including any consumer CSS that targets `.select-dropdown`
   * via an ancestor selector, since that only resolves while the panel stays inside
   * the `.select` container. Opt in for Selects rendered inside clipping containers.
   * When portaled the panel defaults to `z-index: 1000` (top-layer band); raise
   * `--select-dropdown-z-index` if it must sit above an even higher overlay.
   */
  usePortal?: boolean;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
  onopen?: () => void;
  onclose?: () => void;
};
