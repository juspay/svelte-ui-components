import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CardProperties, CardStrictAttrs } from './Card/properties';
import type { PillProperties, PillStrictAttrs } from './Pill/properties';

/**
 * Coverage for #576. These are COMPILE-time assertions: every
 * `@ts-expect-error` fails the build if the error it expects does not occur,
 * so `pnpm check` is what actually runs them. The runtime `expect` calls just
 * keep each case a real, named test in the suite.
 *
 * The claim under test is narrow and worth stating exactly. `attrs` on `Card`
 * and `Pill` is `Record<string, string>`, and both components spread it FIRST
 * with their own managed attributes after. So `attrs={{ class: 'x' }}` is
 * accepted, spread, and then overwritten — the runtime behaviour is correct,
 * and the type is the thing that says nothing.
 *
 * #576 asks for the type to reject those keys, and specifies a major to do it
 * in, because rejecting `class` stops existing code from compiling. This
 * change does NOT take that break. `attrs` keeps accepting everything it
 * always accepted; the managed keys are `@deprecated` instead, and the
 * rejecting type ships alongside as `CardStrictAttrs`/`PillStrictAttrs` for
 * consumers who want the error now. The first two describes below are what
 * pin those two halves apart.
 */

type CardAttrs = NonNullable<CardProperties['attrs']>;
type PillAttrs = NonNullable<PillProperties['attrs']>;

describe('attrs stays wide — nothing that compiled before stops compiling', () => {
  it('is exactly as wide as the Record<string, string> it replaces', () => {
    // The non-breaking claim itself, in both directions, written as assignments
    // the compiler enforces. `expectTypeOf().toMatchTypeOf()` does NOT state
    // this: it is a loose structural match that stays green even against
    // `CardStrictAttrs`, so it would pass through exactly the regression this
    // case exists to catch. Mutual assignability means the accepted set is
    // unchanged rather than merely overlapping the examples below.
    const wide: Record<string, string> = { anything: 'goes', class: 'mine' };
    const asCard: CardAttrs = wide;
    const asPill: PillAttrs = wide;
    const cardBack: Record<string, string> = asCard;
    const pillBack: Record<string, string> = asPill;
    expect(cardBack).toBe(wide);
    expect(pillBack).toBe(wide);
  });

  it('still accepts every attribute Card manages', () => {
    const attrs: CardAttrs = {
      class: 'mine',
      style: 'color: red',
      role: 'button',
      tabindex: '0',
      href: '/somewhere',
      target: '_blank',
      rel: 'noopener',
      onclick: 'alert(1)',
      onkeydown: 'alert(2)',
      'data-pw': 'hijacked',
      testID: 'hijacked'
    };
    expect(attrs.class).toBe('mine');
  });

  it('still accepts every attribute Pill manages', () => {
    const attrs: PillAttrs = {
      class: 'mine',
      type: 'submit',
      'data-pw': 'hijacked',
      testID: 'hijacked',
      role: 'link',
      tabindex: '-1',
      title: 'tip',
      'aria-disabled': 'true',
      'aria-expanded': 'true',
      'aria-pressed': 'false',
      onclick: 'alert(1)',
      onkeydown: 'alert(2)'
    };
    expect(attrs.type).toBe('submit');
  });

  it('still accepts arbitrary attribute names, which a narrowed type would reject', () => {
    const card: CardAttrs = { madeUpThing: 'x', 'data-state': 'waiting' };
    const pill: PillAttrs = { madeUpThing: 'x', 'aria-label': 'Status' };
    expect(card.madeUpThing).toBe(pill.madeUpThing);
  });

  it('still accepts a predeclared object holding managed keys', () => {
    // Excess-property checking only fires on object literals, so this is the
    // path a real consumer's helper takes. It compiled before and still does.
    const input = { 'data-state': 'waiting', class: 'collision', testID: 'collision' };
    const card: CardAttrs = input;
    const pill: PillAttrs = input;
    expect(card).toBe(pill);
  });

  it('keeps the value type string, exactly as before', () => {
    // The one thing that never was allowed: non-string values. Both of these
    // failed against `Record<string, string>` too, so neither is a new break.
    // @ts-expect-error attrs values have always been strings
    const numeric: CardAttrs = { tabindex: 0 };
    // @ts-expect-error attrs values have always been strings, not functions
    const fn: PillAttrs = { onclick: () => {} };
    expect(numeric).toBeDefined();
    expect(fn).toBeDefined();
  });
});

