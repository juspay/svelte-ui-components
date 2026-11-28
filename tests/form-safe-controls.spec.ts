import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

test.beforeEach(async ({ page }) => {
  await page.goto(`${fixtureBaseURL}/form-safe-controls/`);
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('Book page indicators navigate without submitting the form', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to page 2' }).press('Space');
  await expect(page.getByText('Second book page', { exact: true })).toBeVisible();
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('a Gallery thumbnail activates without submitting the form', async ({ page }) => {
  await page.getByRole('button', { name: 'Draft photo' }).click();
  await expect(page.getByTestId('previews')).toHaveText('Previews: 1');
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('numbered pagination changes pages without submitting the form', async ({ page }) => {
  const pagination = page.getByTestId('numbered-pages');
  const current = page.getByTestId('current-page');
  const submissions = page.getByTestId('submissions');
  const previous = pagination.getByRole('button', { name: 'Previous page' });
  const next = pagination.getByRole('button', { name: 'Next page' });

  await next.click();
  await expect(current).toHaveText('Page: 3');
  await expect(next).toBeDisabled();
  await expect(submissions).toHaveText('Submissions: 0');

  await previous.press('Enter');
  await expect(current).toHaveText('Page: 2');
  await expect(submissions).toHaveText('Submissions: 0');

  await pagination.getByRole('button', { name: 'Page 1', exact: true }).click();
  await expect(current).toHaveText('Page: 1');
  await expect(previous).toBeDisabled();
  await expect(submissions).toHaveText('Submissions: 0');
});

test('cursor pagination loads more without submitting the form', async ({ page }) => {
  await page.getByTestId('cursor-pages').getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByTestId('loaded')).toHaveText('Loaded: 1');
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('both Tabs scroll arrows work without submitting the form', async ({ page }) => {
  const tabs = page.getByTestId('tabs');
  const scroll = () => tabs.getByRole('tablist').evaluate((element) => element.scrollLeft);
  await tabs.getByRole('button', { name: 'Scroll tabs right' }).click();
  await expect.poll(scroll).toBeGreaterThan(1);
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
  const offset = await scroll();
  await tabs.getByRole('button', { name: 'Scroll tabs left' }).press('Enter');
  await expect.poll(scroll).toBeLessThan(offset);
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('the Table paginator changes rows without submitting the form', async ({ page }) => {
  const table = page.getByTestId('table');
  await expect(table.getByText('First row', { exact: true })).toBeVisible();
  await table.getByRole('button', { name: 'Next page' }).click();
  await expect(table.getByText('Second row', { exact: true })).toBeVisible();
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 0');
});

test('the explicit form submitter submits and serializes the draft', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Draft' }).fill('My updated draft');
  await page.getByRole('button', { name: 'Save draft' }).press('Enter');
  await expect(page.getByTestId('submissions')).toHaveText('Submissions: 1');
  await expect(page.getByTestId('submitted-draft')).toHaveText('My updated draft');
});
