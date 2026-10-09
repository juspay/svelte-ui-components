import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('named Book remains reachable and turns the visible page with real arrow keys', async ({
  page
}) => {
  await gotoHydrated(page, '/components/book');
  const book = page.getByRole('region', { name: 'Chapter reader', exact: true });
  await book.evaluate((element) => {
    const entry = document.createElement('input');
    entry.id = 'book-keyboard-entry';
    element.before(entry);
  });
  await page.locator('#book-keyboard-entry').click();
  await page.keyboard.press('Tab');
  await expect(book).toBeFocused();
  await expect(book.getByRole('heading', { name: 'Chapter 1', exact: true })).toBeInViewport();
  await page.keyboard.press('ArrowRight');
  await expect(book.getByRole('heading', { name: 'Chapter 2', exact: true })).toBeInViewport();
  await expect(book.getByRole('heading', { name: 'Chapter 1', exact: true })).not.toBeInViewport();
  await page.keyboard.press('ArrowLeft');
  await expect(book.getByRole('heading', { name: 'Chapter 1', exact: true })).toBeInViewport();
  await expect(book).toBeFocused();
});

test('named native video loads and keeps native playback while image alt remains intact', async ({
  page,
  browserName
}) => {
  await gotoHydrated(page, '/components/media-player');
  const player = page.getByTestId('media-player-native-controls-demo');
  const video = player.locator('video');
  await expect(video).toHaveAccessibleName('Native controls video');
  await expect(page.getByTestId('media-player-image-demo').locator('img')).toHaveAccessibleName(
    'Sunset over the ocean'
  );
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(1);
  // Establish a paused starting state; playback below uses the browser's own painted control.
  await video.evaluate((element: HTMLVideoElement) => {
    element.pause();
    element.currentTime = 0;
  });
  await player.evaluate((element) => {
    const entry = document.createElement('input');
    entry.id = 'video-keyboard-entry';
    element.before(entry);
  });
  await page.locator('#video-keyboard-entry').click();
  await page.keyboard.press('Tab');
  await expect(video).toBeFocused();
  const activateNativePlayback = async (): Promise<void> => {
    if (browserName === 'webkit') {
      const bounds = await video.boundingBox();
      if (!bounds) {
        throw new Error('Native video must have a painted playback target');
      }
      // WebKit leaves Space inert even on a focused plain <video controls>. Its painted
      // Play/Pause control occupies the lower-left of the video's native controls bar.
      await video.click({ position: { x: 25, y: bounds.height - 20 } });
    } else {
      await page.keyboard.press('Space');
    }
  };
  await activateNativePlayback();
  await expect(video).toHaveJSProperty('paused', false);
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(0);
  await activateNativePlayback();
  await expect(video).toHaveJSProperty('paused', true);
  await expect(video).toHaveAccessibleName('Native controls video');
});

test('built Book and native video honor late WC labels without replacing native ARIA accessors', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.route('**/__naming-wc.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: readFileSync('dist-wc/index.js', 'utf8')
    })
  );
  await page.evaluate(async (moduleUrl) => {
    const module = await import(/* @vite-ignore */ moduleUrl);
    await Promise.all([
      customElements.whenDefined('sui-book'),
      customElements.whenDefined('sui-media-player')
    ]);
    const book = document.createElement('sui-book');
    book.id = 'naming-wc-book';
    Object.assign(book, {
      transition: 'none',
      pages: ['First guide page', 'Second guide page'].map((text) => ({
        content: module.createRawSnippet(() => ({ render: () => `<p>${text}</p>` }))
      }))
    });
    const video = document.createElement('sui-media-player');
    video.id = 'naming-wc-video';
    Object.assign(video, {
      type: 'video',
      src: '/demo-media/promo-clip.mp4',
      controls: true,
      autoplay: false,
      playing: false,
      muted: true
    });
    const entry = document.createElement('input');
    entry.id = 'naming-wc-entry';
    document.querySelector('main')?.prepend(entry, book, video);
  }, '/__naming-wc.js');
  const bookHost = page.locator('#naming-wc-book');
  const book = bookHost.getByRole('region');
  const videoHost = page.locator('#naming-wc-video');
  const video = videoHost.locator('video');
  await expect(book).toHaveAccessibleName('Book');
  await expect(video).toHaveAccessibleName('Video player');
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(1);
  await bookHost.evaluate((element) => element.setAttribute('aria-label', 'Reading guide'));
  await videoHost.evaluate((element) => element.setAttribute('aria-label', 'Training video'));
  await expect(book).toHaveAccessibleName('Reading guide');
  await expect(video).toHaveAccessibleName('Training video');
  await bookHost.evaluate((element) => Reflect.set(element, 'bookAriaLabel', 'Guide de lecture'));
  await videoHost.evaluate((element) => Reflect.set(element, 'mediaAriaLabel', 'Lecteur vidéo'));
  await expect(book).toHaveAccessibleName('Guide de lecture');
  await expect(video).toHaveAccessibleName('Lecteur vidéo');
  await expect(bookHost).toHaveAttribute('aria-label', 'Guide de lecture');
  await expect(videoHost).toHaveAttribute('aria-label', 'Lecteur vidéo');
  for (const host of [bookHost, videoHost]) {
    expect(
      await host.evaluate((element) =>
        Boolean(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'ariaLabel'))
      )
    ).toBe(false);
  }
  await page.locator('#naming-wc-entry').click();
  await page.keyboard.press('Tab');
  await expect(book).toBeFocused();
  await expect(book).toContainText('First guide page');
  await page.keyboard.press('ArrowRight');
  await expect(book).toContainText('Second guide page');
  await expect(book).not.toContainText('First guide page');
  await expect(video).toHaveAccessibleName('Lecteur vidéo');
});
