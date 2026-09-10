import { describe, expect, expectTypeOf, it } from 'vitest';
import { CARD_MANAGED_ATTRS, PILL_MANAGED_ATTRS, discardedAttrWarnings } from './attrs-discard';
import type { CardStrictAttrs } from './Card/properties';
import type { PillStrictAttrs } from './Pill/properties';

/**
 * #576 again, for the callers types cannot reach.
 *
 * `attrs` is spread onto the root before each component writes its own managed
 * attributes, so an entry for a managed key is accepted and then overwritten.
 * 4.19.0 made that visible by deprecating those keys, which only helps someone
 * reading TypeScript in an editor. A plain-JS consumer, or anyone driving
 * `<sui-card>`/`<sui-pill>` as a web component, gets no types at all and so
 * still gets silence. These messages are what reaches them.
 */

describe('discardedAttrWarnings', () => {
  it('says nothing when attrs is not passed at all', () => {
    expect(discardedAttrWarnings('Card', CARD_MANAGED_ATTRS)).toEqual([]);
  });

  it('says nothing for attributes the component does not manage', () => {
    const attrs = { 'data-state': 'waiting', 'aria-label': 'Order card' };
    expect(discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, attrs)).toEqual([]);
  });

  it('names the discarded key, the component, and what owns it', () => {
    const messages = discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, { class: 'mine' });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Card');
    expect(messages[0]).toContain('class');
    expect(messages[0]).toContain('classes');
  });

  it('reports every discarded key rather than only the first', () => {
    const attrs = { class: 'mine', role: 'button', 'data-state': 'waiting' };
    const messages = discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, attrs);
    expect(messages).toHaveLength(2);
    expect(messages.some((m) => m.includes('class'))).toBe(true);
    expect(messages.some((m) => m.includes('role'))).toBe(true);
  });

  it('keeps the two components on their own lists', () => {
    // Card writes no aria state and Pill writes no style, so the same object is
    // a problem on one and fine on the other. A shared list would invent a
    // restriction neither component actually applies.
    const ariaPressed = { 'aria-pressed': 'true' };
    expect(discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, ariaPressed)).toEqual([]);
    expect(discardedAttrWarnings('Pill', PILL_MANAGED_ATTRS, ariaPressed)).toHaveLength(1);

    const style = { style: 'color: red' };
    expect(discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, style)).toHaveLength(1);
    expect(discardedAttrWarnings('Pill', PILL_MANAGED_ATTRS, style)).toEqual([]);
  });

  it('ignores an inherited property rather than warning about it', () => {
    const attrs = Object.create({ class: 'from-the-prototype' }) as Record<string, string>;
    attrs['data-state'] = 'waiting';
    expect(discardedAttrWarnings('Card', CARD_MANAGED_ATTRS, attrs)).toEqual([]);
  });
});

describe('the runtime lists cannot drift from the types', () => {
  it('every key Card warns about is a key CardStrictAttrs rejects', () => {
    // Indexing the strict type by the runtime map's keys is `undefined` only if
    // all of them are managed; a key that drifted out of the type would widen
    // this to its real attribute type and fail.
    expectTypeOf<CardStrictAttrs[keyof typeof CARD_MANAGED_ATTRS]>().toBeUndefined();
  });

  it('every key Pill warns about is a key PillStrictAttrs rejects', () => {
    expectTypeOf<PillStrictAttrs[keyof typeof PILL_MANAGED_ATTRS]>().toBeUndefined();
  });

  it('names a replacement for every managed key on both components', () => {
    for (const [key, guidance] of Object.entries({
      ...CARD_MANAGED_ATTRS,
      ...PILL_MANAGED_ATTRS
    })) {
      expect(guidance, `${key} has no guidance`).toMatch(/\S/);
    }
  });
});
