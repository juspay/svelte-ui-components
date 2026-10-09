import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

async function loadWebComponents(page: Page): Promise<void> {
  await gotoHydrated(page, '/');
  await page.addScriptTag({
    path: process.env.GENERIC_ROLE_WC_BUNDLE ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction(() => Boolean(customElements.get('sui-draggable')));
}

test('Draggable is a named movable group and keeps child controls independently operable in Svelte and WC', async ({
  page,
  browserName
}) => {
  await gotoHydrated(page, '/components/draggable');
  const demo = page.getByRole('group', { name: 'Drag to move', exact: true });
  await demo.evaluate((element) => {
    const before = document.createElement('input');
    before.id = 'draggable-before';
    element.before(before);
  });
  await page.locator('#draggable-before').click();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(demo).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(demo).toContainText('16, 0');

  await loadWebComponents(page);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main === null) {
      throw new Error('Main unavailable');
    }
    main.replaceChildren();
    const before = document.createElement('input');
    before.id = 'wc-move-before';
    const host = document.createElement('sui-draggable');
    host.id = 'wc-move';
    host.style.cssText = 'display:block; width:220px; padding:12px';
    Object.assign(host, { dragLabel: 'Move preview' });
    const child = document.createElement('button');
    child.textContent = 'Edit preview';
    child.onclick = () => {
      host.dataset.edits = String(Number(host.dataset.edits ?? 0) + 1);
    };
    host.append(child);
    const after = document.createElement('input');
    after.id = 'wc-move-after';
    main.append(before, host, after);
  });
  const host = page.locator('#wc-move');
  const group = host.getByRole('group', { name: 'Move preview', exact: true });
  await page.locator('#wc-move-before').click();
  await page.keyboard.press('Tab');
  await expect(group).toBeFocused();
  const initial = await group.evaluate((element) => getComputedStyle(element).transform);
  await page.keyboard.press('ArrowRight');
  const moved = await group.evaluate((element) => getComputedStyle(element).transform);
  expect(moved).not.toBe(initial);
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  const child = host.getByRole('button', { name: 'Edit preview', exact: true });
  await expect(child).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => group.evaluate((element) => getComputedStyle(element).transform))
    .toBe(moved);
  await page.keyboard.press('Enter');
  await expect(host).toHaveAttribute('data-edits', '1');
  await page.keyboard.press('Tab');
  await expect(page.locator('#wc-move-after')).toBeFocused();
});

test('WC informational Stepper preserves list text while interactive steps retain their names and actions', async ({
  page
}) => {
  await loadWebComponents(page);
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main === null) {
      throw new Error('Main unavailable');
    }
    main.replaceChildren();
    const before = document.createElement('input');
    before.id = 'step-before';
    const info = document.createElement('sui-stepper');
    info.id = 'step-info';
    Object.assign(info, {
      steps: [{ label: 'Prepare' }, { label: 'Review' }],
      currentStepIndex: 0,
      suppressRoleAndTabindex: true
    });
    const after = document.createElement('input');
    after.id = 'step-after';
    const active = document.createElement('sui-stepper');
    active.id = 'step-active';
    Object.assign(active, {
      steps: [{ label: 'Prepare' }, { label: 'Review' }],
      currentStepIndex: 0,
      onhandlestepclick: ({ selectedIndex }: { selectedIndex: number }) => {
        active.dataset.selected = String(selectedIndex);
      }
    });
    main.append(before, info, after, active);
  });
  const info = page.locator('#step-info');
  await expect(info.getByRole('list')).toBeVisible();
  await expect(info.getByRole('listitem')).toHaveCount(2);
  await expect(info.getByRole('button')).toHaveCount(0);
  await expect(info.getByRole('listitem').first()).toContainText('Prepare');
  await expect(info.getByRole('listitem').last()).toContainText('Review');
  for (const step of await info.locator('.step').all()) {
    await expect(step).not.toHaveAttribute('aria-label');
    await expect(step).not.toHaveAttribute('aria-labelledby');
  }
  await page.locator('#step-before').click();
  await page.keyboard.press('Tab');
  await expect(page.locator('#step-after')).toBeFocused();
  await page.keyboard.press('Tab');
  const prepare = page
    .locator('#step-active')
    .getByRole('button', { name: 'Prepare', exact: true });
  await expect(prepare).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#step-active')).toHaveAttribute('data-selected', '1');
});
