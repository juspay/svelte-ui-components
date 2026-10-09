import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { fixtureBaseURL } from './support/fixture-server';
import { inlineDeclarations } from './support/overlay-assertions';
import { activateOverlayBy, ownedStyle, type OverlayActivation } from './support/overlay-ownership';
const baseURL = process.env.SUI_OVERLAY_FIXTURE_URL ?? fixtureBaseURL;

const activations: readonly OverlayActivation[] = ['pointer', 'keyboard', 'tab'];

for (const activation of activations) {
  for (const shadow of [false, true]) {
    test(`owned nested overlays preserve host, restore focus and scrolling (${shadow ? 'shadow' : 'DOM'} root, ${activation})`, async ({
      page
    }) => {
      await page.goto(`${baseURL}/overlay-scroll-ownership/?shadow=${shadow ? '1' : '0'}`);
      const root = page.getByTestId('scroll-root');
      const opener = page.getByTestId('open-modal');
      await root.scrollIntoViewIfNeeded();
      const hostStyle = await inlineDeclarations(page);
      await root.hover({ position: { x: 200, y: 150 } });
      await page.mouse.wheel(0, 150);
      await expect.poll(() => root.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      await root.evaluate((el) => {
        el.scrollTop = 0;
      });
      const assertModalFocus = await activateOverlayBy(page, opener, activation);
      const modal = page.getByRole('dialog', { name: 'Owned modal' });
      await expect(modal).toBeVisible();
      await expect(page.locator('.modal-content')).toHaveCSS(
        'background-color',
        'rgb(240, 235, 230)'
      );
      await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('hidden');
      expect(await inlineDeclarations(page)).toEqual(hostStyle);
      const savedScroll = await root.evaluate((el) => el.scrollTop);
      await modal.hover();
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(150);
      expect(await root.evaluate((el) => el.scrollTop)).toBe(savedScroll);
      const assertSheetFocus = await activateOverlayBy(
        page,
        page.getByTestId('nested-sheet'),
        activation
      );
      await expect(page.getByTestId('owned-sheet')).toBeVisible();
      const assertMenuFocus = await activateOverlayBy(
        page,
        page.getByTestId('nested-menu'),
        activation
      );
      await expect(page.getByRole('dialog', { name: 'Owned menu' }).first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.command-menu-overlay')).toHaveCount(0);
      expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
      await assertMenuFocus();
      await page.getByTestId('close-sheet').click();
      await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
      expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
      await assertSheetFocus();
      await page.getByTestId('close-modal').click();
      await expect(modal).toHaveCount(0);
      await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
      expect(await root.evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe(
        'important'
      );
      expect(await root.evaluate((el) => el.scrollTop)).toBe(savedScroll);
      expect(await inlineDeclarations(page)).toEqual(hostStyle);
      await assertModalFocus();
      await root.hover({ position: { x: 200, y: 150 } });
      await page.mouse.wheel(0, 150);
      await expect.poll(() => root.evaluate((el) => el.scrollTop)).toBeGreaterThan(savedScroll);
      await page.screenshot({
        path: `test-results/overlay-${shadow ? 'shadow' : 'dom'}-restored.png`
      });
    });
  }
}

test('forced parent unmount releases nested scoped holders without changing host styles', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const root = page.getByTestId('scroll-root');
  const hostStyle = await inlineDeclarations(page);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  await page.getByTestId('force-unmount').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
});

test('standalone default locks body until last holder releases and restores priority', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/?standalone=1`);
  const hostStyle = await inlineDeclarations(page);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByTestId('close-sheet').click();
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByTestId('close-modal').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect.poll(() => inlineDeclarations(page)).toEqual(hostStyle);
});

test('standalone body lock keeps host declarations written while it is held', async ({ page }) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/?standalone=1`);
  const body = page.locator('body');
  const before = await ownedStyle(body);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await body.evaluate((node) => {
    node.style.setProperty('padding-right', '13px');
    node.style.setProperty('--host-live', 'updated');
  });
  await page.getByTestId('close-sheet').click();
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByTestId('close-modal').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect
    .poll(() => ownedStyle(body))
    .toEqual({
      ...before,
      inline: { ...before.inline, 'padding-right': ['13px', ''], '--host-live': ['updated', ''] },
      computed: { ...before.computed, paddingRight: '13px' }
    });
});

