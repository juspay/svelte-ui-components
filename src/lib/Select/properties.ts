import type { Snippet } from 'svelte';

export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
  /** Optional per-option test id, emitted as `data-pw` on the option element. */
  testId?: string;
  /**
   * Optional image src (URL or data URI) rendered at the left of the option row,
   * before the label — for icon pickers and any list whose options carry a glyph.
   * Size is controlled by the `--select-option-icon-size` CSS variable (default 16px).
   * An SVG source is inlined, so an icon drawn with `currentColor` inherits the
   * option row's text colour; anything else renders as a plain `<img>`.
   * Pair with the trigger's `leftIcon` (driven by the selected option's icon) to show
   * the current selection in the closed trigger.
   */
  icon?: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[] | string[];
};

export type SelectHierarchy = 'default' | 'ghost';

/** Placement of the `searchable` filter input. See `searchPosition`. */
export type SelectSearchPosition = 'trigger' | 'menu';

export type OptionalSelectProperties = {
  value?: string[];
  multiple?: boolean;
  searchable?: boolean;
  /**
   * Where the `searchable` filter input lives. `'trigger'` (the default) keeps
   * today's behaviour: the input replaces the trigger's label and is focused
   * automatically on open.
   *
   * `'menu'` puts it inside the open dropdown instead, which is what the
   * design-system keyboard contract specifies — the trigger stays a plain
   * combobox, and the search box is reached by Tab AFTER opening rather than
   * by being focused for you. That difference is the point: with the input in
   * the trigger there is no way to open the menu and keep focus on the
   * combobox, so a keyboard user who wanted to arrow through the options had
   * to type first.
   *
   * No effect unless `searchable` is also set.
   */
  searchPosition?: SelectSearchPosition;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Renders the error treatment on the trigger — a red border that outranks
   * the hover and focus border colours, so the field still reads as invalid
   * while the user is in it. Independent of any validation the consumer runs;
   * this is the server- or form-driven flag, matching `Input.forceError`.
   */
  error?: boolean;
  /**
   * Message shown below the trigger while `error` is true, in a `role="alert"`
   * region wired to the combobox through `aria-describedby`. A string rather
   * than a snippet, following `Input`'s `onErrorMessage`: the content is a
   * sentence, and making it a snippet would mean every consumer rebuilds the
   * alert semantics that make it announce.
   */
  errorMessage?: string;
  /**
   * Adds a clear (×) button to the trigger whenever there is a selection. It
   * resets the value WITHOUT opening the menu, which is the whole point —
   * clearing through the menu costs an open, a hunt and a second click.
   * Hidden while `disabled`, and never rendered when nothing is selected.
   */
  clearable?: boolean;
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
  /**
   * Optional image src (URL or data URI) rendered at the left of the trigger.
   * Size is controlled by the `--select-left-icon-size` CSS variable (default 16px).
   * An SVG source is inlined, so an icon drawn with `currentColor` inherits the
   * trigger's text colour; anything else renders as a plain `<img>`.
   */
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
  /**
   * Native `name` for form submission. Select has no underlying `<select>` —
   * it is a custom combobox/listbox — so setting this renders one
   * `<input type="hidden">` per entry in `value`, each carrying the
   * selected item's `id` as its value. Omitted by default: no hidden inputs
   * are rendered and nothing changes for an existing consumer. Mirrors a
   * native `<select multiple>`, which likewise submits one entry per
   * selected `<option>` under the same name; an empty `value` array
   * submits nothing, matching a native select with no selection.
   */
  name?: string;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
  /**
   * Fires when the clear button empties the selection, after `onchange` has
   * already reported the new empty value. Use it to distinguish "cleared" from
   * "deselected the last item", which `onchange` alone cannot tell apart.
   */
  onclear?: () => void;
  onopen?: () => void;
  onclose?: () => void;
};
