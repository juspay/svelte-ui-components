import { expect, test, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-017: the FileInput demos shared one `acceptedFiles`/`errorMessage` pair, so the
 * images-only control's rejection ("has an unsupported type") and its accepted PNG were
 * reported beneath the unrelated *basic* drop zone, while the control a person had just
 * used showed nothing. The card demo wrote into the same shared list.
 *
 * Every assertion here is positional: feedback must sit in the same demo row as the control
 * that produced it, and an upload into one demo must leave every other demo's feedback
 * exactly as it was.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string): string => path.join(here, 'fixtures', name);
const textFile = {
  name: 'audit-upload.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('audit upload')
};

const DEMOS = [
  'file-input-basic',
  'file-input-images',
  'file-input-multi',
  'file-input-card'
] as const;
/** The demo that hands the action to its own Button (activation="trigger"). */
const OWNED = 'file-input-owned';
type Demo = (typeof DEMOS)[number] | typeof OWNED;

/** The demo's own row: the container that holds its control and, beneath it, its feedback. */
const row = (page: Page, demo: Demo): Locator =>
  page
    .getByTestId(demo)
    .locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " demo-row ")][1]'
    );

const upload = (page: Page, demo: Demo, files: Parameters<Locator['setInputFiles']>[0]) =>
  page.getByTestId(`${demo}-input`).setInputFiles(files);

type Texts = Record<(typeof DEMOS)[number], string>;

/** What each of the original four rows currently says, ignoring the control's own label. */
const rowTexts = async (page: Page): Promise<Texts> => {
  const entries = await Promise.all(
    DEMOS.map(async (demo) => {
      const text = await row(page, demo).evaluate((el) => {
        const clone = el.cloneNode(true);
        if (!(clone instanceof HTMLElement)) {
          return '';
        }
        clone.querySelectorAll('.file-input').forEach((node) => node.remove());
        return (clone.innerText ?? '').replace(/\s+/g, ' ').trim();
      });
      return [demo, text] as const;
    })
  );
  return Object.fromEntries(entries) as Texts;
};

const expectOthersUnchanged = (before: Texts, after: Texts, producer: Demo): void => {
  for (const demo of DEMOS) {
    if (demo !== producer) {
      expect(after[demo], `${demo} must not change when ${producer} is used`).toBe(before[demo]);
    }
  }
};

