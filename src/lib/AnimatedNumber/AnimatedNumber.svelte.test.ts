import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AnimatedNumber from './AnimatedNumber.svelte';
import type { AnimatedNumberProperties } from './properties';

/*
 * jsdom 29 has no Element.prototype.animate, no CSS global and no
 * matchMedia, so nothing here can observe the translateY transition itself --
 * that is covered live (see the component's own header comment: measured at
 * -288 -> -144 across 10 frames, and landing correctly under reduced motion).
 * What jsdom CAN render faithfully is the inline style attribute and the DOM
 * structure the transition rides on, so every test below asserts one of
 * those: the column count and kind, the `--_animated-number-digit` value
 * written per column, DOM node identity across an update, and the
 * accessibility tree. Each is something the component could plausibly get
 * wrong independently of the animation working at all.
 */

/** Every column node, digit or literal, in the DOM order they are painted. */
function columns(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>('.animated-number-digit, .animated-number-literal')
  ];
}

/** Every digit column node only, in DOM order. */
function digitColumns(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('.animated-number-digit')];
}

/**
 * Collapses the column sequence into one comparable string per column --
 * `digit:<n>` reading the same custom property the CSS transition reads, or
 * `literal:<text>` -- so a single `toEqual` proves both the shape (how many
 * columns, digit vs literal) and the content (which digit, which character)
 * in one assertion instead of two that could drift apart.
 */
/**
 * The digit a column shows is the one its strip is parked on. Read back from the
 * column's own custom property, which is the single value the component writes
 * per change -- everything else about the roll is CSS.
 */
function shownDigit(column: Element): string {
  return (column as HTMLElement).style.getPropertyValue('--_animated-number-digit');
}

function columnSummary(root: HTMLElement): string[] {
  return columns(root).map((column) =>
    column.classList.contains('animated-number-digit')
      ? `digit:${shownDigit(column)}`
      : `literal:${column.textContent ?? ''}`
  );
}

function renderRoot(props: AnimatedNumberProperties): HTMLElement {
  const { getByRole } = render(AnimatedNumber, props);
  return getByRole('img') as HTMLElement;
}

/**
 * Stands in for `Intl.NumberFormat` to record what it was constructed with.
 * `vi.spyOn(Intl, 'NumberFormat')` cannot do this: it wraps the constructor
 * in a plain proxy that loses the native internal slots `format`/
 * `formatToParts` depend on, so a spied instance's `.format` throws
 * (confirmed directly). Subclassing keeps the real behaviour through
 * `super(...)` while still observing every call. Declared at module scope,
 * not inside a test body -- this file matches the `*.svelte.*` naming
 * convention, so it is itself run through the Svelte compiler, and a class
 * declared inside a callback trips its perf_avoid_nested_class warning (see
 * Table/labels.svelte.test.ts's ResizeObserverStub for the same convention).
 */
class TrackingNumberFormat extends Intl.NumberFormat {
  static calls: ConstructorParameters<typeof Intl.NumberFormat>[] = [];
  constructor(...args: ConstructorParameters<typeof Intl.NumberFormat>) {
    super(...args);
    TrackingNumberFormat.calls.push(args);
  }
}

describe('AnimatedNumber numeric decomposition', () => {
  // Each case's `columns` is the ground truth for both how many columns
  // render and what each one says -- not just a count, which would pass even
  // if two digits swapped positions or a group separator were misread as a
  // digit.
  it.each([
    { value: 0, columns: ['digit:0'], label: '0' },
    { value: 7, columns: ['digit:7'], label: '7' },
    { value: 99, columns: ['digit:9', 'digit:9'], label: '99' },
    { value: 100, columns: ['digit:1', 'digit:0', 'digit:0'], label: '100' },
    // The sign is its own literal column, keyed apart from the digits it
    // precedes -- it must never be read as one.
    { value: -42, columns: ['literal:-', 'digit:4', 'digit:2'], label: '-42' },
    // Intl.NumberFormat's default maximumFractionDigits is 3, so this also
    // pins the rounding the component inherits rather than reimplements.
    {
      value: 3.14159,
      columns: ['digit:3', 'literal:.', 'digit:1', 'digit:4', 'digit:2'],
      label: '3.142'
    },
    // A grouped value exercises both `group` literals in one pass and proves
    // the group separators land between the right digit runs, not just that
    // some comma shows up somewhere.
    {
      value: 1234567,
      columns: [
        'digit:1',
        'literal:,',
        'digit:2',
        'digit:3',
        'digit:4',
        'literal:,',
        'digit:5',
        'digit:6',
        'digit:7'
      ],
      label: '1,234,567'
    }
  ])(
    'renders $value as "$label" with the expected column sequence',
    ({ value, columns: expected, label }) => {
      const root = renderRoot({ value });
      expect(columnSummary(root)).toEqual(expected);
      // The accessible name is derived from the same formatted parts, so it
      // must never drift from what the columns spell out.
      expect(root.getAttribute('aria-label')).toBe(label);
    }
  );
});

