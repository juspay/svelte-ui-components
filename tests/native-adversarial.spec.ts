import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

const baseURL = process.env.SUI_AUDIT_BASE_URL ?? fixtureBaseURL;
const command = async (page: import('@playwright/test').Page, detail: Record<string, unknown>) => {
  await page.evaluate(
    (detail) => window.dispatchEvent(new CustomEvent('sui-adversarial-command', { detail })),
    detail
  );
};
test.beforeEach(async ({ page, context }) => {
  await context.route('**/*', (route) =>
    ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort()
  );
  await page.goto(baseURL + '/adversarial-native/');
  await page.waitForFunction(() => document.documentElement.dataset.adversarialReady === 'true');
});

for (const field of ['input', 'textarea']) {
  test(`native ${field} reset keeps DOM and bound model together`, async ({ page }) => {
    const input = page.getByTestId('audit-' + field);
    await input.fill('edited');
    await expect(page.getByTestId(field + '-model')).toHaveText('edited');
    await page.getByRole('button', { name: 'Reset text fields', exact: true }).click();
    await expect(input).toHaveValue('initial');
    await expect(page.getByTestId(field + '-model')).toHaveText('initial');
  });
  test(`native ${field} preserves browser undo and updates its model`, async ({ page }) => {
    const input = page.getByTestId('audit-' + field);
    await input.focus();
    await input.press('End');
    await input.pressSequentially(' edited');
    const before = await input.inputValue();
    await input.press('ControlOrMeta+Z');
    await expect.poll(() => input.inputValue()).not.toBe(before);
    await expect(page.getByTestId(field + '-model')).toHaveText(await input.inputValue());
  });
}

test('nested native action keeps its keyboard activation inside an interactive Card', async ({
  page
}) => {
  const child = page.getByTestId('nested-button');
  await child.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('child-clicks')).toHaveText('1');
  await expect(page.getByTestId('root-clicks')).toHaveText('0');
});

for (const kind of ['css', 'negative', 'type-hidden']) {
  test(`Dialog reverse Tab ignores ${kind} controls`, async ({ page, browserName }) => {
    await command(page, { hiddenKind: kind });
    await page.getByTestId('dialog-opener').click();
    const first = page.getByTestId('dialog-first');
    await first.focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
    await expect(page.getByTestId('dialog-last')).toBeFocused();
  });
}

for (const modal of [false, true]) {
  test(`open Dialog changes native modality to ${modal} without a logical close`, async ({
    page
  }) => {
    await command(page, { modal: !modal });
    await page.getByTestId('dialog-opener').click();
    const dialog = page.getByTestId('audit-dialog');
    await expect(dialog).toHaveJSProperty('open', true);
    await expect.poll(() => dialog.evaluate((node) => node.matches(':modal'))).toBe(!modal);
    await command(page, { modal });
    await expect.poll(() => dialog.evaluate((node) => node.matches(':modal'))).toBe(modal);
    await expect(page.getByTestId('dialog-close-count')).toHaveText('0');
  });
}

test('portaled menu follows a scoped parent theme while open', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Scoped country', exact: true }).click();
  const menu = page.locator('.select-dropdown-portal');
  await expect(menu).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await command(page, { dark: true });
  await expect(menu).toHaveCSS('background-color', 'rgb(17, 34, 51)');
});

test('file form reset during a simulated pending picker does not resurrect the old file', async ({
  page
}) => {
  const input = page.getByTestId('audit-file');
  await input.setInputFiles({
    name: 'old.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('old')
  });
  const chooser = page.waitForEvent('filechooser');
  await input.click();
  await chooser;
  await input.evaluate((node: HTMLInputElement) => {
    node.form!.reset();
    node.dispatchEvent(new Event('cancel'));
  });
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.files?.length)).toBe(0);
});

test('WC native file input participates in outer form validity and File FormData', async ({
  page
}) => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-native-file-input')));
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 'wc-file-form';
    const field = document.createElement('sui-native-file-input') as HTMLElement & {
      native: boolean;
      nativeAttrs: object;
    };
    field.id = 'wc-file';
    field.setAttribute('name', 'attachment');
    field.native = true;
    field.nativeAttrs = { name: 'attachment', required: true };
    form.append(field);
    document.body.append(form);
  });
  const native = page.locator('#wc-file').locator('input[type="file"]');
  await expect(native).toBeVisible();
  expect(
    await page.locator('#wc-file-form').evaluate((form: HTMLFormElement) => form.checkValidity())
  ).toBe(false);
  await native.setInputFiles({
    name: 'proof.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('proof')
  });
  await expect
    .poll(() =>
      page.locator('#wc-file-form').evaluate((form: HTMLFormElement) => {
        const file = new FormData(form).get('attachment');
        return file instanceof File ? file.name + ':' + file.size : String(file);
      })
    )
    .toBe('proof.txt:5');
});

