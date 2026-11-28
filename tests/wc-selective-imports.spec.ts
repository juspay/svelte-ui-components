import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { gotoWcTestHost } from './support/wc-test-host';

const output = resolve('dist-wc/modules');

test('selective and aggregate package entries share registrations and the snippet factory', async ({
  page
}) => {
  const assets = new Map<string, number>();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/__wc-module/**', async (route) => {
    const file = resolve(
      output,
      new URL(route.request().url()).pathname.slice('/__wc-module/'.length)
    );
    if (relative(output, file).startsWith('..')) {
      await route.abort();
      return;
    }
    const body = readFileSync(file);
    assets.set(file, gzipSync(body).length);
    await route.fulfill({ contentType: 'text/javascript', body });
  });

  await gotoWcTestHost(page);
  const base = '/__wc-module/';
  const packageEntries = readdirSync(output).filter(
    (file) => file.endsWith('.js') && file !== 'index.js'
  );
  expect(packageEntries).toHaveLength(104);

  const selective = await page.evaluate(
    async ({ base, packageEntries }) => {
      const { createRawSnippet } = await import(base + 'button.js');
      const element = document.createElement('sui-button');
      element.setAttribute('text', 'Save draft');
      document.body.append(element);
      return {
        present: packageEntries.filter(
          (name) => typeof customElements.get('sui-' + name.slice(0, -3)) === 'function'
        ),
        snippet: typeof createRawSnippet
      };
    },
    { base, packageEntries }
  );
  expect(selective.present).toEqual(['button.js']);
  expect(selective.snippet).toBe('function');
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeVisible();
  const selectiveBytes = [...assets.values()].reduce((total, bytes) => total + bytes, 0);
  expect(selectiveBytes).toBeLessThan(
    gzipSync(readFileSync(join(output, '../index.js'))).length / 4
  );

  const combined = await page.evaluate(
    async ({ base, packageEntries }) => {
      const original = customElements.get('sui-button');
      const button = await import(base + 'button.js');
      const aggregate = await import(base + 'index.js');
      const select = await import(base + 'select.js');
      return {
        allRegistered: packageEntries.every(
          (name) => typeof customElements.get('sui-' + name.slice(0, -3)) === 'function'
        ),
        sameElement: original === customElements.get('sui-button'),
        sameSnippetFactory:
          button.createRawSnippet === aggregate.createRawSnippet &&
          select.createRawSnippet === aggregate.createRawSnippet
      };
    },
    { base, packageEntries }
  );
  expect(combined).toEqual({ allRegistered: true, sameElement: true, sameSnippetFactory: true });
  expect(errors).toEqual([]);
});

test('four custom elements accept their required data after connection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await gotoWcTestHost(page);
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  const entries = [
    { tag: 'sui-tabs', property: 'items', value: ['Billing tab'], content: 'Billing tab' },
    {
      tag: 'sui-task-list',
      property: 'rows',
      value: [{ label: 'Check the build', status: 'done' }],
      content: 'Check the build'
    },
    {
      tag: 'sui-tool-call-log',
      property: 'chips',
      value: [{ label: 'Read release', state: 'done' }],
      content: 'Read release'
    },
    {
      tag: 'sui-typewriter-text',
      property: 'text',
      value: 'Release prepared',
      content: 'Release prepared'
    }
  ];

  for (const entry of entries) {
    await page.evaluate(async (tag) => {
      await customElements.whenDefined(tag);
      document.body.append(document.createElement(tag));
    }, entry.tag);
    const element = page.locator(entry.tag);
    await expect.poll(() => element.evaluate((node) => node.shadowRoot !== null)).toBe(true);
    await element.evaluate((node, entry) => {
      Reflect.set(node, entry.property, entry.value);
    }, entry);
    await expect(element.getByText(entry.content, { exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
