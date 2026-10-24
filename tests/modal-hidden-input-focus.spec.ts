import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

for (const type of ['hidden', 'HiDdEn']) {
  test(`Modal ignores ${type} form identities for native entry and both Tab edges`, async ({
    page
  }) => {
    await page.goto(`${fixtureBaseURL}/modal-hidden-input/?type=${type}&tabindex=0`);
    await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
    const trigger = page.getByTestId('open-modal');
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Controlled token review', exact: true });
    const cancel = panel.getByRole('button', { name: 'Cancel', exact: true });
    const confirm = panel.getByRole('button', { name: 'Confirm token', exact: true });
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(confirm).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(confirm).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId('submissions')).toHaveText('0');
    await trigger.click();
    await expect(cancel).toBeFocused();
    await cancel.press('Enter');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId('submissions')).toHaveText('0');
    await trigger.click();
    await expect(cancel).toBeFocused();
    await confirm.press('Enter');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId('submissions')).toHaveText('1');
    await expect(page.getByTestId('submitted-token')).toHaveText('controlled-token');
  });
}

test('Modal retains its existing panel fallback with only hidden form identities', async ({
  page
}) => {
  await page.goto(`${fixtureBaseURL}/modal-hidden-input/?controls=none&type=HIDDEN&tabindex=0`);
  await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
  const trigger = page.getByTestId('open-modal');
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Controlled token review', exact: true });
  await expect(panel).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    await expect(panel).toBeFocused();
  }
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId('submissions')).toHaveText('0');
});
