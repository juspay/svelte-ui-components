import { describe, expect, it } from 'vitest';
import { parseDateDisplay } from './timeUtils';

describe('parseDateDisplay', () => {
  it('parses the component display format', () => {
    const parsed = parseDateDisplay('Jul 10, 2026');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(6);
    expect(parsed?.getDate()).toBe(10);
  });

  it('parses numeric and ISO forms', () => {
    expect(parseDateDisplay('7/10/2026')?.getMonth()).toBe(6);
    expect(parseDateDisplay('2026-07-10')?.getDate()).toBe(10);
  });

  it('returns null for text that names no real calendar date', () => {
    expect(parseDateDisplay('not a date')).toBeNull();
    expect(parseDateDisplay('Feb 30, 2026')).toBeNull();
    expect(parseDateDisplay('2026-02-30')).toBeNull();
    expect(parseDateDisplay('2026-13-01')).toBeNull();
    expect(parseDateDisplay('')).toBeNull();
  });

  // `new Date(year, month, day)` remaps years 0-99 onto 1900-1999. The ISO pattern
  // accepts any four digits, so "0050-01-01" is a literal a user can actually type;
  // before the setFullYear build it silently resolved to 1950.
  it('keeps a sub-100 year as written instead of remapping it into the 1900s', () => {
    const parsed = parseDateDisplay('0050-01-01');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(50);
  });

  it('applies Gregorian leap rules to sub-100 years when validating the day', () => {
    // 48 is divisible by 4 -> leap; 50 is not.
    expect(parseDateDisplay('0048-02-29')?.getDate()).toBe(29);
    expect(parseDateDisplay('0050-02-29')).toBeNull();
  });

  it('applies the century leap-year exceptions', () => {
    expect(parseDateDisplay('2000-02-29')?.getDate()).toBe(29);
    expect(parseDateDisplay('1900-02-29')).toBeNull();
    expect(parseDateDisplay('2024-02-29')?.getDate()).toBe(29);
    expect(parseDateDisplay('2023-02-29')).toBeNull();
  });

  it('returns a local-midnight date', () => {
    const parsed = parseDateDisplay('Jul 10, 2026');
    expect(parsed?.getHours()).toBe(0);
    expect(parsed?.getMinutes()).toBe(0);
    expect(parsed?.getSeconds()).toBe(0);
    expect(parsed?.getMilliseconds()).toBe(0);
  });

  it('parses day-first month-name dates', () => {
    for (const text of ['10 Jul 2026', '10 Jul, 2026', '10 July 2026', '10 jul. 2026']) {
      const parsed = parseDateDisplay(text);
      expect(parsed?.getFullYear(), text).toBe(2026);
      expect(parsed?.getMonth(), text).toBe(6);
      expect(parsed?.getDate(), text).toBe(10);
    }
    expect(parseDateDisplay('10 Sept 2026')?.getMonth()).toBe(8);
  });

  it('round-trips every month of the en-IN and en-GB display format', () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    for (const locale of ['en-IN', 'en-GB', 'en-US']) {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const date = new Date(2026, monthIndex, 28);
        const text = date.toLocaleDateString(locale, options);
        expect(parseDateDisplay(text)?.getTime(), `${locale} ${text}`).toBe(date.getTime());
      }
    }
  });

  it('keeps the existing formats unchanged', () => {
    const expected = new Date(2026, 6, 10).getTime();
    for (const text of [
      'Jul 10, 2026',
      'Jul 10 2026',
      'July 10, 2026',
      '7/10/2026',
      '7-10-2026',
      '2026-07-10'
    ]) {
      expect(parseDateDisplay(text)?.getTime(), text).toBe(expected);
    }
  });

  it('rejects day-first text that names no real date', () => {
    expect(parseDateDisplay('31 Feb 2026')).toBeNull();
    expect(parseDateDisplay('10 Foo 2026')).toBeNull();
    expect(parseDateDisplay('0 Jul 2026')).toBeNull();
  });

  it('parses the same day identically for a range start and end', () => {
    const start = parseDateDisplay('10 Jul 2026');
    const end = parseDateDisplay('10 Jul 2026');
    expect(start).not.toBeNull();
    expect(start?.getTime()).toBe(end?.getTime());
  });
});
