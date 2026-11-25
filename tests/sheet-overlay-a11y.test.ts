import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('Sheet backdrop accessibility', () => {
  test('the dialog and its controls are outside the dismiss button', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
    await page.getByText('Open with footer', { exact: true }).click();
    const sheet = page.getByTestId('sheet-footer');
    const panel = sheet.getByRole('dialog', { name: 'Confirm' });
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((el) => el.closest('button, [role="button"]') !== null)).toBe(
      false
    );
    const backdrop = sheet.getByRole('button', { name: 'Close sheet', exact: true });
    await expect(backdrop).toHaveAttribute('type', 'button');
    await expect(backdrop).toHaveAttribute('tabindex', '-1');
    await expect(panel.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  });

  test('a non-dismissible overlay has no backdrop button', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
    await page.getByTestId('sheet-blocking-trigger').click();
    const sheet = page.getByTestId('sheet-blocking');
    await expect(sheet.getByRole('dialog')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Close sheet', exact: true })).toHaveCount(0);
    await expect(sheet).not.toHaveAttribute('role', 'button');
  });

  test('a custom accessible name is applied to the dismissal target', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
    await page.getByTestId('sheet-custom-overlay-label-trigger').click();
    await expect(
      page.getByTestId('sheet-custom-overlay-label').getByRole('button', { name: 'Fermer' })
    ).toBeVisible();
  });

  test('an invisible dismissible backdrop still exposes its named action', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
    await page.getByTestId('sheet-anchored-trigger').click();
    const sheet = page.getByTestId('sheet-anchored');
    await expect(sheet.getByRole('button', { name: 'Close sheet', exact: true })).toBeVisible();
  });

  test('dragging between panel and backdrop leaves the dialog open', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
    const opener = page.getByTestId('sheet-right-trigger');
    await opener.focus();
    await opener.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Settings' });
    await expect(panel).toHaveCSS('transform', 'none');
    const bounds = await panel.boundingBox();
    if (!bounds) {
      throw new Error('Expected the open Sheet panel to have bounds.');
    }
    const inside = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const outside = { x: 5, y: inside.y };
    for (const [from, to] of [
      [inside, outside],
      [outside, inside]
    ]) {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 6 });
      await page.mouse.up();
      await expect(panel.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    }
    await page.keyboard.press('Shift+Tab');
    await expect(panel.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.mouse.click(outside.x, outside.y);
    await expect(panel).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe('Sheet panel focus indicator', () => {
  test('a keyboard-opened sheet (side="right") shows a visible focus ring on the panel', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    // .press() dispatches a real key event, which is what puts the browser in
    // keyboard input modality -- the precondition :focus-visible checks before
    // showing a ring for the panel's subsequent programmatic focus() call.
    // The testId lands on Button's real <button> element, which is what makes
    // Enter a synthetic click rather than a keypress on an inert text node.
    await page.getByTestId('sheet-right-trigger').press('Enter');
    const panel = page.getByTestId('sheet-right-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    await expect(panel).toBeFocused();
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');
  });

  test('a keyboard-opened sheet (side="bottom") shows a visible focus ring on the panel', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-bottom-trigger').press('Enter');
    const panel = page.getByTestId('sheet-bottom-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    await expect(panel).toBeFocused();
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');
  });

  test('a mouse-opened sheet (side="right") keeps the panel default outline unchanged', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-right-trigger').click();
    const panel = page.getByTestId('sheet-right-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    // A mouse click is not keyboard modality, so :focus-visible must not
    // match here -- the existing visual design (no ring) stays unchanged for
    // the common mouse-driven case.
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('none');
  });
});

test.describe('Sheet backdrop keyboard activation', () => {
  test('Tab from a programmatically focused backdrop re-enters the dialog in either direction', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');
    await page.getByText('Open with footer', { exact: true }).click();
    const sheet = page.getByTestId('sheet-footer');
    const panel = sheet.getByRole('dialog', { name: 'Confirm' });
    const backdrop = sheet.getByRole('button', { name: 'Close sheet', exact: true });
    await backdrop.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(panel.getByRole('button', { name: 'Save' })).toBeFocused();
    await backdrop.focus();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  });

  for (const key of ['Enter', 'Space']) {
    test(`the native dismiss button closes on ${key}`, async ({ page }) => {
      await gotoHydrated(page, '/components/sheet');
      const opener = page.getByTestId('sheet-right-trigger');
      await opener.focus();
      await opener.press('Enter');
      const sheet = page.getByTestId('sheet-right');
      const backdrop = sheet.getByRole('button', { name: 'Close sheet', exact: true });
      await expect(backdrop).toBeVisible();
      await backdrop.focus();
      await page.keyboard.press(key);
      await expect(sheet).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }
});