describe('the strict opt-in type rejects what attrs only deprecates', () => {
  it('makes every attribute Card writes on its root unusable', () => {
    // `?: never` makes the property type undefined-only, which is what states
    // rejection exactly. `toBeUndefined()` is the strict type matcher and also
    // avoids the `undefined` type keyword the repo's no-restricted-syntax rule
    // bans; `toMatchTypeOf` is not strict and would pass even if a key were
    // left wide open.
    expectTypeOf<CardStrictAttrs['class']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['style']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['role']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['tabindex']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['href']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['target']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['rel']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['onclick']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['onkeydown']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['data-pw']>().toBeUndefined();
    expectTypeOf<CardStrictAttrs['testID']>().toBeUndefined();
    expect(true).toBe(true);
  });

  it('makes every attribute Pill writes on its root unusable', () => {
    expectTypeOf<PillStrictAttrs['class']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['type']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['role']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['tabindex']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['title']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['onclick']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['onkeydown']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['data-pw']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['testID']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['aria-disabled']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['aria-expanded']>().toBeUndefined();
    expectTypeOf<PillStrictAttrs['aria-pressed']>().toBeUndefined();
    expect(true).toBe(true);
  });

  it('rejects class, which both components manage', () => {
    // @ts-expect-error class is managed by Card; the spread order discards it
    const card: CardStrictAttrs = { class: 'mine' };
    // @ts-expect-error class is managed by Pill
    const pill: PillStrictAttrs = { class: 'mine' };
    expect(card).toBeDefined();
    expect(pill).toBeDefined();
  });

  it('rejects Card style and Pill aria state', () => {
    // @ts-expect-error style is managed by Card; use cssVars
    const card: CardStrictAttrs = { style: 'color: red' };
    // @ts-expect-error aria-pressed is derived from the ariaPressed prop
    const pill: PillStrictAttrs = { 'aria-pressed': false };
    expect(card).toBeDefined();
    expect(pill).toBeDefined();
  });

  it('rejects managed keys through predeclared objects, not just literals', () => {
    // Optional `never` members are what makes this fail; an `Omit` alone would
    // let a predeclared object through, and would not override the `data-*`
    // index signature either.
    const input = { 'data-state': 'waiting', 'data-pw': 'collision' };
    // @ts-expect-error explicit managed keys override the data-* index signature
    const card: CardStrictAttrs = input;
    // @ts-expect-error Pill owns data-pw too
    const pill: PillStrictAttrs = input;
    expect(card).toBe(pill);
  });

  it('gives native attributes their real types rather than string', () => {
    const card: CardStrictAttrs = { title: 'Native tooltip', hidden: true, onfocus: () => {} };
    const pill: PillStrictAttrs = { style: 'color: red', 'aria-label': 'Status' };
    // @ts-expect-error native event handlers are functions, not strings
    const handler: CardStrictAttrs = { onfocus: 'alert(1)' };
    // @ts-expect-error aria-live is a constrained native attribute
    const aria: PillStrictAttrs = { 'aria-live': 'loud' };
    expect(card.title).toBe('Native tooltip');
    expect(pill.style).toBe('color: red');
    expect(handler).toBeDefined();
    expect(aria).toBeDefined();
  });

  it('accepts what each component does not manage, and the two lists differ', () => {
    // Card writes no aria state; Pill writes no `style`. Forbidding a key a
    // component never touches would be a fake restriction, so the two managed
    // lists deliberately differ rather than being unioned into one.
    const card: CardStrictAttrs = { 'aria-pressed': true, 'aria-expanded': false };
    const pill: PillStrictAttrs = { style: 'color: red' };
    // @ts-expect-error the mirror image: each key is managed by the other component
    const cardStyle: CardStrictAttrs = { style: 'color: red' };
    // @ts-expect-error Pill derives aria-pressed from its ariaPressed prop
    const pillAria: PillStrictAttrs = { 'aria-pressed': true };
    expect(card['aria-pressed']).toBe(true);
    expect(pill.style).toBe('color: red');
    expect(cardStyle).toBeDefined();
    expect(pillAria).toBeDefined();
  });
});

describe('both components keep the same contract', () => {
  it('takes the same object on Card and Pill, wide and strict alike', () => {
    // The reason this landed on Card and Pill together. One narrowed and one
    // wide is worse than two wide: code that compiled against Card would fail
    // against Pill for a reason the API does not reveal.
    const shared = { 'data-state': 'waiting' };
    const card: CardAttrs = shared;
    const pill: PillAttrs = shared;
    const strictCard: CardStrictAttrs = shared;
    const strictPill: PillStrictAttrs = shared;
    expect(card['data-state']).toBe(pill['data-state']);
    expect(strictCard['data-state']).toBe(strictPill['data-state']);
  });
});