describe('AnimatedNumber column identity across a magnitude change', () => {
  // This is the single guarantee the whole keying scheme exists for: 99 -> 100
  // must ADD a column, never renumber the two that were already on screen. A
  // test that only counted columns before and after would pass even if every
  // node were torn down and rebuilt from scratch, which is exactly the
  // regression this guards against -- a rebuilt node has no in-flight
  // transition to continue, so the CSS motion would silently stop working
  // even though the final digits still looked right. Proving survival needs
  // node identity, not equal output, so each surviving node is tagged with a
  // `data-*` expando before the update: the component's own markup never
  // writes that attribute, so it can only still be there because Svelte
  // reused the actual element rather than creating a fresh one with a
  // matching digit.
  it('keeps the tens and ones DOM nodes when 99 rolls over to 100, inserting only the new hundreds column', async () => {
    const { getByRole, rerender } = render(AnimatedNumber, { value: 99 });
    const root = getByRole('img') as HTMLElement;
    const before = digitColumns(root);
    expect(before.map(shownDigit)).toEqual(['9', '9']);

    before[0].dataset.identityProbe = 'tens';
    before[1].dataset.identityProbe = 'ones';

    await rerender({ value: 100 });

    const after = digitColumns(root);
    expect(after.map(shownDigit)).toEqual(['1', '0', '0']);
    // The tens and ones columns are the SAME elements, now one place further
    // right, carrying the tag forward.
    expect(after[1].dataset.identityProbe).toBe('tens');
    expect(after[2].dataset.identityProbe).toBe('ones');
    // The newly inserted hundreds column reuses neither prior node -- it has
    // never been tagged.
    expect(after[0].dataset.identityProbe).toBeUndefined();
  });

  // The mirror case: shrinking back must release exactly the column that
  // stops being needed, and leave the survivors as the same nodes too --
  // otherwise a value that oscillates around a magnitude boundary (99, 100,
  // 99, ...) would rebuild nodes on every other change.
  it('keeps the tens and ones DOM nodes when 100 drops back to 99, removing only the hundreds column', async () => {
    const { getByRole, rerender } = render(AnimatedNumber, { value: 100 });
    const root = getByRole('img') as HTMLElement;
    const before = digitColumns(root);
    expect(before).toHaveLength(3);
    before[1].dataset.identityProbe = 'tens';
    before[2].dataset.identityProbe = 'ones';

    await rerender({ value: 99 });

    const after = digitColumns(root);
    expect(after.map(shownDigit)).toEqual(['9', '9']);
    expect(after[0].dataset.identityProbe).toBe('tens');
    expect(after[1].dataset.identityProbe).toBe('ones');
  });
});

describe('AnimatedNumber string path decomposition', () => {
  it('splits a pre-formatted string into digit and literal columns, one column per character', () => {
    const root = renderRoot({ value: '₹1.23Cr' });
    const summary = columnSummary(root);
    expect(summary).toEqual([
      'literal:₹',
      'digit:1',
      'literal:.',
      'digit:2',
      'digit:3',
      'literal:C',
      'literal:r'
    ]);
    expect(summary.filter((entry) => entry.startsWith('digit:'))).toHaveLength(3);
    expect(summary.filter((entry) => entry.startsWith('literal:'))).toHaveLength(4);
  });

  // The prefix is anchored from the LEFT (always column 0), unlike the body
  // and suffix which are keyed from the right -- this is what stops a grown
  // digit count from sliding the currency symbol into being read as a digit.
  it('anchors a leading non-digit prefix so a growing digit count does not reinterpret it', async () => {
    const { getByRole, rerender } = render(AnimatedNumber, { value: '$99.99' });
    const root = getByRole('img') as HTMLElement;
    const before = columns(root);
    expect(columnSummary(root)).toEqual([
      'literal:$',
      'digit:9',
      'digit:9',
      'literal:.',
      'digit:9',
      'digit:9'
    ]);
    const dollarSign = before[0];
    expect(dollarSign.textContent).toBe('$');

    await rerender({ value: '$100.01' });

    const after = columns(root);
    // Same node, still a literal, still exactly "$" -- never absorbed into
    // the digit run that grew beside it.
    expect(after[0]).toBe(dollarSign);
    expect(after[0].classList.contains('animated-number-literal')).toBe(true);
    expect(after[0].textContent).toBe('$');
    expect(columnSummary(root)).toEqual([
      'literal:$',
      'digit:1',
      'digit:0',
      'digit:0',
      'literal:.',
      'digit:0',
      'digit:1'
    ]);
  });
});