test.describe('FileInput feedback belongs to the example that produced it', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/file-input');
  });

  test('a wrong file type is reported under the images-only control, not under the basic drop zone', async ({
    page
  }) => {
    await upload(page, 'file-input-basic', fixture('tiny.png'));
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny.png');
    const before = await rowTexts(page);

    await upload(page, 'file-input-images', textFile);

    const images = row(page, 'file-input-images');
    await expect(images).toContainText('"audit-upload.txt" has an unsupported type.');
    expectOthersUnchanged(before, await rowTexts(page), 'file-input-images');
    await expect(row(page, 'file-input-basic')).not.toContainText('unsupported');
  });

  test('the rejection is an alert the control is described by, directly beneath it', async ({
    page
  }) => {
    await upload(page, 'file-input-images', textFile);

    const region = page.getByTestId('file-input-images');
    const alert = page.getByTestId('file-input-images-error-message');
    await expect(alert).toHaveAttribute('role', 'alert');
    await expect(alert).toContainText('unsupported type');
    // The accessibility link, resolved the way a screen reader does: the id on the region
    // must name an element that is rendered and carries the text.
    const describedBy = await region.getAttribute('aria-describedby');
    expect(describedBy).toBe(await alert.getAttribute('id'));

    const controlBox = await region.boundingBox();
    const alertBox = await alert.boundingBox();
    if (controlBox === null || alertBox === null) {
      throw new Error('control or alert has no box');
    }
    expect(alertBox.y).toBeGreaterThanOrEqual(controlBox.y + controlBox.height - 1);
    expect(alertBox.y - (controlBox.y + controlBox.height)).toBeLessThan(40);
  });

  test('a valid PNG is accepted beside the images-only control and leaves the others alone', async ({
    page
  }) => {
    await upload(page, 'file-input-basic', fixture('tiny-2.png'));
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny-2.png');
    const before = await rowTexts(page);

    await upload(page, 'file-input-images', fixture('tiny.png'));

    await expect(row(page, 'file-input-images')).toContainText('Accepted: tiny.png');
    await expect(page.getByTestId('file-input-images-error-message')).toHaveCount(0);
    expectOthersUnchanged(before, await rowTexts(page), 'file-input-images');
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny-2.png');
  });

  test('a size rejection replaces the previous accepted file and names the 1 MB limit', async ({
    page
  }) => {
    await upload(page, 'file-input-images', fixture('tiny.png'));
    await expect(row(page, 'file-input-images')).toContainText('Accepted: tiny.png');
    const before = await rowTexts(page);

    await upload(page, 'file-input-images', fixture('too-large.png'));

    const images = row(page, 'file-input-images');
    await expect(images).toContainText('"too-large.png" exceeds the 1.0 MB limit.');
    await expect(images).not.toContainText('Accepted:');
    expectOthersUnchanged(before, await rowTexts(page), 'file-input-images');
  });

  test('a multiple-file result is reported under the multiple demo only', async ({ page }) => {
    await upload(page, 'file-input-images', fixture('tiny.png'));
    await expect(row(page, 'file-input-images')).toContainText('Accepted: tiny.png');
    const before = await rowTexts(page);

    await upload(page, 'file-input-multi', [fixture('tiny.png'), fixture('tiny-2.png')]);

    await expect(row(page, 'file-input-multi')).toContainText('2 file(s): tiny.png, tiny-2.png');
    expectOthersUnchanged(before, await rowTexts(page), 'file-input-multi');
  });

  test('the card demo no longer writes into the basic demo', async ({ page }) => {
    await upload(page, 'file-input-basic', fixture('tiny.png'));
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny.png');
    const before = await rowTexts(page);

    await upload(page, 'file-input-card', fixture('tiny-3.png'));

    await expect(row(page, 'file-input-card')).toContainText('Accepted: tiny-3.png');
    expectOthersUnchanged(before, await rowTexts(page), 'file-input-card');
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny.png');
  });

  test('four uploads into four demos each leave exactly their own result', async ({ page }) => {
    await upload(page, 'file-input-basic', fixture('tiny.png'));
    await upload(page, 'file-input-images', textFile);
    await upload(page, 'file-input-multi', [fixture('tiny.png'), fixture('tiny-2.png')]);
    await upload(page, 'file-input-card', fixture('tiny-3.png'));

    await expect(row(page, 'file-input-basic')).toHaveText(/Accepted: tiny\.png$/);
    await expect(row(page, 'file-input-images')).toContainText('unsupported type');
    await expect(row(page, 'file-input-multi')).toContainText('2 file(s): tiny.png, tiny-2.png');
    await expect(row(page, 'file-input-card')).toContainText('Accepted: tiny-3.png');
    const texts = await rowTexts(page);
    expect(texts['file-input-basic']).not.toMatch(/unsupported|tiny-2|tiny-3/);
    expect(texts['file-input-images']).not.toMatch(/Accepted|tiny/);
  });

  test('the demo whose Button owns the action reports under itself and leaves the rest alone', async ({
    page
  }) => {
    await upload(page, 'file-input-basic', fixture('tiny.png'));
    await expect(row(page, 'file-input-basic')).toContainText('Accepted: tiny.png');
    const before = await rowTexts(page);

    await upload(page, OWNED, fixture('tiny-2.png'));

    await expect(row(page, OWNED)).toContainText('Accepted: tiny-2.png');
    expectOthersUnchanged(before, await rowTexts(page), OWNED);
  });

  test('a mixed drop reports both the rejected and the accepted file, in the control that took it', async ({
    page
  }) => {
    const region = page.getByTestId('file-input-images');
    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' }));
      transfer.items.add(new File(['x'], 'notes.txt', { type: 'text/plain' }));
      return transfer;
    });

    await region.dispatchEvent('drop', { dataTransfer });

    const images = row(page, 'file-input-images');
    await expect(images).toContainText('Accepted: photo.png');
    await expect(images).toContainText('"notes.txt" has an unsupported type.');
    await expect(row(page, 'file-input-basic')).not.toContainText('notes.txt');
  });

  test('every demo reserves a polite live region before it has anything to say', async ({
    page
  }) => {
    const everyDemo: readonly Demo[] = [...DEMOS, OWNED];
    for (const demo of everyDemo) {
      const status = page.getByTestId(`${demo}-result`);
      await expect(status, `${demo} result region`).toHaveAttribute('role', 'status');
      await expect(status).toBeEmpty();
      await expect(row(page, demo).locator('[role="status"]')).toHaveCount(1);
    }
    // Present already, so filling it is a change a screen reader announces rather than a
    // new element it may never notice.
    await upload(page, 'file-input-multi', [fixture('tiny.png'), fixture('tiny-2.png')]);
    await expect(page.getByTestId('file-input-multi-result')).toContainText('2 file(s)');
  });
});

test.describe('FileDropzoneTrigger demos report each upload under their own control', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/file-dropzone-trigger');
  });

  const result = (page: Page, name: string): Locator => page.getByTestId(name);

  test('an accepted file and a rejected file land under the control that took them', async ({
    page
  }) => {
    const logo = page.locator('.file-input').nth(0).locator('input[type="file"]');
    const compact = page.locator('.file-input').nth(1).locator('input[type="file"]');
    const muted = page.locator('.file-input').nth(2).locator('input[type="file"]');

    await logo.setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('x')
    });
    await expect(result(page, 'file-dropzone-trigger-accepted')).toContainText(
      'Accepted: logo.png'
    );

    await compact.setInputFiles(textFile);
    await expect(page.locator('.demo-row').nth(1).getByRole('alert')).toContainText(
      '"audit-upload.txt" has an unsupported type.'
    );

    await muted.setInputFiles({ name: 'data.csv', mimeType: 'text/csv', buffer: Buffer.from('a') });
    await expect(result(page, 'file-dropzone-trigger-muted-accepted')).toContainText(
      'Accepted: data.csv'
    );

    // None of the three reported into another.
    await expect(result(page, 'file-dropzone-trigger-accepted')).toHaveText('Accepted: logo.png');
    await expect(result(page, 'file-dropzone-trigger-compact-accepted')).toBeEmpty();
    await expect(result(page, 'file-dropzone-trigger-muted-accepted')).toHaveText(
      'Accepted: data.csv'
    );
  });
});
