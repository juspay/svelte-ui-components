import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * AnimatedNumber runs no timer. A value change writes one custom property per
 * column, `--_animated-number-digit`, and hands the browser ONE interpolation per
 * column: `--_animated-number-delta`, travelling from `-delta` back to 0. Every
 * glyph's position is CSS arithmetic over the sum of those two, recomputed each
 * frame -- no glyph is ever itself animated (motion.ts explains why that
 * distinction is the mechanism rather than an implementation detail).
 *
 * jsdom has no running animations and no `Element.animate` at all (verified for
 * this repo's vitest/jsdom 29.1.1), so a unit test can assert the DOM and the
 * custom property but never that anything MOVED, nor that it moved the right
 * WAY. Both claims need a real engine, which is what this suite is for.
 *
 * Route: /components/animated-number, the `counter` demo (data-pw="counter",
 * default 99), whose buttons give deterministic retargets.
 *
 * Two traps this suite deliberately avoids:
 *
 * 1. Measuring a column the click under test is about to BORN. A fresh column
 *    has no previous digit of its own -- it rolls in from 0, which is what it
 *    implicitly was before it existed -- so sampling one conflates "just
 *    mounted" with "not animating". Every "does it interpolate" test below first
 *    reaches a value where the measured retarget does not change the digit count.
 *    The one test that WANTS a newly-born column asks for it deliberately.
 * 2. Trusting `test.use({ reducedMotion })`, verified not to reach `matchMedia`
 *    under this repo's config (see tests/typewriter-text-reduced-motion.test.ts
 *    and tests/voice-orb-reduced-motion.test.ts). Every reduced-motion test here
 *    uses `emulateMedia` and then probes `matchMedia(...).matches` before
 *    trusting anything downstream of it.
 *
 * There are two independent ways the motion stops and both are tested, because
 * for a while only one existed. `--motion-duration: 0s` is how a consuming app
 * switches it off; the OS preference is how a reader does. Neither is a
 * `transition` any more -- both collapse the resolved
 * `--_animated-number-spin-duration`, which the component reads back before
 * deciding whether to animate at all -- so both are asserted end to end here
 * rather than by reading a duration off a style.
 */

const ROUTE = '/components/animated-number';

// A column that genuinely interpolated visited more than its start and end
// frame; three is the lowest count that cannot be explained by "sampled once
// before, once after" landing either side of a single jump.
const MIN_DISTINCT_SAMPLES = 3;

const EPSILON = 0.02;

const button = (page: Page, name: string): Locator =>
  page.getByRole('button', { name, exact: true });

const digitColumns = (page: Page, testId: string): Locator =>
  page.locator(`[data-pw="${testId}"] .animated-number-digit`);

/** The one scalar the browser is interpolating for this column. */
const deltaOf = (column: Locator): Promise<number> =>
  column.evaluate(
    (el) =>
      Number.parseFloat(getComputedStyle(el).getPropertyValue('--_animated-number-delta')) || 0
  );

/**
 * The glyphs actually inside this column's window, each with how much of the
 * window it covers. At rest exactly one glyph is displayed at all; mid-roll the
 * other nine are revealed but only the arriving and leaving pair should ever be
 * within the window -- everything else is parked a full box away by the clamp.
 */
const visibleGlyphs = (column: Locator): Promise<{ glyph: string; covered: number }[]> =>
  column.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return [...el.querySelectorAll('.animated-number-digit-glyph')]
      .map((node) => {
        if (getComputedStyle(node).display === 'none') {
          return null;
        }
        const rect = node.getBoundingClientRect();
        const overlap = Math.max(
          0,
          Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top)
        );
        const covered = overlap / box.height;
        return covered > 0.002 ? { glyph: node.textContent ?? '', covered } : null;
      })
      .flatMap((entry) => (entry === null ? [] : [entry]));
  });

/** The single glyph a settled column is showing -- the other nine are `display: none`. */
const settledGlyph = async (column: Locator): Promise<string> => {
  const shown = await visibleGlyphs(column);
  expect(shown).toHaveLength(1);
  return shown[0].glyph;
};

/**
 * Clicks a button and samples one column's delta every animation frame, all
 * inside the page.
 *
 * Sampling from the test side instead -- a `waitForTimeout` loop around a CDP
 * read -- makes the measurement race the roll: each read costs a round trip, so
 * under a loaded machine the first sample can land after a 0.9s roll has already
 * finished and every sample then reads the same settled zero. That is a false
 * "it never moved", and it failed exactly once in a full parallel run of the
 * suite while passing thirty times on its own. Driving it from
 * `requestAnimationFrame` removes the round trip from the timing entirely.
 *
 * `column` indexes from the left, or from the right when negative, and is
 * re-resolved every frame so a click that changes the digit count still follows
 * the column the caller meant.
 */
