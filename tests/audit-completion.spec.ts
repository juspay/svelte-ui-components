import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('ColorPicker stops updating after a cancelled touch drag', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium CDP provides touch cancellation');
  await page.setViewportSize({ width: 390, height: 800 });
  await gotoHydrated(page, '/components/color-picker');
  await page.locator('.color-picker-container button[aria-expanded]').first().click();
  const panel = page.getByRole('slider', { name: 'Saturation and brightness' }).first();
  await panel.scrollIntoViewIfNeeded();
  const box = await panel.boundingBox();
  if (box === null) {
    throw new Error('Expected a visible saturation panel');
  }
  const session = await page.context().newCDPSession(page);
  const at = (fraction: number) => ({
    x: box.x + box.width * fraction,
    y: box.y + box.height / 2
  });
  const touch = (
    type: 'touchStart' | 'touchMove' | 'touchCancel' | 'touchEnd',
    fraction?: number
  ) =>
    session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: typeof fraction === 'number' ? [at(fraction)] : []
    });

  await touch('touchStart', 0.3);
  await touch('touchMove', 0.55);
  await expect(panel).toHaveAttribute('aria-valuenow', '55');
  await touch('touchCancel');
  const point = at(0.75);
  await page.mouse.move(point.x, point.y);
  await expect(panel).toHaveAttribute('aria-valuenow', '55');

  await touch('touchStart', 0.35);
  await touch('touchEnd');
  await expect(panel).toHaveAttribute('aria-valuenow', '35');
});

test('overflowing Markdown code is tabbable and scrollable only while needed', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoHydrated(page, '/components/markdown-text');
  const code = page.getByTestId('markdown-text-reply').locator('pre').first();
  await expect(code).toHaveAttribute('tabindex', '0');
  await expect(code).toHaveAttribute('role', 'region');
  await expect(code).toHaveAccessibleName(/code/i);
  await code.focus();
  await expect(code).toBeFocused();
  // WebKit's native scroller needs the key held through an animation frame.
  await page.keyboard.press('ArrowRight', { delay: 50 });
  await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(code).not.toHaveAttribute('tabindex', '0');
});

test('autoplay can be paused, resumed, and stopped by keyboard focus', async ({ page }) => {
  const initialTime = new Date('2026-01-01T12:00:00Z');
  await page.clock.install({ time: initialTime });
  // Keep navigation and click latency from advancing the first slide.
  await page.clock.pauseAt(new Date('2026-01-01T12:01:00Z'));
  await gotoHydrated(page, '/components/carousel');
  const carousel = page.getByTestId('carousel-autoplay-demo');
  const live = carousel.locator('[aria-live]');
  await expect(live).toHaveAttribute('aria-live', 'off');
  await carousel.getByRole('button', { name: 'Pause rotation' }).click();
  await page.clock.runFor(5_001);
  await expect(live).toHaveText('Slide 1 of 3');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await carousel.getByRole('button', { name: 'Start rotation' }).click();
  await page.getByRole('heading', { name: 'Carousel', exact: true }).hover();
  await page.clock.runFor(2_501);
  await expect(live).toHaveText('Slide 2 of 3');
  await page.keyboard.press('Tab');
  await expect(carousel.getByRole('button', { name: 'Start rotation' })).toBeVisible();
  await page.clock.runFor(5_001);
  await expect(live).toHaveText('Slide 2 of 3');
});

test('reduced motion starts the Carousel paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await gotoHydrated(page, '/components/carousel');
  const carousel = page.getByTestId('carousel-autoplay-demo');
  await expect(carousel.getByRole('button', { name: 'Start rotation' })).toBeVisible();
  await page.clock.runFor(5_001);
  await expect(carousel.locator('[aria-live=polite]')).toHaveText('Slide 1 of 3');
});

const targets = [
  ['book', 'button[aria-label^="Go to page"]'],
  ['carousel', '[aria-label^="Go to slide"]'],
  ['attachment-chip-row', 'button[aria-label^="Remove "]'],
  ['chat-composer', 'button[aria-label^="Remove "]'],
  ['chip-input', '.pill-dismiss button'],
  ['pill', '.pill-dismiss button'],
  ['select', '.select-clear, .pill-dismiss button']
] as const;

for (const [route, selector] of targets) {
  test(`${route} has 24px pointing targets for the audited controls`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    await gotoHydrated(page, `/components/${route}`);
    const controls = page.locator(selector).filter({ visible: true });
    expect(await controls.count()).toBeGreaterThan(0);
    expect(
      await controls.evaluateAll((elements) =>
        elements.every((element) => {
          const { width, height } = element.getBoundingClientRect();
          return width >= 24 && height >= 24;
        })
      )
    ).toBe(true);
  });
}

test('Dialog integration is named and reflows with larger text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await gotoHydrated(page, '/components/dialog');
  await expect(page.getByTestId('native-selector-contract')).toHaveAccessibleName(
    'Example platform'
  );
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe('dark');
  for (const testId of ['native-placeholder-contract', 'styled-placeholder-contract']) {
    const color = await page
      .getByTestId(testId)
      .evaluate((element) => getComputedStyle(element, '::placeholder').color);
    expect(color).toBe('rgb(190, 203, 218)');
  }
  await page.locator('main').evaluate((main) => {
    const nodes = [...main.querySelectorAll<HTMLElement>('*')];
    const sizes = nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize) * 2);
    nodes.forEach((node, i) => node.style.setProperty('font-size', `${sizes.at(i)}px`));
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('new catalogue pages expose real component demos', async ({ page }) => {
  await gotoHydrated(page, '/components/armed-button');
  await page.getByRole('button', { name: 'Remove draft' }).click();
  await page.getByRole('button', { name: 'confirm: Remove draft', exact: true }).click();
  await expect(page.getByText('Confirmed removals: 1')).toBeVisible();

  await gotoHydrated(page, '/components/diff-viewer');
  await page.getByRole('button', { name: /docs\/release.md/ }).click();
  await expect(page.getByText(/\[x\] Verify the browser build/)).toBeVisible();

  await gotoHydrated(page, '/components/windowed-list');
  await expect(page.getByText('Draft created', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /earlier/i }).click();
  await expect(page.getByText('Review requested', { exact: true })).toBeVisible();
});
