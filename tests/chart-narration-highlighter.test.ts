import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import {
  installNarrationObserver,
  readNarrationEvidence,
  stopNarrationObserver,
  narrationProblems
} from './support/narration-observer';

// Observe short phases before the trusted action. Playback and product code stay native.
test.describe('LineChart narration sync', () => {
  test('highlights each month as the transcript names it', async ({ page }, testInfo) => {
    await gotoHydrated(page, '/components/line-chart');
    const readout = page.getByTestId('narration-highlighted');
    const transcript = page.getByTestId('narration-transcript');
    await expect(readout).toHaveText('nothing highlighted');
    await expect(transcript).toHaveText('');
    await expect(page.getByTestId('line-highlight-hook-chart').locator('circle.dot')).toHaveCount(
      12
    );
    await installNarrationObserver(page);
    try {
      await page.getByTestId('narration-play').click();
      await expect
        .poll(async () => narrationProblems(await readNarrationEvidence(page), 1), {
          timeout: 5000
        })
        .toEqual([]);
      await expect(transcript).toContainText('easing off');
    } finally {
      await testInfo.attach('native-narration-chronology', {
        body: JSON.stringify(await stopNarrationObserver(page), null, 2),
        contentType: 'application/json'
      });
    }
  });

  test('the chart itself renders the highlight, not just the readout', async ({
    page
  }, testInfo) => {
    await gotoHydrated(page, '/components/line-chart');
    const chart = page.getByTestId('line-highlight-hook-chart');
    await expect(chart.locator('circle.dot')).not.toHaveCount(0);
    await expect(chart.locator('circle.dot.highlighted')).toHaveCount(0);
    await expect(chart.locator('circle.dot')).toHaveCount(12);
    await installNarrationObserver(page);
    try {
      await page.getByTestId('narration-play').click();
      // One highlighted dot is insufficient: it must be the actual Feb mark at index1,
      // with matching focus-label/coordinates, highlight radius/ring and crosshair.
      await expect
        .poll(async () => narrationProblems(await readNarrationEvidence(page), 1, ['Feb']), {
          timeout: 5000
        })
        .toEqual([]);
    } finally {
      await testInfo.attach('native-narration-chronology', {
        body: JSON.stringify(await stopNarrationObserver(page), null, 2),
        contentType: 'application/json'
      });
    }
  });

  test('replaying resets, so the same months can highlight again', async ({ page }, testInfo) => {
    await gotoHydrated(page, '/components/line-chart');
    await expect(page.getByTestId('line-highlight-hook-chart').locator('circle.dot')).toHaveCount(
      12
    );
    await installNarrationObserver(page);
    try {
      await page.getByTestId('narration-play').click();
      await expect
        .poll(async () => narrationProblems(await readNarrationEvidence(page), 1), {
          timeout: 5000
        })
        .toEqual([]);
      await page.getByTestId('narration-play').click();
      // A new trusted generation and observed reset exclude stale first-turn Nov/Feb.
      await expect
        .poll(async () => narrationProblems(await readNarrationEvidence(page), 2), {
          timeout: 5000
        })
        .toEqual([]);
    } finally {
      await testInfo.attach('native-narration-chronology', {
        body: JSON.stringify(await stopNarrationObserver(page), null, 2),
        contentType: 'application/json'
      });
    }
  });
});
