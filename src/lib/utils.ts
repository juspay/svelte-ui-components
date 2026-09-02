import type { CustomValidator, Hsv, Hsl, InputDataType, Rgb, ValidationState } from '$lib/types';

/**
 * @description A common function to validate value provided inside the input component
 * @param inputValue String value coming from input field
 * @param dataType Datatype of the value being entered in the input component
 * @param validPattern Regular expression which is supposed to be applied on the input string
 * @param inProgressPattern Regular expression which is supposed to be applied on the input string while input is in progress
 * @param customValidators Array of customer validator functions
 * @returns ValidationState : InProgress | Valid | Invalid
 */

export function validateInput(
  inputValue: string,
  dataType: InputDataType,
  validPattern: RegExp | null,
  inProgressPattern: RegExp | null,
  customValidators: CustomValidator[]
): ValidationState {
  let validationResult: ValidationState = 'Valid';

  switch (dataType) {
    case 'email':
      validationResult = validateEmailInput(inputValue);
      break;

    case 'tel':
      validationResult =
        validPattern === null
          ? validatePhoneNumber(inputValue)
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
 * @description Validates Indian phone numbers
 * @todo Update Regex to take different variations of input in next update
 * @link https://stackoverflow.com/questions/18351553/regular-expression-validation-for-indian-phone-number-and-mobile-number
 * @param phoneNumber
 * @returns ValidationState
 */
function validatePhoneNumber(phoneNumber: string): ValidationState {
  try {
    const validationPattern = new RegExp('^[6-9]{1}[0-9]{9}$');
    const inProgressPattern = new RegExp('^[6-9]{1}[0-9]{0,9}$');
    if (validationPattern.test(phoneNumber)) {
      return 'Valid';
    } else if (inProgressPattern.test(phoneNumber) || phoneNumber.length === 0) {
      return 'InProgress';
    } else {
      return 'Invalid';
    }
  } catch (e) {
    console.error('Phone Regex creation failed', e);
  }
  return phoneNumber.length === 10 ? 'Valid' : phoneNumber.length > 10 ? 'InProgress' : 'Invalid';
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
