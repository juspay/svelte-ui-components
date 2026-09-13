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
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-input') !== 'undefined', null, {
      timeout: 15_000
    });
    // Let every element upgrade and render before anything is read.
    await page.waitForTimeout(600);

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
    await page.locator('#submit').click();
    await expect(output).toContainText('email = ada@example.com');
    await expect(output).toContainText('terms = accepted');
    await expect(output).toContainText('notifications = on');
    await expect(output).toContainText('pay = wallet');
    await expect(output).toContainText('volume = 41');
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