const rollSamples = (
  page: Page,
  buttonLabel: string,
  column: number,
  windowMs = 1200
): Promise<number[]> =>
  page.evaluate(
    ({ label, index, ms }) =>
      new Promise<number[]>((resolve) => {
        const columns = (): Element[] => [
          ...document.querySelectorAll('[data-pw="counter"] .animated-number-digit')
        ];
        const at = (): Element | null => {
          const all = columns();
          return all[index < 0 ? all.length + index : index] ?? null;
        };
        const samples: number[] = [];
        const read = (): void => {
          const node = at();
          samples.push(
            node === null
              ? 0
              : Number.parseFloat(
                  getComputedStyle(node).getPropertyValue('--_animated-number-delta')
                ) || 0
          );
        };
        const target = [...document.querySelectorAll('button')].find(
          (node) => node.textContent?.trim() === label
        );
        target?.click();
        const start = performance.now();
        const tick = (): void => {
          read();
          if (performance.now() - start < ms) {
            requestAnimationFrame(tick);
          } else {
            resolve(samples);
          }
        };
        requestAnimationFrame(tick);
      }),
    { label: buttonLabel, index: column, ms: windowMs }
  );

const distinctCount = (samples: readonly number[]): number =>
  new Set(samples.map((value) => Math.round(value / EPSILON))).size;

/** Already-finished animations resolve `finished` immediately, so this is a real
 *  settle rather than a guessed timeout -- the pattern tests/carousel.test.ts and
 *  tests/sheet-band-width.test.ts already established. */
const waitForSettle = (column: Locator): Promise<Animation[]> =>
  column.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));

const settleAll = (page: Page): Promise<unknown> =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null)))
  );