test('portaled percentage min-width stays relative to its trigger', async ({ page }) => {
  const scope = page.getByTestId('scoped-theme');
  await scope.evaluate((node) => {
    node.style.width = '160px';
    node.style.setProperty('--select-dropdown-width', 'auto');
    node.style.setProperty('--select-dropdown-min-width', '100%');
  });
  await page.getByRole('combobox', { name: 'Scoped country', exact: true }).click();
  const menu = page.locator('.select-dropdown-portal');
  const bounds = (await menu.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(160);
  expect(bounds.width).toBeLessThan(400);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});

for (const field of ['input', 'textarea']) {
  test(`preventing native ${field} reset preserves its current model`, async ({ page }) => {
    const input = page.getByTestId('audit-' + field);
    await input.fill('edited');
    await page
      .getByTestId('reset-form')
      .evaluate((form) =>
        form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
      );
    await page.getByRole('button', { name: 'Reset text fields', exact: true }).click();
    await expect(input).toHaveValue('edited');
    await expect(page.getByTestId(field + '-model')).toHaveText('edited');
  });
}

test('WC portal follows host theme and keeps full labels', async ({ page }) => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-select')));
  await page.evaluate(() => {
    const field = document.createElement('sui-select') as HTMLElement & {
      items: object[];
      value: string[];
      usePortal: boolean;
      ariaLabel: string;
    };
    field.id = 'wc-scoped-select';
    field.items = [{ id: 'IN', label: 'India (+91)', displayLabel: '+91' }];
    field.value = ['IN'];
    field.usePortal = true;
    field.ariaLabel = 'WC scoped country';
    field.style.setProperty('--select-dropdown-background', '#ffffff');
    document.body.append(field);
  });
  const field = page.locator('#wc-scoped-select');
  await field.getByRole('combobox').click();
  const menu = field.locator('.select-dropdown-portal');
  await expect(menu).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await field.evaluate((node) => node.style.setProperty('--select-dropdown-background', '#112233'));
  await expect(menu).toHaveCSS('background-color', 'rgb(17, 34, 51)');
  await expect(field.getByRole('option', { name: 'India (+91)', exact: true })).toBeVisible();
});

test('WC native email validity reaches its outer form', async ({ page }) => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-input')));
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 'wc-email-form';
    const input = document.createElement('sui-input') as HTMLElement & {
      native: boolean;
      value: string;
      dataType: string;
    };
    input.id = 'wc-email';
    input.setAttribute('name', 'email');
    input.native = true;
    input.dataType = 'email';
    input.value = 'not-an-email';
    form.append(input);
    document.body.append(form);
  });
  const native = page.locator('#wc-email').locator('input');
  await expect(native).toHaveValue('not-an-email');
  expect(await native.evaluate((node: HTMLInputElement) => node.validity.typeMismatch)).toBe(true);
  expect(
    await page.locator('#wc-email-form').evaluate((node: HTMLFormElement) => node.checkValidity())
  ).toBe(false);
});

for (const cancelled of [false, true]) {
  test(`WC external multiple files respect ${cancelled ? 'prevented' : 'permitted'} reset and simulated picker cancel`, async ({
    page
  }) => {
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-native-file-input')));
    await page.evaluate((cancelled) => {
      const form = document.createElement('form');
      form.id = 'external-file-owner';
      if (cancelled) {
        form.addEventListener('reset', (event) => event.preventDefault());
      }
      const field = document.createElement('sui-native-file-input');
      field.id = 'external-files';
      field.setAttribute('form', form.id);
      field.setAttribute('name', 'attachments');
      Object.assign(field, { native: true, multiple: true, required: true });
      document.body.append(form, field);
    }, cancelled);
    const input = page.locator('#external-files').locator('input');
    await expect(input).toBeVisible();
    await input.setInputFiles([
      { name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('one') },
      { name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('two') }
    ]);
    const entries = () =>
      page
        .locator('#external-file-owner')
        .evaluate((form: HTMLFormElement) =>
          new FormData(form)
            .getAll('attachments')
            .map((file) => (file instanceof File ? file.name : file))
        );
    await expect.poll(entries).toEqual(['one.txt', 'two.txt']);
    // Exercise pending-selection restoration without an OS modal blocking automation.
    // Real native picker activation is covered by native-review-contracts.spec.ts.
    await input.dispatchEvent('click');
    await page.locator('#external-file-owner').evaluate((form: HTMLFormElement) => form.reset());
    await input.dispatchEvent('cancel');
    await expect.poll(entries).toEqual(cancelled ? ['one.txt', 'two.txt'] : ['']);
    await expect
      .poll(() => input.evaluate((node: HTMLInputElement) => node.files?.length))
      .toBe(cancelled ? 2 : 0);
  });
}

