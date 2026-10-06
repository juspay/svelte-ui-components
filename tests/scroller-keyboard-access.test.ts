import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ISSUE-021. A Scroller with no arrow buttons (showArrows=false, or arrows hidden on touch) and
// content that holds nothing focusable could not be scrolled from a keyboard: the scroll region
// carried tabindex="-1", so Tab stepped over it to the next control. These specs press real Tab
// and Arrow keys; `.focus()` alone proves nothing about Tab order, and the scroll offsets are read
// back from the element, not inferred from an event having fired.

const region = (page: Page, testId: string): Locator =>
  page.getByTestId(testId).locator('.scroll-container');

const offset = (locator: Locator, axis: 'x' | 'y'): Promise<number> =>
  locator.evaluate((el, a) => (a === 'x' ? el.scrollLeft : el.scrollTop), axis);

test.describe('Scroller — keyboard route when arrows are absent', () => {
  test('a horizontal region is reached by Tab, scrolled by the arrow keys, and left again', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-no-arrows-horizontal');
    // The fixture genuinely overflows; a 1600px child in a 500px region.
    const size = await scroller.evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth
    }));
    expect(size.scroll).toBeGreaterThan(size.client);

    await page.getByTestId('scroller-horizontal-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await expect(scroller).toHaveAttribute('role', 'region');
    await expect(scroller).toHaveAccessibleName('Scrollable content');

    expect(await offset(scroller, 'x')).toBe(0);
    for (let press = 0; press < 4; press += 1) {
      await page.keyboard.press('ArrowRight');
    }
    // Four presses of the 40px step, exactly: an immediate jump, so no engine's smooth-scroll
    // timing can shorten the total.
    await expect.poll(() => offset(scroller, 'x')).toBe(160);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => offset(scroller, 'x')).toBe(120);

    // Focus can leave in both directions.
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-horizontal-after')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(scroller).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('scroller-horizontal-before')).toBeFocused();
  });

  test('a vertical region is reached by Tab and scrolled by ArrowDown and ArrowUp', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-no-arrows-vertical');
    const size = await scroller.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight
    }));
    expect(size.scroll).toBeGreaterThan(size.client);

    await page.getByTestId('scroller-vertical-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    await expect(scroller).toHaveAccessibleName('Scrollable content');

    // WebKit does not scroll a focused vertical region with ArrowDown/ArrowUp on its own, so this
    // is the assertion that fails in that engine without the component's own key handling.
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('ArrowDown');
    }
    await expect.poll(() => offset(scroller, 'y')).toBe(120);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => offset(scroller, 'y')).toBe(80);

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-vertical-after')).toBeFocused();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`the region has a visible focus ring only while keyboard focus is on it (${colorScheme})`, async ({
      page
    }) => {
      await page.emulateMedia({ colorScheme });
      await gotoHydrated(page, '/components/scroller');

      const scroller = region(page, 'scroller-no-arrows-horizontal');
      const ring = () =>
        scroller.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            style: style.outlineStyle,
            width: Number.parseFloat(style.outlineWidth),
            color: style.outlineColor
          };
        });

      expect((await ring()).style).toBe('none');
      await page.getByTestId('scroller-horizontal-before').focus();
      await page.keyboard.press('Tab');
      await expect(scroller).toBeFocused();

      const focused = await ring();
      expect(focused.style).toBe('solid');
      expect(focused.width).toBeGreaterThanOrEqual(2);
      expect(focused.color).not.toBe('rgba(0, 0, 0, 0)');
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('scroller-horizontal-after')).toBeFocused();
      expect((await ring()).style).toBe('none');
    });
  }

  test('a region the consumer names keeps that name', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-no-arrows-labelled');
    await expect(scroller).toHaveAccessibleName('Release timeline');
    await page.getByTestId('scroller-labelled-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
  });

  test('content that fits adds no Tab stop and no region name', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-no-arrows-fits');
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await expect(scroller).not.toHaveAttribute('aria-label', /.*/);

    await page.getByTestId('scroller-fits-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-fits-after')).toBeFocused();
  });

  test('focusable content keeps its own Tab stops and the region adds none', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-no-arrows-nested');
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    await page.getByTestId('scroller-nested-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-nested-first')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-nested-last')).toBeFocused();
    // Focus reaching the far control scrolls it into view without our key handling. The
    // browser's smooth scroll can start after focus is reported, so wait for its real offset.
    await expect.poll(() => offset(scroller, 'x')).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-nested-after')).toBeFocused();
  });

  test('keys pressed inside nested content are not claimed by the region', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    // A bubble-phase listener on window runs after the component's own handler, so it sees whether
    // that handler called preventDefault. The browser may still scroll the region natively for a
    // key nothing handled -- that is the browser's default and is not ours to suppress -- so the
    // offset is not what is asserted here.
    const log = await page.evaluateHandle(() => {
      const entries: { key: string; prevented: boolean }[] = [];
      window.addEventListener('keydown', (e) => {
        entries.push({ key: e.key, prevented: e.defaultPrevented });
      });
      return entries;
    });

    await page.getByTestId('scroller-nested-first').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    expect(await log.jsonValue()).toEqual([
      { key: 'ArrowRight', prevented: false },
      { key: 'ArrowLeft', prevented: false }
    ]);
  });

  test('the same keys are claimed when the region itself holds focus', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const log = await page.evaluateHandle(() => {
      const entries: { key: string; prevented: boolean }[] = [];
      window.addEventListener('keydown', (e) => {
        entries.push({ key: e.key, prevented: e.defaultPrevented });
      });
      return entries;
    });

    await page.getByTestId('scroller-horizontal-before').focus();
    await page.keyboard.press('Tab');
    await expect(region(page, 'scroller-no-arrows-horizontal')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    const entries = await log.jsonValue();
    // The Tab press is logged too; only the two arrows matter.
    expect(entries.filter((e) => e.key.startsWith('Arrow'))).toEqual([
      { key: 'ArrowRight', prevented: true },
      // The other axis is left to the page.
      { key: 'ArrowDown', prevented: false }
    ]);
  });

  test('where arrows are shown they are the route, and the region adds no Tab stop', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-touch-arrows');
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    await page.getByTestId('scroller-touch-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-touch-arrows-next')).toBeFocused();

    const before = await offset(scroller, 'x');
    await page.keyboard.press('Enter');
    await expect.poll(() => offset(scroller, 'x')).toBeGreaterThan(before);
  });

  test('drag-to-scroll and the arrow buttons still scroll the default demo', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-horizontal-default');
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    await page.getByTestId('scroller-horizontal-default-next').click();
    await expect.poll(() => offset(scroller, 'x')).toBeGreaterThan(0);

    const box = await scroller.boundingBox();
    if (box === null) {
      throw new Error('default scroller region has no box');
    }
    const startOffset = await offset(scroller, 'x');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => offset(scroller, 'x')).toBeGreaterThan(startOffset);
  });
});

