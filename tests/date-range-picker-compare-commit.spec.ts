import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * Compare mode, through the two demos that ship it. A pick in the compare calendar is a draft:
 * Apply commits it, and Cancel, Escape and an outside press leave the committed range as it was.
 *
 * Before the draft was exposed to `compareCalendar` the demos could not do this. In the standalone
 * demo Apply was disabled on first use, then wrote the range the panel opened with back over the
 * pick, and Cancel kept the pick; in the inline demo a compare range never committed at all.
 */

// Day buttons are labelled by the browser's locale; the expected result text is built here.
test.use({ locale: 'en-US' });

const ROUTE = '/components/date-range-picker';

const monthNow = (page: Page) =>
  page.evaluate(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

const formatDay = (year: number, month: number, day: number): string =>
  new Date(year, month, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const rangeText = (year: number, month: number, from: number, to: number): string =>
  `${formatDay(year, month, from)} – ${formatDay(year, month, to)}`;

/** The in-month day buttons of the displayed month, so the nth is day n + 1. */
const pickRange = async (calendar: Locator, from: number, to: number): Promise<void> => {
  const days = calendar.locator('[role="gridcell"] button');
  await days.nth(from - 1).click();
  await days.nth(to - 1).click();
};

const pressOutside = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'DateRangePicker' }).click();

test('standalone compare panel: Apply commits the pick; Cancel, Escape and an outside press discard it', async ({
  page
}) => {
  await gotoHydrated(page, ROUTE);
  const { year, month } = await monthNow(page);
  const demo = page.getByTestId('drp-standalone-compare-demo');
  const result = page.getByTestId('drp-standalone-compare-demo-result');
  const panel = demo.locator('.drp-compare-panel');
  const apply = panel.getByRole('button', { name: 'Apply compare selection' });
  const openPanel = () => demo.getByRole('button', { name: 'Open compare period picker' }).click();

  await expect(result).toHaveText('Compare range: None – None');

  await openPanel();
  await expect(apply).toBeDisabled();
  await pickRange(panel, 5, 8);
  await expect(apply).toBeEnabled();
  // A pick is a draft: nothing is committed until Apply.
  await expect(result).toHaveText('Compare range: None – None');
  await apply.click();
  await expect(panel).toHaveCount(0);
  const committed = `Compare range: ${rangeText(year, month, 5, 8)}`;
  await expect(result).toHaveText(committed);

  const ways: Array<[string, () => Promise<void>]> = [
    ['Cancel', () => panel.getByRole('button', { name: 'Cancel compare selection' }).click()],
    ['Escape', () => page.keyboard.press('Escape')],
    ['an outside press', () => pressOutside(page)]
  ];
  for (const [name, leave] of ways) {
    await test.step(`leaving with ${name} keeps the committed range`, async () => {
      await openPanel();
      await pickRange(panel, 12, 15);
      await expect(apply).toBeEnabled();
      await leave();
      await expect(panel).toHaveCount(0);
      await expect(result).toHaveText(committed);
    });
  }

  // The panel still works after those: a new pick commits over the old one.
  await openPanel();
  await pickRange(panel, 12, 15);
  await apply.click();
  await expect(result).toHaveText(`Compare range: ${rangeText(year, month, 12, 15)}`);
});

test('inline compare calendar: the main Apply commits the compare pick; Cancel and Escape discard it', async ({
  page
}) => {
  await gotoHydrated(page, ROUTE);
  const { year, month } = await monthNow(page);
  const demo = page.getByTestId('drp-compare-demo');
  const result = page.getByTestId('drp-compare-demo-result');
  const panel = demo.getByRole('dialog').first();
  const mainCalendar = panel.getByRole('grid').first();
  const compareCalendar = panel.locator('.drp-compare-section');
  const openPanel = () => demo.getByRole('button', { name: 'Open date picker' }).click();

  await expect(result).toHaveText('Compare range: None selected');

  await openPanel();
  await pickRange(mainCalendar, 2, 4);
  await pickRange(compareCalendar, 5, 8);
  await expect(result).toHaveText('Compare range: None selected');
  await panel.getByRole('button', { name: 'Apply date selection' }).click();
  const committed = `Compare range: ${rangeText(year, month, 5, 8)}`;
  await expect(result).toHaveText(committed);

  await openPanel();
  await pickRange(compareCalendar, 12, 15);
  await panel.getByRole('button', { name: 'Cancel date selection' }).click();
  await expect(panel).toHaveCount(0);
  await expect(result).toHaveText(committed);

  await openPanel();
  await pickRange(compareCalendar, 12, 15);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(result).toHaveText(committed);
});
