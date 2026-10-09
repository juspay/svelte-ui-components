import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('IframeViewer example delivers the real outbound ping to its embedded document', async ({
  page
}) => {
  await gotoHydrated(page, '/components/iframe-viewer');
  const frame = page.frameLocator('[data-pw="iframe-viewer-messaging"] iframe');
  await expect(frame.locator('#log')).toHaveText('Waiting for a message…');
  await page.getByRole('button', { name: 'Send message to iframe', exact: true }).click();
  await expect(frame.locator('#log')).toHaveText(/^Received: \{"type":"ping","at":\d+\}$/);
});
