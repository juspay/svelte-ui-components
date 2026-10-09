import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

test.beforeEach(async ({ page }) => {
  await page.goto(
    `${process.env.COMPOSITE_VALIDITY_BASE_URL ?? fixtureBaseURL}/composite-validity/`
  );
  await expect(page.getByRole('heading', { name: 'Composite form validity' })).toBeVisible();
});

test('native submit retains the first invalid visible owner and submits only after every required control is valid', async ({
  page
}) => {
  const submit = page.getByRole('button', { name: 'Submit order', exact: true });
  const radio = page.getByRole('radio', { name: 'Cash payment', exact: true });
  const choice = page.getByRole('checkbox', { name: 'Accept order', exact: true });
  const rating = page.getByRole('slider', { name: 'Order confidence', exact: true });
  const output = page.getByTestId('submitted');
  await submit.click();
  await expect(radio).toBeFocused();
  await expect(output).toBeEmpty();
  await page.keyboard.press('Space');
  await expect(radio).toBeChecked();
  await submit.click();
  await expect(choice).toBeFocused();
  await expect(output).toBeEmpty();
  await page.keyboard.press('Space');
  await expect(choice).toBeChecked();
  await submit.click();
  await expect(rating).toBeFocused();
  await expect(output).toBeEmpty();
  await page.keyboard.press('ArrowRight');
  await expect(rating).toHaveAttribute('aria-valuenow', '1');
  await submit.click();
  await expect(output).toHaveText('[["payment","cash"],["choice","accepted"],["confidence","1"]]');
});

test('checkValidity is silent and reportValidity focuses the first invalid custom control', async ({
  page
}) => {
  const before = page.getByRole('textbox', { name: 'Before validation', exact: true });
  await page.getByRole('button', { name: 'Submit order', exact: true }).click();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: 'Cash payment', exact: true })).toBeChecked();
  await before.click();
  expect(
    await page.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity())
  ).toBe(false);
  await expect(before).toBeFocused();
  expect(
    await page.locator('form').evaluate((form) => (form as HTMLFormElement).reportValidity())
  ).toBe(false);
  await expect(page.getByRole('checkbox', { name: 'Accept order', exact: true })).toBeFocused();
});
