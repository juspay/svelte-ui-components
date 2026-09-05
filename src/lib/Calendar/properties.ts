import type { Snippet } from 'svelte';

export type CalendarProperties = OptionalCalendarProperties & CalendarEventProperties;

export type OptionalCalendarProperties = {
  value?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  mode?: 'single' | 'range';
  minDate?: Date | null;
  maxDate?: Date | null;
  disabledDates?: Date[] | ((date: Date) => boolean);
  weekStartsOn?: 0 | 1;
  locale?: string;
  testId?: string;
  previousMonthIcon?: Snippet;
  nextMonthIcon?: Snippet;
  classes?: string;
  /** The month to display initially (only year+month are used). Defaults to the current month. */
  initialMonth?: Date | null;
};

export type CalendarEventProperties = {
  onselect?: (event: { date: Date }) => void;
  /** @deprecated Use `onselect` instead; both work until 4.0.0. */
  onSelect?: (event: { date: Date }) => void;
  onrangeselect?: (event: { rangeStart: Date; rangeEnd: Date }) => void;
  /** @deprecated Use `onrangeselect` instead; both work until 4.0.0. */
  onRangeSelect?: (event: { rangeStart: Date; rangeEnd: Date }) => void;
  onmonthchange?: (event: { year: number; month: number }) => void;
  /** @deprecated Use `onmonthchange` instead; both work until 4.0.0. */
  onMonthChange?: (event: { year: number; month: number }) => void;
};