test.describe('AnimatedNumber motion', () => {
  test('with motion allowed, a persisting digit column genuinely interpolates and lands on its digit', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    // 99 -> 100 crosses a magnitude boundary and mounts a column; clearing that
    // out BEFORE the measured click means +7 changes only digits that already
    // existed on both sides of it.
    await button(page, 'reset to 99').click();
    await button(page, '+1').click();
    await expect(counter).toHaveAttribute('aria-label', '100');

    const ones = digitColumns(page, 'counter').last();
    await waitForSettle(ones);
    const columnsBefore = await digitColumns(page, 'counter').count();

    const samples = await rollSamples(page, '+7', -1);
    await waitForSettle(ones);

    // 100 -> 107 is still three digits: the node measured is the same DOM node
    // before and after, never a freshly-mounted one.
    expect(await digitColumns(page, 'counter').count()).toBe(columnsBefore);
    expect(distinctCount(samples)).toBeGreaterThanOrEqual(MIN_DISTINCT_SAMPLES);

    // The delta always ends at zero: it is a correction applied to a digit that
    // already holds the answer, not the position itself.
    expect(Math.abs(await deltaOf(ones))).toBeLessThan(EPSILON);
    expect(await settledGlyph(ones)).toBe('7');
    await expect(counter).toHaveAttribute('aria-label', '107');
  });

  /*
   * The regression test for the defect this component was rebuilt over.
   *
   * 99 -> 100 turns two nines into zeros while the number as a whole goes UP.
   * Judged per column, each of those is a difference of -9 and rolls nine
   * positions backwards while its neighbour rolls one forwards -- the number
   * visibly tearing itself apart. Every column has to take its direction from
   * the whole number, so each nine steps forward exactly ONE position.
   *
   * Asserted on the delta rather than on appearance, because "one step" is
   * precisely what the delta means and a screenshot of the midpoint cannot tell
   * one step from nine.
   */
  test('a 9 rolling over to 0 while the number counts up travels one step, not nine backwards', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    await button(page, 'reset to 99').click();
    await settleAll(page);
    await expect(counter).toHaveAttribute('aria-label', '99');

    await button(page, '+1').click();
    // The first frame of the roll, before the spring has eaten into it: the
    // delta starts at exactly -1 per column, one position, upward.
    const opening = await digitColumns(page, 'counter').evaluateAll((columns) =>
      columns.map((el) =>
        Number.parseFloat(getComputedStyle(el).getPropertyValue('--_animated-number-delta'))
      )
    );
    expect(opening).toHaveLength(3);
    for (const delta of opening) {
      expect(delta).toBeGreaterThan(-1.001);
      expect(delta).toBeLessThan(0);
    }

    await settleAll(page);
    await expect(counter).toHaveAttribute('aria-label', '100');
    expect(await settledGlyph(digitColumns(page, 'counter').nth(0))).toBe('1');
    expect(await settledGlyph(digitColumns(page, 'counter').nth(1))).toBe('0');
    expect(await settledGlyph(digitColumns(page, 'counter').nth(2))).toBe('0');
  });

  /*
   * The other half of the same defect, and the one that was visible rather than
   * merely wrong: with each glyph's own transform animated, a glyph parked a full
   * box ABOVE whose offset wrapped to a full box BELOW was interpolated straight
   * through the middle, putting a full-size unrelated digit across the number
   * mid-roll. Recomputing every glyph's offset from a moving scalar cannot do
   * that, and this is what says so: across every frame of a roll, the only glyphs
   * ever inside a column's window are the one leaving and the one arriving, and
   * together they always cover it exactly once -- never three at once, never a gap.
   */
  test('no glyph other than the pair swapping places ever crosses the window', async ({ page }) => {
    await gotoHydrated(page, ROUTE);

    await button(page, 'reset to 99').click();
    await settleAll(page);

    const seen = await page.evaluate(
      () =>
        new Promise<{ glyphs: string[]; covered: number[]; counts: number[] }[]>((resolve) => {
          const root = document.querySelector('[data-pw="counter"]');
          const frames: { glyphs: string[]; covered: number[]; counts: number[] }[] = [];
          const sample = (): void => {
            for (const column of root?.querySelectorAll('.animated-number-digit') ?? []) {
              const box = column.getBoundingClientRect();
              const inside = [...column.querySelectorAll('.animated-number-digit-glyph')]
                .filter((node) => getComputedStyle(node).display !== 'none')
                .map((node) => {
                  const rect = node.getBoundingClientRect();
                  const overlap =
                    Math.max(0, Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top)) /
                    box.height;
                  return { glyph: node.textContent ?? '', overlap };
                })
                .filter((entry) => entry.overlap > 0.002);
              frames.push({
                glyphs: inside.map((entry) => entry.glyph),
                covered: [inside.reduce((total, entry) => total + entry.overlap, 0)],
                counts: [inside.length]
              });
            }
          };
          const plus = [...document.querySelectorAll('button')].find(
            (node) => node.textContent?.trim() === '+1'
          );
          plus?.click();
          const start = performance.now();
          const tick = (): void => {
            sample();
            if (performance.now() - start < 1000) {
              requestAnimationFrame(tick);
            } else {
              resolve(frames);
            }
          };
          requestAnimationFrame(tick);
        })
    );

    expect(seen.length).toBeGreaterThan(60);
    for (const frame of seen) {
      // Never a third glyph in the window: that is the sweep, exactly.
      expect(frame.counts[0]).toBeLessThanOrEqual(2);
      // And the window is always fully painted -- no gap opening between the
      // outgoing and incoming glyph, which is what a mismatched step size looked
      // like when the strip moved a bare text row through a taller clip box.
      expect(frame.covered[0]).toBeGreaterThan(0.98);
      expect(frame.covered[0]).toBeLessThan(1.02);
    }

    // Over the whole roll only '9' and '0' were ever on screen in the two
    // rolling columns, and only '0' and '1' in the one that was born.
    const everSeen = new Set(seen.flatMap((frame) => frame.glyphs));
    expect([...everSeen].sort()).toEqual(['0', '1', '9']);
  });

  /*
   * The mirror of the test above, and the reason the direction is taken from the
   * whole number rather than from each column. 100 -> 99 turns two zeros into
   * nines while the number goes DOWN, so every wheel has to turn the opposite
   * way: each 0 steps back one position to reach 9, rather than forward nine.
   * Same shape, opposite sign -- a component that hardcoded "wrap upward" would
   * pass the increment test and fail this one.
   */
  test('a 0 rolling back to 9 while the number counts down travels one step the other way', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    await button(page, 'reset to 99').click();
    await button(page, '+1').click();
    await settleAll(page);
    await expect(counter).toHaveAttribute('aria-label', '100');

    await button(page, 'reset to 99').click();
    const opening = await digitColumns(page, 'counter').evaluateAll((columns) =>
      columns.map((el) =>
        Number.parseFloat(getComputedStyle(el).getPropertyValue('--_animated-number-delta'))
      )
    );
    // Both surviving columns open at +1 -- one position, downward -- where the
    // increment opened them at -1.
    expect(opening.length).toBeGreaterThanOrEqual(2);
    for (const delta of opening.slice(-2)) {
      expect(delta).toBeLessThan(1.001);
      expect(delta).toBeGreaterThan(0);
    }

    await settleAll(page);
    await expect(counter).toHaveAttribute('aria-label', '99');
    expect(await settledGlyph(digitColumns(page, 'counter').nth(0))).toBe('9');
    expect(await settledGlyph(digitColumns(page, 'counter').nth(1))).toBe('9');
  });

  test('a zero --motion-duration lands on the end frame without animating at all', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    await button(page, 'reset to 99').click();
    await button(page, '+1').click();
    await expect(counter).toHaveAttribute('aria-label', '100');

    const ones = digitColumns(page, 'counter').last();
    await waitForSettle(ones);
    await page.addStyleTag({ content: '[data-pw="counter"] { --motion-duration: 0s; }' });

    const samples = await rollSamples(page, '+7', -1);

    // Nothing to interpolate: the component reads the collapsed duration back
    // off the computed style and never starts an animation, so the digit is
    // simply already correct rather than racing to get there.
    expect(distinctCount(samples)).toBe(1);
    expect(Math.abs(samples[0])).toBeLessThan(EPSILON);
    expect(await ones.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await settledGlyph(ones)).toBe('7');
    await expect(counter).toHaveAttribute('aria-label', '107');
  });

  test('nothing animates on first paint', async ({ page }) => {
    await gotoHydrated(page, ROUTE);
    // The mount latch flips synchronously in onMount, already after first paint;
    // this margin only guards a race between that flip and the query below.
    await page.waitForTimeout(150);

    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const effect = animation.effect;
          return (
            effect instanceof KeyframeEffect &&
            effect.target !== null &&
            effect.target.classList.contains('animated-number-digit') &&
            // Except the ones that asked to. `animateOnMount` is opt-in and
            // rolling up from zero is exactly what it is for, so those are not
            // violations of this rule -- they are the other half of it, and the
            // test below asserts they DO move.
            effect.target.closest('[data-pw^="entry"]') === null
          );
        }).length
    );

    // Every other AnimatedNumber demo on the page counts, not just `counter`:
    // the point is that first paint shows them at rest rather than counting up
    // from zero without being asked.
    expect(running).toBe(0);
  });

  test('a newly-mounted leading column rolls in rather than appearing already at rest', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    await button(page, 'reset to 99').click();
    await settleAll(page);
    expect(await digitColumns(page, 'counter').count()).toBe(2);

    const samples = await rollSamples(page, '+1', 0);
    const leading = digitColumns(page, 'counter').first();
    await waitForSettle(leading);

    // Confirms the column sampled really is the one born by this click, not the
    // pre-existing tens column that happened to be `.first()` before.
    expect(await digitColumns(page, 'counter').count()).toBe(3);
    expect(distinctCount(samples)).toBeGreaterThanOrEqual(MIN_DISTINCT_SAMPLES);
    expect(await settledGlyph(leading)).toBe('1');
    await expect(counter).toHaveAttribute('aria-label', '100');
  });

  test('a burst of five changes within 200ms settles on the final value, not stranded mid-roll', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    await button(page, 'burst: 5 changes in 200ms').click();

    // The burst's own five setTimeouts span 200ms
    // (src/routes/components/animated-number/+page.svelte); this waits past that
    // plus a full roll on the last retarget, with margin. Overlapping rolls
    // compose rather than replace each other, so the last one still has to be
    // able to finish.
    await page.waitForTimeout(1600);
    await settleAll(page);

    // The last of the five retargets always wins regardless of the counter's
    // value beforehand: 500 + 4 * 111 = 944.
    await expect(counter).toHaveAttribute('aria-label', '944');

    const columns = digitColumns(page, 'counter');
    await expect(columns).toHaveCount(3);
    for (const [index, digit] of ['9', '4', '4'].entries()) {
      const column = columns.nth(index);
      expect(await settledGlyph(column)).toBe(digit);
      // Composed deltas all unwind to zero, so nothing is left leaning.
      expect(Math.abs(await deltaOf(column))).toBeLessThan(EPSILON);
      expect(await column.evaluate((el) => el.getAnimations().length)).toBe(0);
    }
  });

  /*
   * A column reveals its other nine glyphs for the duration of a roll and hides
   * them again after. Getting that "after" wrong is invisible in the end state
   * and obvious on screen: each roll waits on every animation running on the
   * column when it started, so an earlier roll -- which waited on a strictly
   * smaller set -- resolves while a later one is still going, hides the glyphs
   * that are not current, and pops the outgoing digit out of existence.
   *
   * Measured before the fix: from 948ms into the burst, all three columns were
   * four animations deep and had already dropped the class.
   */
  test('a column stays revealed for as long as it is still rolling, through a burst', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);

    const offences = await page.evaluate(
      () =>
        new Promise<{ t: number; column: number; running: number }[]>((resolve) => {
          const root = document.querySelector('[data-pw="counter"]');
          const found: { t: number; column: number; running: number }[] = [];
          const burst = [...document.querySelectorAll('button')].find(
            (node) => node.textContent?.trim() === 'burst: 5 changes in 200ms'
          );
          burst?.click();
          const start = performance.now();
          const tick = (): void => {
            const elapsed = performance.now() - start;
            for (const [column, node] of [
              ...(root?.querySelectorAll('.animated-number-digit') ?? [])
            ].entries()) {
              const running = node.getAnimations().length;
              if (running > 0 && !node.classList.contains('animated-number-digit--spinning')) {
                found.push({ t: Math.round(elapsed), column, running });
              }
            }
            if (elapsed < 1800) {
              requestAnimationFrame(tick);
            } else {
              resolve(found);
            }
          };
          requestAnimationFrame(tick);
        })
    );

    expect(offences).toEqual([]);
  });

  /*
   * The easing reaches `Element.animate` from a token a consumer controls, and
   * `animate` throws on one it cannot parse. Thrown from inside an effect that
   * runs mid-render, that would take the surrounding component down with it and
   * strand the class that reveals the nine glyphs a column hides at rest --
   * leaving a stack of wrong digits frozen on screen.
   *
   * Degrading to an instant change is the same graceful fallback an engine
   * without `mod()` already gets. Both halves are asserted: nothing animates,
   * AND the number still arrives, which a bare "it did not throw" would not say.
   */
  test('an easing the engine cannot parse changes the value instantly instead of throwing', async ({
    page
  }) => {
    await gotoHydrated(page, ROUTE);
    const counter = page.getByTestId('counter');

    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));

    await page.addStyleTag({
      content: '[data-pw="counter"] { --animated-number-digit-transition-easing: not-an-easing; }'
    });
    await button(page, '+7').click();

    const started = await digitColumns(page, 'counter').evaluateAll((columns) =>
      columns.reduce((total, column) => total + column.getAnimations().length, 0)
    );
    expect(started).toBe(0);
    await expect(counter).toHaveAttribute('aria-label', '106');
    expect(await settledGlyph(digitColumns(page, 'counter').last())).toBe('6');
    expect(failures).toEqual([]);

    // And a usable easing afterwards still animates -- the component is not left
    // in a permanently degraded state by one bad value.
    await page.addStyleTag({
      content: '[data-pw="counter"] { --animated-number-digit-transition-easing: ease-out; }'
    });
    const samples = await rollSamples(page, '+7', -1);
    expect(distinctCount(samples)).toBeGreaterThanOrEqual(MIN_DISTINCT_SAMPLES);
    await expect(counter).toHaveAttribute('aria-label', '113');
  });

  /*
   * The preference ALONE, with no token wired by the page or by this test --
   * exactly the situation a real reader is in. This is the case that was broken
   * before AnimatedNumber grew its own @media block: every other reduced-motion
   * test here helps the component along by setting --motion-duration, which a
   * consuming app might simply never do.
   */
  test('the OS preference alone stops the roll, with no token wired, and lands on the right digit', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, ROUTE);

    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true
    );

    const samples = await rollSamples(page, '+7', -1);
    const ones = digitColumns(page, 'counter').last();

    expect(distinctCount(samples)).toBe(1);
    expect(Math.abs(samples[0])).toBeLessThan(EPSILON);
    expect(await ones.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await settledGlyph(ones)).toBe('6');
    expect(await page.locator('[data-pw="counter"]').getAttribute('aria-label')).toBe('106');
  });
});

