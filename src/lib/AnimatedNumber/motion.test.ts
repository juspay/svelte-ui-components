import { describe, expect, it } from 'vitest';
import { durationMs, trendBetween, wheelDelta, WHEEL_LENGTH } from './motion';

/*
 * The arithmetic behind the roll, tested as plain functions. Everything these
 * decide is invisible in jsdom -- there is no `Element.animate` and nothing
 * moves -- and only partly visible even in a real engine, where a midpoint
 * screenshot cannot tell one step from nine. So the claims are made here, on the
 * numbers themselves, and the browser suite asserts that those numbers reach the
 * screen.
 *
 * `canSpin` is deliberately not covered: it exists to feature-detect `mod()`,
 * `round()`, `linear()` and `CSS.registerProperty`, none of which jsdom has, so
 * a test here could only assert that it returns false in an environment the
 * component never runs in. Its real behaviour is covered by the browser suite
 * (motion runs at all) and by the custom-element check (registration reaches
 * inside a shadow root, which an `@property` rule would not).
 */

describe('wheelDelta with a direction from the whole number', () => {
  // The case the component was rebuilt over. 99 -> 100 turns two nines into
  // zeros while the number goes UP, and each of those has to step FORWARD one
  // position. Read per column it is a difference of -9, which is what rolled
  // them nine positions backwards while the new leading column rolled one
  // forwards -- the number tearing itself apart mid-roll.
  it('rolls 9 -> 0 forward by one when the number is counting up', () => {
    expect(wheelDelta(0, 9, 1)).toBe(1);
  });

  it('rolls 0 -> 9 backward by one when the number is counting down', () => {
    expect(wheelDelta(9, 0, -1)).toBe(-1);
  });

  it.each([
    { digit: 4, previous: 3, trend: 1, delta: 1, why: 'an ordinary step up needs no wrap' },
    { digit: 3, previous: 4, trend: -1, delta: -1, why: 'an ordinary step down needs no wrap' },
    { digit: 2, previous: 8, trend: 1, delta: 4, why: '8 -> 9 -> 0 -> 1 -> 2 is four forward' },
    { digit: 8, previous: 2, trend: -1, delta: -4, why: '2 -> 1 -> 0 -> 9 -> 8 is four back' },
    { digit: 7, previous: 7, trend: 1, delta: 0, why: 'an unchanged column does not move' },
    { digit: 7, previous: 7, trend: -1, delta: 0, why: 'nor does it when counting down' }
  ])('$why', ({ digit, previous, trend, delta }) => {
    expect(wheelDelta(digit, previous, trend)).toBe(delta);
  });

  /*
   * The invariant, stated over every pair a column can see. With a direction
   * given, a column either stays put or turns THAT way -- never the other. It is
   * exactly what was missing: each column judging its own direction is what let
   * one roll backwards while its neighbour rolled forwards, and a handful of
   * examples would not have said so for all 100 pairs.
   */
  it.each([1, -1])('with trend %i, no column ever turns the other way', (trend) => {
    const offending: string[] = [];
    for (let previous = 0; previous < WHEEL_LENGTH; previous += 1) {
      for (let digit = 0; digit < WHEEL_LENGTH; digit += 1) {
        const delta = wheelDelta(digit, previous, trend);
        if (delta !== 0 && Math.sign(delta) !== trend) {
          offending.push(`${previous}->${digit} gave ${delta}`);
        }
        // And it never takes the long way: the wheel has ten positions, so no
        // move is ever more than nine, and a wrap is always the short way round.
        if (Math.abs(delta) >= WHEEL_LENGTH) {
          offending.push(`${previous}->${digit} travelled ${delta}, a full turn or more`);
        }
      }
    }
    expect(offending).toEqual([]);
  });

  it('lands on the digit it was sent to, from every starting position', () => {
    for (const trend of [1, -1]) {
      for (let previous = 0; previous < WHEEL_LENGTH; previous += 1) {
        for (let digit = 0; digit < WHEEL_LENGTH; digit += 1) {
          const arrived =
            (((previous + wheelDelta(digit, previous, trend)) % WHEEL_LENGTH) + WHEEL_LENGTH) %
            WHEEL_LENGTH;
          expect(arrived).toBe(digit);
        }
      }
    }
  });
});

describe('wheelDelta with no direction to go on', () => {
  // Trend 0 means "no opinion" -- the string path where no two values can be
  // compared numerically, and the first change of all. Each column then judges
  // itself, which is right in isolation and is the behaviour that has to stay
  // available; it is only wrong when a shared direction WAS available.
  it('falls back to the column of its own accord', () => {
    expect(wheelDelta(0, 9, 0)).toBe(-9);
    expect(wheelDelta(9, 0, 0)).toBe(9);
    expect(wheelDelta(4, 3, 0)).toBe(1);
  });
});

