import { expect, test } from '@playwright/test';

test.describe('Carousel', () => {
  test('spreads each slide view.properties onto its component, not nested under a properties prop', async ({
    page
  }) => {
    await page.goto('/components/carousel');

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
    await page.goto('/components/carousel');

    const carousel = page.getByTestId('carousel-manual-demo');
    const dot1 = page.getByTestId('carousel-manual-dot-1');
    const dot2 = page.getByTestId('carousel-manual-dot-2');
    await expect(dot1).toHaveClass(/active-dot/);

    await dot2.click();

    // Every slide stays mounted inside .slidesDiv (.carousel just clips via
    // overflow:hidden + a transform), so getByText(...).toBeVisible() alone
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

  test('pressing Enter on a focused dot navigates to that slide', async ({ page }) => {
    await page.goto('/components/carousel');

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
});
