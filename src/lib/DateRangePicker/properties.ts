import type { Snippet } from 'svelte';

export type DateRangePreset = {
  label: string;
  getValue: () => { start: Date; end: Date };
  /**
   * Optional group key. Consecutive presets sharing the same group key are
   * visually grouped together. A thin divider (and optional group label) is
   * rendered whenever the group key changes between two consecutive presets.
   * Presets without a group field render exactly as before.
   */
  group?: string;
};

export type DateRangePickerMode = 'range' | 'single';

export type OptionalDateRangePickerProperties = {
  /** Currently selected start of range (bindable). */
  rangeStart?: Date | null;
  /** Currently selected end of range (bindable). */
  rangeEnd?: Date | null;
  /** Selected date when mode='single' (bindable). */
  value?: Date | null;
  /** Whether the picker operates in range or single-date mode. Default: 'range'. */
  mode?: DateRangePickerMode;
  /** Earliest selectable date. */
  minDate?: Date | null;
  /** Latest selectable date. */
  maxDate?: Date | null;
  /** Specific dates to disable, or a predicate. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** Maximum number of days a selected range may span, inclusive of both endpoints (range mode only). Once a start date is picked, dates that would exceed this span are disabled until the range is completed. Omit for no limit. */
  maxRangeDays?: number | null;
  /** Preset options shown in the sidebar. Omit to hide the sidebar. */
  presets?: DateRangePreset[] | null;
  /** Placeholder shown when no range is selected. */
  placeholder?: string;
  /** Show two months side by side. Defaults to true for range mode, false for single. */
  dualMonth?: boolean;
  /** Snippet rendered in the time-picker slot. Consumer controls all time UI. */
  timePicker?: Snippet;
  /** Start of compare range (bindable). Used when compareCalendar snippet is provided. */
  compareStart?: Date | null;
  /** End of compare range (bindable). Used when compareCalendar snippet is provided. */
  compareEnd?: Date | null;
  /** Snippet rendered in the compare-calendar slot. Consumer controls all compare UI. */
  compareCalendar?: Snippet;
  /** Which day of the week starts the calendar. 0=Sunday, 1=Monday. */
  weekStartsOn?: 0 | 1;
  /** BCP-47 locale string for date formatting. */
  locale?: string;
  /** Test ID placed on the root wrapper element. */
  testId?: string;
  /** Extra CSS classes applied to the root wrapper. */
  classes?: string;
  /** Custom trigger content snippet. Receives the current label string as its argument. */
  triggerSnippet?: Snippet<[string]>;
  /** Custom icon snippet for the trigger button. */
  triggerIcon?: Snippet;
  /**
   * When true (and mode='single'), shows a Clear button in the footer whenever a
   * date is committed. Clicking Clear resets value to null and fires onclear.
   * Has no effect in range mode. Default: false.
   */
  clearable?: boolean;
  /**
   * Label of the preset that should appear active on mount, without firing onapply.
   * The matching preset's date range is seeded into the draft and the trigger shows
   * the preset label. If no preset matches the string exactly, the prop is ignored.
   * Only takes effect once on mount; subsequent prop changes are not tracked.
   */
  initialPresetLabel?: string;
};

export type DateRangePickerEventProperties = {
  /** Fired when the user clicks Apply in range mode. presetLabel is the sidebar preset name if one was active, or null for a custom calendar selection. */
  onapply?: (event: { rangeStart: Date; rangeEnd: Date; presetLabel: string | null }) => void;
  /** Fired when the user clicks Apply in single mode. presetLabel is the sidebar preset name if one was active, or null for a custom calendar selection. */
  onapplysingle?: (event: { date: Date; presetLabel: string | null }) => void;
  /** Fired when the compare range is applied. presetLabel is the sidebar preset name if one was active, or null for a custom calendar selection. */
  onapplycompare?: (event: {
    compareStart: Date;
    compareEnd: Date;
    presetLabel: string | null;
  }) => void;
  /** Fired when the user dismisses without applying. */
  oncancel?: () => void;
  /** Fired whenever the picker opens or closes. */
  onopentoggle?: (event: { open: boolean }) => void;
  /**
   * Fired when the user clicks the Clear button in single mode (requires clearable=true).
   * value is reset to null before this callback is invoked.
   */
  onclear?: () => void;
};

export type DateRangePickerProperties = OptionalDateRangePickerProperties &
  DateRangePickerEventProperties;
