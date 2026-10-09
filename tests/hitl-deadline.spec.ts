import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { fixtureBaseURL } from './support/fixture-server';

const fixedTime = new Date('2026-10-04T00:00:00Z');

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: fixedTime });
});

test('server absolute expiry wins over a longer relative duration', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=30&offset=5000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(5100);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await expect(page.getByTestId('deadline-card-completion')).toBeVisible();
});

test('a suspended-tab clock jump settles the relative fallback once', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=10&relative=true`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('an already elapsed server expiry cannot restart a replayed duration', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=30&offset=-1000`);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('zero countdown retains the manual-only contract', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=0&offset=-1000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

test('history never fires a replayed confirmation', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=30&offset=-1000&history=true`);
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

test('a disabled card cannot auto-approve an elapsed deadline or restart after enabling', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=-1000&disabled=true`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeDisabled();
  await page.clock.fastForward(60_000);
  await page.getByTestId('toggle-disabled').click();
  await expect(page.getByTestId('deadline-card-confirm')).toBeEnabled();
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
  await page.getByTestId('deadline-card-confirm').click();
  await expect(page.getByTestId('deadline-events')).toHaveText('1:approved');
});

test('interaction pauses an absolute deadline and leaves manual approval available', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await page.getByTestId('deadline-card-action-0').click();
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
  await page.getByTestId('deadline-card-cancel').click();
  await expect(page.getByTestId('deadline-events')).toHaveText('1:rejected');
});

test('unmount clears the running deadline timer without dispatching', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await page.getByTestId('unmount').click();
  await page.clock.fastForward(60_000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

for (const invalidOffset of ['NaN', 'Infinity']) {
  test(`a non-finite expiry (${invalidOffset}) uses the relative wall-clock fallback`, async ({
    page
  }) => {
    await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=2&offset=${invalidOffset}`);
    await page.clock.fastForward(2100);
    await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  });
}

test('extending a mounted absolute deadline prevents approval at the old expiry', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(1000);
  await page.getByTestId('extend-deadline').click();
  await page.clock.fastForward(5100);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
  await page.clock.fastForward(15000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('shortening a mounted absolute deadline approves once at the revised expiry', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=20000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(1000);
  await page.getByTestId('shorten-deadline').click();
  await page.clock.fastForward(2100);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('relative fallback remains anchored across presentation and duration updates', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=5&relative=true`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(1000);
  await page.getByTestId('rerender').click();
  await page.clock.fastForward(4100);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('clearing an absolute deadline uses the original relative fallback', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=5&offset=20000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.clock.fastForward(1000);
  await page.getByTestId('clear-deadline').click();
  await page.getByTestId('rerender').click();
  await page.clock.fastForward(4100);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('zeroing a running countdown prevents deadline updates from restarting it', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.getByTestId('disable-countdown').click();
  await page.clock.fastForward(200);
  await page.getByTestId('shorten-deadline').click();
  await page.getByTestId('rerender').click();
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

test('deadline replacement cannot restart a countdown stopped by disabled approval', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await expect(page.getByTestId('deadline-card-confirm')).toBeVisible();
  await page.getByTestId('toggle-disabled').click();
  await page.clock.fastForward(200);
  await page.getByTestId('shorten-deadline').click();
  await page.getByTestId('toggle-disabled').click();
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

test('deadline replacement cannot restart an interaction-paused countdown', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await page.getByTestId('deadline-card-action-0').click();
  await page.getByTestId('shorten-deadline').click();
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
});

test('deadline replacement cannot emit another decision after settlement', async ({ page }) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=5000`);
  await page.clock.fastForward(5100);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await page.getByTestId('extend-deadline').click();
  await page.getByTestId('shorten-deadline').click();
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('elapsed deadline waits for initial async mute then restores before approval', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=-1000&mic=defer`);
  await expect(page.getByTestId('mic-pending')).toHaveText('pending');
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
  await page.getByTestId('release-mic').click();
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await expect(page.getByTestId('mic-state')).toHaveText('unmuted:2');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await expect(page.getByTestId('mic-state')).toHaveText('unmuted:2');
});

test('failed initial mute keeps elapsed approval once-only without a restoration toggle', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?offset=-1000&mic=reject`);
  await expect(page.getByTestId('mic-pending')).toHaveText('pending');
  await page.getByTestId('release-mic').click();
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
  await expect(page.getByTestId('mic-state')).toHaveText('unmuted:1');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('1:auto-approved');
});

test('manual-only deadline restores a completed initial mute on user approval', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/hitl-deadline/?seconds=0&offset=-1000&mic=defer`);
  await expect(page.getByTestId('mic-pending')).toHaveText('pending');
  await page.getByTestId('release-mic').click();
  await expect(page.getByTestId('mic-state')).toHaveText('muted:1');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('deadline-events')).toHaveText('0:none');
  await page.getByTestId('deadline-card-confirm').click();
  await expect(page.getByTestId('deadline-events')).toHaveText('1:approved');
  await expect(page.getByTestId('mic-state')).toHaveText('unmuted:2');
});
