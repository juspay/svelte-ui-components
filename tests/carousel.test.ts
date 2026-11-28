import { expect, test, type Locator } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

test.describe('Carousel', () => {
  test('spreads each slide view.properties onto its component, not nested under a properties prop', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/carousel');

    const carousel = page.getByTestId('carousel-manual-demo');
    // Regression test: view.component previously received a single `properties` prop
    // (no real component in this library accepts that shape), so Card's title/description
    // silently rendered empty. If the spread fix regresses, this slide renders blank.
    await expect(carousel.getByText('Summer Sale')).toBeVisible();
    await expect(carousel.getByText('Up to 40% off select styles.')).toBeVisible();
  });

  test('clicking a dot navigates to that slide, rendering its own spread properties', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/carousel');

    const carousel = page.getByTestId('carousel-manual-demo');
    const dot1 = page.getByTestId('carousel-manual-dot-1');
    const dot2 = page.getByTestId('carousel-manual-dot-2');
    await expect(dot1).toHaveClass(/active-dot/);

    await dot2.click();

    // Every slide stays mounted inside .slidesDiv (.carousel just clips via
    // overflow:hidden and an offset), so getByText(...).toBeVisible() alone
    // can't tell "navigated here" from "rendered off-screen the whole time" --
    // confirmed empirically: it reports true for slide 2's content even before
    // this click. The dot's active-dot class is what actually reflects
    // activeSlideIndex, so assert that first, then that the now-active slide's
    // own spread properties are the ones on screen.
    await expect(dot2).toHaveClass(/active-dot/);
    await expect(dot1).not.toHaveClass(/active-dot/);
    await expect(carousel.getByText('New Arrivals')).toBeVisible();
    await expect(carousel.getByText('This week’s drop just landed.')).toBeVisible();
    // Waits for the slide's actual 0.5s CSS transition to finish (confirmed
    // getAnimations() tracks it) so the video recording captures the settled
    // state, instead of a fixed sleep.
    await carousel
      .locator('.slidesDiv')
      .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  });

  test('the active dot is exposed as aria-current, and only that one', async ({ page }) => {
    await gotoHydrated(page, '/components/carousel');
    const dot1 = page.getByTestId('carousel-manual-dot-1');
    const dot2 = page.getByTestId('carousel-manual-dot-2');

    // Sighted users read the active-dot class; a screen-reader user querying the dots hears
    // only "Go to slide N" unless the current one is marked. aria-current is that mark.
    await expect(dot1).toHaveAttribute('aria-current', 'true');
    await expect(dot2).not.toHaveAttribute('aria-current', /.*/);

    await dot2.click();
    await expect(dot2).toHaveAttribute('aria-current', 'true');
    await expect(dot1).not.toHaveAttribute('aria-current', /.*/);
    // Exactly one dot in the whole strip is current, so a stale mark on any other dot fails.
    await expect(
      page.getByTestId('carousel-manual-dots').locator('[aria-current="true"]')
    ).toHaveCount(1);
  });

  test('pressing Enter on a focused dot navigates to that slide', async ({ page }) => {
    await gotoHydrated(page, '/components/carousel');

    const carousel = page.getByTestId('carousel-manual-demo');
    const dot1 = page.getByTestId('carousel-manual-dot-1');
    const dot3 = page.getByTestId('carousel-manual-dot-3');

    await dot3.focus();
    // A keyboard-focused dot needs a visible focus ring -- otherwise a sighted
    // keyboard user can Tab to a dot and never see which one is about to activate.
    await expect(dot3).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');

    await expect(dot3).toHaveClass(/active-dot/);
    await expect(dot1).not.toHaveClass(/active-dot/);
    await expect(carousel.getByText('Free Shipping')).toBeVisible();
    await carousel
      .locator('.slidesDiv')
      .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  });

  test('dot and active-dot transitions are scoped to background, not outline', async ({ page }) => {
    await gotoHydrated(page, '/components/carousel');

    // dot1 is active-dot (aria-current) on load; dot2 stays a plain .dot.
    // Checking both rules matters: `transition: all` on either one would let
    // a keyboard focus ring animate in instead of appearing instantly, and
    // the previous test's `outline-style: solid` assertion would not catch
    // that regression -- it only proves an outline exists, not which
    // properties transition. Reading the computed transition-property list
    // does.
    const activeDot = page.getByTestId('carousel-manual-dot-1');
    const inactiveDot = page.getByTestId('carousel-manual-dot-2');
    await expect(activeDot).toHaveClass(/active-dot/);
    await expect(inactiveDot).not.toHaveClass(/active-dot/);

    for (const dot of [activeDot, inactiveDot]) {
      const transitionProperties = await dot.evaluate((el) =>
        getComputedStyle(el)
          .transitionProperty.split(',')
          .map((property) => property.trim())
      );
      // `all` would also transition `outline`; assert the property list
      // itself rather than merely that a focus outline is present.
      expect(transitionProperties).not.toContain('all');
      expect(transitionProperties).not.toContain('outline');
      expect(transitionProperties).toEqual(['background']);
    }
  });
});