test.describe('Scroller — the route follows resize and content changes', () => {
  test('growing the content makes the region a Tab stop and shrinking it removes the stop', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-dynamic');
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await page.getByTestId('scroller-dynamic-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-dynamic-after')).toBeFocused();

    await page.getByTestId('scroller-dynamic-grow').click();
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.getByTestId('scroller-dynamic-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => offset(scroller, 'x')).toBe(40);

    await page.getByTestId('scroller-dynamic-shrink').click();
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await expect(scroller).not.toHaveAttribute('aria-label', /.*/);
    await page.getByTestId('scroller-dynamic-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-dynamic-after')).toBeFocused();
  });

  test('narrowing the container makes content that used to fit overflow', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-dynamic');
    await page.getByTestId('scroller-dynamic-medium').click();
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    // A pure resize: the content itself never changes.
    await page.getByTestId('scroller-dynamic-narrow').click();
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.getByTestId('scroller-dynamic-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();

    await page.getByTestId('scroller-dynamic-narrow').click();
    await expect(scroller).toHaveAttribute('tabindex', '-1');
  });

  test('a focusable child appearing hands the Tab stop to the child, and its removal returns it', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');

    const scroller = region(page, 'scroller-dynamic');
    await page.getByTestId('scroller-dynamic-grow').click();
    await expect(scroller).toHaveAttribute('tabindex', '0');

    await page.getByTestId('scroller-dynamic-focusable').click();
    await expect(scroller).toHaveAttribute('tabindex', '-1');
    await page.getByTestId('scroller-dynamic-before').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-dynamic-inner')).toBeFocused();

    await page.getByTestId('scroller-dynamic-focusable').click();
    await expect(scroller).toHaveAttribute('tabindex', '0');
  });
});

// Hiding the only control inside content that keeps its size is the original ISSUE-021 symptom
// reached by a different road: nothing resizes, so the route has to notice the change itself.
// The nested demo's controls sit in a fixed-width child; each strategy below hides both of them and
// is checked with real Tab presses, with the child's width read back to prove no box moved.
const NESTED_CONTROLS = ['scroller-nested-first', 'scroller-nested-last'] as const;
const HIDING_STYLE = `
  .pw-gone { display: none !important; }
  .pw-invisible { visibility: hidden !important; }
  .pw-compact [data-pw="scroller-nested-first"],
  .pw-compact [data-pw="scroller-nested-last"] { display: none !important; }
`;

type HidingStrategy = {
  readonly name: string;
  readonly hide: (page: Page) => Promise<void>;
  readonly show: (page: Page) => Promise<void>;
};

