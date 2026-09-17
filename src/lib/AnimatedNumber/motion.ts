/**
 * The odometer's motion arithmetic, kept out of the component so it can be
 * tested as plain functions -- jsdom has no `Element.animate`, no `CSS` global
 * and no running transitions, so none of this is observable through a rendered
 * component there.
 *
 * The mechanism, which is worth stating once because it is not the obvious one:
 * a glyph's position is never itself animated. Each of the ten glyphs in a
 * column resolves its own offset as a pure function of one scalar, and only that
 * scalar moves. Animating each glyph's own `transform` instead interpolates the
 * RESOLVED before and after values, so a glyph parked off-screen above whose
 * offset wrapped to below is tweened straight THROUGH the visible window -- a
 * full-size digit sliding across the number. Moving the scalar and recomputing
 * the offsets every frame cannot produce that, because every glyph's position
 * stays a continuous function of one moving value.
 *
 * The scalar is `--_animated-number-digit + --_animated-number-delta`. The digit
 * jumps to its new value immediately and the delta animates from `-delta` to 0,
 * so their sum travels from the old digit to the new one without anything
 * needing to remember where it started.
 */

/** Digits per column. Every column carries a full 0-9 wheel. */
export const WHEEL_LENGTH = 10;

/** Registered so it INTERPOLATES: an unregistered custom property animates discretely. */
export const DELTA_PROPERTY = '--_animated-number-delta';

/**
 * How far this column's wheel turns, signed, in digits.
 *
 * `trend` is the direction the number as a whole moved, and passing it is the
 * single thing that makes 99 -> 100 roll each 9 forward by one step. Judged per
 * column instead, a 9 -> 0 column sees a difference of -9 and takes nine steps
 * backwards while its neighbours step forwards. Zero means "no opinion", which
 * falls back to each column's own direction.
 */
export const wheelDelta = (digit: number, previous: number, trend: number): number => {
  const difference = digit - previous;
  const direction = trend === 0 ? Math.sign(difference) : trend;
  if (direction < 0 && digit > previous) {
    return digit - WHEEL_LENGTH - previous;
  }
  if (direction > 0 && digit < previous) {
    return WHEEL_LENGTH - previous + digit;
  }
  return difference;
};

/**
 * The digits of a string, rewritten as ASCII so two runs can be compared.
 *
 * `digitOf` is the caller's own glyph lookup, so a numbering system whose digits
 * are neither ASCII nor contiguous still reduces to something comparable. The
 * previous `replace(/\D/g, '')` was ASCII-only without the `u` flag, so every
 * Arabic-Indic, Devanagari or Bengali numeral was stripped and BOTH runs came
 * back empty -- the trend then read 0, and a 9 -> 0 column with no direction to
 * follow rolls nine positions backwards. Rewriting to ASCII rather than keeping
 * the original glyphs also keeps the comparison below honest for a
 * non-contiguous system, where code-point order is not value order.
 */
const digitRun = (text: string, digitOf: (character: string) => number): string => {
  let run = '';
  for (const character of text) {
    const digit = digitOf(character);
    if (digit >= 0) {
      run += String(digit);
    }
  }
  return run;
};

/**
 * Fallback lookup for a caller with no numbering system of its own to offer.
 *
 * Unicode assigns the General_Category Nd only to decimal digits, and each such
 * block is exactly ten consecutive code points beginning at its own zero. So the
 * value of a digit is how far it sits above the first Nd code point in its run,
 * found by walking down at most nine places. That covers every numbering system
 * whose digits ARE decimal digits -- Arabic-Indic, Devanagari, Bengali, the
 * supplementary-plane ones -- without a table.
 *
 * It returns -1 for `hanidec`, whose Han numerals are not Nd at all. Nothing can
 * infer those from the character alone, which is exactly why the component hands
 * in its own map rather than relying on this.
 */
