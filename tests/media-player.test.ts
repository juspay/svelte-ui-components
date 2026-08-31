import { expect, test } from '@playwright/test';

test.describe('MediaPlayer', () => {
  test('image type renders through Img, no video controls', async ({ page }) => {
    await page.goto('/components/media-player');

    const imagePlayer = page.getByTestId('media-player-image-demo');
    await expect(imagePlayer.locator('img')).toBeVisible();
    await expect(imagePlayer.locator('video')).toHaveCount(0);
  });

  test('video type renders a video element with an accessible toggle role', async ({ page }) => {
    await page.goto('/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    const video = videoPlayer.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('role', 'button');
    await expect(video).toHaveAttribute('tabindex', '0');
  });

  test('clicking the video toggles its aria-label between play and pause', async ({ page }) => {
    await page.goto('/components/media-player');

    const video = page.getByTestId('media-player-video-demo').locator('video');
    await video.evaluate((el: HTMLVideoElement) => {
      el.muted = true;
      return el.play();
    });
    await expect(video).toHaveAttribute('aria-label', 'Pause video');

    await video.click();
    await expect(video).toHaveAttribute('aria-label', 'Play video');
  });

  test('hovering reveals the overlay controls, which are real Button instances', async ({
    page
  }) => {
    await page.goto('/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    await videoPlayer.hover();

    const controls = videoPlayer.locator('.control button');
    await expect(controls).toHaveCount(2);
    await expect(controls.first()).toBeVisible();
  });

  test('the mute control toggles aria-label between Mute and Unmute', async ({ page }) => {
    await page.goto('/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    await videoPlayer.hover();

    const muteButton = videoPlayer.locator('.bottom-control button');
    await expect(muteButton).toHaveAttribute('aria-label', 'Unmute');

    await muteButton.click();
    await expect(muteButton).toHaveAttribute('aria-label', 'Mute');
  });

  test('keyboard focus (not just mouse hover) reveals the overlay controls', async ({ page }) => {
    await page.goto('/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    const playButton = videoPlayer.locator('.center-control button');

    // Not hovering at all -- reach the button purely via keyboard.
    await videoPlayer.locator('video').focus();
    await page.keyboard.press('Tab');
    await expect(playButton).toBeFocused();
    await expect(playButton).toBeVisible();
  });

  test('native controls mode omits the custom button role/tabindex from the video', async ({
    page
  }) => {
    await page.goto('/components/media-player');

    const video = page.getByTestId('media-player-native-controls-demo').locator('video');
    await expect(video).toBeVisible();
    await expect(video).not.toHaveAttribute('role', 'button');
    await expect(video).not.toHaveAttribute('tabindex', '0');
    await expect(video).toHaveAttribute('controls', '');
  });

  test('playing bindable, pause direction: an external host setting it false actually pauses', async ({
    page
  }) => {
    await page.goto('/components/media-player');

    const video = page.getByTestId('media-player-external-pause-demo').locator('video');
    const button = page.getByTestId('external-pause-toggle');

    // Starts autoplaying (default `playing = true`); the button never touches the video
    // element directly, only a host-side `$state` bound to `playing` -- exactly like a real
    // consumer's bind:playing. If the fix works, the player reacts on its own.
    await expect(video).toHaveJSProperty('paused', false);

    await button.click();
    await expect(video).toHaveJSProperty('paused', true);
  });

  test('playing bindable, play direction: an external host setting it true actually plays', async ({
    page
  }) => {
    await page.goto('/components/media-player');

    const video = page.getByTestId('media-player-external-play-demo').locator('video');
    const button = page.getByTestId('external-play-toggle');

    // Starts paused (autoplay off, playing initial false); same contract, opposite direction.
    await expect(video).toHaveJSProperty('paused', true);

    await button.click();
    await expect(video).toHaveJSProperty('paused', false);
  });

  test('no captionsSrc renders no track element at all', async ({ page }) => {
    await page.goto('/components/media-player');

    const video = page.getByTestId('media-player-video-demo').locator('video');
    await expect(video.locator('track')).toHaveCount(0);
  });

  test('a supplied captionsSrc renders a real track element', async ({ page }) => {
    await page.goto('/components/media-player');

    const track = page.getByTestId('media-player-captions-demo').locator('track');
    await expect(track).toHaveAttribute('kind', 'captions');
    await expect(track).toHaveAttribute('label', 'English');
    await expect(track).toHaveAttribute('srclang', 'en');
    const src = await track.getAttribute('src');
    expect(src).toContain('promo-clip.vtt');
  });
});