test('explicit null ownership never locks the host body', async ({ page }) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/?null=1`);
  const hostStyle = await inlineDeclarations(page);
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  await page.getByTestId('nested-menu').click();
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
  await page.keyboard.press('Escape');
  await expect(page.locator('.command-menu-overlay')).toHaveCount(0);
  await page.getByTestId('force-unmount').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
});

test('built custom-element adapters forward owned container properties across nested surfaces', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const hostStyle = await inlineDeclarations(page);
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
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
  await page.locator('sui-sheet').evaluate((el) => el.remove());
  await page.locator('sui-modal').evaluate((el) => el.remove());
  expect(await root.evaluate((el) => el.style.overflow)).toBe('hidden');
  await page.locator('sui-command-menu').evaluate((el) => el.remove());
  await expect.poll(() => root.evaluate((el) => el.style.overflow)).toBe('auto');
  expect(await root.evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important');
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
});

test('custom-element invalid and null scroll ownership cannot acquire a host body lock', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  const hostStyle = await inlineDeclarations(page);
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
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('sui-modal, sui-sheet, sui-command-menu')) {
      element.remove();
    }
  });
  await expect(page.locator('sui-modal, sui-sheet, sui-command-menu')).toHaveCount(0);
  expect(await inlineDeclarations(page)).toEqual(hostStyle);
});

for (const foreign of [false, true]) {
  for (const releaseFirst of ['public API', 'custom element']) {
    test(`independent public API and ${foreign ? 'foreign ' : ''}WC share actual owner holds (${releaseFirst} first)`, async ({
      page
    }) => {
      await page.goto(`${baseURL}/overlay-scroll-ownership/`);
      const root = page.getByTestId('scroll-root');
      const hostStyle = await page.evaluate(() => document.body.style.cssText);
      await root.evaluate((owner) => {
        owner.style.setProperty('overflow-x', 'clip', 'important');
        owner.style.setProperty('overflow-y', 'auto');
        owner.style.setProperty('color', 'red');
      });
      const initialOverflow = await root.evaluate((owner) => ({
        x: owner.style.getPropertyValue('overflow-x'),
        xp: owner.style.getPropertyPriority('overflow-x'),
        y: owner.style.getPropertyValue('overflow-y'),
        yp: owner.style.getPropertyPriority('overflow-y')
      }));
      const initialComputed = await root.evaluate((owner) => ({
        x: getComputedStyle(owner).overflowX,
        y: getComputedStyle(owner).overflowY
      }));
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'acquire' }))
      );
      if (foreign) {
        await page.evaluate(() => {
          const frame = document.createElement('iframe');
          frame.name = 'independent-wc-realm';
          document.body.append(frame);
        });
      }
      const realm = foreign ? page.frame({ name: 'independent-wc-realm' }) : page;
      if (realm === null) {
        throw new Error('Missing independent WC realm');
      }
      await realm.addScriptTag({
        path: resolve(import.meta.dirname, '../dist-wc/index.js'),
        type: 'module'
      });
      await realm.waitForFunction(() => typeof customElements.get('sui-modal') === 'function');
      await realm.evaluate(() => {
        const owner = parent.document.querySelector<HTMLElement>('[data-pw="scroll-root"]');
        if (owner === null) {
          throw new Error('Missing actual owner');
        }
        const modal = document.createElement('sui-modal');
        Object.assign(modal, {
          scrollContainer: () => {
            owner.dataset.publicOwnerGetterCalls = String(
              Number(owner.dataset.publicOwnerGetterCalls ?? '0') + 1
            );
            return owner;
          },
          enableTransition: false
        });
        document.body.append(modal);
      });
      await expect(realm.locator('sui-modal .modal')).toBeVisible();
      expect(Number(await root.getAttribute('data-public-owner-getter-calls'))).toBeGreaterThan(0);
      await root.evaluate((owner) => {
        owner.style.setProperty('color', 'blue', 'important');
        owner.style.setProperty('padding-right', '13px');
      });
      if (releaseFirst === 'public API') {
        await page.evaluate(() =>
          window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'release' }))
        );
        await page.evaluate(() =>
          window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'release' }))
        );
        await expect(root).toHaveCSS('overflow', 'hidden');
        await expect(realm.locator('sui-modal .modal')).toBeVisible();
        await realm.locator('sui-modal').evaluate((element) => element.remove());
      } else {
        await realm.locator('sui-modal').evaluate((element) => element.remove());
        await expect(root).toHaveCSS('overflow', 'hidden');
        await page.evaluate(() =>
          window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'release' }))
        );
      }
      await expect
        .poll(() =>
          root.evaluate((owner) => ({
            x: owner.style.getPropertyValue('overflow-x'),
            xp: owner.style.getPropertyPriority('overflow-x'),
            y: owner.style.getPropertyValue('overflow-y'),
            yp: owner.style.getPropertyPriority('overflow-y')
          }))
        )
        .toEqual(initialOverflow);
      await expect(root).toHaveCSS('overflow-x', initialComputed.x);
      await expect(root).toHaveCSS('overflow-y', initialComputed.y);
      expect(
        await root.evaluate((owner) => ({
          color: owner.style.color,
          priority: owner.style.getPropertyPriority('color'),
          padding: owner.style.paddingRight
        }))
      ).toEqual({ color: 'blue', priority: 'important', padding: '13px' });
      expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
    });
  }
}

test('public API hold follows a real owner adopted into an independent WC realm', async ({
  page
}) => {
  await page.goto(`${baseURL}/overlay-scroll-ownership/`);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'acquire' }));
    const owner = document.querySelector<HTMLElement>('[data-pw="scroll-root"]');
    const frame = document.createElement('iframe');
    frame.name = 'adopted-owner-realm';
    frame.style.cssText = 'width:600px;height:400px';
    document.body.append(frame);
    const destination = frame.contentDocument;
    if (owner === null || destination === null) {
      throw new Error('Missing adoption documents');
    }
    const moved = destination.adoptNode(owner);
    if (moved !== owner || owner.ownerDocument !== destination) {
      throw new Error('Actual owner identity was not preserved by adoption');
    }
    destination.body.append(moved);
  });
  const realm = page.frame({ name: 'adopted-owner-realm' });
  if (realm === null) {
    throw new Error('Missing adopted-owner realm');
  }
  await realm.addScriptTag({
    path: resolve(import.meta.dirname, '../dist-wc/index.js'),
    type: 'module'
  });
  await realm.waitForFunction(() => typeof customElements.get('sui-modal') === 'function');
  await realm.evaluate(() => {
    const owner = document.querySelector<HTMLElement>('[data-pw="scroll-root"]');
    const modal = document.createElement('sui-modal');
    Object.assign(modal, { scrollContainer: () => owner, enableTransition: false });
    document.body.append(modal);
  });
  const owner = realm.getByTestId('scroll-root');
  await expect(realm.locator('sui-modal .modal')).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent('public-scroll-lock-control', { detail: 'release' }))
  );
  await expect(owner).toHaveCSS('overflow', 'hidden');
  await expect(realm.locator('sui-modal .modal')).toBeVisible();
  await realm.locator('sui-modal').evaluate((element) => element.remove());
  await expect
    .poll(() =>
      owner.evaluate((element) => ({
        value: element.style.overflow,
        priority: element.style.getPropertyPriority('overflow')
      }))
    )
    .toEqual({ value: 'auto', priority: 'important' });
});
