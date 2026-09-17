<script lang="ts">
  import { onMount } from 'svelte';
  import type { AnimatedNumberProperties } from './properties';
  import { canSpin, DELTA_PROPERTY, durationMs, trendBetween, wheelDelta } from './motion';

  let {
    value,
    locale = 'en-US',
    format,
    live = 'off',
    ariaLabel,
    testId,
    classes
  }: AnimatedNumberProperties = $props();

  /**
   * Every column holds all ten glyphs for the life of its DOM node, and each one
   * resolves its own position from a single scalar rather than being animated
   * itself -- see motion.ts for why that distinction is the whole mechanism, and
   * what animating the glyphs directly looked like instead.
   *
   * The component runs no timer. A value change writes one custom property per
   * column and hands one interpolation to the browser; everything else is CSS
   * arithmetic re-evaluated per frame.
   */
  type Column =
    | { readonly kind: 'digit'; readonly key: string; readonly digit: number }
    | { readonly kind: 'literal'; readonly key: string; readonly text: string };

  /** The fallback when a locale's own numbering system cannot be resolved. */
  const LATIN_DIGITS: readonly string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  /**
   * Integer digits are keyed by place value counted from the units digit, so
   * growing a magnitude (99 -> 100) only ever ADDS a key at one end and never
   * renumbers the columns already on screen -- the node survives, so a roll
   * already in flight on it carries on rather than being torn down. Group separators mirror that, keyed by distance from the
   * right; every other part type occurs at most once per ECMA-402 and is keyed
   * by the type itself.
   */
  const columnsFromParts = (parts: readonly Intl.NumberFormatPart[]): readonly Column[] => {
    const integerDigits = parts.reduce(
      // `[...value]` counts code points. `.length` counts UTF-16 units, which
      // doubles every digit of a supplementary-plane system such as `mathbold`
      // and hands each column a place-value key computed from the wrong total,
      // so a magnitude change renumbers columns that should have survived it.
      (total, part) => (part.type === 'integer' ? total + [...part.value].length : total),
      0
    );
    const groups = parts.reduce((total, part) => (part.type === 'group' ? total + 1 : total), 0);
    let integerSeen = 0;
    let fractionSeen = 0;
    let groupSeen = 0;
    const literalSeen: Record<string, number> = {};
    const columns: Column[] = [];
    for (const part of parts) {
      if (part.type === 'integer') {
        for (const character of part.value) {
          columns.push({
            kind: 'digit',
            key: `int-${integerDigits - 1 - integerSeen}`,
            digit: digitOf(character)
          });
          integerSeen += 1;
        }
      } else if (part.type === 'fraction') {
        for (const character of part.value) {
          columns.push({
            kind: 'digit',
            key: `frac-${fractionSeen}`,
            digit: digitOf(character)
          });
          fractionSeen += 1;
        }
      } else if (part.type === 'group') {
        columns.push({ kind: 'literal', key: `group-${groups - 1 - groupSeen}`, text: part.value });
        groupSeen += 1;
      } else {
        // Keyed by type AND an ordinal counted WITHIN that type. The ordinal is
        // needed because accounting format emits TWO parts typed `literal` --
        // '(' and ')' bracketing a negative -- and a duplicate key in a keyed
        // {#each} is a Svelte runtime error, not a cosmetic slip. Counting the
        // columns emitted so far instead made the ordinal depend on how many
        // DIGITS preceded it, so growing a magnitude renumbered every literal
        // after the digits and Svelte rebuilt each one: `99% -> 100%` discarded
        // the `%` node and made a new one. Nothing shows, because a literal never
        // animates -- but surviving the update is the whole point of keying them.
        const ordinal = literalSeen[part.type] ?? 0;
        literalSeen[part.type] = ordinal + 1;
        columns.push({ kind: 'literal', key: `${part.type}-${ordinal}`, text: part.value });
      }
    }
    return columns;
  };

  /**
   * An already-formatted string has no parts to read, so it is split into a
   * leading non-digit run, a numeric body and a trailing non-digit run. The
   * prefix anchors from the LEFT and the body and suffix from the RIGHT, which
   * is what keeps a currency symbol still when the digit count grows:
   * `$99.99 -> $100.01` rolls four digits and adds one column, rather than
   * re-reading the `$` column as a digit.
   *
   * The split asks `digitOf` what counts as a digit rather than matching
   * `\D`, which is ASCII-only without the `u` flag. Every Arabic-Indic,
   * Eastern-Arabic, Bengali and Devanagari numeral therefore read as a NON-digit
   * and the leading run swallowed the whole string, leaving the body empty and
   * every character a static literal -- with the right value, the right
   * accessible name and nothing thrown, so the only symptom was that the number
   * quietly stopped rolling. `locale` could not help: the numbering system was
   * resolved correctly and then never consulted, because the split had already
   * happened.
   */
  const columnsFromText = (text: string): readonly Column[] => {
    const characters = [...text];
    let firstDigit = -1;
    let lastDigit = -1;
    characters.forEach((character, index) => {
      if (digitOf(character) >= 0) {
        if (firstDigit < 0) {
          firstDigit = index;
        }
        lastDigit = index;
      }
    });
    // No digits at all means the whole string is prefix, which is what the
    // greedy leading run produced for a digitless string before.
    const hasDigits = firstDigit >= 0;
    const prefix = hasDigits ? characters.slice(0, firstDigit) : characters;
    const body = hasDigits ? characters.slice(firstDigit, lastDigit + 1) : [];
    const suffix = hasDigits ? characters.slice(lastDigit + 1) : [];

    const columns: Column[] = [];
    prefix.forEach((character, index) => {
      columns.push({ kind: 'literal', key: `pre-${index}`, text: character });
    });
    body.forEach((character, index) => {
      const key = `body-${body.length - 1 - index}`;
      const digit = digitOf(character);
      columns.push(
        digit >= 0 ? { kind: 'digit', key, digit } : { kind: 'literal', key, text: character }
      );
    });
    suffix.forEach((character, index) => {
      columns.push({
        kind: 'literal',
        key: `post-${suffix.length - 1 - index}`,
        text: character
      });
    });
    return columns;
  };

  // (-0).toLocaleString() renders "-0" in every engine implementing signed zero
  // faithfully, which reads as wrong next to a value nobody typed as negative.
  const numeric = $derived(typeof value === 'number' && Object.is(value, -0) ? 0 : value);

  const formatter = $derived(new Intl.NumberFormat(locale, format));

  /**
   * The code point of THIS locale's zero. A numbering system's ten digits are
   * contiguous, so one code point gives both the glyph list and the parse.
   *
   * Necessary because `Intl.NumberFormat` does not return Western digits for
   * every locale: ar-EG yields '١٢٣٤', fa-IR '۱۲۳۴', bn-BD '১২৩৪', ne-NP '१२३४'.
   * `Number('١')` is NaN, which reached the inline custom property as the literal
   * text `NaN`, made the whole `calc()` invalid so `transform` fell back to
   * `none`, and froze every column on its first glyph -- while `aria-label`, built
   * from the untouched part values, still read the correct localized number. A
   * sighted reader and a screen-reader reader were told different things.
   */
  /**
   * This numbering system's ten digits, in value order, asked FROM the formatter.
   *
   * Derived by formatting 0-9 rather than as `zero + index`, which assumes the
   * ten digits are ten consecutive code points. `hanidec` is not: its digits are
   * the Han numerals 〇一二三四五六七八九, whose code points are scattered, so the
   * arithmetic produced ten unrelated characters, nothing matched a real digit,
   * and the number rendered as motionless literals. It is reachable with an
   * ordinary locale string -- `zh-u-nu-hanidec` -- so it needs no exotic option
   * to hit.
   *
   * Necessary for the same reason the arithmetic version was: `Intl` does not
   * return Western digits for every locale. ar-EG yields '١٢٣٤', fa-IR '۱۲۳۴',
   * bn-BD '১২৩৪', ne-NP '१२३४'.
   */
  const glyphs = $derived.by((): readonly string[] => {
    try {
      const numberingSystem = formatter.resolvedOptions().numberingSystem;
      const digits = new Intl.NumberFormat('en', { numberingSystem, useGrouping: false });
      return Array.from({ length: 10 }, (_, digit) => digits.format(digit));
    } catch {
      return LATIN_DIGITS;
    }
  });

  /**
   * The digit a glyph stands for in the active numbering system, or -1.
   *
   * A map rather than subtraction, so a system whose digits are not contiguous
   * resolves as readily as one whose digits are.
   */
  const digitOf = $derived.by((): ((character: string) => number) => {
    const lookup = new Map(glyphs.map((glyph, digit) => [glyph, digit]));
    return (character: string): number => lookup.get(character) ?? -1;
  });

  const parts = $derived(typeof numeric === 'number' ? formatter.formatToParts(numeric) : null);

  // One source of truth for "what does this actually say", so the accessible
  // name can never drift from the glyphs on screen.
  const plainText = $derived(
    parts === null ? String(numeric) : parts.map((part) => part.value).join('')
  );

  /**
   * Gates the roll for columns that exist on the very first paint: those are at
   * rest, not arriving, so the number never counts up from zero on page load. A
   * column that appears LATER, because the value grew a digit, mounts with this
   * already true and does roll in -- from 0, which is what it implicitly was
   * before it existed.
   *
   * `onMount` rather than `$effect`, which eslint.config.js bans outright:
   * nothing here needs to re-run, it is a one-way latch.
   */
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  /*
   * Plain bookkeeping, not `$state` -- like ColorPicker's `lastCommittedHex` and
   * Tabs' `lastSelectionKey` -- so reading it never creates a reactive
   * dependency. Whichever column's attachment runs first for a given value
   * computes the direction the number as a whole moved; the rest read it back.
   * That shared direction is the single thing that makes every 9 in 99 -> 100
   * step forward by one rather than nine backwards.
   */
  let lastSeen: number | string | null = null;
  let trend = 0;

  const trendFor = (current: number | string): number => {
    if (lastSeen !== current) {
      trend = lastSeen === null ? 0 : trendBetween(lastSeen, current, digitOf);
      lastSeen = current;
    }
    return trend;
  };

  /** The digit each column last settled on, kept per DOM node so it survives the
   *  attachment being re-created when any of its arguments change. */
  const settledDigits = new WeakMap<Element, number>();

  /**
   * Which roll is the current one for a column, so an earlier roll finishing
   * cannot clear the class a later one still needs.
   *
   * Each roll waits on every animation running on the column when it starts, but
   * an earlier roll waited on a strictly smaller set and so resolves FIRST --
   * while the later one is still going. Measured during the burst demo: from
   * 948ms, three columns were four animations deep and had already dropped the
   * class, which sends the nine glyphs that are not current back to
   * `display: none` and pops the outgoing digit out of existence mid-roll.
   */
  const rollGeneration = new WeakMap<Element, number>();

  /**
   * Turns one column's wheel to `digit`.
   *
   * `{@attach}` runs its callback inside a real reactive effect (see Tabs and
   * ColorPicker for the same idiom), which gives the after-the-DOM-updated hook
   * this needs without reaching for the banned `$effect`. The duration and
   * easing are read back off the computed style rather than hardcoded, so the
   * two-token chain in the stylesheet below -- and the reduced-motion block that
   * collapses it -- keep working even though the motion itself is no longer a
   * CSS transition.
   */
  const roll =
    (digit: number, canRoll: boolean, current: number | string) =>
    (node: HTMLElement): void => {
      // Advance the shared trend before any early return: a column whose own
      // digit did not change still has to let the first-runner compute it.
      const direction = trendFor(current);

      const seen = settledDigits.has(node);
      const previous = settledDigits.get(node) ?? 0;
      settledDigits.set(node, digit);

      if (!canRoll || !canSpin()) {
        return;
      }
      const delta = wheelDelta(digit, seen ? previous : 0, direction);
      if (delta === 0) {
        return;
      }

      const styles = getComputedStyle(node);
      const duration = durationMs(styles.getPropertyValue('--_animated-number-spin-duration'));
      if (duration <= 0) {
        return;
      }
      const easing = styles.getPropertyValue('--_animated-number-spin-easing').trim();

      try {
        node.animate(
          { [DELTA_PROPERTY]: [-delta, 0] },
          {
            duration,
            easing: easing.length > 0 ? easing : 'linear',
            // Overlapping rolls sum rather than replace, so a burst of changes
            // mid-flight stays continuous instead of snapping to the newest one.
            composite: 'accumulate'
          }
        );
      } catch {
        // `animate` rejects an easing it cannot parse, and the easing comes from
        // a token a consumer controls. Changing instantly is the same graceful
        // degradation an engine without `mod()` already gets -- far better than
        // throwing out of an effect mid-render, which would also strand the
        // class added below and leave nine glyphs stuck on screen.
        return;
      }

      // Reveals the nine glyphs that are `display: none` at rest, so the one
      // leaving is visible on its way out. Added after `animate` rather than
      // before so a throw cannot leave it behind; the style flush happens at
      // paint, well after this synchronous block, so the glyphs are still
      // visible for the animation's very first frame.
      const generation = (rollGeneration.get(node) ?? 0) + 1;
      rollGeneration.set(node, generation);
      node.classList.add('animated-number-digit--spinning');

      const settle = (): void => {
        if (rollGeneration.get(node) === generation) {
          node.classList.remove('animated-number-digit--spinning');
        }
      };
      // `then(settle, settle)`: a roll replaced mid-flight rejects rather than
      // resolves, and the class still has to come off on the last one out.
      Promise.all(node.getAnimations().map((running) => running.finished)).then(settle, settle);
    };

  const columns = $derived(
    parts === null ? columnsFromText(String(numeric)) : columnsFromParts(parts)
  );

  /**
   * What assistive technology is told this element is. An empty one used to be
   * announced as `role="img"` with `aria-label=""` -- a graphic with no
   * accessible name, which WCAG 1.1.1 does not allow and which readers announce
   * as a bare "image" or skip. Badge renders `<AnimatedNumber value={value ?? ''} />`
   * whenever `animateValue` is set, so a badge with no value yet reached exactly
   * that. With nothing to say the element says nothing and stays an ordinary
   * span; an explicit `ariaLabel` still makes it an image, because then it does
   * have something to say.
   *
   * `aria-live` is deliberately NOT gated on this. A live region has to be in
   * the DOM before the change it announces, so an element that starts empty and
   * later fills in still has to carry it from the first render.
   */
  const accessibleName = $derived(ariaLabel ?? plainText);
  const named = $derived(accessibleName.length > 0);