describe('AnimatedNumber non-finite and digitless values', () => {
  // NaN and Infinity are still `typeof value === 'number'`, so they go
  // through Intl.NumberFormat rather than the string path -- and
  // formatToParts represents each as a single opaque part (type "nan" /
  // "infinity") with no `integer`/`fraction` part alongside it, so the
  // component's own part-type switch already renders them as one literal
  // column with no digit columns at all. Nothing here needs a special case
  // in the test, only proof that the fallthrough actually behaves that way.
  it.each([
    { value: NaN, text: 'NaN' },
    { value: Infinity, text: '∞' }
  ])('renders $text as a single literal with zero digit columns', ({ value, text }) => {
    const root = renderRoot({ value });
    expect(digitColumns(root)).toHaveLength(0);
    expect(columnSummary(root)).toEqual([`literal:${text}`]);
    expect(root.getAttribute('aria-label')).toBe(text);
  });

  it('renders a digitless string like "N/A" as literals only, with zero digit columns', () => {
    const root = renderRoot({ value: 'N/A' });
    expect(digitColumns(root)).toHaveLength(0);
    expect(columnSummary(root)).toEqual(['literal:N', 'literal:/', 'literal:A']);
    expect(root.getAttribute('aria-label')).toBe('N/A');
  });
});

describe('AnimatedNumber accessibility', () => {
  it('exposes role="img" with an aria-label mirroring the formatted text', () => {
    const root = renderRoot({ value: 1234 });
    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('1,234');
  });

  it('lets an explicit ariaLabel override the formatted text', () => {
    const root = renderRoot({ value: 42, ariaLabel: 'Forty-two widgets' });
    expect(root.getAttribute('aria-label')).toBe('Forty-two widgets');
  });

  it('hides the digit-column subtree from assistive tech, leaving only the root name', () => {
    const root = renderRoot({ value: 1234 });
    const visual = root.querySelector('.animated-number-visual');
    expect(visual).not.toBeNull();
    expect(visual?.getAttribute('aria-hidden')).toBe('true');
  });

  it('omits aria-live entirely when live is "off", rather than announcing every change', () => {
    const root = renderRoot({ value: 5 });
    expect(root.hasAttribute('aria-live')).toBe(false);
  });

  it.each(['polite', 'assertive'] as const)('sets aria-live="%s" when requested', (live) => {
    const root = renderRoot({ value: 5, live });
    expect(root.getAttribute('aria-live')).toBe(live);
  });
});

describe('AnimatedNumber locale determinism', () => {
  it('formats through an explicit non-default locale', () => {
    const root = renderRoot({ value: 1234.5, locale: 'de-DE' });
    expect(root.getAttribute('aria-label')).toBe('1.234,5');
  });

  /*
   * The property this test protects only shows up as an argument, never in
   * any rendered output: `new Intl.NumberFormat('en-US', ...)` and
   * `new Intl.NumberFormat(undefined, ...)` can format identically whenever
   * the process happens to already default to en-US (true on most CI and
   * most developer machines), which would make an output-only assertion here
   * pass for the wrong reason and stay green even if the component quietly
   * dropped its `locale = 'en-US'` default in favour of leaving it
   * unspecified. Reading the actual constructor argument is what makes this
   * assertion true regardless of the ambient environment's own default.
   */
  it('passes the literal "en-US" to Intl.NumberFormat when locale is omitted, not undefined', () => {
    TrackingNumberFormat.calls = [];
    const OriginalNumberFormat = Intl.NumberFormat;
    // Intl.NumberFormat is natively callable without `new`, a call signature
    // no `class ... extends` subclass can type-check as having, so the cast
    // has to go through `unknown` -- the runtime object still behaves
    // identically, since `super(...)` in the subclass's constructor is the
    // only construction path this test (or the component) ever exercises.
    Intl.NumberFormat = TrackingNumberFormat as unknown as typeof Intl.NumberFormat;
    try {
      renderRoot({ value: 1234.5 });
    } finally {
      Intl.NumberFormat = OriginalNumberFormat;
    }
    // The formatter that renders the value is constructed first and must carry
    // the literal default.
    expect(TrackingNumberFormat.calls[0]?.[0]).toBe('en-US');
    // The component also builds a second, auxiliary formatter to resolve the
    // active numbering system's zero glyph. The invariant this test exists to
    // protect is not the call COUNT but that no construction is left to resolve
    // against the ambient environment, which is what would let a prerendered
    // page and the browser that hydrates it format the same number differently.
    expect(TrackingNumberFormat.calls.length).toBeGreaterThanOrEqual(1);
    for (const call of TrackingNumberFormat.calls) {
      expect(call[0]).toBeDefined();
      expect(typeof call[0]).toBe('string');
    }
  });
});

