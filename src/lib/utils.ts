import type { CustomValidator, Hsv, Hsl, InputDataType, Rgb, ValidationState } from '$lib/types';

/**
 * A phone-number shape a consumer opts into, as the pair of patterns the
 * in-progress/committed distinction needs.
 *
 * Presets exist because `tel` cannot have a correct universal *format* rule --
 * only a universal *character* rule (see `validateE164Shape`). A market-specific
 * format is a real requirement and belongs to whoever knows the market, so it is
 * named, exported and opted into rather than assumed.
 */
export type TelPreset = {
  /** Matches a complete, committed number. */
  readonly valid: RegExp;
  /** Matches a number still being typed. Must accept every prefix of `valid`. */
  readonly inProgress: RegExp;
};

/**
 * Ten digits beginning 6-9 -- an Indian mobile number.
 *
 * This was the UNCONDITIONAL default for `dataType="tel"`. A consumer outside
 * India got `+33 6 12 34 56 78` and `(555) 123-4567` marked Invalid by a rule
 * they never chose and could not see, which is the worst shape for a default to
 * fail in: correct input, silently rejected, no message naming the market.
 * It is still here, still correct for the market it describes, and now has to be
 * asked for.
 */
export const TEL_PRESET_IN_MOBILE: TelPreset = {
  valid: /^[6-9][0-9]{9}$/,
  inProgress: /^[6-9][0-9]{0,9}$/
};

/** Every preset this library ships, by name. */
export const TEL_PRESETS: Readonly<Record<string, TelPreset>> = {
  'in-mobile': TEL_PRESET_IN_MOBILE
};

/** Optional, additive settings for `validateInput`. */
export type ValidateInputOptions = {
  /**
   * Format rule for `dataType="tel"` when no `validPattern` is supplied. Null or
   * omitted keeps the locale-neutral character check described on
   * `validateInput`.
   */
  readonly telPreset?: TelPreset | null;
};

/** Digits a number can hold under E.164, which caps the subscriber number at 15. */
const E164_MAX_DIGITS = 15;
/** Shortest real number anywhere; below this a number is still being typed. */
const TEL_MIN_DIGITS = 4;

/**
 * The only rule about phone numbers that holds in every market: which
 * CHARACTERS one may contain, and how many digits it may hold. Length, leading
 * digit and grouping are all national, so none of them are asserted here.
 *
 * Rejects letters and stray punctuation, accepts `+33 6 12 34 56 78`,
 * `(555) 123-4567` and `9876543210` alike.
 */
function validateE164Shape(phoneNumber: string): ValidationState {
  if (phoneNumber.length === 0) {
    return 'InProgress';
  }
  // A leading + is part of the international prefix and may appear only first.
  const body = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
  if (/[^0-9\s()\-.]/.test(body)) {
    return 'Invalid';
  }
  const digits = body.replace(/[^0-9]/g, '');
  if (digits.length > E164_MAX_DIGITS) {
    return 'Invalid';
  }
  return digits.length >= TEL_MIN_DIGITS ? 'Valid' : 'InProgress';
}

/**
 * @description A common function to validate value provided inside the input component
 * @param inputValue String value coming from input field
 * @param dataType Datatype of the value being entered in the input component
 * @param validPattern Regular expression which is supposed to be applied on the input string
 * @param inProgressPattern Regular expression which is supposed to be applied on the input string while input is in progress
 * @param customValidators Array of customer validator functions
 * @param options Optional settings; see `ValidateInputOptions`
 * @returns ValidationState : InProgress | Valid | Invalid
 *
 * Only `email`, `tel`, `password` and `text` are validated here. `number`,
 * `time`, `date`, `search` and `url` have NO branch and always return 'Valid'
 * before custom validators run -- the browser's own constraint validation is the
 * only thing checking them. That is a real gap rather than a deliberate policy,
 * and it is stated on `Input`'s `dataType` prop as well as here, because a
 * consumer choosing a dataType reads the prop and not this file.
 *
 * `tel` with no `validPattern` checks the CHARACTERS a number may contain and
 * nothing about its national format (see `validateE164Shape`). It used to apply
 * an Indian mobile pattern unconditionally; that rule is now
 * `TEL_PRESET_IN_MOBILE`, passed through `options.telPreset` here or through
 * `Input`'s `validationPattern` / `inProgressPattern` props.
 */