</script>

<span
  class="animated-number {classes ?? ''}"
  data-pw={testId ?? null}
  testID={testId ?? null}
  role={named ? 'img' : null}
  aria-label={named ? accessibleName : null}
  aria-live={live === 'off' ? null : live}
>
  <!--
    The glyph machinery below is ten real text nodes per column. Nine of them are
    `display: none` while the column is at rest, but they all come back for the
    duration of a roll, and `aria-hidden` does not help there: selection and
    find-in-page work on the text layer, not the accessibility tree, so a reader
    who drag-selected "1,234" mid-roll would otherwise copy every numeral with
    it. The glyphs are made unselectable and the value is carried by this one
    node instead, so a copy yields the number whether or not anything is moving.

    Which is also why it needs `aria-hidden` of its own. Being clipped rather
    than `display: none` is what keeps it in the text layer -- and that kept it
    in the accessibility tree too. Sitting inside the `role="img"` root was
    assumed to be enough, on the reading that `img` has presentational children;
    ARIA says user agents SHOULD treat them that way and Chromium does not.
    Measured inside one counter: `image "99"`, `StaticText "99"` and
    `InlineTextBox "99"`, so the number was announced twice -- and for an adopter
    like Badge, whose root is a `status` live region, twice on every change.
    `aria-hidden` removes it from that tree without touching selection, which is
    a render-tree concern and unaffected by it.
  -->
  <span class="animated-number-plain" aria-hidden="true">{plainText}</span>
  <span class="animated-number-visual" aria-hidden="true">
    {#each columns as column (column.key)}
      {#if column.kind === 'digit'}
        <span
          class="animated-number-digit"
          style="--_animated-number-digit: {column.digit};"
          {@attach roll(column.digit, mounted, numeric)}
        >
          {#each glyphs as glyph, index (glyph)}
            <!--
              Only the current glyph is in flow, so it alone gives the column its
              height and the column never resizes mid-roll. `inert` marks the
              other nine: it takes them out of the tab order and the text layer
              as well as positioning them, and they stay `display: none` until a
              roll is actually running.
            -->
            <span
              class="animated-number-digit-glyph"
              style="--_animated-number-glyph: {index};"
              inert={index !== column.digit}>{glyph}</span
            >
          {/each}
        </span>
      {:else}
        <span class="animated-number-literal">{column.text}</span>
      {/if}
    {/each}
  </span>
</span>

<style>
  .animated-number {
    /*
     * One box, shared by the columns, the static characters and the glyphs, and
     * also the distance a step of one digit travels.
     *
     * Defined once and referred to as a LENGTH rather than each place computing
     * its own, and rather than the glyphs positioning themselves in percentages
     * of their own height. A percentage resolves against the element's used
     * height, which WebKit rounds: measured at a 70.39px box, it parked a
     * clamped glyph 70.0px away instead of 70.39px, leaving a 0.39px sliver of
     * the wrong digit inside the window on every frame of every roll. It fell
     * inside the fully transparent end of the mask so nothing showed, but it is
     * the sort of near-miss that stops being invisible at another font size.
     * Sharing one length makes the column and the glyph the same size by
     * construction instead of by agreement. (The reference implementation meets
     * the same rounding and rounds its mask height to whole pixels for it.)
     */
    --_animated-number-box: calc(
      var(--animated-number-row-height, 1.2em) + 2 * var(--animated-number-fade-height, 0.28em)
    );
    position: relative;
    display: inline-block;
    white-space: nowrap;
    font-variant-numeric: var(--animated-number-font-variant-numeric, tabular-nums);
    color: var(--animated-number-color, inherit);
  }

  .animated-number-visual {
    /* Decorative glyph content, same treatment Avatar, KeyboardInput, Tabs,
       Calendar and Draggable already give theirs. */
    user-select: none;
  }

  /* Carries the real value for selection, copy and find-in-page. Clipped rather
     than `display: none` or `visibility: hidden`, both of which would take it out
     of the text layer and defeat the point. It sits inside the `role="img"` root,
     so assistive technology never reaches it -- the root's aria-label is the one
     accessible name. */
  .animated-number-plain {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /*
   * Both the digit columns and the static characters use ONE box height, so they
   * sit on the same line however the fade is tuned: the text row plus a fade band
   * above and below. The negative margin hands those two bands back to the line
   * box, so the number still occupies exactly `--animated-number-row-height` in
   * the surrounding text and adding a fade never shifts the baseline.
   */
  /*
   * Both the digit columns and the static characters use ONE box height, so they
   * sit on the same line however the fade is tuned: the text row plus a fade band
   * above and below. The negative margin hands those two bands back to the line
   * box, so the number still occupies exactly `--animated-number-row-height` in
   * the surrounding text and adding a fade never shifts the baseline. One box is
   * also exactly what a step of one digit travels, so a neighbour lands fully
   * outside the column rather than poking into the fade band where the mask is
   * still opaque.
   */
  .animated-number-digit,
  .animated-number-literal {
    display: inline-block;
    vertical-align: bottom;
    height: var(--_animated-number-box, 1.76em);
    line-height: var(--_animated-number-box, 1.76em);
    margin-block: calc(-1 * var(--animated-number-fade-height, 0.28em));
  }

  .animated-number-digit {
    position: relative;
    width: var(--animated-number-digit-width, 1ch);
    text-align: center;
    /* The mask only fades what is inside this box; the clip is what removes the
       glyphs parked outside it. Without it they sit in plain view above and below
       the number. */
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--animated-number-fade-height, 0.28em),
      #000 calc(100% - var(--animated-number-fade-height, 0.28em)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--animated-number-fade-height, 0.28em),
      #000 calc(100% - var(--animated-number-fade-height, 0.28em)),
      transparent 100%
    );

    /*
     * The scalar every glyph below resolves its position from. A token stream,
     * not a value: it is substituted into the `mod()` in the glyph rule, where
     * `a + b` is an ordinary calc sum. The digit jumps to its new value and the
     * delta animates from `-delta` back to 0, so the sum travels from the old
     * digit to the new one and no glyph ever has its own position animated.
     */
    --_animated-number-c: var(--_animated-number-digit, 0) + var(--_animated-number-delta, 0);

    /*
     * The two-token chain, resolved here and read back by the attachment rather
     * than driving a `transition` -- which is why it still answers to
     * `--motion-duration` and to the reduced-motion block at the end of this
     * sheet, even though the motion is now one interpolated custom property.
     */
    --_animated-number-spin-duration: var(
      --animated-number-digit-transition-duration,
      var(--motion-duration, 0.9s)
    );
    --_animated-number-spin-easing: var(
      --animated-number-digit-transition-easing,
      var(
        --motion-easing,
        linear(
          0,
          0.005,
          0.019,
          0.039,
          0.066,
          0.096,
          0.129,
          0.165,
          0.202,
          0.24,
          0.278,
          0.316,
          0.354,
          0.39,
          0.426,
          0.461,
          0.494,
          0.526,
          0.557,
          0.586,
          0.614,
          0.64,
          0.665,
          0.689,
          0.711,
          0.731,
          0.751,
          0.769,
          0.786,
          0.802,
          0.817,
          0.831,
          0.844,
          0.856,
          0.867,
          0.877,
          0.887,
          0.896,
          0.904,
          0.912,
          0.919,
          0.925,
          0.931,
          0.937,
          0.942,
          0.947,
          0.951,
          0.955,
          0.959,
          0.962,
          0.965,
          0.968,
          0.971,
          0.973,
          0.976,
          0.978,
          0.98,
          0.981,
          0.983,
          0.984,
          0.986,
          0.987,
          0.988,
          0.989,
          0.99,
          0.991,
          0.992,
          0.992,
          0.993,
          0.994,
          0.994,
          0.995,
          0.995,
          0.996,
          0.996,
          0.9963,
          0.9967,
          0.9969,
          0.9972,
          0.9975,
          0.9977,
          0.9979,
          0.9981,
          0.9982,
          0.9984,
          0.9985,
          0.9987,
          0.9988,
          0.9989,
          1
        )
      )
    );
  }

  /*
   * Where the wheel is actually drawn. `--_animated-number-offset-raw` is this
   * glyph's distance ahead of the current position, 0-9; the `round(down, ...)`
   * line re-centres that onto -5..5 so a glyph is placed on whichever side it is
   * nearer, and the clamp parks everything further than one box away at exactly
   * one box away. Nothing here is transitioned: it is recomputed every frame
   * from a scalar that is, which is what keeps a far glyph pinned outside the
   * window instead of tweening across it.
   */
  .animated-number-digit-glyph {
    display: block;
    height: var(--_animated-number-box, 1.76em);
    line-height: var(--_animated-number-box, 1.76em);
    --_animated-number-offset-raw: mod(
      10 + var(--_animated-number-glyph, 0) - mod(var(--_animated-number-c, 0), 10),
      10
    );
    --_animated-number-offset: calc(
      var(--_animated-number-offset-raw, 0) - 10 *
        round(down, var(--_animated-number-offset-raw, 0) / 5, 1)
    );
    --_animated-number-y: clamp(
      calc(-1 * var(--_animated-number-box, 1.76em)),
      calc(var(--_animated-number-offset, 0) * var(--_animated-number-box, 1.76em)),
      var(--_animated-number-box, 1.76em)
    );
    transform: translateY(var(--_animated-number-y, 0));
  }

  /* Only the current glyph stays in flow, so the column keeps one glyph's height
     and never resizes mid-roll. */
  .animated-number-digit-glyph[inert] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  /* At rest the column holds exactly the digit it reads as -- which is also what
     stops the other nine reaching find-in-page. They come back for the roll. */
  .animated-number-digit:not(.animated-number-digit--spinning) .animated-number-digit-glyph[inert] {
    display: none;
  }

  /* DESIGN_PRINCIPLES.md section 1 says only an animation with no natural end
     needs its own reduced-motion block, because --motion-duration: 0s would
     strand it on a keyframe meaning something else. This one is finite and has
     no such hazard -- but the token only stops it if something assigns it, and
     nothing in this library ever does: it exists as the middle rung of a
     fallback chain for consumers to reach. Left at that, a reader who asked
     their OS for reduced motion still watched every digit roll.

     Collapsing the duration here rather than duplicating the query in script
     keeps one mechanism for both routes: the attachment reads 0s and never
     starts an animation, so the digit is simply already correct. It lives in
     this component's own <style> because that is the only stylesheet reaching
     inside the shadow root a custom-element consumer gets. */
  @media (prefers-reduced-motion: reduce) {
    .animated-number-digit {
      --_animated-number-spin-duration: 0s;
    }
  }
</style>
