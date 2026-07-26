// Time-of-day and calendar-date helpers for the DateRangePicker's built-in date + time inputs.
import type { TimeDisplayBoundary } from './properties';

/** Matches a 12-hour clock display such as "2:30 PM" or "02:05 am". */
export const TIME_DISPLAY_PATTERN = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)$/i;

const pad = (n: number): string => n.toString().padStart(2, '0');

/** Parse a 12-hour display string into 24-hour hours/minutes, or null when invalid. */
export const parseTimeDisplay = (display: string): { hours: number; minutes: number } | null => {
  const match = TIME_DISPLAY_PATTERN.exec(display.trim());
  if (match === null) {
    return null;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
};

/** Format a Date's time-of-day as a 12-hour display string, e.g. "02:30 PM". */
export const formatTimeDisplay = (date: Date): string => {
  const hours24 = date.getHours();
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${pad(hours12)}:${pad(date.getMinutes())} ${meridiem}`;
};

/** Return a new Date with the time-of-day from a 12-hour display string applied, or null when invalid. */
export const applyTimeDisplay = (
  date: Date,
  display: string,
  boundary: TimeDisplayBoundary
): Date | null => {
  const parsed = parseTimeDisplay(display);
  if (parsed === null) {
    return null;
  }
  const next = new Date(date.getTime());
  if (boundary === 'end') {
    next.setHours(parsed.hours, parsed.minutes, 59, 999);
  } else {
    next.setHours(parsed.hours, parsed.minutes, 0, 0);
  }
  return next;
};

/** Minutes-since-midnight for ordering comparisons, or null when the display is invalid. */
export const toMinutesOfDay = (display: string): number | null => {
  const parsed = parseTimeDisplay(display);
  return parsed === null ? null : parsed.hours * 60 + parsed.minutes;
};

const SHORT_MONTH_NAMES = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec'
];

/** Matches the DateRangePicker's own display format, e.g. "Jul 10, 2026" or "Jul 10 2026". */
const MONTH_NAME_DATE_PATTERN = /^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/;

/** Matches numeric "M/D/YYYY" or "M-D-YYYY" input. */
const NUMERIC_SLASH_DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

/** Matches ISO "YYYY-MM-DD" input. */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * Build a local-midnight Date for the given calendar parts.
 *
 * `new Date(year, ...)` maps years 0-99 onto 1900-1999, so a literal the parser accepts
 * as four digits — "0050-01-01" — would silently land in 1950. setFullYear has no such
 * remapping, so the date is constructed neutrally and then stamped.
 */
const localMidnightFromParts = (year: number, monthIndex: number, day: number): Date => {
  const date = new Date();
  date.setFullYear(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const daysInMonth = (year: number, monthIndex: number): number =>
  // Day 0 of the next month is the last day of this one.
  localMidnightFromParts(year, monthIndex + 1, 0).getDate();

/** Build a local-midnight Date from year/monthIndex/day, or null when the calendar date does not exist. */
const buildDateFromParts = (year: number, monthIndex: number, day: number): Date | null => {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > daysInMonth(year, monthIndex)) {
    return null;
  }
  return localMidnightFromParts(year, monthIndex, day);
};

/**
 * Parse a typed calendar-date string into a local-midnight Date, or null when the text is
 * unparseable or names a calendar date that does not exist (e.g. "Feb 30, 2026"). Accepts the
 * component's own display format ("Jul 10, 2026"), numeric "M/D/YYYY", and ISO "YYYY-MM-DD".
 */
export const parseDateDisplay = (display: string): Date | null => {
  const trimmedDisplay = display.trim();
  if (trimmedDisplay === '') {
    return null;
  }

  const isoMatch = ISO_DATE_PATTERN.exec(trimmedDisplay);
  if (isoMatch !== null) {
    return buildDateFromParts(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const monthNameMatch = MONTH_NAME_DATE_PATTERN.exec(trimmedDisplay);
  if (monthNameMatch !== null) {
    const monthIndex = SHORT_MONTH_NAMES.indexOf(monthNameMatch[1].slice(0, 3).toLowerCase());
    if (monthIndex === -1) {
      return null;
    }
    return buildDateFromParts(Number(monthNameMatch[3]), monthIndex, Number(monthNameMatch[2]));
  }

  const slashMatch = NUMERIC_SLASH_DATE_PATTERN.exec(trimmedDisplay);
  if (slashMatch !== null) {
    return buildDateFromParts(
      Number(slashMatch[3]),
      Number(slashMatch[1]) - 1,
      Number(slashMatch[2])
    );
  }

  return null;
};
