import { expect, test } from '@playwright/test';

/**
 * A watchable companion to wc-form-association.spec.ts.
 *
 * That spec asserts the contract by reading FormData in JavaScript, which is the
 * right way to prove it and produces a recording of a nearly blank page: the
 * fixture it builds has no visible output, so the video shows almost nothing.
 * This drives static/wc-form-demo.html instead, where every control is visible
 * and what the form collects is printed on screen as it changes -- so the
 * recording shows the behaviour rather than merely accompanying it.
 *
 * It is not a duplicate: the assertions here read the rendered output, so they
 * would fail if the page showed something different from what the form holds.
 */
test.describe('a form of custom elements, end to end', () => {
  test('collecting, resetting and validating are all visible on the page', async ({ page }) => {
    await page.goto('/wc-form-demo.html');
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();

    const output = page.getByTestId('wc-form-output');
    const validity = page.getByTestId('wc-form-validity');

    // 1. Nothing has been submitted yet.
    await expect(output).toHaveText('(nothing collected yet)');

    // 2. The required checkbox is unchecked, so the form is invalid.
    await page.locator('#check').click();
    await expect(validity).toHaveText('form.checkValidity() → false');
    await page.waitForTimeout(500);

    // 3. Submitting is blocked by that. This is the sharpest proof that the
    //    browser is really consulting a shadow-rooted custom element: the click
    //    lands, the submit event never fires, and the output stays untouched.
    await page.locator('#submit').click();
    await page.waitForTimeout(500);
    await expect(output).toHaveText('(nothing collected yet)');

    // 4. Accept the terms; the form becomes valid and submit goes through.
    await page.locator('sui-checkbox').click();
    await page.waitForTimeout(400);
    await page.locator('#check').click();
    await expect(validity).toHaveText('form.checkValidity() → true');
    await page.locator('#submit').press('Enter');
    await expect(output).toContainText('email = ada@example.com');
    await expect(output).toContainText('terms = accepted');
    await expect(output).toContainText('notifications = on');
    await expect(output).toContainText('pay = wallet');
    await expect(output).toContainText('volume = 41');
    await expect(validity).toHaveText('form.checkValidity() → true');
    await page.waitForTimeout(800);

    // 5. Switch the radio group; exactly one entry changes.
    await page.locator('sui-radio[value="cod"]').click();
    await page.waitForTimeout(400);
    await page.locator('#submit').click();
    await expect(output).toContainText('pay = cod');
    await expect(output).not.toContainText('pay = wallet');
    await page.waitForTimeout(800);

    // 6. Reset restores every control's markup default -- including putting the
    //    required box back to unchecked, which makes the form invalid again.
    await page.locator('#reset').click();
    await page.waitForTimeout(700);
    await page.locator('#check').click();
    await expect(validity).toHaveText('form.checkValidity() → false');
    await page.waitForTimeout(900);
  });
});

test('rejected submissions report invalid before and after a successful submit', async ({
  page
}) => {
  await page.goto('/wc-form-demo.html');
  const submit = page.getByRole('button', { name: 'Submit' });
  const terms = page.getByRole('checkbox', { name: 'Accept terms' });
  const validity = page.getByTestId('wc-form-validity');
  const output = page.getByTestId('wc-form-output');
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(validity).toHaveText('form.checkValidity() → false');
  await expect(output).toHaveText('(nothing collected yet)');

  await terms.check();
  await submit.press('Enter');
  await expect(validity).toHaveText('form.checkValidity() → true');
  await expect(output).toContainText('terms = accepted');
  const submittedValues = await output.innerText();

  await terms.uncheck();
  await submit.click();
  await expect(validity).toHaveText('form.checkValidity() → false');
  await expect(output).toHaveText(submittedValues);
});

test('waits for the served bundle and stays unavailable if it fails', async ({ page }) => {
  await page.route('**/wc/index.js', (route) => route.abort());
  await page.goto('/wc-form-demo.html');

  await expect(page.getByRole('status').filter({ hasText: 'could not load' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'checkValidity()' })).toBeDisabled();
  await expect(page.getByTestId('wc-form-output')).toHaveText('(nothing collected yet)');
});

test.describe('standalone form on touch screens', () => {
  test('uses the device viewport while its controls are loading', async ({
    browser,
    browserName
  }) => {
    const page = await browser.newPage({
      viewport: { width: 320, height: 760 },
      isMobile: browserName !== 'firefox',
      hasTouch: true,
      baseURL: test.info().project.use.baseURL
    });
    let allowBundle: () => void = () => {};
    const bundleReady = new Promise<void>((resolve) => {
      allowBundle = resolve;
    });
    await page.route('**/wc/index.js', async (route) => {
      await bundleReady;
      await route.continue();
    });
    try {
      await page.goto('/wc-form-demo.html', { waitUntil: 'commit' });
      await expect(
        page.getByRole('status').filter({ hasText: 'Loading form controls' })
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
      await expect(page.getByTestId('wc-form-output')).toHaveText('(nothing collected yet)');
      expect(
        await page.evaluate(() => ({
          viewport: window.innerWidth,
          content: document.documentElement.scrollWidth,
          language: document.documentElement.lang
        }))
      ).toEqual({ viewport: 320, content: 320, language: 'en' });
    } finally {
      allowBundle();
    }
    const check = page.getByRole('button', { name: 'checkValidity()' });
    await expect(check).toBeEnabled();
    await check.tap();
    await expect(page.getByTestId('wc-form-validity')).toHaveText('form.checkValidity() → false');
    await page.close();
  });
});