describe('AnimatedNumber defects found in review', () => {
  /*
   * Intl does not return Western digits for every locale. ar-EG yields '١٢٣٤',
   * fa-IR '۱۲۳۴', bn-BD '১২৩৪', ne-NP '१२३४'. The first implementation called
   * Number() on those characters, got NaN, wrote it into the inline custom
   * property, and the resulting invalid calc() dropped the transform entirely --
   * so every column froze on its first glyph while aria-label, built from the
   * untouched part values, still read the correct localized number. The visible
   * digits and the announced ones disagreed.
   */
  it.each([
    ['ar-EG', 'arab'],
    ['fa-IR', 'arabext'],
    ['bn-BD', 'beng'],
    ['ne-NP', 'deva']
  ])('renders %s (%s numerals) without NaN, and matches its own accessible name', (locale) => {
    const { container } = render(AnimatedNumber, { value: 1234, locale });
    const root = container.querySelector('.animated-number');
    const columns = [...container.querySelectorAll('.animated-number-digit')];

    expect(columns).toHaveLength(4);
    for (const column of columns) {
      // The position the strip is parked on. NaN here was the original defect:
      // it reached the inline property as literal text, made the calc() invalid,
      // and froze every column on its first glyph while the accessible name went
      // on reading the correct localized number.
      const position = column.getAttribute('style') ?? '';
      expect(position).not.toContain('NaN');
      expect(position).toMatch(/--_animated-number-digit:\s*[0-9]\s*;/);
      expect(column.querySelectorAll('.animated-number-digit-glyph')).toHaveLength(10);
    }

    // The glyphs the odometer can show must be the locale's own, or the visible
    // number could never equal the announced one however correct the indexing.
    const localeZero = new Intl.NumberFormat(locale).format(0);
    const glyphs = [...columns[0].querySelectorAll('.animated-number-digit-glyph')].map(
      (glyph) => glyph.textContent
    );
    expect(glyphs).toHaveLength(10);
    expect(glyphs[0]).toBe(localeZero);

    // And the selectable plain-text node carries exactly what is announced.
    expect(container.querySelector('.animated-number-plain')?.textContent).toBe(
      root?.getAttribute('aria-label')
    );
  });

  /*
   * Accounting format emits TWO parts typed 'literal' -- the '(' and ')' around a
   * negative -- and keying both by part.type alone produced duplicate keys in a
   * keyed {#each}, which Svelte treats as a runtime error rather than a slip.
   */
  it('renders accounting-format negatives, whose two bracket parts share a part type', () => {
    const render1 = () =>
      render(AnimatedNumber, {
        value: -5,
        format: { style: 'currency', currency: 'USD', currencySign: 'accounting' }
      });
    expect(render1).not.toThrow();

    const { container } = render1();
    const text = container.querySelector('.animated-number')?.getAttribute('aria-label') ?? '';
    expect(text).toContain('(');
    expect(text).toContain(')');
  });

  /*
   * Every column keeps all ten glyphs in the DOM for the roll. They are real text
   * nodes, so a reader who drag-selected the number and copied it got all of them.
   * aria-hidden does not help -- selection reads the text layer, not the a11y tree.
   */
  it('carries the real value in one selectable node, separate from the glyph track', () => {
    const { container } = render(AnimatedNumber, { value: 1234 });
    const plain = container.querySelector('.animated-number-plain');

    expect(plain?.textContent).toBe('1,234');
    // It must stay inside the role="img" root, whose aria-label is the single
    // accessible name -- otherwise the value would be announced twice.
    expect(plain?.closest('.animated-number')).not.toBeNull();
    expect(container.querySelector('.animated-number-visual')?.contains(plain ?? null)).toBe(false);
  });
});