test.describe('Carousel backward compatibility and announcements', () => {
  test('a wrapper that declares `properties` still receives the bag', async ({ page }) => {
    await gotoHydrated(page, '/components/carousel');
    const legacy = page.getByTestId('carousel-legacy-demo');
    await expect(legacy).toBeVisible();
    // Spreading the bag was the fix, but the pre-existing wrapper shape has to
    // keep working or the fix is a breaking change to a published component.
    await expect(legacy.getByTestId('carousel-legacy-slide')).toHaveText(
      'legacy wrapper still receives its bag'
    );
  });

  test('the active slide position is announced to assistive technology', async ({ page }) => {
    await gotoHydrated(page, '/components/carousel');
    const carousel = page.getByTestId('carousel-manual-demo');
    const live = carousel.locator('[aria-live="polite"]');
    await expect(live).toHaveText('Slide 1 of 3');

    await page.getByTestId('carousel-manual-dot-2').click();
    // The dots say where they GO; without this region nothing says where the
    // carousel ARRIVED, including for autoplay and swipe.
    await expect(live).toHaveText('Slide 2 of 3');
  });
});

async function expectSlideAligned(carousel: Locator, slide: number, total: number): Promise<void> {
  await expect(carousel.locator('[aria-live="polite"]')).toHaveText(`Slide ${slide} of ${total}`);
  await expect(carousel.getByRole('button', { name: `Go to slide ${slide}` })).toHaveAttribute(
    'aria-current',
    'true'
  );
  await expect
    .poll(() =>
      carousel
        .locator('.current-slide')
        .nth(slide - 1)
        .evaluate((item) => {
          const viewport = item.closest('.carousel');
          if (viewport === null) {
            throw new Error('Missing carousel viewport');
          }
          const slideRect = item.getBoundingClientRect();
          const viewportRect = viewport.getBoundingClientRect();
          return Math.max(
            Math.abs(slideRect.left - viewportRect.left),
            Math.abs(slideRect.right - viewportRect.right)
          );
        })
    )
    .toBeLessThanOrEqual(1);
}

test('aligns the rendered slide at default, fractional and fluid widths', async ({ page }) => {
  await page.goto(`${fixtureBaseURL}/carousel-layout/`);
  const host = page.getByTestId('carousel-host');
  const carousel = page.getByTestId('layout-carousel');
  await expect(carousel).toHaveCSS('width', '360px');
  await expect(carousel.locator('.carousel')).toHaveCSS('width', '300px');
  await carousel.getByRole('button', { name: 'Go to slide 2' }).press('Enter');
  await expectSlideAligned(carousel, 2, 3);

  await host.evaluate((element) => element.style.setProperty('--carousel-width', '270.5px'));
  await expectSlideAligned(carousel, 2, 3);

  await host.evaluate((element) =>
    element.style.setProperty('--carousel-width', 'calc(100% - 16px)')
  );
  await expect(carousel.locator('.carousel')).toHaveCSS('width', '328px');
  await expectSlideAligned(carousel, 2, 3);

  await host.evaluate((element) => {
    element.style.width = '260px';
    element.setAttribute('dir', 'rtl');
  });
  await expect(carousel.locator('.carousel')).toHaveCSS('width', '228px');
  await carousel.getByRole('button', { name: 'Go to slide 3' }).click();
  await expectSlideAligned(carousel, 3, 3);

  await page.getByRole('button', { name: 'Shorten list' }).click();
  await expectSlideAligned(carousel, 1, 1);
  await page.getByRole('button', { name: 'Empty list' }).click();
  await expect(carousel.locator('.carousel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore list' }).click();
  const track = carousel.locator('.carousel');
  const box = await track.boundingBox();
  if (box === null) {
    throw new Error('Missing restored carousel viewport');
  }
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, y);
  await page.mouse.up();
  await expectSlideAligned(carousel, 2, 3);
});

