import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

test('a bottom edge has a touch strip and leaves its content button tappable', async ({ page }) => {
  await gotoHydrated(page, '/components/resizable');
  const panel = page.locator('.resize-stage .resizable');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator('.box').evaluate((content: HTMLElement) => {
    const button = document.createElement('button');
    button.textContent = 'Apply';
    content.style.position = 'relative';
    button.style.cssText = 'position: absolute; bottom: 24px; left: 25%; height: 24px';
    button.onclick = () => {
      button.textContent = 'Applied';
    };
    content.append(button);
  });

  const bottomHandle = panel.locator('[data-edge="bottom"]');
  expect(
    await bottomHandle.evaluate((handle) => {
      const rect = handle.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 20) === handle;
    })
  ).toBe(true);
  const button = panel.getByRole('button', { name: 'Apply' });
  await button.tap();
  await expect(panel.getByRole('button', { name: 'Applied' })).toBeVisible();
});

test('default touch handles preserve direct slotted actions, small panels and dock content width', async ({
  page
}) => {
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.evaluate(async () => {
    await customElements.whenDefined('sui-resizable');
    document.body.innerHTML = `
      <sui-resizable width="200" height="100" handles='["right","bottom"]'>
        <button style="position:absolute;bottom:9px;left:40px;width:60px;height:12px">Save</button>
      </sui-resizable>
      <sui-resizable id="small" width="16" height="16" handles='["left","right","top","bottom"]'></sui-resizable>
      <sui-dock-panel state="docked" width="320" style="--dock-panel-position:relative"></sui-dock-panel>`;
    const save = document.querySelector('button');
    if (save === null) {
      throw new Error('Missing slotted button');
    }
    save.onclick = () => {
      save.textContent = 'Saved';
    };
  });
  await page.getByRole('button', { name: 'Save', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
  await expect(page.locator('#small .resizable')).toHaveCSS('width', '16px');
  await expect(page.locator('#small .resizable')).toHaveCSS('height', '16px');
  await expect(page.locator('sui-dock-panel .body')).toHaveCSS('width', '318px');
});
