import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { focusTabStopBefore } from './support/tab-order';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`capability demonstrations (${theme})`, () => {
    test.use({ colorScheme: theme });

    for (const [slug, name] of [
      ['lottie-player', 'LottiePlayer'],
      ['attachment-chip-row', 'AttachmentChipRow'],
      ['speech-synthesis', 'SpeechSynthesis']
    ]) {
      test(`${name} is linked, documented, titled and usable at 320px`, async ({ page }) => {
        await gotoHydrated(page, `/components/${slug}`);
        await expect(page).toHaveTitle(`${name} — Svelte UI`);
        const exampleLink = page.getByRole('link', { name: 'interactive example', exact: true });
        expect(
          await exampleLink.evaluate((element) =>
            element instanceof HTMLAnchorElement ? element.href : ''
          )
        ).toBe(new URL(`/components/${slug}`, page.url()).href);
        await expect(
          page.getByRole('heading', { name: 'Documentation', exact: true })
        ).toBeVisible();
        await expect(
          page.locator('aside nav').getByRole('link', { name, exact: true })
        ).toHaveAttribute('aria-current', 'page');
        await page.setViewportSize({ width: 320, height: 640 });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth
            )
          )
          .toBe(0);
      });
    }

    test('Lottie uses real SVG movement, pause, stop, speed, completion and looping', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/lottie-player');
      const preview = page.getByRole('img', { name: 'Animation preview', exact: true });
      await expect(preview).toBeVisible();
      await expect(preview.getByTestId('lottie-demo')).toHaveCount(1);
      const drawing = page.getByTestId('lottie-demo').locator('svg');
      await expect(drawing).toBeVisible();
      await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeEnabled();
      const position = () => drawing.locator('g[transform]').first().getAttribute('transform');
      const initial = await position();
      await page.getByRole('button', { name: 'Play animation', exact: true }).click();
      await expect.poll(position).not.toBe(initial);
      await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
      const paused = await position();
      await page.waitForTimeout(150);
      expect(await position()).toBe(paused);
      await page.getByRole('button', { name: 'Stop animation', exact: true }).click();
      await expect.poll(position).toBe(initial);
      await page.getByLabel('Playback speed', { exact: true }).selectOption('2');
      await expect(page.getByLabel('Playback speed', { exact: true })).toHaveAccessibleName(
        'Playback speed'
      );
      await page.getByRole('button', { name: 'Play animation', exact: true }).click();
      await expect(page.getByTestId('lottie-status')).toHaveText('Completed');
      await page.getByLabel('Loop animation', { exact: true }).check();
      await expect(drawing).toBeVisible();
      await page.getByRole('button', { name: 'Play animation', exact: true }).click();
      await page.waitForTimeout(1300);
      await expect(page.getByTestId('lottie-status')).toHaveText('Playing');
      await page.getByRole('button', { name: 'Stop animation', exact: true }).click();
      await expect(page.getByTestId('lottie-status')).toHaveText('Stopped');
      await page.getByRole('button', { name: 'Show load error', exact: true }).click();
      await expect(page.getByTestId('lottie-status')).toHaveText('Animation could not load');
      await page.getByRole('button', { name: 'Reset animation', exact: true }).click();
      await expect(drawing).toBeVisible();
      await expect(page.getByTestId('lottie-status')).toHaveText('Ready');
      await page.getByRole('button', { name: 'Play animation', exact: true }).click();
      await expect.poll(position).not.toBe(initial);
      await page.getByRole('button', { name: 'Reset animation', exact: true }).click();
      await expect(page.getByTestId('lottie-status')).toHaveText('Ready');
      await expect.poll(position).toBe(initial);
    });

    test('attachments open local previews, remove the right item and reset', async ({ page }) => {
      await gotoHydrated(page, '/components/attachment-chip-row');
      await expect(
        page.getByRole('button', { name: 'Remove landscape.svg', exact: true })
      ).toHaveCount(1);
      await expect(
        page.getByRole('button', { name: 'Remove promo-clip.mp4', exact: true })
      ).toHaveCount(1);
      for (let index = 1; index <= 6; index += 1) {
        await expect(
          page.getByRole('button', { name: `Remove notes-${index}.txt`, exact: true })
        ).toHaveCount(1);
      }
      await page.getByRole('button', { name: 'Open landscape.svg', exact: true }).click();
      await expect(page.getByTestId('attachment-preview').getByRole('img')).toHaveAttribute(
        'src',
        /attachment-landscape.svg$/
      );
      await page.getByRole('button', { name: 'Close preview', exact: true }).click();
      await page.getByRole('button', { name: 'Open notes-1.txt', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'Download notes-1.txt', exact: true })
      ).toHaveAttribute('download', 'notes-1.txt');
      await page.getByTestId('attachments-editable-remove-file-notes-1').click();
      await expect(page.getByTestId('attachment-feedback')).toHaveText('Removed notes-1.txt');
      await expect(page.getByRole('button', { name: 'Open notes-1.txt', exact: true })).toHaveCount(
        0
      );
      await page.getByRole('button', { name: 'Play promo-clip.mp4', exact: true }).click();
      await expect(page.getByTestId('attachment-preview').locator('video')).toHaveAttribute(
        'controls',
        ''
      );
      await page.getByRole('button', { name: 'Reset attachments', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Open notes-1.txt', exact: true })
      ).toBeVisible();
      await page.setViewportSize({ width: 320, height: 640 });
      expect(
        await page
          .getByTestId('attachments-readonly')
          .locator('.scroll-container')
          .evaluate((el) => el.scrollWidth > el.clientWidth)
      ).toBe(true);
      const strip = page.getByTestId('attachments-readonly').locator('.scroll-container');
      await expect(strip).toHaveAttribute('aria-label', 'Pending attachments');
      await expect(strip).toHaveAttribute('tabindex', '0');
      await strip.scrollIntoViewIfNeeded();
      await focusTabStopBefore(strip);
      await page.keyboard.press('Tab');
      await expect(strip).toBeFocused();
      const before = await strip.evaluate((element) => element.scrollLeft);
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => strip.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(before);
      await page.keyboard.press('Tab');
      await expect(strip).not.toBeFocused();
    });

    test('speech separates native capability from deterministic simulated state/error paths', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/speech-synthesis');
      const supported = await page.evaluate(() => 'speechSynthesis' in window);
      await expect(page.getByTestId('speech-support')).toContainText(
        supported ? 'Speech API available' : 'unavailable'
      );
      await page.getByLabel('Text to read', { exact: true }).fill('A short native speech example.');
      await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
      // Native headless voices/audio vary by platform; this proves the user path
      // invokes the real API and Stop, without claiming audible speech delivery.
      await page.getByRole('button', { name: 'Stop speech', exact: true }).click();
      await expect(page.getByTestId('speech-native-status')).toHaveText('Stopped');
      await page.getByRole('button', { name: 'Start simulated speech', exact: true }).click();
      await expect(page.getByTestId('speech-simulated-status')).toHaveText(
        'Simulated speech running'
      );
      await page.getByRole('button', { name: 'Stop simulated speech', exact: true }).click();
      await expect(page.getByTestId('speech-simulated-status')).toHaveText(
        'Simulated speech stopped'
      );
      await page.getByRole('button', { name: 'Start simulated speech', exact: true }).click();
      await expect(page.getByTestId('speech-simulated-status')).toHaveText(
        'Simulated speech stopped'
      );
      await page.getByRole('button', { name: 'Show simulated error', exact: true }).click();
      await expect(page.getByTestId('speech-simulated-error')).toContainText(
        'Could not read this text aloud'
      );
      await page.getByRole('button', { name: 'Try unavailable speech', exact: true }).click();
      await expect(page.getByTestId('speech-unavailable-error')).toHaveText(
        'Speech playback is not supported in this browser.'
      );
      await page.goto('/components/button');
      await expect(page.getByRole('heading', { name: 'Button', exact: true })).toBeVisible();
    });
  });
}
