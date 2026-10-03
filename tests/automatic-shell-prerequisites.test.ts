import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('horizontal resizing keeps the height owned by the container', async ({ page }) => {
  await gotoHydrated(page, '/components/resizable');
  const dock = page.getByTestId('axis-dock');
  const handle = dock.getByRole('separator');
  await handle.focus();
  await handle.press('ArrowRight');
  await expect(dock).toHaveCSS('width', '364px');
  expect(await dock.evaluate((element) => element.style.height)).toBe('');
  await page.getByTestId('grow-resize-stage').click();
  await expect(dock).toHaveCSS('height', '260px');
  const bounds = await handle.boundingBox();
  if (bounds === null) {
    throw new Error('Resize handle is missing');
  }
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 80, bounds.y + 30);
  await page.mouse.up();
  expect(await dock.evaluate((element) => element.style.height)).toBe('');
  await page.getByTestId('grow-resize-stage').click();
  await expect(dock).toHaveCSS('height', '340px');
});

test('composer focus handle and trailing action operate on one textarea', async ({ page }) => {
  await gotoHydrated(page, '/components/chat-composer');
  await page.getByTestId('focus-composer').click();
  await expect(page.getByTestId('focus-composer-input')).toBeFocused();
  await expect(page.getByTestId('composer-focus-count')).toHaveText('1');
  await expect(page.getByRole('textbox', { name: 'Ask AI', exact: true })).toHaveCount(1);
  await expect(page.getByTestId('composer-trailing')).toBeVisible();
});

test('header expand and collapse action reflects each transition', async ({ page }) => {
  await gotoHydrated(page, '/components/chat-header');
  const header = page.getByTestId('expand-header');
  const expand = header.getByRole('button', { name: 'Expand', exact: true });
  const restingColor = await expand.evaluate((element) => getComputedStyle(element).color);
  await expand.hover();
  await expect(expand).toHaveCSS('color', restingColor);
  await expand.click();
  await expect(page.getByTestId('header-expanded-state')).toHaveText('expanded');
  await header.getByRole('button', { name: 'Collapse', exact: true }).click();
  await expect(page.getByTestId('header-expanded-state')).toHaveText('docked');
});
