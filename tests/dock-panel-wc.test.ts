import { expect, test } from '@playwright/test';
import type { DockPanelControls } from '../src/lib/DockPanel/properties';

test('DockPanel custom element reflects reservations and preserves its root through state and late slot changes', async ({
  page
}) => {
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-dock-panel') === 'function');
  await page.evaluate(() => {
    const panel = document.createElement('sui-dock-panel');
    panel.id = 'dock';
    panel.setAttribute('state', 'docked');
    panel.setAttribute('width', '380');
    panel.innerHTML = '<p>Persistent body</p><button id="inside">Panel action</button>';
    const before = document.createElement('button');
    before.id = 'before';
    before.textContent = 'Before panel';
    const after = document.createElement('button');
    after.id = 'after';
    after.textContent = 'After panel';
    document.body.append(before, panel, after);
  });
  const host = page.locator('#dock');
  const panel = host.getByRole('complementary');
  await expect(panel).toBeVisible();
  const original = await panel.elementHandle();
  await expect(host).toHaveJSProperty('reservedWidth', 380);
  await expect(host.locator('.header')).toHaveCount(0);
  await host.evaluate((element) => {
    const parent = document.createElement('div');
    parent.innerHTML = '<span slot="header">Nested body content</span>';
    element.append(parent);
  });
  await expect(host.getByText('Nested body content')).toBeVisible();
  await expect(host.locator('.header')).toHaveCount(0);
  await host
    .getByText('Persistent body')
    .evaluate((element) => element.setAttribute('slot', 'body'));
  await expect(host.getByText('Persistent body')).toBeVisible();
  await expect(host.getByText('Nested body content')).toBeHidden();
  await host.getByText('Persistent body').evaluate((element) => element.removeAttribute('slot'));
  await expect(host.getByText('Nested body content')).toBeVisible();
  await host.evaluate((element) => {
    const header = document.createElement('div');
    header.slot = 'header';
    header.textContent = 'Late header';
    const footer = document.createElement('div');
    footer.slot = 'footer';
    footer.textContent = 'Late footer';
    element.append(header, footer);
  });
  await expect(host.getByText('Late header')).toBeVisible();
  await expect(host.getByText('Late footer')).toBeVisible();
  await host.getByText('Late footer').evaluate((element) => element.setAttribute('slot', 'header'));
  await expect(host.locator('.footer')).toHaveCount(0);
  await expect(host.getByText('Late footer')).toBeVisible();
  await host.getByText('Late footer').evaluate((element) => element.setAttribute('slot', 'footer'));
  await expect(host.locator('.footer')).toHaveCount(1);
  expect(await panel.evaluate((element, previous) => element === previous, original)).toBe(true);
  await host.evaluate((element) => Reflect.set(element, 'state', 'expanded'));
  await expect(host).toHaveJSProperty('reservedWidth', 0);
  expect(await panel.evaluate((element, previous) => element === previous, original)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(host).toHaveJSProperty('state', 'docked');
  await expect(host).toHaveJSProperty('reservedWidth', 380);
  await host.evaluate((element) => {
    element.querySelector(':scope > [slot="header"]')?.remove();
    element.querySelector(':scope > [slot="footer"]')?.remove();
  });
  await expect(host.locator('.header')).toHaveCount(0);
  await expect(host.locator('.footer')).toHaveCount(0);
  expect(await panel.evaluate((element, previous) => element === previous, original)).toBe(true);
  await host.evaluate((element) => Reflect.set(element, 'state', 'closed'));
  await expect(host.locator('.dock-panel')).toHaveAttribute('inert', '');
  expect(
    await host
      .locator('.dock-panel')
      .evaluate((element, previous) => element === previous, original)
  ).toBe(true);
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
});

test('DockPanel snippet props receive controls and resume after native slots are removed', async ({
  page
}) => {
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-dock-panel') === 'function');
  await page.evaluate(() => {
    const panel = document.createElement('sui-dock-panel');
    panel.id = 'fallback-dock';
    Object.assign(panel, {
      state: 'docked',
      header: (_anchor: Node, controls: () => DockPanelControls) => {
        Reflect.set(window, '__dockHeaderControls', controls());
        Reflect.set(window, '__dockHeaderCalled', true);
      },
      footer: () => Reflect.set(window, '__dockFooterCalled', true)
    });
    panel.innerHTML = '<p>Persistent fallback body</p>';
    document.body.append(panel);
  });
  const host = page.locator('#fallback-dock');
  await expect(host.getByRole('complementary')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__dockHeaderCalled')))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__dockFooterCalled')))
    .toBe(true);
  await page.evaluate(() => {
    const controls: DockPanelControls = Reflect.get(window, '__dockHeaderControls');
    controls.expand();
  });
  await expect(host).toHaveJSProperty('state', 'expanded');
  await expect(host).toHaveJSProperty('reservedWidth', 0);
  await host.evaluate((element) => {
    Reflect.set(element, 'body', () => Reflect.set(window, '__dockBodyCalled', true));
  });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__dockBodyCalled'))).toBe(true);
  await expect(host.getByText('Persistent fallback body')).toBeHidden();
  await host.evaluate((element) => Reflect.set(element, 'body', null));
  await expect(host.getByText('Persistent fallback body')).toBeVisible();
  await host.evaluate((element) => {
    Reflect.set(window, '__dockHeaderCalled', false);
    Reflect.set(window, '__dockFooterCalled', false);
    const header = document.createElement('div');
    header.slot = 'header';
    header.textContent = 'Override header';
    const footer = document.createElement('div');
    footer.slot = 'footer';
    footer.textContent = 'Override footer';
    element.append(header, footer);
  });
  await expect(host.getByText('Override header')).toBeVisible();
  await expect(host.getByText('Override footer')).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__dockHeaderCalled'))).toBe(false);
  expect(await page.evaluate(() => Reflect.get(window, '__dockFooterCalled'))).toBe(false);
  await host.evaluate((element) => {
    Reflect.set(window, '__dockHeaderCalled', false);
    Reflect.set(window, '__dockFooterCalled', false);
    element.querySelector(':scope > [slot="header"]')?.remove();
    element.querySelector(':scope > [slot="footer"]')?.remove();
  });
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__dockHeaderCalled')))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__dockFooterCalled')))
    .toBe(true);
  await page.evaluate(() => {
    const controls: DockPanelControls = Reflect.get(window, '__dockHeaderControls');
    controls.close();
  });
  await expect(host).toHaveJSProperty('state', 'closed');
});
