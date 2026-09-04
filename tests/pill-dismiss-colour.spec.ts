import { expect, test } from '@playwright/test';

const expectBareDismiss = async (
  dismiss: import('@playwright/test').Locator,
  colour: string
): Promise<void> => {
  await expect(dismiss.locator('svg')).toHaveCSS('color', colour);
  await expect(dismiss).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(dismiss).toHaveCSS('background-image', 'none');
  await expect(dismiss).toHaveCSS('border-width', '0px');
};

test.describe('Pill dismiss glyph colour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/pill');
    await page.mouse.move(0, 0);
  });

  for (const fixture of [
    { id: 'pill-dismiss-under-button-token', colour: 'rgb(18, 52, 86)' },
    { id: 'pill-dismiss-under-variant-rule', colour: 'rgb(30, 30, 30)' }
  ]) {
    for (const state of ['rest', 'hover', 'pointer-active', 'keyboard-active', 'focus']) {
      test(`${fixture.id} keeps a bare glyph at ${state}`, async ({ page }) => {
        const dismiss = page.getByTestId(`${fixture.id}-dismiss`);
        await expect(dismiss).toBeVisible();
        if (fixture.id === 'pill-dismiss-under-variant-rule') {
          const consumerVariant = await dismiss.evaluate((element) =>
            getComputedStyle(element).getPropertyValue('--consumer-variant').trim()
          );
          expect(['primary', 'ghost']).toContain(consumerVariant);
        }
        try {
          if (state === 'hover' || state === 'pointer-active') {
            await dismiss.hover();
            expect(await dismiss.evaluate((element) => element.matches(':hover'))).toBe(true);
          }
          if (state === 'pointer-active') {
            await page.mouse.down();
            expect(await dismiss.evaluate((element) => element.matches(':active'))).toBe(true);
          }
          if (state === 'keyboard-active' || state === 'focus') {
            await page.keyboard.press('Tab');
            await dismiss.focus();
            expect(await dismiss.evaluate((element) => element.matches(':focus-visible'))).toBe(
              true
            );
          }
          if (state === 'keyboard-active') {
            await page.keyboard.down('Space');
            expect(await dismiss.evaluate((element) => element.matches(':active'))).toBe(true);
          }
          await expectBareDismiss(dismiss, fixture.colour);
          if (state === 'focus' && fixture.id === 'pill-dismiss-under-variant-rule') {
            await expect(dismiss).toHaveCSS('box-shadow', 'rgb(0, 91, 211) 0px 0px 0px 2px');
          }
        } finally {
          await page.mouse.up();
          await page.keyboard.up('Space');
        }
      });
    }
  }

  test('honours separate dismiss and hover colours', async ({ page }) => {
    const dismiss = page.getByTestId('pill-dismiss-custom-colour-dismiss');
    await expectBareDismiss(dismiss, 'rgb(18, 52, 86)');
    await dismiss.hover();
    await expectBareDismiss(dismiss, 'rgb(101, 67, 33)');
  });

  test('disabled dismiss remains disabled and uses the consumer disabled palette', async ({
    page
  }) => {
    const dismiss = page.getByTestId('pill-dismiss-disabled-dismiss');
    await expect(dismiss).toBeDisabled();
    await expect(dismiss).toHaveAccessibleName('Dismiss');
    await expect(dismiss.locator('svg')).toHaveCSS('color', 'rgb(181, 181, 181)');
    await expect(dismiss).toHaveCSS('background-color', 'rgb(241, 241, 241)');
    await dismiss.click({ force: true });
    await expect(page.getByTestId('pill-dismiss-count')).toHaveText('0');
  });

  test('dismiss fires once by pointer and once by keyboard', async ({ page }) => {
    const dismiss = page.getByTestId('pill-dismiss-under-variant-rule-dismiss');
    await dismiss.click();
    await expect(page.getByTestId('pill-dismiss-count')).toHaveText('1');
    await dismiss.press('Space');
    await expect(page.getByTestId('pill-dismiss-count')).toHaveText('2');
  });

  test('the same sheet still themes normal primary and ghost Buttons', async ({ page }) => {
    const primary = page.getByTestId('pill-consumer-primary');
    const ghost = page.getByTestId('pill-consumer-ghost');
    await expect(primary).toHaveCSS('background-color', 'rgb(48, 48, 48)');
    await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(ghost).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(ghost).toHaveCSS('color', 'rgb(30, 30, 30)');
    await primary.hover();
    await expect(primary).toHaveCSS('background-color', 'rgb(26, 26, 26)');
    await ghost.hover();
    await expect(ghost).toHaveCSS('background-color', 'rgb(241, 241, 241)');
  });
});

test('interactive Pill does not intercept keyboard activation of its dismiss button', async ({
  page
}) => {
  await page.goto('/components/pill');
  const dismiss = page.getByTestId('pill-interactive-dismiss');
  await dismiss.press('Space');
  await expect(page.getByTestId('pill-dismiss-count')).toHaveText('1');
  await expect(page.getByTestId('pill-click-count')).toHaveText('0');
  await dismiss.press('Enter');
  await expect(page.getByTestId('pill-dismiss-count')).toHaveText('2');
  await expect(page.getByTestId('pill-click-count')).toHaveText('0');
  await page.getByTestId('pill-interactive').press('Space');
  await expect(page.getByTestId('pill-click-count')).toHaveText('1');
});

test('sui-pill supplies a visible default dismiss glyph and honours a slotted glyph', async ({
  page
}) => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-pill')));
  await page.evaluate(() => {
    const pill = document.createElement('sui-pill');
    pill.setAttribute('data-pw', 'wc-pill');
    pill.setAttribute('text', 'Dismissible web component');
    pill.setAttribute('dismissible', '');
    document.body.prepend(pill);
  });
  const pill = page.getByTestId('wc-pill');
  const dismiss = pill.getByRole('button', { name: 'Dismiss' });
  await expect(dismiss).toBeVisible();
  await expect(dismiss.locator('svg')).toBeVisible();
  await pill.evaluate((element) => element.setAttribute('dismiss-label', 'Remove framework'));
  await expect(pill.getByRole('button', { name: 'Remove framework' })).toBeVisible();
  await pill.evaluate((element) => element.setAttribute('dismiss-label', '   '));
  await expect(pill.getByRole('button', { name: 'Dismiss' })).toBeVisible();
  await page.evaluate(() => {
    // Svelte discovers named slots when the element connects, not after its first render.
    const customPill = document.createElement('sui-pill');
    customPill.setAttribute('data-pw', 'wc-custom-pill');
    customPill.setAttribute('text', 'Custom dismiss glyph');
    customPill.setAttribute('dismissible', '');
    const glyph = document.createElement('span');
    glyph.setAttribute('slot', 'dismiss-icon');
    glyph.textContent = 'Remove';
    customPill.append(glyph);
    document.body.prepend(customPill);
  });
  const customPill = page.getByTestId('wc-custom-pill');
  await expect(customPill.locator('[slot="dismiss-icon"]')).toBeVisible();
  expect(
    await customPill
      .locator('[slot="dismiss-icon"]')
      .evaluate((element) => element.assignedSlot !== null)
  ).toBe(true);
  await expect(customPill.getByRole('button', { name: 'Dismiss' }).locator('svg')).toHaveCount(0);
});
