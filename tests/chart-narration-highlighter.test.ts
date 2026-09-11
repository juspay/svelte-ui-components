import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `createNarrationHighlighter` is covered as a unit in
 * `src/lib/_chart/narrationHighlighter.test.ts`, against a recording stub. That
 * proves the matching, the once-per-turn guard and the timers, and proves
 * nothing about whether a real chart highlights when it is driven.
 *
 * These run it against a mounted `LineChart` through the same `onChartReady`
 * API a consumer gets, so the two ends are pinned together: the orchestrator
 * picks a category index, and the chart actually moves.
 */
test.describe('LineChart narration sync', () => {
  test('highlights each month as the transcript names it', async ({ page }) => {
    await gotoHydrated(page, '/components/line-chart');

    const readout = page.getByTestId('narration-highlighted');
    const transcript = page.getByTestId('narration-transcript');

    await expect(readout).toHaveText('nothing highlighted');
    await expect(transcript).toHaveText('');

    await page.getByTestId('narration-play').click();

    // Feb is named first, so it is highlighted before the rest is spoken.
    await expect(readout).toHaveText('last matched Feb');
    // ...and the transcript that triggered it really does contain the word.
    await expect(transcript).toContainText('Feb');

    await expect(readout).toHaveText('last matched Jun');
    await expect(readout).toHaveText('last matched Nov');

    // The order matters: a matcher that fired on the whole script at once, or
    // that ignored the once-per-turn guard, would not step through them.
    await expect(transcript).toContainText('easing off');
  });

  test('the chart itself renders the highlight, not just the readout', async ({ page }) => {
    await gotoHydrated(page, '/components/line-chart');

    // The readout is the demo's own state, driven by the same `narrator` the
    // "Highlight Hook" LineChart below was bound to in onChartReady. This
    // asserts the component reacted: that chart's Feb dot is drawn with the
    // "highlighted" styling the imperative API turns on, not merely that some
    // chart on the page has an SVG.
    const chart = page.getByTestId('line-highlight-hook-chart');
    const highlightedDot = chart.locator('circle.dot.highlighted');

    await expect(highlightedDot).toHaveCount(0);

    await page.getByTestId('narration-play').click();
    await expect(page.getByTestId('narration-highlighted')).toHaveText('last matched Feb');

    // Only one point highlights at a time, so this is Feb's dot.
    await expect(highlightedDot).toHaveCount(1);
  });

  test('replaying resets, so the same months can highlight again', async ({ page }) => {
    await gotoHydrated(page, '/components/line-chart');
    const readout = page.getByTestId('narration-highlighted');

    await page.getByTestId('narration-play').click();
    await expect(readout).toHaveText('last matched Nov');

    await page.getByTestId('narration-play').click();
    // Without reset() the fired set would still hold Feb and it would never
    // highlight again on a second turn.
    await expect(readout).toHaveText('last matched Feb');
  });
});
