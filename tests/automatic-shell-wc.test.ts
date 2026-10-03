import { expect, test } from '@playwright/test';

test('header expansion is absent by default and responds to a callback assigned after mount', async ({
  page
}) => {
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-chat-header') === 'function');
  await page.evaluate(() => {
    const header = document.createElement('sui-chat-header');
    header.id = 'assistant-header';
    header.setAttribute('title', 'Assistant');
    document.body.append(header);
  });
  const header = page.locator('#assistant-header');
  await expect(header.locator('.chat-header')).toBeVisible();
  await expect(header.getByRole('button', { name: 'Expand', exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    const header = document.getElementById('assistant-header');
    if (header === null) {
      throw new Error('Header did not mount');
    }
    Reflect.set(header, 'onexpandchange', (expanded: boolean) => {
      header.dataset.callback = String(expanded);
    });
    header.addEventListener('expandchange', (event) => {
      if (event instanceof CustomEvent) {
        header.dataset.event = String(event.detail);
      }
    });
  });
  await header.getByRole('button', { name: 'Expand', exact: true }).click();
  await expect(header).toHaveJSProperty('expanded', true);
  await expect(header).toHaveAttribute('data-callback', 'true');
  await expect(header).toHaveAttribute('data-event', 'true');
  await header.getByRole('button', { name: 'Collapse', exact: true }).click();
  await expect(header).toHaveJSProperty('expanded', false);
  await expect(header).toHaveAttribute('data-event', 'false');
  await header.evaluate((element) => element.setAttribute('show-expand', 'false'));
  await expect(header.getByRole('button', { name: 'Expand', exact: true })).toHaveCount(0);
});

for (const layout of ['row', 'stacked']) {
  test(`composer trailing slot and inputfocus event preserve one accessible input in ${layout}`, async ({
    page
  }) => {
    await page.goto('about:blank');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-chat-composer') === 'function');
    await page.evaluate((currentLayout) => {
      const composer = document.createElement('sui-chat-composer');
      composer.id = 'assistant-composer';
      composer.setAttribute('placeholder', 'Ask AI');
      composer.setAttribute('layout', currentLayout);
      composer.setAttribute('action-text', 'Start voice');
      Reflect.set(composer, 'onaction', () => {});
      const open = document.createElement('button');
      open.textContent = 'Open panel';
      open.slot = 'trailing';
      composer.append(open);
      composer.addEventListener('inputfocus', () => {
        composer.dataset.focused = 'true';
      });
      document.body.append(composer);
    }, layout);
    const composer = page.locator('#assistant-composer');
    const input = composer.getByRole('textbox', { name: 'Ask AI', exact: true });
    await expect(input).toHaveCount(1);
    await input.focus();
    await expect(composer).toHaveAttribute('data-focused', 'true');
    await expect(composer.getByRole('button', { name: 'Open panel' })).toBeVisible();
    await expect(composer.getByRole('button', { name: 'Voice conversation' })).toHaveText(
      'Start voice'
    );
    const assigned = await composer.locator('slot[name="trailing"]').evaluate((element) => {
      if (!(element instanceof HTMLSlotElement)) {
        throw new Error('Trailing slot is missing');
      }
      return element.assignedElements().length;
    });
    expect(assigned).toBe(1);
  });
}

for (const layout of ['row', 'stacked']) {
  test(`composer preserves trailing snippet priority and late native slots in ${layout}`, async ({
    page
  }) => {
    await page.goto('about:blank');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-chat-composer') === 'function');
    await page.evaluate((currentLayout) => {
      const composer = document.createElement('sui-chat-composer');
      composer.id = 'snippet-composer';
      composer.setAttribute('layout', currentLayout);
      document.body.append(composer);
    }, layout);
    const composer = page.locator('#snippet-composer');
    await expect(composer.getByRole('textbox')).toHaveCount(1);
    await expect(composer.locator('slot[name="trailing"]')).toHaveCount(0);
    await composer.evaluate((element) => {
      Reflect.set(element, 'trailing', () => Reflect.set(window, '__composerTrailingCalled', true));
      const open = document.createElement('button');
      open.slot = 'trailing';
      open.textContent = 'Late open';
      element.append(open);
    });
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, '__composerTrailingCalled')))
      .toBe(true);
    await expect(composer.locator('slot[name="trailing"]')).toHaveCount(0);
    await composer.evaluate((element) => Reflect.set(element, 'trailing', null));
    await expect(composer.getByRole('button', { name: 'Late open' })).toBeVisible();
    await composer
      .getByRole('button', { name: 'Late open' })
      .evaluate((element) => element.remove());
    await expect(composer.locator('slot[name="trailing"]')).toHaveCount(0);
  });
}