const eachControl = (page: Page, apply: (el: HTMLElement) => void): Promise<void[]> =>
  Promise.all(NESTED_CONTROLS.map((id) => page.getByTestId(id).evaluate(apply)));

const HIDING_STRATEGIES: readonly HidingStrategy[] = [
  {
    name: 'inline style display:none',
    hide: async (page) => {
      await eachControl(page, (el) => el.style.setProperty('display', 'none'));
    },
    show: async (page) => {
      await eachControl(page, (el) => el.style.removeProperty('display'));
    }
  },
  {
    name: 'a class that sets display:none',
    hide: async (page) => {
      await eachControl(page, (el) => el.classList.add('pw-gone'));
    },
    show: async (page) => {
      await eachControl(page, (el) => el.classList.remove('pw-gone'));
    }
  },
  {
    name: 'a class that sets visibility:hidden',
    hide: async (page) => {
      await eachControl(page, (el) => el.classList.add('pw-invisible'));
    },
    show: async (page) => {
      await eachControl(page, (el) => el.classList.remove('pw-invisible'));
    }
  },
  {
    name: 'the hidden attribute',
    hide: async (page) => {
      await eachControl(page, (el) => el.setAttribute('hidden', ''));
    },
    show: async (page) => {
      await eachControl(page, (el) => el.removeAttribute('hidden'));
    }
  },
  {
    // No write to the scroller's content at all: a stylesheet rule keyed on a class far above it.
    // Only the controls' own boxes change.
    name: 'a class on an ancestor outside the Scroller, through a stylesheet rule',
    hide: async (page) => {
      await page.evaluate(() => document.documentElement.classList.add('pw-compact'));
    },
    show: async (page) => {
      await page.evaluate(() => document.documentElement.classList.remove('pw-compact'));
    }
  }
];

test.describe('Scroller — the route follows controls hidden without any resize', () => {
  for (const strategy of HIDING_STRATEGIES) {
    test(`hiding and showing the only controls with ${strategy.name}`, async ({ page }) => {
      await gotoHydrated(page, '/components/scroller');
      await page.addStyleTag({ content: HIDING_STYLE });

      const scroller = region(page, 'scroller-no-arrows-nested');
      const content = scroller.locator('.wide-content');
      const widthBefore = await content.evaluate((el) => el.getBoundingClientRect().width);
      expect(widthBefore).toBeGreaterThan(1000);

      // Control: with the controls shown, Tab goes to them and the region is not a stop.
      await expect(scroller).toHaveAttribute('tabindex', '-1');
      await page.getByTestId('scroller-nested-before').focus();
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('scroller-nested-first')).toBeFocused();

      await strategy.hide(page);
      // Nothing around the controls moved, so a route that waits for a resize would stay stale.
      await expect(scroller).toHaveAttribute('tabindex', '0');
      expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBe(widthBefore);

      await page.getByTestId('scroller-nested-before').focus();
      await page.keyboard.press('Tab');
      await expect(scroller).toBeFocused();
      await expect(scroller).toHaveAccessibleName('Scrollable content');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => offset(scroller, 'x')).toBe(80);
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('scroller-nested-after')).toBeFocused();

      await strategy.show(page);
      await expect(scroller).toHaveAttribute('tabindex', '-1');
      await expect(scroller).not.toHaveAttribute('aria-label', /.*/);
      await page.getByTestId('scroller-nested-before').focus();
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('scroller-nested-first')).toBeFocused();
    });
  }

  test('a media query that hides the controls changes the route with the viewport', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/scroller');
    await page.addStyleTag({
      content: `@media (max-width: 900px) {
        [data-pw="scroller-nested-first"], [data-pw="scroller-nested-last"] { display: none !important; }
      }`
    });

    const scroller = region(page, 'scroller-no-arrows-nested');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(scroller).toHaveAttribute('tabindex', '-1');

    await page.setViewportSize({ width: 880, height: 800 });
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.getByTestId('scroller-nested-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(scroller).toHaveAttribute('tabindex', '-1');
  });
});

test.describe('Scroller — arrows hidden on a touch device', () => {
  test.use({ hasTouch: true });

  test('the region is the keyboard route once the arrows are gone', async ({ page }) => {
    await gotoHydrated(page, '/components/scroller');

    const touch = await page.evaluate(
      () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
    );
    expect(touch, 'the context must really be touch-capable').toBe(true);
    await expect(page.getByTestId('scroller-touch-arrows-next')).toHaveCount(0);

    const scroller = region(page, 'scroller-touch-arrows');
    await expect(scroller).toHaveAttribute('tabindex', '0');
    await page.getByTestId('scroller-touch-before').focus();
    await page.keyboard.press('Tab');
    await expect(scroller).toBeFocused();
    await expect(scroller).toHaveAccessibleName('Scrollable content');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => offset(scroller, 'x')).toBe(80);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('scroller-touch-after')).toBeFocused();
  });
});