test('WC native file respects inherited disabling, reenabling and renaming', async ({ page }) => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-native-file-input')));
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 'disabled-file-owner';
    const fieldset = document.createElement('fieldset');
    const field = document.createElement('sui-native-file-input');
    field.id = 'disabled-file';
    field.setAttribute('name', 'attachment');
    Object.assign(field, { native: true, required: true });
    fieldset.append(field);
    form.append(fieldset);
    document.body.append(form);
  });
  const input = page.locator('#disabled-file').locator('input');
  await expect(input).toBeVisible();
  await input.setInputFiles({
    name: 'proof.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('proof')
  });
  await page
    .locator('#disabled-file-owner fieldset')
    .evaluate((node: HTMLFieldSetElement) => (node.disabled = true));
  await expect(input).toBeDisabled();
  const snapshot = () =>
    page.locator('#disabled-file-owner').evaluate((form: HTMLFormElement) => ({
      keys: [...new FormData(form).keys()],
      valid: form.checkValidity()
    }));
  await expect.poll(snapshot).toEqual({ keys: [], valid: true });
  await page.locator('#disabled-file').evaluate((node) => node.setAttribute('name', 'renamed'));
  await page
    .locator('#disabled-file-owner fieldset')
    .evaluate((node: HTMLFieldSetElement) => (node.disabled = false));
  await expect(input).toBeEnabled();
  await expect.poll(snapshot).toEqual({ keys: ['renamed'], valid: true });
});

test('Dialog modality changes preserve focused control and restore the original opener', async ({
  page
}) => {
  // Open with the keyboard: Safari pointer activation blurs even a previously
  // focused button, so its actual pre-dialog focus would instead be the body.
  await page.getByTestId('dialog-opener').focus();
  await page.getByTestId('dialog-opener').press('Enter');
  const last = page.getByTestId('dialog-last');
  await last.focus();
  await command(page, { modal: false });
  await expect(last).toBeFocused();
  await command(page, { modal: true });
  await expect(last).toBeFocused();
  await command(page, { open: false });
  await expect(page.getByTestId('dialog-opener')).toBeFocused();
  await expect(page.getByTestId('dialog-close-count')).toHaveText('1');
});

test('native Select preserves item disabled semantics', async ({ page }) => {
  const select = page.getByRole('combobox', { name: 'Native disabled options', exact: true });
  await expect(select.getByRole('option', { name: 'Unavailable' })).toBeDisabled();
});

test('anchor Cards deliver consumer keyboard events without synthesizing activation', async ({
  page
}) => {
  await page.getByTestId('anchor-card').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('anchor-keys')).toHaveText('1');
});

test('native FileInput error descriptions resolve to visible announced content', async ({
  page
}) => {
  await page.addScriptTag({
    path: process.env.SUI_AUDIT_WC_PATH ?? 'dist-wc/index.js',
    type: 'module'
  });
  await page.waitForFunction(() => Boolean(customElements.get('sui-native-file-input')));
  await page.evaluate(() => {
    const field = document.createElement('sui-native-file-input');
    field.id = 'accessible-file';
    Object.assign(field, { native: true, invalid: true, errorMessage: 'Choose a supported file.' });
    document.body.append(field);
  });
  const field = page.locator('#accessible-file');
  const input = field.locator('input');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(field.getByRole('alert')).toHaveText('Choose a supported file.');
  expect(
    await input.evaluate((node) => {
      const root = node.getRootNode();
      return (
        (root instanceof Document || root instanceof ShadowRoot) &&
        (node.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .every((id) => root.getElementById(id) !== null)
      );
    })
  ).toBe(true);
});

test('a portaled Select inside native Dialog remains interactive in the modal layer', async ({
  page
}) => {
  await command(page, { showDialogSelect: true });
  await page.getByTestId('dialog-opener').focus();
  await page.getByTestId('dialog-opener').press('Enter');
  const country = page.getByRole('combobox', { name: 'Dialog country', exact: true });
  await country.click();
  await page.getByRole('option', { name: 'United Kingdom', exact: true }).click({ timeout: 5000 });
  await expect(country).toContainText('United Kingdom');
  await expect(page.getByTestId('audit-dialog')).toHaveJSProperty('open', true);
  await country.click();
  await page.keyboard.press('Escape');
  await expect(country).toBeFocused();
  await expect(country).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('audit-dialog')).toHaveJSProperty('open', true);
});
