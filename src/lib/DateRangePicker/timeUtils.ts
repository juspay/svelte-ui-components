// Time-of-day helpers for the DateRangePicker's built-in date + time inputs.
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