describe('AnimatedNumber defects found in the post-completion audit', () => {
  /*
   * The string path split its input with /^(\D*)([\s\S]*?)(\D*)$/, and `\D`
   * without the `u` flag means "not an ASCII digit" -- so every Arabic-Indic,
   * Eastern-Arabic, Bengali and Devanagari numeral counted as a NON-digit and the
   * leading `\D*` swallowed the whole string into the prefix. Body came back
   * empty, `digitValue` was never reached, and every character rendered as a
   * static literal.
   *
   * The failure is silent: the value is right, the accessible name is right,
   * nothing throws -- the number just stops rolling. It reaches every component
   * that feeds AnimatedNumber a pre-formatted string, which is seven of the nine
   * adopters. And `locale` made no difference, though the docs say it does: the
   * numbering system was resolved correctly and then never consulted, because the
   * split had already happened.
   */
  /*
   * The input is asked FROM the locale rather than written as literal code
   * points. Engines disagree about which numbering system a locale resolves to
   * -- measured: bn-BD is `beng` in Node and Chromium but `latn` in WebKit, and
   * ne-NP is `deva` in Node and WebKit but `latn` in Chromium -- so a hardcoded
   * '\u0967\u0968\u0969' asserts something that is only true in some of the
   * places this suite could run. Formatting the number through the same locale
   * the component is given states the actual contract instead: whatever glyphs
   * this locale's own formatter produces, feeding that string back in has to
   * roll them.
   */
  it.each(['ar-EG', 'fa-IR', 'bn-BD', 'ne-NP', 'hi-IN'])(
    'rolls a string this locale formatted itself (%s), whatever numerals it uses',
    (locale) => {
      const text = new Intl.NumberFormat(locale, { useGrouping: false }).format(123);
      const { container } = render(AnimatedNumber, { value: text, locale });
      expect(digitColumns(container)).toHaveLength(3);
      expect(container.querySelectorAll('.animated-number-literal')).toHaveLength(0);
    }
  );

  // The defect in its own terms: a non-ASCII numeral must be readable as a digit.
  // Guarded so it only runs where the environment actually resolves a non-Latin
  // system, which is the same reason the case above derives its input.
  it('reads a non-ASCII numeral as a digit, not as a literal', () => {
    const locale = ['ar-EG', 'fa-IR', 'bn-BD', 'ne-NP'].find(
      (candidate) => new Intl.NumberFormat(candidate).format(0) !== '0'
    );
    expect(locale).toBeDefined();
    const text = new Intl.NumberFormat(locale, { useGrouping: false }).format(123);
    expect(/^[0-9]+$/.test(text)).toBe(false);

    const { container } = render(AnimatedNumber, { value: text, locale });
    expect(digitColumns(container)).toHaveLength(3);
  });

  it('still splits a Latin string exactly as before, prefix and suffix included', () => {
    const root = renderRoot({ value: '$99.99' });
    expect(columnSummary(root)).toEqual([
      'literal:$',
      'digit:9',
      'digit:9',
      'literal:.',
      'digit:9',
      'digit:9'
    ]);
  });

  /*
   * Literal columns were keyed `${part.type}-${columns.length}`, so the ordinal
   * counted every column before them -- digits included. Adding a digit shifted
   * every following literal's key, and Svelte tore the node down and built a new
   * one. Nothing is visible today, because a literal never animates; the point is
   * that the keying scheme exists precisely so nodes survive, and for anything
   * after the digits it silently did not.
   */
  it('keeps the percent sign node when the digit count grows beneath it', async () => {
    const { container, rerender } = render(AnimatedNumber, {
      value: 0.99,
      format: { style: 'percent' }
    });
    const before = container.querySelector('.animated-number-literal');
    expect(before?.textContent).toBe('%');
    (before as HTMLElement).dataset.identityProbe = 'percent';

    await rerender({ value: 1, format: { style: 'percent' } });

    const after = container.querySelector('.animated-number-literal');
    expect(after?.textContent).toBe('%');
    expect((after as HTMLElement).dataset.identityProbe).toBe('percent');
  });

  /*
   * An empty value produced `role="img"` with `aria-label=""` -- an image with no
   * accessible name, which WCAG 1.1.1 does not allow and which screen readers
   * announce as a bare "image" or skip outright. Reachable: Badge renders
   * `<AnimatedNumber value={value ?? ''} />` whenever `animateValue` is set, so a
   * badge with no value yet puts an unnamed graphic in the accessibility tree.
   */
  it('does not claim to be an image when it has nothing to announce', () => {
    const { container } = render(AnimatedNumber, { value: '' });
    const root = container.querySelector('.animated-number');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('role')).toBeNull();
    expect(root?.hasAttribute('aria-label')).toBe(false);
  });

  it('is still an image when an explicit ariaLabel gives it something to say', () => {
    const { container } = render(AnimatedNumber, { value: '', ariaLabel: 'No transactions yet' });
    const root = container.querySelector('.animated-number');
    expect(root?.getAttribute('role')).toBe('img');
    expect(root?.getAttribute('aria-label')).toBe('No transactions yet');
  });
});