const unicodeDigitOf = (character: string): number => {
  const code = character.codePointAt(0);
  if (!Number.isInteger(code) || !/\p{Nd}/u.test(character)) {
    return -1;
  }
  const value = Number(code);
  let zero = value;
  while (value - zero < 9 && /\p{Nd}/u.test(String.fromCodePoint(zero - 1))) {
    zero -= 1;
  }
  return value - zero;
};

/**
 * Which way the whole number moved: 1 up, -1 down, 0 unchanged.
 *
 * Numbers are compared as numbers. A pre-formatted string has no numeric value
 * to compare, so its digit runs are compared instead -- longer wins, then
 * lexicographically, which is exactly numeric order for two runs of digits and
 * stays correct past `Number.MAX_SAFE_INTEGER`, where subtracting would not.
 */
export const trendBetween = (
  previous: number | string,
  next: number | string,
  digitOf: (character: string) => number = unicodeDigitOf
): number => {
  if (typeof previous === 'number' && typeof next === 'number') {
    // `|| 0` folds away both the signed zero `Math.sign` returns for `0 -> -0`
    // and the NaN it returns when either side is non-finite: neither is a
    // direction, and both would otherwise be passed on as one.
    return Math.sign(next - previous) || 0;
  }
  const before = digitRun(String(previous), digitOf);
  const after = digitRun(String(next), digitOf);
  if (before.length !== after.length) {
    return Math.sign(after.length - before.length);
  }
  return before < after ? 1 : before > after ? -1 : 0;
};

/** A CSS `<time>` in milliseconds. Anything unparseable reads as 0, i.e. no motion. */
export const durationMs = (value: string): number => {
  const text = value.trim();
  const amount = Number.parseFloat(text);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return text.endsWith('ms') ? amount : text.endsWith('s') ? amount * 1000 : 0;
};

/**
 * Registers the delta property on the document, returning whether it is
 * registered afterwards.
 *
 * It has to be done from script rather than by an `@property` rule in the
 * component's own stylesheet: an `@property` inside a shadow root does not
 * register (measured in both Chromium and WebKit -- the probe's initial value
 * never applied). That stylesheet is the only one reaching inside the shadow
 * root a custom-element consumer gets, so relying on the at-rule would have left
 * `<sui-animated-number>` silently un-animated while the Svelte component moved.
 * `CSS.registerProperty` registers per document, so one call covers both.
 */
const registerDelta = (): boolean => {
  try {
    CSS.registerProperty({
      name: DELTA_PROPERTY,
      syntax: '<number>',
      inherits: true,
      initialValue: '0'
    });
    return true;
  } catch (error) {
    // Registering the same name twice throws, and so does a malformed
    // descriptor. Only the first means the property is there -- which happens
    // whenever a second copy of this library shares the page.
    return error instanceof DOMException && error.name === 'InvalidModificationError';
  }
};

/**
 * Whether this engine can run the roll at all.
 *
 * `mod()` and `round()` place the glyphs, `linear()` carries the spring easing,
 * and the registration above is what lets the delta interpolate rather than jump
 * at the halfway point. Without all four the component still renders correctly
 * -- `transform` falls back to `none`, which is where the current glyph already
 * sits, and the other nine stay `display: none` because nothing ever adds the
 * spinning class -- it just changes instantly.
 */
let supported: boolean | null = null;
export const canSpin = (): boolean => {
  if (supported !== null) {
    return supported;
  }
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    supported = false;
    return supported;
  }
  // Probed by attempting it rather than through CSS.supports, which reports
  // false positives for `linear()` against what `animate()` will actually take.
  const linear = ((): boolean => {
    try {
      document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
      return true;
    } catch {
      return false;
    }
  })();
  supported =
    CSS.supports('line-height', 'mod(1,1)') &&
    CSS.supports('line-height', 'round(down,1,1)') &&
    linear &&
    registerDelta();
  return supported;
};
