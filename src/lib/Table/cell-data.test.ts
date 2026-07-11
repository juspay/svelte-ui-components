import { describe, it, expect } from 'vitest';
import {
  asAvatarStackData,
  asCompareCellData,
  asInputCellData,
  asLinkCellData,
  asTagArrayItems,
  asTagCellData,
  avatarInitial,
  buildAvatarStack,
  cellValueToText
} from './cellData';

describe('cell narrowing', () => {
  it('asTagCellData accepts objects with a string text and rejects scalars', () => {
    expect(asTagCellData({ text: 'Active', classes: 'pill-success' })).toEqual({
      text: 'Active',
      classes: 'pill-success'
    });
    expect(asTagCellData('Active')).toBeNull();
    expect(asTagCellData(null)).toBeNull();
    expect(asTagCellData({ notText: 1 })).toBeNull();
  });

  it('asTagArrayItems requires every item to carry a string text', () => {
    expect(asTagArrayItems([{ text: 'A' }, { text: 'B', classes: 'x' }])).toHaveLength(2);
    expect(asTagArrayItems([{ text: 'A' }, { label: 'B' }])).toBeNull();
    expect(asTagArrayItems('A,B')).toBeNull();
  });

  it('asAvatarStackData requires an items array', () => {
    expect(asAvatarStackData({ items: [{ id: 'u1' }] })).not.toBeNull();
    expect(asAvatarStackData({ max: 3 })).toBeNull();
    expect(asAvatarStackData([{ id: 'u1' }])).toBeNull();
  });

  it('asCompareCellData accepts any plain object and rejects scalars/arrays', () => {
    expect(asCompareCellData({ primary: '₹1,000', trendPercent: 5 })).not.toBeNull();
    expect(asCompareCellData('plain')).toBeNull();
    expect(asCompareCellData([1, 2])).toBeNull();
  });

  it('asLinkCellData accepts {url} objects and bare non-empty strings', () => {
    expect(asLinkCellData({ url: 'https://x.test', label: 'X' })).toEqual({
      url: 'https://x.test',
      label: 'X'
    });
    expect(asLinkCellData('https://x.test')).toEqual({ url: 'https://x.test' });
    expect(asLinkCellData('')).toBeNull();
    expect(asLinkCellData({ href: 'https://x.test' })).toBeNull();
  });

  it('asInputCellData carries string iconUrl/ariaLabel and drops non-string values', () => {
    expect(
      asInputCellData({
        placeholder: 'Amount',
        iconUrl: 'data:image/svg+xml;utf8,x',
        ariaLabel: 'Amount in rupees'
      })
    ).toEqual({
      placeholder: 'Amount',
      ariaLabel: 'Amount in rupees',
      iconUrl: 'data:image/svg+xml;utf8,x'
    });
    expect(asInputCellData({ iconUrl: 42, ariaLabel: false })).toEqual({});
    expect(asInputCellData('amount')).toBeNull();
  });

  it('cellValueToText renders scalars, dashes empty/object values', () => {
    expect(cellValueToText('abc')).toBe('abc');
    expect(cellValueToText(42)).toBe('42');
    expect(cellValueToText(false)).toBe('false');
    expect(cellValueToText('')).toBe('-');
    expect(cellValueToText(null)).toBe('-');
    expect(cellValueToText({ any: 'object' })).toBe('-');
  });
});

describe('avatar stack', () => {
  it('uses the label first codepoint, uppercased, emoji-safe', () => {
    expect(avatarInitial({ id: 'u1', label: 'alice' })).toBe('A');
    expect(avatarInitial({ id: 'u1', label: '😀 team' })).toBe('😀');
  });

  it('falls back to the last alphanumeric char of the id, then #', () => {
    expect(avatarInitial({ id: 'user-42x' })).toBe('X');
    expect(avatarInitial({ id: '###' })).toBe('#');
  });

  it('caps visible chips at max (default 4) and reports the overflow', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((letter) => ({
      id: letter,
      label: letter
    }));
    const defaulted = buildAvatarStack({ items });
    expect(defaulted.icons).toHaveLength(4);
    expect(defaulted.rest).toBe(2);
    expect(defaulted.icons[0]).toEqual({ type: 'text', content: 'A' });

    const capped = buildAvatarStack({ items, max: 6 });
    expect(capped.icons).toHaveLength(6);
    expect(capped.rest).toBe(0);
  });
});
