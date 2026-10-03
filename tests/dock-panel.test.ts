import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('pill hands off draft and focus with one textbox, retaining the panel and conversation', async ({
  page
}) => {
  await gotoHydrated(page, '/components/dock-panel');
  const panel = page.getByTestId('assistant-dock');
  const node = await panel.elementHandle();
  const conversation = await page.getByTestId('persistent-conversation').elementHandle();
  await expect(page.getByRole('textbox', { name: 'Ask AI', exact: true })).toHaveCount(1);
  await expect(page.getByTestId('assistant-pill').locator('.chat-composer')).toHaveCSS(
    'border-radius',
    '999px'
  );
  await page.getByTestId('pill-composer').fill('Keep this draft');
  await page.getByTestId('pill-open').click();
  await expect(page.getByTestId('panel-composer')).toHaveValue('Keep this draft');
  await expect(page.getByTestId('panel-composer')).toBeFocused();
  await expect(page.getByTestId('dock-reserved')).toHaveText('380');
  await expect(page.getByRole('textbox', { name: 'Ask AI', exact: true })).toHaveCount(1);
  await page.getByTestId('expand-dock').click();
  await expect(panel).toHaveAttribute('data-state', 'expanded');
  await expect(page.getByTestId('dock-reserved')).toHaveText('0');
  expect(
    await page.getByTestId('underlying-page').evaluate((element) => ({
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility
    }))
  ).toEqual({ display: 'block', visibility: 'visible' });
  expect(await panel.evaluate((element, original) => element === original, node)).toBe(true);
  expect(
    await page
      .getByTestId('persistent-conversation')
      .evaluate((element, original) => element === original, conversation)
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-state', 'docked');
  await page.getByTestId('close-dock').click();
  await expect(panel).toHaveAttribute('inert', '');
  await expect(page.getByTestId('dock-reserved')).toHaveText('0');
  await expect(page.getByRole('textbox', { name: 'Ask AI', exact: true })).toHaveCount(1);
});

test('docked panel lets focus and clicks reach the page and keeps CSS-owned height after resize', async ({
  page
}) => {
  await gotoHydrated(page, '/components/dock-panel');
  await page.getByTestId('open-dock').click();
  const panel = page.getByTestId('assistant-dock');
  const handle = panel.getByRole('separator');
  await handle.focus();
  await handle.press('ArrowRight');
  await expect(panel).toHaveCSS('width', '364px');
  await expect(page.getByTestId('dock-reserved')).toHaveText('364');
  expect(await panel.locator('.dock-panel-frame').evaluate((element) => element.style.height)).toBe(
    ''
  );
  await page.getByTestId('grow-dock-stage').click();
  await expect(panel).toHaveCSS('height', '620px');
  const outside = page.getByTestId('underlying-action');
  await outside.focus();
  await expect(outside).toBeFocused();
  await outside.click();
  await expect(page.getByTestId('page-clicks')).toHaveText('1');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-state', 'docked');
  expect(await panel.getAttribute('aria-modal')).toBeNull();
});

test('insets and reduced motion remain caller-owned', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHydrated(page, '/components/dock-panel');
  await page.getByTestId('expand-dock').click();
  const panel = page.getByTestId('assistant-dock');
  await panel.evaluate((element) => {
    element.style.setProperty('--dock-panel-top', '10px');
    element.style.setProperty('--dock-panel-right', '12px');
    element.style.setProperty('--dock-panel-bottom', '14px');
    element.style.setProperty('--dock-panel-left', '16px');
  });
  await expect(panel).toHaveCSS('top', '10px');
  await expect(panel).toHaveCSS('right', '12px');
  await expect(panel).toHaveCSS('bottom', '14px');
  await expect(panel).toHaveCSS('left', '16px');
  await expect(panel).toHaveCSS('transition-duration', '0s');
});
