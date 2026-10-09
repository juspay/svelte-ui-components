import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { fixtureBaseURL } from './support/fixture-server';
const baseURL = process.env.SUI_OVERLAY_FIXTURE_URL ?? fixtureBaseURL;

for (const shadow of [false, true]) {
  test(`owned nested overlays preserve host, restore focus and scrolling (${shadow ? 'shadow' : 'DOM'} root)`, async ({
    page
  }) => {
    await page.goto(`${baseURL}/overlay-scroll-ownership/?shadow=${shadow ? '1' : '0'}`);
    const root = page.getByTestId('scroll-root');
    const opener = page.getByTestId('open-modal');
    await root.scrollIntoViewIfNeeded();
    const hostStyle = await page.evaluate(() => document.body.style.cssText);
    await root.hover({ position: { x: 200, y: 150 } });
    await page.mouse.wheel(0, 150);
    await expect.poll(() => root.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await root.evaluate((el) => {
      el.scrollTop = 0;
    });
    await opener.click();
    const modal = page.getByRole('dialog', { name: 'Owned modal' });
    await expect(modal).toBeVisible();
    await expect(page.locator('.modal-content')).toHaveCSS(
      'background-color',
      'rgb(240, 235, 230)'
    );
    await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('hidden');
    expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
    const savedScroll = await root.evaluate((el) => el.scrollTop);
    await modal.hover();
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(150);
    expect(await root.evaluate((el) => el.scrollTop)).toBe(savedScroll);
    await page.getByTestId('nested-sheet').click();
    await expect(page.getByTestId('owned-sheet')).toBeVisible();
    await page.getByTestId('nested-menu').click();
    await expect(page.getByRole('dialog', { name: 'Owned menu' }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.command-menu-overlay')).toHaveCount(0);
    expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
    await expect(page.getByTestId('nested-menu')).toBeFocused();
    await page.getByTestId('close-sheet').click();
    await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
    expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
    await expect(page.getByTestId('nested-sheet')).toBeFocused();
    await page.getByTestId('close-modal').click();
    await expect(modal).toHaveCount(0);
    await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
    expect(await root.evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important');
    expect(await root.evaluate((el) => el.scrollTop)).toBe(savedScroll);
    expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
    await expect(opener).toBeFocused();
    await root.hover({ position: { x: 200, y: 150 } });
    await page.mouse.wheel(0, 150);
    await expect.poll(() => root.evaluate((el) => el.scrollTop)).toBeGreaterThan(savedScroll);
    await page.screenshot({
      path: `test-results/overlay-${shadow ? 'shadow' : 'dom'}-restored.png`
    });
  });
}

test('forced parent unmount releases nested scoped holders without changing host styles', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const root = page.getByTestId('scroll-root');
  const hostStyle = await page.evaluate(() => document.body.style.cssText);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  await page.getByTestId('force-unmount').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
});

test('standalone default locks body until last holder releases and restores priority', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/?standalone=1`);
  const hostStyle = await page.evaluate(() => document.body.style.cssText);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByTestId('close-sheet').click();
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByTestId('close-modal').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
});

test('explicit null ownership never locks the host body', async ({ page }) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/?null=1`);
  const hostStyle = await page.evaluate(() => document.body.style.cssText);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  await page.getByTestId('nested-menu').click();
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
  await page.keyboard.press('Escape');
  await expect(page.locator('.command-menu-overlay')).toHaveCount(0);
  await page.getByTestId('force-unmount').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
});

test('built custom-element adapters forward owned container properties across nested surfaces', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const hostStyle = await page.evaluate(() => document.body.style.cssText);
  await page.addScriptTag({
    path: resolve(import.meta.dirname, '../dist-wc/index.js'),
    type: 'module'
  });
  await page.waitForFunction(() => typeof customElements.get('sui-modal') === 'function');
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-pw="scroll-root"]');
    if (root === null) {
      throw new Error('Missing owned root');
    }
    for (const tag of ['sui-modal', 'sui-sheet', 'sui-command-menu']) {
      const element = document.createElement(tag);
      Object.assign(element, {
        scrollContainer: () => root,
        open: true,
        items: [],
        enableTransition: false
      });
      root.appendChild(element);
    }
  });
  const root = page.getByTestId('scroll-root');
  await expect(page.locator('sui-modal .modal')).toBeVisible();
  await expect(page.locator('sui-sheet .sheet-panel')).toBeVisible();
  await expect(page.locator('sui-command-menu .command-menu-overlay')).toBeVisible();
  expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
  await page.locator('sui-sheet').evaluate((el) => el.remove());
  await page.locator('sui-modal').evaluate((el) => el.remove());
  expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
  await page.locator('sui-command-menu').evaluate((el) => el.remove());
  await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
  expect(await root.evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important');
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
});

test('custom-element invalid and null scroll ownership cannot acquire a host body lock', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const hostStyle = await page.evaluate(() => document.body.style.cssText);
  await page.addScriptTag({
    path: resolve(import.meta.dirname, '../dist-wc/index.js'),
    type: 'module'
  });
  await page.waitForFunction(() => typeof customElements.get('sui-modal') === 'function');
  await page.evaluate(() => {
    for (const [tag, scrollContainer] of [
      ['sui-modal', '#host-body'],
      ['sui-sheet', null],
      ['sui-command-menu', {}]
    ]) {
      const element = document.createElement(String(tag));
      Object.assign(element, { scrollContainer, open: true, items: [] });
      document.body.appendChild(element);
    }
  });
  await expect(page.locator('sui-modal .modal')).toBeVisible();
  await expect(page.locator('sui-sheet .sheet-panel')).toBeVisible();
  await expect(page.locator('sui-command-menu .command-menu-overlay')).toBeVisible();
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('sui-modal, sui-sheet, sui-command-menu')) {
      element.remove();
    }
  });
  await expect(page.locator('sui-modal, sui-sheet, sui-command-menu')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
});