/*
 * A space among the literals has to occupy space.
 *
 * Every column -- digit or literal -- is `display: inline-block`, which makes
 * each one its own inline formatting context. Collapsible whitespace at the
 * start and end of one of those is removed, so a literal column holding exactly
 * one ordinary space rendered at zero width and the string closed up: "12m 15s"
 * painted as "12m15s". Nothing else showed it. The accessible name is built
 * from the value rather than the columns, so it still read "12m 15s"; the
 * column count was right; only the pixels were wrong.
 *
 * Reachable from any caller that formats its own string -- durations are the
 * obvious shape -- and found by adopting the component in a dashboard rather
 * than by any test here, which is why this one exists. Asserted as a width
 * because that is the thing that was wrong; asserting `white-space` would pin
 * the current fix rather than the behaviour.
 */
test('a space between literals keeps its width', async ({ page }) => {
  await gotoHydrated(page, ROUTE);

  const spaced = page.getByTestId('spaced');
  await expect(spaced).toBeVisible();

  const widths = await spaced.evaluate((node: HTMLElement) =>
    Array.from(node.querySelectorAll('.animated-number-literal')).map((literal) => ({
      text: literal.textContent ?? '',
      width: literal.getBoundingClientRect().width
    }))
  );

  const space = widths.find((literal) => literal.text === ' ');
  expect(space, 'the space should be its own literal column').toBeDefined();
  expect(space?.width ?? 0).toBeGreaterThan(0);

  // And it should be a real space rather than a hair of rounding: the narrowest
  // glyph on the row is a useful floor, and a collapsed column measured 0.
  const letter = widths.find((literal) => literal.text === 'm');
  expect(space?.width ?? 0).toBeGreaterThan((letter?.width ?? 0) * 0.15);
});

