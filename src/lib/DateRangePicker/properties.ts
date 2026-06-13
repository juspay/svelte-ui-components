import type { Snippet } from 'svelte';

export type DateRangePreset = {
  label: string;
  getValue: () => { start: Date; end: Date };
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
};

export type DateRangePickerEventProperties = {
  /** Fired when the user clicks Apply in range mode. */
  onapply?: (event: { rangeStart: Date; rangeEnd: Date }) => void;
  /** Fired when the user clicks Apply in single mode. */
  onapplysingle?: (event: { date: Date }) => void;
  /** Fired when the compare range is applied. */
  onapplycompare?: (event: { compareStart: Date; compareEnd: Date }) => void;
  /** Fired when the user dismisses without applying. */
  oncancel?: () => void;
  /** Fired whenever the picker opens or closes. */
  onopentoggle?: (event: { open: boolean }) => void;
};

export type DateRangePickerProperties = OptionalDateRangePickerProperties &
  DateRangePickerEventProperties;
