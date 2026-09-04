import { expect, test } from '@playwright/test';

// The checkbox inside Toggle is visually hidden, so a label association is the only way to
// name it or to activate it from its text. Before these props existed the visible text was
// plain text beside the switch: clicking it did nothing and assistive tech announced an
// unnamed checkbox — observed in Lighthouse's order-editing config, where the "Enable order
// editing" text could not activate its own switch.
test.describe('Toggle label association', () => {
  test('the built-in text is a real label: clicking it toggles the switch', async ({ page }) => {
    await page.goto('/components/toggle');

    const container = page.getByTestId('toggle-text-label');
    const input = container.locator('input[type="checkbox"]');
    const label = container.locator('label.text');

    const inputId = await input.getAttribute('id');
    expect(inputId).toBeTruthy();
    await expect(label).toHaveAttribute('for', inputId ?? '');
    await expect(input).toHaveAccessibleName('Built-in text label');

    await expect(page.getByTestId('toggle-text-label-state')).toHaveText('OFF');
    await label.click();
    await expect(page.getByTestId('toggle-text-label-state')).toHaveText('ON');
  });

  test("a consumer-supplied id lets the consumer's own <label for> activate the switch", async ({
    page
  }) => {
    await page.goto('/components/toggle');

    const input = page
      .getByTestId('toggle-external-label-switch')
      .locator('input[type="checkbox"]');
    await expect(input).toHaveAttribute('id', 'toggle-external-label-input');
    await expect(input).toHaveAccessibleName('Consumer label');

    await expect(page.getByTestId('toggle-external-label-state')).toHaveText('OFF');
    await page.getByTestId('toggle-external-label').click();
    await expect(page.getByTestId('toggle-external-label-state')).toHaveText('ON');
  });

  test('ariaLabel names a switch that has no visible text', async ({ page }) => {
    await page.goto('/components/toggle');

    const input = page.getByTestId('toggle-aria-label').locator('input[type="checkbox"]');
    await expect(input).toHaveAttribute('aria-label', 'Silent switch');
    await expect(input).toHaveAccessibleName('Silent switch');
    await expect(page.getByTestId('toggle-aria-label').locator('label.text')).toBeHidden();
  });
});

