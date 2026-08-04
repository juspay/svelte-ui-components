import { expect, test } from '@playwright/test';

// Modal used to wrap ANY non-empty header.leftImage in role="button" + tabindex="0" with click and
// keydown handlers, whether or not onheaderLeftImageClick was supplied. Consumers pass a decorative
// brand/source logo there far more often than a back button, so assistive tech announced a focusable
// "button" that did nothing when activated — worse than leaving the image unannounced. The wrapper is
// now interactive only when a handler is actually supplied.
test.describe('Modal left image interactivity', () => {
  test('a decorative left image with no click handler is not a control', async ({ page }) => {
    await page.goto('/components/modal');
    await page.getByText('Open modal with decorative left image').click();

    const modal = page.getByTestId('decorative-left-image-modal');
    await expect(modal).toBeVisible();

    const leftImage = page.getByTestId('decorative-left-image');
    await expect(leftImage).toBeVisible();

    // Not announced as a control, and not reachable by keyboard.
    await expect(leftImage).not.toHaveAttribute('role', 'button');
    await expect(leftImage).not.toHaveAttribute('tabindex', /.*/);
    await expect(leftImage).not.toHaveAttribute('aria-label', /.+/);

    // The image itself still renders — this is an accessibility fix, not a visual removal.
    await expect(leftImage.locator('img, svg')).toBeVisible();
  });

  test('a left image with a click handler stays a fully keyboard-operable button', async ({
    page
  }) => {
    await page.goto('/components/modal');
    await page.getByText('Open modal with back button').click();

    const modal = page.getByTestId('back-button-modal');
    await expect(modal).toBeVisible();

    const backButton = page.getByTestId('back-button-left-image');
    await expect(backButton).toHaveAttribute('role', 'button');
    await expect(backButton).toHaveAttribute('tabindex', '0');
    await expect(backButton).toHaveAttribute('aria-label', 'Go back');

    const clickCount = page.getByTestId('back-button-click-count');
    await expect(clickCount).toHaveText('clicks: 0');

    await backButton.click();
    await expect(clickCount).toHaveText('clicks: 1');

    // Keyboard activation must keep working for the interactive case.
    await backButton.focus();
    await page.keyboard.press('Enter');
    await expect(clickCount).toHaveText('clicks: 2');

    await page.keyboard.press(' ');
    await expect(clickCount).toHaveText('clicks: 3');
  });
});
