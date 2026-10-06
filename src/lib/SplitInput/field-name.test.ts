import { describe, expect, it } from 'vitest';
import { resolveFieldName } from './field-name';

const tel = { dataType: 'tel', maxLength: 1 } as const;

describe('resolveFieldName', () => {
  it('names a one-digit box by its position', () => {
    expect(resolveFieldName({ index: 1, total: 6, config: tel })).toBe('Digit 2 of 6');
  });

  it('leads with the group name so the box is identifiable outside its group', () => {
    expect(resolveFieldName({ index: 1, total: 6, config: tel, groupLabel: 'One-time code' })).toBe(
      'One-time code, digit 2 of 6'
    );
  });

  it('calls a one-character text box a character, not a digit', () => {
    expect(
      resolveFieldName({ index: 0, total: 5, config: { dataType: 'text', maxLength: 1 } })
    ).toBe('Character 1 of 5');
    expect(resolveFieldName({ index: 0, total: 5, config: { maxLength: 1 } })).toBe(
      'Character 1 of 5'
    );
  });

  it('calls a wider box a field, because "digit 1 of 4" for "192" would be wrong', () => {
    expect(
      resolveFieldName({
        index: 0,
        total: 4,
        config: { dataType: 'number', maxLength: 3 },
        groupLabel: 'IP address'
      })
    ).toBe('IP address, field 1 of 4');
    expect(resolveFieldName({ index: 0, total: 2, config: {} })).toBe('Field 1 of 2');
  });

  it('uses the visible caption when the box has one, since that is what it is called on screen', () => {
    expect(
      resolveFieldName({ index: 0, total: 3, config: { label: 'R' }, groupLabel: 'RGB color' })
    ).toBe('RGB color, R');
    expect(resolveFieldName({ index: 0, total: 3, config: { label: 'area code' } })).toBe(
      'area code'
    );
  });

  it('uses an explicit per-box ariaLabel exactly as given, without the group or a position', () => {
    expect(
      resolveFieldName({
        index: 0,
        total: 3,
        config: { ariaLabel: 'Red', label: 'R' },
        groupLabel: 'RGB color'
      })
    ).toBe('Red');
  });

  it('lets positionLabel replace the default position wording', () => {
    expect(
      resolveFieldName({
        index: 2,
        total: 4,
        config: { dataType: 'number', maxLength: 3 },
        groupLabel: 'IP address',
        positionLabel: (position, total) => `octet ${position} of ${total}`
      })
    ).toBe('IP address, octet 3 of 4');
  });

  it('does not ask positionLabel for a box that already has a name of its own', () => {
    let asked = 0;
    const positionLabel = (): string => {
      asked += 1;
      return 'unused';
    };
    resolveFieldName({ index: 0, total: 2, config: { ariaLabel: 'Red' }, positionLabel });
    resolveFieldName({ index: 0, total: 2, config: { label: 'R' }, positionLabel });
    expect(asked).toBe(0);
  });

  it('falls back to the default when positionLabel returns nothing usable', () => {
    expect(resolveFieldName({ index: 0, total: 2, config: tel, positionLabel: () => '  ' })).toBe(
      'Digit 1 of 2'
    );
  });

  it('ignores blank names rather than producing an empty aria-label', () => {
    expect(
      resolveFieldName({
        index: 0,
        total: 2,
        config: { ariaLabel: '   ', label: '', maxLength: 1, dataType: 'tel' },
        groupLabel: ' '
      })
    ).toBe('Digit 1 of 2');
  });
});