export function validateInput(
  inputValue: string,
  dataType: InputDataType,
  validPattern: RegExp | null,
  inProgressPattern: RegExp | null,
  customValidators: CustomValidator[],
  options: ValidateInputOptions = {}
): ValidationState {
  let validationResult: ValidationState = 'Valid';

  switch (dataType) {
    case 'email':
      validationResult = validateEmailInput(inputValue);
      break;

    case 'tel':
      validationResult =
        validPattern === null
          ? validatePhoneNumber(inputValue, options.telPreset ?? null)
          : validateTextWithPattern(inputValue, validPattern, inProgressPattern);
      break;

    case 'password':
      validationResult = validatePassword(inputValue, validPattern, inProgressPattern);
      break;

    case 'text':
      validationResult = validateTextWithPattern(inputValue, validPattern, inProgressPattern);
      break;
  }

  customValidators.forEach((validator: CustomValidator) => {
    const currentResult = validator(inputValue, validationResult);
    if (currentResult === 'Invalid') {
      validationResult = 'Invalid';
    } else if (currentResult === 'InProgress') {
      validationResult = 'InProgress';
    } else {
      validationResult =
        validationResult === 'Valid' && currentResult === 'Valid' ? 'Valid' : validationResult;
    }
  });

  return validationResult;
}

/**
 * @description Validates input string against passed RegExp
 * @param inputValue string
 * @param validationPattern RegExp for valid input
 * @param inProgressPattern RegExp for inprogress input
 * @returns ValidationState
 */

function validateTextWithPattern(
  inputValue: string,
  validationPattern: RegExp | null,
  inProgressPattern: RegExp | null
): ValidationState {
  if (validationPattern !== null) {
    if (validationPattern.test(inputValue)) {
      return 'Valid';
    } else if (
      (inProgressPattern !== null && inProgressPattern.test(inputValue)) ||
      inputValue.length === 0
    ) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  }
  return 'Valid';
}

/**
 * @description Validates password string against passed RegExp
 * @param password string
 * @param validationPattern RegExp for valid input
 * @param inProgressPattern RegExp for inprogress input
 * @returns ValidationState
 */
function validatePassword(
  password: string,
  validationPattern: RegExp | null,
  inProgressPattern: RegExp | null
): ValidationState {
  if (validationPattern !== null) {
    if (validationPattern.test(password)) {
      return 'Valid';
    } else if (
      inProgressPattern !== null &&
      inProgressPattern.test(password) &&
      password.length === 0
    ) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  }
  return 'Valid';
}

/**
 * @description Validates an email input based upon RF 5322 Email format
 * @param emailId String
 * @returns ValidationState
 */