/*
 * The other half of "nothing animates on first paint".
 *
 * That rule is right for a number that was always going to be on screen, and
 * wrong for one that ARRIVES -- and it is actively harmful where the value then
 * never changes again, which is the ordinary case on a dashboard: metrics land
 * with a fetch and sit there. Gated off on mount, such a number is static for
 * its whole life and the odometer does nothing at all, so adopting it buys
 * nothing. `animateOnMount` is what makes that case worth anything.
 *
 * Asserted by reading the rendered position of the glyph that ARRIVES, rather
 * than by counting animations: an animation object can exist and still not move
 * anything, which is the failure this whole suite was built to catch.
 *
 * How the first version of this probe went wrong, because both mistakes read as
 * "the component does not animate" and neither was true:
 *
 *  1. It watched the wrong glyph. It asked for `.animated-number-glyph`, a class
 *     that does not exist (the real one is `animated-number-digit-glyph`), and
 *     fell back to `firstElementChild` -- the glyph for 0, the one LEAVING the
 *     window. That glyph is parked a full box away within the first sixth of the
 *     roll and never moves again, so a probe that started after that saw one
 *     constant position. Failed 2 of 5 in Chromium and 4 of 5 in Firefox on the
 *     audited build, passed 5 of 5 in WebKit only because its sampler happened to
 *     start earlier.
 *  2. It started looking after `page.goto` resolved, i.e. after `load`, after
 *     hydration, and with the 900ms roll already under way.
 *
 * The fix for the second is the same for every test below: observation is
 * installed by an init script, BEFORE any page script runs, so the first
 * `Element.animate` call the component makes is already seen. The component is
 * not touched and the animation is the browser's own -- the wrapper calls the
 * native `animate`, keeps the returned Animation, and in `hold` mode only
 * pauses it. It never supplies a keyframe, a position or a callback of its own.
 */
interface EntryRoll {
  readonly element: HTMLElement;
  readonly animation: Animation;
  readonly samples: { offset: number; delta: number; state: AnimationPlayState }[];
}

interface EntryProbe {
  readonly rolls: EntryRoll[];
  readonly offsetOf: (column: HTMLElement) => number;
}

declare global {
  interface Window {
    __entryProbe?: EntryProbe;
  }
}

