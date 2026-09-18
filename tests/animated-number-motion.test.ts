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
 * Asserted by sampling the rendered position rather than by counting
 * animations: an animation object can exist and still not move anything, which
 * is the failure this whole suite was built to catch.
 */
test('animateOnMount rolls the columns up from zero as the number appears', async ({ page }) => {
  await page.goto(ROUTE);

  // Deliberately NOT gotoHydrated: the entry roll starts at hydration, and
  // waiting for the hydration marker can land after a short roll has finished.
  const column = page.getByTestId('entry').locator('.animated-number-digit').first();
  await column.waitFor({ state: 'attached', timeout: 15_000 });

  const positions = await column.evaluate(async (node: HTMLElement) => {
    const seen: number[] = [];
    const glyph = node.querySelector('.animated-number-glyph') ?? node.firstElementChild;
    for (let frame = 0; frame < 45; frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (glyph instanceof HTMLElement) {
        seen.push(Math.round(glyph.getBoundingClientRect().top));
      }
    }
    return seen;
  });

  const distinct = new Set(positions);
  expect(
    distinct.size,
    `the entry column should travel, but it sat at ${[...distinct].join(', ')}`
  ).toBeGreaterThan(1);
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
