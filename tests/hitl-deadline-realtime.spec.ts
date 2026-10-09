import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

test('an actual timer honors a short absolute expiry despite a thirty-second duration', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=30&offset=750`);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved', {
    timeout: 5000
  });
  await expect(page.getByTestId('deadline-card-completion')).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});
