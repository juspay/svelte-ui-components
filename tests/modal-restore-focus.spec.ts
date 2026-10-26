import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fixtureBaseURL } from './support/fixture-server';
const origin = process.env.BZ7218_FIXTURE_ORIGIN ?? fixtureBaseURL;
const read = (page: Page) => page.evaluate(() => Reflect.get(window, 'modalRestoreFixture').read());
const start = async (page: Page, mode: string) => {
  await page.goto(origin + '/modal-restore-focus/');
  await page.getByRole('heading', { name: 'Modal focus return owner fixture' }).waitFor();
  await page.evaluate((next) => Reflect.get(window, 'modalRestoreFixture').open(next), mode);
  await expect(page.getByRole('dialog', { name: 'Focus return owner' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close presentation' })).toBeFocused();
};
const finish = async (page: Page, info: TestInfo, data: object) => {
  await page.screenshot({ path: info.outputPath('final.png') });
  writeFileSync(info.outputPath('result.json'), JSON.stringify(data, null, 2) + '\n');
};

test('omitted default restores its ordinary opener after real outro', async ({ page }, info) => {
  await start(page, 'default');
  await page.getByRole('button', { name: 'Close presentation' }).click();
  await expect(page.locator('.modal-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Original opener' })).toBeFocused();
  const result = await read(page);
  expect(result.resolves).toBe(0);
  await finish(page, info, result);
});

test('late getter resolves once at real teardown after outro and cleanup', async ({
  page
}, info) => {
  await start(page, 'late');
  await page.getByRole('button', { name: 'Close presentation' }).click();
  expect((await read(page)).resolves).toBe(0);
  await expect(page.locator('.modal-content')).toHaveCount(1);
  await page.evaluate(() => Reflect.get(window, 'modalRestoreFixture').addLate());
  await expect(page.locator('.modal-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Late target' })).toBeFocused();
  const result = await read(page);
  expect(result.resolves).toBe(1);
  expect(result.trace.find((x: { type: string }) => x.type === 'resolve').overflow).toBe('');
  const resolvedAt = result.trace.findIndex((x: { type: string }) => x.type === 'resolve');
  expect(
    result.trace.slice(0, resolvedAt).some((x: { type: string }) => x.type === 'outroend')
  ).toBe(true);
  await finish(page, info, result);
});

test('getter snapshot ignores a replacement prop for the mounted presentation', async ({
  page
}, info) => {
  await start(page, 'getter');
  await page.evaluate(() => Reflect.get(window, 'modalRestoreFixture').replaceOption());
  await page.getByRole('button', { name: 'Close presentation' }).click();
  await expect(page.locator('.modal-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Return target' })).toBeFocused();
  const result = await read(page);
  expect(result.resolves).toBe(1);
  expect(
    result.trace
      .filter((x: { type: string }) => x.type === 'resolve')
      .map((x: { detail: string }) => x.detail)
  ).toEqual(['getter']);
  await finish(page, info, result);
});

for (const mode of ['null', 'getter-null', 'throw', 'element']) {
  test(
    mode + ' suppresses invalid restoration without captured-opener fallback',
    async ({ page }, info) => {
      await start(page, mode);
      if (mode === 'element') {
        await page.evaluate(() => Reflect.get(window, 'modalRestoreFixture').removeTarget());
      }
      await page.getByRole('button', { name: 'Close presentation' }).click();
      await expect(page.locator('.modal-content')).toHaveCount(0);
      const result = await read(page);
      expect(result.active).not.toBe('opener');
      expect(result.overflow).toBe('');
      expect(result.resolves).toBe(mode === 'getter-null' || mode === 'throw' ? 1 : 0);
      await finish(page, info, result);
    }
  );
}

test('old fenced getter cannot steal focus from a newer keyed presentation', async ({
  page
}, info) => {
  await start(page, 'fenced');
  await page.evaluate(() => {
    const api = Reflect.get(window, 'modalRestoreFixture');
    api.close();
    api.open('getter');
  });
  await expect.poll(async () => (await read(page)).resolves).toBe(1);
  await expect(page.locator('.modal-content')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Close presentation' })).toBeFocused();
  const before = await read(page);
  expect(
    before.trace
      .filter((x: { type: string }) => x.type === 'resolve')
      .map((x: { detail: string }) => x.detail)
  ).toEqual(['fenced']);
  await page.getByRole('button', { name: 'Close presentation' }).click();
  await expect(page.locator('.modal-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Return target' })).toBeFocused();
  const after = await read(page);
  expect(after.resolves).toBe(2);
  await finish(page, info, {
    before,
    after,
    scope: 'Controlled immutable owner fence; not DistributionCard/provider acceptance.'
  });
});

test('reduced motion still restores once at actual teardown', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 'getter');
  await page.getByRole('button', { name: 'Close presentation' }).click();
  await expect(page.locator('.modal-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Return target' })).toBeFocused();
  const result = await read(page);
  expect(result.resolves).toBe(1);
  await finish(page, info, result);
});

for (const mode of ['getter', 'element', 'null']) {
  test(
    'WC Object property forwards ' + mode + ' without reflection or eager getter evaluation',
    async ({ page }, info) => {
      await page.goto(origin + '/modal-restore-focus/');
      await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
      await page.waitForFunction(() => Boolean(customElements.get('sui-modal')));
      await page.evaluate((kind) => {
        const opener = document.querySelector<HTMLButtonElement>('[data-focus-name="opener"]');
        const target = document.querySelector<HTMLButtonElement>('[data-focus-name="target"]');
        if (!opener || !target) {
          throw new Error('WC fixture targets missing');
        }
        opener.focus();
        let calls = 0;
        let cleanupOverflow = 'unresolved';
        const modal = document.createElement('sui-modal');
        Reflect.set(
          modal,
          'restoreFocusTo',
          kind === 'null'
            ? null
            : kind === 'element'
              ? target
              : () => {
                  calls++;
                  cleanupOverflow = document.body.style.overflow;
                  return target;
                }
        );
        Reflect.set(modal, 'containFocus', true);
        Reflect.set(modal, 'modalRole', 'dialog');
        Reflect.set(modal, 'modalAriaLabel', 'WC return owner');
        const close = document.createElement('button');
        close.textContent = 'WC content';
        modal.append(close);
        document.body.append(modal);
        Object.assign(window, {
          wcReturnFixture: {
            modal,
            read: () => ({
              calls,
              cleanupOverflow,
              reflected: modal.hasAttribute('restorefocusto'),
              active:
                document.activeElement?.getAttribute('data-focus-name') ??
                document.activeElement?.tagName
            })
          }
        });
      }, mode);
      await expect(page.getByRole('dialog', { name: 'WC return owner' })).toBeVisible();
      const before = await page.evaluate(() => Reflect.get(window, 'wcReturnFixture').read());
      expect(before.calls).toBe(0);
      expect(before.reflected).toBe(false);
      await page.evaluate(() => Reflect.get(window, 'wcReturnFixture').modal.remove());
      await expect(page.getByRole('dialog', { name: 'WC return owner' })).toHaveCount(0);
      if (mode !== 'null') {
        await expect(page.getByRole('button', { name: 'Return target' })).toBeFocused();
      }
      const after = await page.evaluate(() => Reflect.get(window, 'wcReturnFixture').read());
      expect(after.calls).toBe(mode === 'getter' ? 1 : 0);
      if (mode === 'null') {
        expect(after.active).not.toBe('opener');
      }
      if (mode === 'getter') {
        expect(after.cleanupOverflow).toBe('');
      }
      await finish(page, info, { before, after, mode });
    }
  );
}
