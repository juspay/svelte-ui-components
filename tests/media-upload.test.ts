import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

test.describe('MediaUpload', () => {
  test('selecting a file adds a card and updates the counter', async ({ page }) => {
    await page.goto('/components/media-upload');

    const upload = page.getByTestId('media-upload-demo');
    await expect(upload.locator('.counter')).toHaveText('0 / 3');

    await upload.locator('input[type="file"]').setInputFiles(path.join(fixtures, 'tiny.png'));

    await expect(upload.locator('.card')).toHaveCount(1);
    await expect(upload.locator('.counter')).toHaveText('1 / 3');
    await expect(upload.locator('.meta-name')).toHaveText('tiny.png');
  });

  test('an image card renders a thumbnail via Img', async ({ page }) => {
    await page.goto('/components/media-upload');

    const upload = page.getByTestId('media-upload-demo');
    await upload.locator('input[type="file"]').setInputFiles(path.join(fixtures, 'tiny.png'));

    await expect(upload.locator('.card img')).toBeVisible();
  });

  test('a file over maxFileSize is rejected with a visible alert, no card added', async ({
    page
  }) => {
    await page.goto('/components/media-upload');

    const upload = page.getByTestId('media-upload-demo');
    await upload.locator('input[type="file"]').setInputFiles(path.join(fixtures, 'too-large.png'));

    await expect(upload.locator('.card')).toHaveCount(0);
    await expect(upload.getByRole('alert')).toBeVisible();
    await expect(upload.getByRole('alert')).toContainText('too large');
  });

  test('removing a card via its remove button updates the counter', async ({ page }) => {
    await page.goto('/components/media-upload');

    const upload = page.getByTestId('media-upload-demo');
    await upload.locator('input[type="file"]').setInputFiles(path.join(fixtures, 'tiny.png'));
    await expect(upload.locator('.card')).toHaveCount(1);

    await upload.locator('.remove button').click();

    await expect(upload.locator('.card')).toHaveCount(0);
    await expect(upload.locator('.counter')).toHaveText('0 / 3');
  });

  test('the drop tile disappears once maxLength is reached', async ({ page }) => {
    await page.goto('/components/media-upload');

    const upload = page.getByTestId('media-upload-demo');
    await upload
      .locator('input[type="file"]')
      .setInputFiles([
        path.join(fixtures, 'tiny.png'),
        path.join(fixtures, 'tiny-2.png'),
        path.join(fixtures, 'tiny-3.png')
      ]);

    await expect(upload.locator('.card')).toHaveCount(3);
    await expect(upload.locator('.drop-tile')).toHaveCount(0);
  });
});
