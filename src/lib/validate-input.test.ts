import { describe, expect, it } from 'vitest';
import { TEL_PRESET_IN_MOBILE, TEL_PRESETS, validateInput } from './utils';
import type { ValidationState } from './types';

/**
 * Validation ownership was right and the defaults were not generic.
 *
 * With no supplied pattern, `dataType="tel"` required ten digits beginning 6-9 --
 * an Indian mobile number -- so a consumer anywhere else got correct input
 * silently rejected by a rule they never chose and could not see in the API.
 *
 * The default is now the only rule that holds everywhere (which characters a
 * number may contain), and the market rule is a named preset. `validateInput`
 * stays exported and callable on its own, which is what these tests use.
 */

const tel = (value: string, preset: Parameters<typeof validateInput>[5] = {}): ValidationState =>
  validateInput(value, 'tel', null, null, [], preset);

describe('the tel default no longer assumes a market', () => {
  it.each([
    ['+33 6 12 34 56 78', 'a French mobile'],
    ['(555) 123-4567', 'a US number as commonly written'],
    ['+1-202-555-0143', 'a US number in international form'],
    ['9876543210', 'an Indian mobile, which must still pass'],
    ['+44 20 7946 0958', 'a UK landline'],
    ['020 7946 0958', 'the same number nationally']
  ])('accepts %s (%s)', (value) => {
    expect(tel(value)).toBe('Valid');
  });

  it.each([['+33 6 12 34 56 78'], ['(555) 123-4567'], ['+44 20 7946 0958']])(
    '%s was rejected by the old Indian-mobile default',
    (value) => {
      // The regression this closes, asserted against the preset that used to be
      // applied unconditionally rather than against a copy of it.
      expect(tel(value, { telPreset: TEL_PRESET_IN_MOBILE })).toBe('Invalid');
    }
  );

  it.each([
    ['abc', 'letters'],
    ['555-CALL-NOW', 'a vanity number'],
    ['12/34/5678', 'a date'],
    ['1234567890123456', 'more digits than E.164 allows']
  ])('still rejects %s (%s)', (value) => {
    expect(tel(value)).toBe('Invalid');
  });

  it('treats an empty or part-typed number as in progress, not as an error', () => {
    // Reporting Invalid mid-typing is what puts a red border under someone who
    // has entered two of ten digits.
    expect(tel('')).toBe('InProgress');
    expect(tel('+')).toBe('InProgress');
    expect(tel('+33')).toBe('InProgress');
    expect(tel('98')).toBe('InProgress');
  });
});

describe('the Indian-mobile rule is still available, by name', () => {
  it('is reachable through the preset registry as well as the constant', () => {
    expect(TEL_PRESETS['in-mobile']).toBe(TEL_PRESET_IN_MOBILE);
  });

  it('reproduces the pre-4.20 behaviour exactly when opted into', () => {
    expect(tel('9876543210', { telPreset: TEL_PRESET_IN_MOBILE })).toBe('Valid');
    expect(tel('98', { telPreset: TEL_PRESET_IN_MOBILE })).toBe('InProgress');
    expect(tel('1876543210', { telPreset: TEL_PRESET_IN_MOBILE })).toBe('Invalid');
    expect(tel('', { telPreset: TEL_PRESET_IN_MOBILE })).toBe('InProgress');
  });

  it('accepts every prefix of a valid number, so typing one is never an error', () => {
    const complete = '9876543210';
    for (let length = 1; length <= complete.length; length += 1) {
      const partial = complete.slice(0, length);
      const state = tel(partial, { telPreset: TEL_PRESET_IN_MOBILE });
      expect(state, `${partial} should not be Invalid while being typed`).not.toBe('Invalid');
    }
  });
});

describe('an explicit validationPattern still wins over everything', () => {
  it('uses the supplied pattern rather than the default or a preset', () => {
    const sixDigits = /^[0-9]{6}$/;
    expect(validateInput('123456', 'tel', sixDigits, null, [])).toBe('Valid');
    // Long enough for the neutral default, wrong for the pattern the caller gave.
    expect(validateInput('1234567', 'tel', sixDigits, null, [])).toBe('Invalid');
    // The preset is ignored when a pattern is supplied, so the two cannot fight.
    expect(
      validateInput('123456', 'tel', sixDigits, null, [], { telPreset: TEL_PRESET_IN_MOBILE })
    ).toBe('Valid');
  });
});

describe('the dataTypes with no branch are documented as unvalidated', () => {
  // Not an endorsement -- a pin, so that adding validation for one of these is a
  // deliberate change with a failing test rather than a silent new rejection.
  it.each(['number', 'time', 'date', 'search', 'url'] as const)(
    '%s is always reported Valid, whatever it holds',
    (dataType) => {
      expect(validateInput('not at all a ' + dataType, dataType, null, null, [])).toBe('Valid');
      expect(validateInput('', dataType, null, null, [])).toBe('Valid');
    }
  );

  it('still runs custom validators for them, which is the supported way to check', () => {
    const mustBeEven = (value: string): ValidationState =>
      Number(value) % 2 === 0 ? 'Valid' : 'Invalid';
    expect(validateInput('3', 'number', null, null, [mustBeEven])).toBe('Invalid');
    expect(validateInput('4', 'number', null, null, [mustBeEven])).toBe('Valid');
  });
});

describe('validateInput stays usable standalone', () => {
  it('needs no options argument at all', () => {
    // The sixth parameter is optional, so every pre-existing five-argument call
    // site keeps compiling and keeps working.
    expect(validateInput('a@b.co', 'email', null, null, [])).toBe('Valid');
    expect(validateInput('anything', 'text', null, null, [])).toBe('Valid');
  });
});