describe('trendBetween', () => {
  it.each([
    { previous: 99, next: 100, sign: 1 },
    { previous: 100, next: 99, sign: -1 },
    { previous: 5, next: 5, sign: 0 },
    { previous: -3, next: -9, sign: -1 },
    { previous: 0, next: -0, sign: 0 }
  ])('reads $previous -> $next as $sign', ({ previous, next, sign }) => {
    expect(trendBetween(previous, next)).toBe(sign);
  });

  // A pre-formatted string has no numeric value to compare, so its digit run is
  // compared instead: longer first, then lexicographically, which is numeric
  // order for two runs of digits.
  it.each([
    { previous: '$99.99', next: '$100.01', sign: 1 },
    { previous: '$100.01', next: '$99.99', sign: -1 },
    { previous: '₹1.23Cr', next: '₹1.45Cr', sign: 1 },
    { previous: '₹1.45Cr', next: '₹1.23Cr', sign: -1 },
    { previous: '₹1.23Cr', next: '₹1.23Cr', sign: 0 },
    { previous: 'N/A', next: 'N/A', sign: 0 }
  ])('reads "$previous" -> "$next" as $sign', ({ previous, next, sign }) => {
    expect(trendBetween(previous, next)).toBe(sign);
  });

  /*
   * Why the string path compares runs rather than parsing them. These two differ
   * by one, but both round to the same double, so `Number(next) - Number(previous)`
   * is 0 and the whole number would roll the wrong way -- or not at all.
   */
  it('stays correct past the range where subtracting two parsed digits would not', () => {
    const previous = '99999999999999999999';
    const next = '100000000000000000000';
    // Both parse to the same double, so subtracting says they are equal --
    // which would leave every column to guess its own direction.
    expect(Number(next) - Number(previous)).toBe(0);
    expect(Number('9007199254740993') - Number('9007199254740992')).toBe(0);
    expect(trendBetween('9007199254740992', '9007199254740993')).toBe(1);
    expect(trendBetween(previous, next)).toBe(1);
  });

  it('compares a number against a string through their digits', () => {
    expect(trendBetween(99, '100')).toBe(1);
    expect(trendBetween('100', 99)).toBe(-1);
  });
});

describe('durationMs', () => {
  it.each([
    { value: '0.9s', ms: 900 },
    { value: '900ms', ms: 900 },
    { value: ' 1.5s ', ms: 1500 },
    { value: '0s', ms: 0 },
    { value: '0ms', ms: 0 }
  ])('reads $value as $ms', ({ value, ms }) => {
    expect(durationMs(value)).toBe(ms);
  });

  // Anything unreadable has to mean "do not animate" rather than "animate for
  // NaN milliseconds", which throws inside `Element.animate`.
  it.each(['', '   ', 'ease-out', 'var(--motion-duration)', '0.9'])(
    'reads %j as no motion at all',
    (value) => {
      expect(durationMs(value)).toBe(0);
    }
  );
});

describe('trendBetween across a non-ASCII numbering system', () => {
  /*
   * `digitRun` matched `\D`, which without the `u` flag means "not an ASCII
   * digit", so every Arabic-Indic, Devanagari or Bengali numeral was stripped and
   * BOTH runs came back empty. The trend then read 0 -- "no opinion" -- and each
   * column fell back to judging its own direction, which is precisely the state
   * that makes a 9 -> 0 column roll nine positions BACKWARD while its neighbour
   * rolls one forward. The same ASCII-only assumption was fixed in the
   * component's own string split; this is the other half of it.
   */
  it.each(['ar-EG', 'fa-IR', 'bn-BD', 'ne-NP', 'en-US'])(
    'reads a rollover formatted by %s as counting up',
    (locale) => {
      const format = (value: number): string =>
        new Intl.NumberFormat(locale, { useGrouping: false }).format(value);
      expect(trendBetween(format(99), format(100))).toBe(1);
      expect(trendBetween(format(100), format(99))).toBe(-1);
    }
  );

  // The consequence, stated end to end: with the direction recovered, the wheel
  // takes one step. Without it, nine the other way.
  it('turns a localized 9 -> 0 column one step forward, not nine backward', () => {
    const format = (value: number): string =>
      new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(value);
    const trend = trendBetween(format(99), format(100));
    expect(wheelDelta(0, 9, trend)).toBe(1);
  });
});