/**
 * Wraps `Element.prototype.animate` for the `animateOnMount` demo numbers only.
 *
 * `sample`: reads each roll once per frame from the frame after it is created.
 * `hold`: pauses each roll at time 0 as it is created, so a test can scrub the
 * real effect through its timeline deterministically and then let it play out.
 *
 * `offset` is the arriving glyph's top relative to its own column's top, so it is
 * 0 when settled and independent of page scroll and layout above the number.
 */
const observeEntryRolls = async (page: Page, mode: 'sample' | 'hold'): Promise<void> => {
  await page.addInitScript((installMode) => {
    const native = Element.prototype.animate;
    const rolls: EntryRoll[] = [];

    const offsetOf = (column: HTMLElement): number => {
      const arriving =
        [...column.querySelectorAll('.animated-number-digit-glyph')].find(
          (glyph) => !glyph.hasAttribute('inert')
        ) ?? null;
      return arriving === null
        ? Number.NaN
        : arriving.getBoundingClientRect().top - column.getBoundingClientRect().top;
    };
    window.__entryProbe = { rolls, offsetOf };

    const track = (element: HTMLElement, animation: Animation): void => {
      const roll: EntryRoll = { element, animation, samples: [] };
      rolls.push(roll);
      const read = (): void => {
        roll.samples.push({
          offset: offsetOf(element),
          delta:
            Number.parseFloat(
              getComputedStyle(element).getPropertyValue('--_animated-number-delta')
            ) || 0,
          state: animation.playState
        });
      };
      if (installMode === 'hold') {
        animation.pause();
        animation.currentTime = 0;
        return;
      }
      const tick = (): void => {
        read();
        if (animation.playState === 'running' || animation.playState === 'paused') {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
      void animation.finished.then(read, () => null);
    };

    Element.prototype.animate = function (
      this: Element,
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      const animation = native.call(this, keyframes, options);
      if (
        this instanceof HTMLElement &&
        this.classList.contains('animated-number-digit') &&
        this.closest('[data-pw^="entry"]') !== null
      ) {
        track(this, animation);
      }
      return animation;
    };
  }, mode);
};

/** Waits for hydration to have started at least one entry roll. */
const waitForEntryRolls = (page: Page): Promise<unknown> =>
  page.waitForFunction(
    () =>
      document.documentElement.dataset.hydrated === 'true' &&
      (window.__entryProbe?.rolls.length ?? 0) > 0,
    null,
    { timeout: 15_000 }
  );

/** What the entry demo numbers are, read from the DOM rather than restated. */
const entryColumns = (page: Page): Promise<{ digit: number; rolled: boolean }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-pw^="entry"] .animated-number-digit')].map(
      (column) => ({
        digit: Number.parseInt(column.style.getPropertyValue('--_animated-number-digit'), 10),
        rolled: (window.__entryProbe?.rolls ?? []).some((roll) => roll.element === column)
      })
    )
  );

/** Every digit column of the two entry numbers is at rest on the digit it shows. */
const expectEntrySettled = async (page: Page): Promise<void> => {
  const settled = await page.evaluate(() => {
    const columns = [
      ...document.querySelectorAll<HTMLElement>('[data-pw^="entry"] .animated-number-digit')
    ];
    return {
      shown: columns.map((column) => {
        const glyph = [...column.querySelectorAll('.animated-number-digit-glyph')].find(
          (node) => !node.hasAttribute('inert')
        );
        return glyph?.textContent ?? '?';
      }),
      wanted: columns.map((column) => column.style.getPropertyValue('--_animated-number-digit')),
      offsets: columns.map((column) => window.__entryProbe?.offsetOf(column) ?? Number.NaN),
      stillSpinning: columns.filter((column) =>
        column.classList.contains('animated-number-digit--spinning')
      ).length,
      stillAnimating: columns.reduce((total, column) => total + column.getAnimations().length, 0)
    };
  });

  expect(settled.shown).toEqual(settled.wanted.map((digit) => digit.trim()));
  for (const offset of settled.offsets) {
    expect(Math.abs(offset)).toBeLessThan(0.5);
  }
  expect(settled.stillSpinning, 'a settled column must drop its spinning class').toBe(0);
  expect(settled.stillAnimating, 'a settled column must have no live animation').toBe(0);
};

/** The accessible name the entry numbers must carry before, during and after the roll. */
const expectEntryNames = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('entry')).toHaveAttribute('aria-label', '60,000');
  await expect(page.getByTestId('entry-currency')).toHaveAttribute('aria-label', '₹1,240.00');
  await expect(page.getByRole('img', { name: '60,000', exact: true })).toHaveCount(1);
  await expect(page.getByRole('img', { name: '₹1,240.00', exact: true })).toHaveCount(1);
};