test('the published custom element aligns the active slide after its host resizes', async ({
  page
}) => {
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.evaluate(async () => {
    await customElements.whenDefined('sui-carousel');
    const carousel = document.createElement('sui-carousel');
    // An empty Svelte component is sufficient here: the browser measures the actual
    // boxes produced by the packaged wrapper and the shared Carousel implementation.
    function slide() {
      return {};
    }
    Reflect.set(carousel, 'views', [{ component: slide }, { component: slide }]);
    carousel.toggleAttribute('show-dots', true);
    carousel.style.width = '360px';
    carousel.style.setProperty('--carousel-width', 'calc(100% - 10px)');
    document.body.append(carousel);
  });
  const carousel = page.locator('sui-carousel');
  await carousel.getByRole('button', { name: 'Go to slide 2' }).click();
  await expectSlideAligned(carousel, 2, 2);
  await carousel.evaluate((element) => {
    element.style.width = '240px';
  });
  await expect(carousel.locator('.carousel')).toHaveCSS('width', '220px');
  await expectSlideAligned(carousel, 2, 2);
});

test('Book and Carousel keep eight indicator targets usable in a 160px host', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${fixtureBaseURL}/carousel-layout/`);
  const book = page.getByTestId('compact-book');
  const carousel = page.getByTestId('compact-carousel');
  const indicatorRows = [
    book.locator('.page-indicator'),
    page.getByTestId('compact-carousel-indicators')
  ];
  for (const row of indicatorRows) {
    const indicators = row.getByRole('button');
    await expect(indicators).toHaveCount(8);
    const sizes = await indicators.evaluateAll((elements) =>
      elements.map((element) => {
        const { width, height, top } = element.getBoundingClientRect();
        return { width, height, top };
      })
    );
    expect(sizes.every(({ width, height }) => width >= 24 && height >= 24)).toBe(true);
    expect(new Set(sizes.map(({ top }) => top)).size).toBe(2);
    expect(await row.evaluate((element) => element.scrollWidth)).toBe(160);
  }
  await book.getByRole('button', { name: 'Go to page 8' }).click();
  await expect(book.getByRole('button', { name: 'Go to page 8' })).toHaveClass(/dot-active/);
  await carousel.getByRole('button', { name: 'Go to slide 8' }).click();
  await expect(carousel.locator('[aria-live]')).toHaveText('Slide 8 of 8');
});

test('keyboard focus on a link inside SVG stops Carousel rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:01:00Z'));
  await page.goto(`${fixtureBaseURL}/carousel-layout/`);
  const carousel = page.getByTestId('compact-carousel');
  await carousel.getByRole('button', { name: 'Start rotation' }).press('Space');
  await expect(carousel.getByRole('button', { name: 'Pause rotation' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(carousel.getByRole('link', { name: 'Slide details' })).toBeFocused();
  await expect(carousel.getByRole('button', { name: 'Start rotation' })).toBeVisible();
  await page.clock.runFor(2_001);
  await expect(carousel.locator('[aria-live]')).toHaveText('Slide 1 of 8');
});

test('the narrow demo shows the full selected slide without a horizontal pan', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoHydrated(page, '/components/carousel');
  const carousel = page.getByTestId('carousel-manual-demo');
  await carousel.getByRole('button', { name: 'Go to slide 2' }).click();
  await expectSlideAligned(carousel, 2, 3);
  const viewport = carousel.locator('.carousel');
  const geometry = await viewport.evaluate((element) => {
    const row = element.closest('.demo-row');
    if (row === null) {
      throw new Error('Missing Carousel demo row');
    }
    const frame = element.getBoundingClientRect();
    const host = row.getBoundingClientRect();
    return {
      left: frame.left - host.left,
      right: host.right - frame.right,
      scroll: row.scrollLeft
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeGreaterThanOrEqual(-1);
  expect(geometry.scroll).toBe(0);
});