describe('AnimatedNumber numbering systems that are not contiguous ASCII', () => {
  /*
   * The glyph list was built as `zeroCodePoint + index`, which assumes a
   * numbering system's ten digits are ten consecutive code points. `hanidec` is
   * not: its digits are the Han numerals 〇一二三四五六七八九, whose code points
   * are scattered (12295, 19968, 20108, …). The derived glyph list was therefore
   * ten unrelated characters, `digitValue` returned -1 for every real digit, and
   * the number rendered as literals with nothing able to roll.
   *
   * It is reachable with an ordinary locale string -- `zh-u-nu-hanidec` -- so it
   * needs no exotic `format` option to hit.
   */
  it('rolls a non-contiguous numbering system (hanidec) rather than rendering literals', () => {
    const locale = 'zh-u-nu-hanidec';
    // Guard: only meaningful where this environment's ICU actually resolves it.
    expect(new Intl.NumberFormat(locale).resolvedOptions().numberingSystem).toBe('hanidec');

    const { container } = render(AnimatedNumber, { value: 1234, locale });
    expect(digitColumns(container)).toHaveLength(4);

    // And the glyphs offered are that system's own, in value order.
    const first = digitColumns(container)[0];
    const glyphs = [...first.querySelectorAll('.animated-number-digit-glyph')].map(
      (glyph) => glyph.textContent
    );
    const expected = Array.from({ length: 10 }, (_, digit) =>
      new Intl.NumberFormat(locale, { useGrouping: false }).format(digit)
    );
    expect(glyphs).toEqual(expected);
  });

  /*
   * `mathbold` is contiguous but lives outside the BMP, so each digit is a
   * surrogate PAIR. Counting `part.value.length` counts UTF-16 code units rather
   * than characters, which doubles the integer length and hands every column a
   * place-value key computed from the wrong total -- so a magnitude change
   * renumbers columns that should have survived it.
   */
  it('counts supplementary-plane digits by character, so place-value keys stay stable', async () => {
    const format = { numberingSystem: 'mathbold' };
    expect(new Intl.NumberFormat('en', format).resolvedOptions().numberingSystem).toBe('mathbold');

    /*
     * The column COUNT is already right, because `for...of` over a string
     * iterates code points -- which is why a length-only assertion passes even
     * with the defect. What breaks is the place-value KEY: the total is taken
     * from `part.value.length`, which counts UTF-16 units, so every digit
     * counts twice. "99" is keyed from a total of 4 and "100" from a total of
     * 6, and the keys those produce do not line up, so Svelte tears down and
     * rebuilds the columns that should have survived. Node identity is the only
     * thing that shows it.
     */
    const { getByRole, rerender } = render(AnimatedNumber, { value: 99, format });
    const root = getByRole('img') as HTMLElement;
    const before = digitColumns(root);
    expect(before).toHaveLength(2);
    before[0].dataset.identityProbe = 'tens';
    before[1].dataset.identityProbe = 'ones';

    await rerender({ value: 100, format });

    const after = digitColumns(root);
    expect(after).toHaveLength(3);
    // Same two nodes, one place further right -- exactly what the Latin case asserts.
    expect(after[1].dataset.identityProbe).toBe('tens');
    expect(after[2].dataset.identityProbe).toBe('ones');
    expect(after[0].dataset.identityProbe).toBeUndefined();
  });
});
