import { expect, test, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// With inlineTriggers set, ChatComposer paints its textarea text transparent and lets a text layer
// behind it draw the words. Its ::selection rule then has to bring the selected text back, and it
// used to set only `color`: a ::selection rule that sets any property replaces the browser's own
// highlight, so the highlight background fell to transparent and selected text looked unselected.
//
// What the spec pins:
//   - With nothing set, the highlight is painted, and it differs from the surface under it.
//   - --chat-composer-selection-background replaces it.

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/chat-composer-selection/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const selectHello = async (page: Page, host: string) => {
  const input = page.locator(`[data-pw="${host}"] textarea`);
  await expect(input).toHaveClass(/inline-mentions/);
  await input.focus();
  return input.evaluate((textarea: HTMLTextAreaElement) => {
    textarea.setSelectionRange(0, 5);
    let surface: Element | null = textarea;
    let surfaceBackground = 'rgba(0, 0, 0, 0)';
    while (surface && surfaceBackground === 'rgba(0, 0, 0, 0)') {
      surfaceBackground = getComputedStyle(surface).backgroundColor;
      surface = surface.parentElement;
    }
    return {
      selectedText: textarea.value.slice(textarea.selectionStart, textarea.selectionEnd),
      background: getComputedStyle(textarea, '::selection').backgroundColor,
      surfaceBackground
    };
  });
};

test.describe('ChatComposer inline-mention selection', () => {
  test('paints a visible highlight by default', async ({ page }) => {
    await openFixture(page);
    const selection = await selectHello(page, 'ccs-mentions');

    expect(selection.selectedText).toBe('hello');
    expect(selection.background, JSON.stringify(selection)).not.toBe(TRANSPARENT);
    expect(selection.background, JSON.stringify(selection)).not.toBe(selection.surfaceBackground);
  });

  test('takes its highlight from --chat-composer-selection-background', async ({ page }) => {
    await openFixture(page);
    const selection = await selectHello(page, 'ccs-token');

    expect(selection.selectedText).toBe('hello');
    expect(selection.background).toBe('rgb(254, 240, 138)');
  });
});