function validateEmailInput(emailId: string): ValidationState {
  try {
    /**
     * @description Using RFC 5322 Format for validation
     * @tutorial https://www.regextester.com/115911
     * @tutorial https://emailregex.com/
     * @tutorial https://stackoverflow.com/questions/42982005/email-address-regular-expression-rfc-5322-passed-in-to-match-does-not-work
     * @tutorial https://www.regular-expressions.info/email.html
     */
    const validPattern = new RegExp(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    const inProgressPattern = new RegExp(/[^ ]{1,}[\w0-9.,_,@]{0,}/);
    if (validPattern.test(emailId)) {
      return 'Valid';
    } else if (inProgressPattern.test(emailId) || emailId.length === 0) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  } catch (e) {
    console.error('Email Regex creation failed: ', e);
  }
  return 'Valid';
}

/**
 * @description Validates a phone number against an opted-in preset, or against
 * the locale-neutral character rule when none is given.
 * @param phoneNumber
 * @param preset Market-specific format, or null for no format rule at all
 * @returns ValidationState
 */
function validatePhoneNumber(phoneNumber: string, preset: TelPreset | null): ValidationState {
  if (preset === null) {
    return validateE164Shape(phoneNumber);
  }
  if (preset.valid.test(phoneNumber)) {
    return 'Valid';
  }
  return preset.inProgress.test(phoneNumber) || phoneNumber.length === 0 ? 'InProgress' : 'Invalid';
}

/**
 * @description Creates a debouncer function that delays invoking the provided callback until a specified delay period has elapsed since the last invocation.
 * @param delay The delay period in milliseconds before invoking the callback.
 * @returns A debouncer function that accepts a callback and delays its invocation based on the specified delay.
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (SSR, private browsing, storage full)
  }
}

// ── Color conversions ───────────────────────────────────────────

const HEX_COLOR_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

export function hexToRgb(hex: string): Rgb | null {
  const m = hex.match(HEX_COLOR_PATTERN);
  if (m === null) {
    return null;
  }
  const rStr = m.at(1);
  const gStr = m.at(2);
  const bStr = m.at(3);
  if (typeof rStr !== 'string' || typeof gStr !== 'string' || typeof bStr !== 'string') {
    return null;
  }
  return { r: parseInt(rStr, 16), g: parseInt(gStr, 16), b: parseInt(bStr, 16) };
}

export function rgbToHsv(r: number, g: number, b: number): Hsv {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }
  return { h, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): Rgb {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
      break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const rgb = hsvToRgb(h, s, v);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToHsv(hex: string): Hsv | null {
  const rgb = hexToRgb(hex);
  if (rgb === null) {
    return null;
  }
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHsl(h: number, s: number, v: number): Hsl {
  const l = v * (1 - s / 2);
  let sl = 0;
  if (l > 0 && l < 1) {
    sl = (v - l) / Math.min(l, 1 - l);
  }
  return { h: Math.round(h * 360), s: Math.round(sl * 100), l: Math.round(l * 100) };
}

export function hslToHsv(hDeg: number, sPct: number, lPct: number): Hsv {
  const h = hDeg / 360;
  const sl = sPct / 100;
  const l = lPct / 100;
  const v = l + sl * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);
  return { h, s: sv, v };
}

export function isValidHex(hex: string): boolean {
  return HEX_COLOR_PATTERN.test(hex);
}

export function clampInt(v: string, min: number, max: number): number {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) {
    return min;
  }
  return Math.max(min, Math.min(max, n));
}

// ── Misc ────────────────────────────────────────────────────────

/**
 * Whether the user has asked the OS to minimise animation.
 *
 * Shared rather than per-component: two independent character-reveal
 * implementations ship in this library — `ChatController`'s buffered drain and
 * `TypewriterText`'s typing loop — and a reveal that honours this setting in one
 * but not the other means the same OS preference silences an animation in a chat
 * bubble and leaves it running in the message body rendered inside it.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Leading-edge throttle, despite the name: the first call runs immediately and
 * every call within `delay` of it is dropped, rather than the last one being
 * deferred as a debounce would. Modal relies on exactly that — the first
 * dismissal must be acted on at once, and the repeats it guards against are the
 * ones to discard.
 *
 * Not exported from the package; renaming it is a free change whenever the
 * mismatch stops being worth the note.
 */
export function createDebouncer(delay: number) {
  let lastCallTime = 0;
  return function <T extends unknown[]>(callback: (...args: T) => void, ...args: T) {
    const now = Date.now();
    if (now - lastCallTime > delay) {
      lastCallTime = now;
      callback(...args);
    }
  };
}

/**
 * Body scroll lock, reference counted.
 *
 * Modal, Sheet and CommandMenu each hide body overflow while they are open. Doing
 * that with a bare assignment means the FIRST of them to unmount restores
 * scrolling for all of them, so closing a confirmation dialog inside a still-open
 * modal silently lets the page behind it scroll again. Counting the holders keeps
 * the lock until the last one releases it.
 *
 * Callers must pair every lock with exactly one unlock.
 */
let bodyScrollLockCount = 0;
// Whatever inline overflow the host page had set before the first lock, so the last unlock
// hands it back instead of clearing it: a host running `overflow: clip` on its body keeps it.
let bodyScrollPreviousOverflow = '';

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (bodyScrollLockCount === 0) {
    bodyScrollPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyScrollLockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = bodyScrollPreviousOverflow;
    bodyScrollPreviousOverflow = '';
  }
}