test.describe('animateOnMount entry roll', () => {
  test('animateOnMount rolls the columns up from zero as the number appears', async ({ page }) => {
    // Observation first, then the same `page.goto` the original probe used: the
    // roll starts at hydration, some hundreds of ms after `load`, and the
    // sampler is already waiting for it.
    await observeEntryRolls(page, 'sample');
    await page.goto(ROUTE);
    await waitForEntryRolls(page);
    await page.evaluate(() =>
      Promise.all((window.__entryProbe?.rolls ?? []).map((roll) => roll.animation.finished))
    );

    // Every column that has somewhere to travel from zero did roll. Columns whose
    // digit is 0 have no distance to cover and are rightly not animated.
    const columns = await entryColumns(page);
    expect(columns.length).toBeGreaterThan(0);
    for (const column of columns.filter((entry) => entry.digit !== 0)) {
      expect(column, 'a non-zero entry column never rolled').toMatchObject({ rolled: true });
    }

    const rolls = await page.evaluate(() =>
      (window.__entryProbe?.rolls ?? []).map((roll) => ({
        samples: roll.samples,
        owner: roll.element.closest('[data-pw^="entry"]')?.getAttribute('data-pw') ?? null
      }))
    );
    // The plain numeric `entry` has one non-zero digit, so it is a single roll.
    const entry = rolls.find((roll) => roll.owner === 'entry');
    expect(entry, 'the 60,000 entry number never started a roll').toBeDefined();
    const series = entry?.samples ?? [];

    // Observation really began with the motion: the first frame saw it running.
    expect(series[0]?.state).toBe('running');
    const offsets = series.map((sample) => Math.round(sample.offset * 100) / 100);
    const start = offsets[0];
    const end = offsets[offsets.length - 1];
    expect(
      Math.abs(start),
      `the arriving glyph should begin away from its slot, but started at ${start}`
    ).toBeGreaterThan(5);
    expect(Math.abs(end), `and finish in its slot, but ended at ${end}`).toBeLessThan(0.5);
    expect(
      new Set(offsets).size,
      `the entry column should travel, but it sat at ${[...new Set(offsets)].join(', ')}`
    ).toBeGreaterThanOrEqual(MIN_DISTINCT_SAMPLES);

    await expectEntrySettled(page);
    await expectEntryNames(page);
  });

  test('a late observer finds the entry numbers settled on their value with their names intact', async ({
    page
  }) => {
    // The deliberately late case: no hook, observation only after hydration, which
    // is when most of the 900ms roll can already be behind it. All a late observer
    // can honestly claim is the END state, and that is exactly what it asserts --
    // it must not claim motion, which is what the original probe tried to do.
    await gotoHydrated(page, ROUTE);
    await settleAll(page);

    const rest = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-pw^="entry"] .animated-number-digit')].map(
        (column) => {
          const glyph = [...column.querySelectorAll('.animated-number-digit-glyph')].find(
            (node) => !node.hasAttribute('inert')
          );
          return {
            shown: glyph?.textContent ?? '?',
            wanted: column.style.getPropertyValue('--_animated-number-digit').trim(),
            top:
              (glyph?.getBoundingClientRect().top ?? Number.NaN) -
              column.getBoundingClientRect().top,
            spinning: column.classList.contains('animated-number-digit--spinning'),
            animations: column.getAnimations().length
          };
        }
      )
    );
    expect(rest.length).toBeGreaterThan(0);
    for (const column of rest) {
      expect(column.shown).toBe(column.wanted);
      expect(Math.abs(column.top)).toBeLessThan(0.5);
      expect(column.spinning).toBe(false);
      expect(column.animations).toBe(0);
    }
    await expectEntryNames(page);
  });

  test('a held entry roll interpolates through its native keyframes and plays out to the value', async ({
    page
  }) => {
    // `hold`: each real roll is paused at time 0 the moment the component creates
    // it, so what is read below is the browser's own effect at known progress
    // points rather than a race against a 900ms clock.
    await observeEntryRolls(page, 'hold');
    await page.goto(ROUTE);
    await waitForEntryRolls(page);

    // Held at the start: nothing has advanced, and the names are already correct.
    await expectEntryNames(page);

    const scrub = await page.evaluate(async () => {
      const probe = window.__entryProbe;
      if (!probe) {
        throw new Error('entry probe missing');
      }
      const frame = (): Promise<unknown> =>
        new Promise((resolve) => requestAnimationFrame(resolve));
      const reads: { portion: number; offsets: number[]; names: (string | null)[] }[] = [];
      for (const portion of [0, 0.25, 0.5, 0.75, 1]) {
        for (const roll of probe.rolls) {
          const effect = roll.animation.effect;
          if (effect === null) {
            throw new Error('a paused entry roll lost its native effect');
          }
          roll.animation.currentTime = Number(effect.getComputedTiming().duration) * portion;
        }
        await frame();
        reads.push({
          portion,
          offsets: probe.rolls.map((roll) => probe.offsetOf(roll.element)),
          names: [...document.querySelectorAll('[data-pw^="entry"]')].map((root) =>
            root.getAttribute('aria-label')
          )
        });
      }
      return {
        reads,
        rolls: probe.rolls.map((roll) => {
          const effect = roll.animation.effect;
          const frames = effect instanceof KeyframeEffect ? effect.getKeyframes() : [];
          return {
            digit: Number.parseInt(
              roll.element.style.getPropertyValue('--_animated-number-digit'),
              10
            ),
            property: frames.map((entry) => String(entry['--_animated-number-delta'])),
            composite: effect instanceof KeyframeEffect ? effect.composite : null,
            duration: effect === null ? 0 : Number(effect.getComputedTiming().duration)
          };
        })
      };
    });

    // The real effect: one registered scalar travelling from minus the distance
    // to zero. From zero, so the first keyframe is minus the digit itself.
    expect(scrub.rolls.length).toBeGreaterThan(0);
    for (const roll of scrub.rolls) {
      expect(roll.property).toEqual([String(-roll.digit), '0']);
      expect(roll.duration).toBeGreaterThan(0);
    }

    scrub.rolls.forEach((_, index) => {
      const at = (portion: number): number =>
        scrub.reads.find((read) => read.portion === portion)?.offsets[index] ?? Number.NaN;
      const start = at(0);
      const end = at(1);
      expect(Math.abs(start), `roll ${index}: starts away from its slot`).toBeGreaterThan(5);
      expect(Math.abs(end), `roll ${index}: ends in its slot`).toBeLessThan(0.5);

      // A real interpolation passes through frames that are neither the start
      // nor the end; a jump would only ever read one or the other.
      const between = [0.25, 0.5, 0.75].filter((portion) => {
        const offset = Math.abs(at(portion));
        return offset > 0.5 && offset < Math.abs(start) - 0.5;
      });
      expect(
        between.length,
        `roll ${index}: no intermediate frame, offsets were ${scrub.reads
          .map((read) => read.offsets[index].toFixed(1))
          .join(', ')}`
      ).toBeGreaterThan(0);

      // It only ever closes in on its slot. It may START on either side -- the
      // wheel parks a far glyph a full box above or below and swaps the side while
      // it is out of sight -- so the distance is what must never grow.
      const distances = [0, 0.25, 0.5, 0.75, 1].map((portion) => Math.abs(at(portion)));
      distances.slice(1).forEach((distance, step) => {
        expect(
          distance,
          `roll ${index}: moved away from its slot between ${step * 25}% and ${(step + 1) * 25}%`
        ).toBeLessThanOrEqual(distances[step] + 0.5);
      });
    });

    // The accessible name never moves with the glyphs.
    for (const read of scrub.reads) {
      expect(read.names).toEqual(['60,000', '₹1,240.00']);
    }

    // Now let the same real effects play out from the start, un-held.
    await page.evaluate(async () => {
      const rolls = window.__entryProbe?.rolls ?? [];
      for (const roll of rolls) {
        roll.animation.currentTime = 0;
        roll.animation.play();
      }
      await Promise.all(rolls.map((roll) => roll.animation.finished));
    });

    await expectEntrySettled(page);
    await expectEntryNames(page);
  });
});