test('generated ids are unique and preserve keyboard activation of the hidden input', async ({
  page
}) => {
  await page.goto('/components/toggle');
  const inputs = page.locator('input[type="checkbox"]');
  const ids = await inputs.evaluateAll((elements) => elements.map((element) => element.id));
  expect(ids.every((id) => id.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
  const input = page.getByTestId('toggle-text-label').locator('input');
  await input.focus();
  await page.keyboard.press('Space');
  await expect(input).toBeChecked();
  await expect(page.getByTestId('toggle-text-label-state')).toHaveText('ON');
});

test('ariaLabelledby names the hidden checkbox', async ({ page }) => {
  await page.goto('/components/toggle');
  await expect(page.getByTestId('toggle-labelledby').locator('input')).toHaveAccessibleName(
    'Order notifications'
  );
});

test('disabled text cannot activate the hidden checkbox', async ({ page }) => {
  await page.goto('/components/toggle');
  const container = page.getByTestId('toggle-disabled-label');
  await expect(container.locator('input')).toBeDisabled();
  await expect(container.locator('input')).toHaveAccessibleName('Disabled setting');
  await container.locator('.text').click({ force: true });
  await expect(container.locator('input')).not.toBeChecked();
});

test.describe('sui-toggle shadow-DOM labelling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-toggle')));
    await page.evaluate(() => {
      const toggle = document.createElement('sui-toggle');
      toggle.setAttribute('data-pw', 'wc-toggle');
      toggle.setAttribute('id', 'wc-host');
      toggle.setAttribute('input-id', 'wc-checkbox');
      toggle.setAttribute('text', 'Web component setting');
      document.body.prepend(toggle);
    });
  });

  test('text names and activates the checkbox within its shadow root', async ({ page }) => {
    const toggle = page.getByTestId('wc-toggle');
    const input = toggle.locator('input');
    await expect(input).toHaveAttribute('id', 'wc-checkbox');
    await expect(input).toHaveAccessibleName('Web component setting');
    await toggle.locator('label.text').click();
    await expect(input).toBeChecked();
    await input.focus();
    await page.keyboard.press('Space');
    await expect(input).not.toBeChecked();
  });

  test('inputId updates the internal label without replacing native host identity', async ({
    page
  }) => {
    const toggle = page.getByTestId('wc-toggle');
    await expect(toggle.locator('input')).toHaveAttribute('id', 'wc-checkbox');
    await toggle.evaluate((element) => {
      element.id = 'wc-renamed-host';
      Reflect.set(element, 'inputId', 'wc-renamed');
    });
    await expect(toggle).toHaveAttribute('id', 'wc-renamed-host');
    await expect(toggle.locator('input')).toHaveAttribute('id', 'wc-renamed');
    await expect(toggle.locator('label.text')).toHaveAttribute('for', 'wc-renamed');
    await toggle.locator('label.text').click();
    await expect(toggle.locator('input')).toBeChecked();
  });

  test('input-aria-label attribute and property name the hidden input independently of the host', async ({
    page
  }) => {
    const toggle = page.getByTestId('wc-toggle');
    await toggle.evaluate((element) => {
      element.setAttribute('text', '');
      element.setAttribute('aria-label', 'Host label');
      element.setAttribute('input-aria-label', 'Account alerts');
    });
    await expect(toggle.locator('input')).toHaveAccessibleName('Account alerts');
    await toggle.evaluate((element) => {
      Reflect.set(element, 'inputAriaLabel', 'Shipping alerts');
      element.ariaLabel = 'Renamed host label';
    });
    await expect(toggle.locator('input')).toHaveAccessibleName('Shipping alerts');
    await expect(toggle).toHaveAttribute('aria-label', 'Renamed host label');
  });

  test('light-DOM label references do not replace an explicit accessible name', async ({
    page
  }) => {
    const toggle = page.getByTestId('wc-toggle');
    await toggle.evaluate((element) => {
      const label = document.createElement('label');
      label.id = 'wc-light-label';
      label.htmlFor = 'wc-checkbox';
      label.textContent = 'Outside label';
      element.before(label);
      element.setAttribute('input-aria-labelledby', 'wc-light-label');
      element.setAttribute('text', '');
      element.setAttribute('input-aria-label', 'Explicit account alerts');
    });
    await expect(toggle.locator('input')).toHaveAccessibleName('Explicit account alerts');
    await page.locator('#wc-light-label').click();
    await expect(toggle.locator('input')).not.toBeChecked();
  });

  test('blank input id keeps the internal text label usable', async ({ page }) => {
    const toggle = page.getByTestId('wc-toggle');
    for (const id of ['', '   ']) {
      await toggle.evaluate((element, value) => {
        Reflect.set(element, 'inputId', value);
      }, id);
      await expect(toggle).toHaveAttribute('id', 'wc-host');
      await expect(toggle.locator('input')).toHaveAccessibleName('Web component setting');
      const inputId = await toggle.locator('input').getAttribute('id');
      expect(inputId?.trim().length).toBeGreaterThan(0);
    }
    await toggle.locator('label.text').click();
    await expect(toggle.locator('input')).toBeChecked();
  });

  test('blank explicit names retain the built-in accessible name without empty ARIA attributes', async ({
    page
  }) => {
    const toggle = page.getByTestId('wc-toggle');
    const input = toggle.locator('input');
    for (const value of ['', '   ']) {
      await toggle.evaluate((element, name) => {
        element.setAttribute('input-aria-label', name);
        element.setAttribute('input-aria-labelledby', name);
      }, value);
      await expect(input).toHaveAccessibleName('Web component setting');
      await expect(input).not.toHaveAttribute('aria-label');
      await expect(input).not.toHaveAttribute('aria-labelledby');
    }
    await toggle.locator('label.text').click();
    await expect(input).toBeChecked();
  });

  test('input-aria-labelledby resolves a label in the checkbox shadow root', async ({ page }) => {
    const toggle = page.getByTestId('wc-toggle');
    await expect(toggle.locator('input')).toHaveCount(1);
    await toggle.evaluate((element) => {
      const label = document.createElement('span');
      label.id = 'wc-internal-label';
      label.textContent = 'Same-root account alerts';
      element.shadowRoot?.prepend(label);
      element.setAttribute('aria-labelledby', 'wc-host-reference');
      element.setAttribute('input-aria-labelledby', 'wc-internal-label');
    });
    await expect(toggle.locator('input')).toHaveAccessibleName('Same-root account alerts');
    await expect(toggle.locator('input')).toHaveAttribute('aria-labelledby', 'wc-internal-label');
    await expect(toggle).toHaveAttribute('aria-labelledby', 'wc-host-reference');
  });
});

for (const index of [0, 1]) {
  test(`blank id ${index} still names and activates the checkbox`, async ({ page }) => {
    await page.goto('/components/toggle');
    const toggle = page.getByTestId(`toggle-blank-id-${index}`);
    const input = toggle.locator('input');
    await expect(input).toHaveAccessibleName(`Blank id setting ${index}`);
    const id = await input.getAttribute('id');
    expect(id?.trim().length).toBeGreaterThan(0);
    await toggle.locator('.text').click();
    await expect(input).toBeChecked();
  });
}