/*
 * A consumer's bare element selector must not repaint the number.
 *
 * The component renders its root, its columns, its glyphs and its
 * selection-copy node as `<span>`s. A host stylesheet carrying a bare `span`
 * rule therefore hits every one of them, and a bare type selector beats plain
 * inheritance -- so the number stopped looking like the text it replaced while
 * the surrounding label, being a text node in a div, was untouched.
 *
 * Not hypothetical, and not a small difference: Lighthouse's static/style/text.css
 * carries `span { color: var(--text-color-tertiary); font-size: var(--font-size-xxs);
 * font-weight: var(--font-weight-regular) }`. Adopting the odometer there took
 * every headline dashboard metric from 24px/600 to 12px/400 in the tertiary text
 * colour -- measured on /analytics, /, /identity and six other routes. Before the
 * adoption the value was a bare text node inside `.statcard-value` and inherited
 * correctly, so nothing in the library's own pages could have shown this.
 *
 * The rule injected here is that exact shape. Asserted against the PARENT's
 * resolved font rather than against fixed numbers, because the contract is
 * "renders as the text it replaces", not "renders at 24px".
 */
test('a host stylesheet with a bare span rule cannot restyle the number', async ({ page }) => {
  await gotoHydrated(page, ROUTE);

  await page.addStyleTag({
    content: `span { font-size: 9px; font-weight: 100; color: rgb(255, 0, 0); }`
  });
  // Deliberately NOT `!important`. The real rule is not, and a consumer who
  // does write `!important` on a type selector has overridden the component on
  // purpose and can keep both halves. What this pins is the ordinary case: a
  // plain type selector loses to a class, but only if the class actually
  // DECLARES the property -- inheritance alone loses to it, which is exactly
  // how this got through.
  await page.waitForTimeout(150);

  const compared = await page.getByTestId('counter').evaluate((node: HTMLElement) => {
    const parent = node.parentElement;
    if (!parent) {
      throw new Error('no parent to compare against');
    }
    const wrap = getComputedStyle(parent);
    const readable = (el: Element) => {
      const s = getComputedStyle(el);
      return { size: s.fontSize, weight: s.fontWeight, family: s.fontFamily, color: s.color };
    };
    const glyph = node.querySelector('.animated-number-digit-glyph');
    return {
      parent: {
        size: wrap.fontSize,
        weight: wrap.fontWeight,
        family: wrap.fontFamily,
        color: wrap.color
      },
      root: readable(node),
      glyph: glyph ? readable(glyph) : null
    };
  });

  expect(compared.root.size, 'root font-size should track the surrounding text').toBe(
    compared.parent.size
  );
  expect(compared.root.weight).toBe(compared.parent.weight);
  expect(compared.root.color).toBe(compared.parent.color);
  expect(compared.glyph?.size, 'the visible glyph is what the reader sees').toBe(
    compared.parent.size
  );
  expect(compared.glyph?.weight).toBe(compared.parent.weight);
  expect(compared.glyph?.color).toBe(compared.parent.color);
});
