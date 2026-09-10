import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('MediaPlayer', () => {
  test('image type renders through Img, no video controls', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const imagePlayer = page.getByTestId('media-player-image-demo');
    await expect(imagePlayer.locator('img')).toBeVisible();
    await expect(imagePlayer.locator('video')).toHaveCount(0);
  });

  test('video type renders a video element with an accessible toggle role', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    const video = videoPlayer.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('role', 'button');
    await expect(video).toHaveAttribute('tabindex', '0');
  });

  test('clicking the video toggles its aria-label between play and pause', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

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
    await gotoHydrated(page, '/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    await videoPlayer.hover();

    const controls = videoPlayer.locator('.control button');
    await expect(controls).toHaveCount(2);
    await expect(controls.first()).toBeVisible();
  });

  test('the mute control toggles aria-label between Mute and Unmute', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const videoPlayer = page.getByTestId('media-player-video-demo');
    await videoPlayer.hover();

    const muteButton = videoPlayer.locator('.bottom-control button');
    await expect(muteButton).toHaveAttribute('aria-label', 'Unmute');

    await muteButton.click();
    await expect(muteButton).toHaveAttribute('aria-label', 'Mute');
  });

  test('keyboard focus (not just mouse hover) reveals the overlay controls', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

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
    await gotoHydrated(page, '/components/media-player');

    const video = page.getByTestId('media-player-native-controls-demo').locator('video');
    await expect(video).toBeVisible();
    await expect(video).not.toHaveAttribute('role', 'button');
    await expect(video).not.toHaveAttribute('tabindex', '0');
    await expect(video).toHaveAttribute('controls', '');
  });

  test('playing bindable, pause direction: an external host setting it false actually pauses', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

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
    await gotoHydrated(page, '/components/media-player');

    const video = page.getByTestId('media-player-external-play-demo').locator('video');
    const button = page.getByTestId('external-play-toggle');

    // Starts paused (autoplay off, playing initial false); same contract, opposite direction.
    await expect(video).toHaveJSProperty('paused', true);

    await button.click();
    await expect(video).toHaveJSProperty('paused', false);
  });

  test('no captionsSrc renders no track element at all', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const video = page.getByTestId('media-player-video-demo').locator('video');
    await expect(video.locator('track')).toHaveCount(0);
  });

  // ── seek bar, time display, fullscreen (the transport row) ──────────────────

  test('the three transport controls are opt-in: a default player renders none of them', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const plain = page.getByTestId('media-player-video-demo');
    await plain.hover();

    await expect(plain.getByTestId('media-player-video-demo-seek')).toHaveCount(0);
    await expect(plain.getByTestId('media-player-video-demo-time')).toHaveCount(0);
    await expect(plain.getByTestId('media-player-video-demo-fullscreen')).toHaveCount(0);
    // Still exactly the two it always had: play and mute.
    await expect(plain.locator('.control button')).toHaveCount(2);
  });

  test('a transport player renders the seek bar, the time and the fullscreen button', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    await player.hover();

    await expect(player.getByTestId('media-player-transport-demo-seek')).toBeVisible();
    await expect(player.getByTestId('media-player-transport-demo-time')).toBeVisible();
    await expect(player.getByTestId('media-player-transport-demo-fullscreen')).toBeVisible();
    // Play, mute and fullscreen.
    await expect(player.locator('.control button')).toHaveCount(3);
  });

  test('duration binds out once metadata loads, and the time display reads m:ss', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    const video = player.locator('video');
    await video.evaluate(
      (el: HTMLVideoElement) =>
        el.readyState > 0 ||
        new Promise((resolve) => el.addEventListener('loadedmetadata', resolve, { once: true }))
    );

    // The host's readout is bound to the component's own duration, so a non-zero value
    // here proves the binding, not just that the video knows its length.
    await expect(page.getByTestId('transport-readout')).not.toContainText('duration=0.0');
    await expect(player.getByTestId('media-player-transport-demo-time')).toHaveText(
      /^\d+:\d{2} \/ \d+:\d{2}$/
    );
  });

  test('seeking moves the media and reports the position through onseek', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    const video = player.locator('video');

    // Wait on the component's own duration, not the element's readyState. The seek is a
    // no-op until duration is known -- seeking to a fraction of an unknown length is
    // meaningless -- so dispatching before then tests nothing and passes for the wrong
    // reason. The readout is bound to the component, so this waits on the real precondition.
    await expect(page.getByTestId('transport-readout')).not.toContainText('duration=0.0');
    await player.hover();

    // Drive the Slider's own input rather than clicking a pixel offset: the assertion is
    // about what the component does with a seek, not about where the track happens to sit.
    const slider = player.getByTestId('media-player-transport-demo-seek').locator('input');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '1';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // The element actually moved. The demo player is paused, so a non-zero position here
    // can only have come from the seek rather than from playback drifting past the check.
    await expect
      .poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime))
      .toBeGreaterThan(0.5);
    await expect(page.getByTestId('transport-readout')).toContainText('lastSeek=1.0');
  });

  test('currentTime bindable, inward direction: an external host write actually seeks', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    const video = player.locator('video');

    // Wait on the component's own duration: a seek is clamped against it, so writing
    // before it is known would test the guard rather than the binding.
    await expect(page.getByTestId('transport-readout')).not.toContainText('duration=0.0');
    await expect(video).toHaveJSProperty('currentTime', 0);

    // The button never touches the video element -- it only assigns a host-side $state
    // bound to `currentTime`, exactly like a consumer restoring a saved position.
    await page.getByTestId('external-seek-toggle').click();

    await expect
      .poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime))
      .toBeGreaterThan(2);
  });

  test('an external write is not echoed back as a deliberate seek', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    await expect(page.getByTestId('transport-readout')).not.toContainText('duration=0.0');

    // `onseek` means "the user scrubbed". A host restoring a position is not a scrub, and
    // reporting it as one would make a save/restore cycle look like user intent forever.
    await page.getByTestId('external-seek-toggle').click();
    await expect
      .poll(async () => player.locator('video').evaluate((el: HTMLVideoElement) => el.currentTime))
      .toBeGreaterThan(2);

    // -1 is the demo's untouched sentinel, deliberately not 0: a literal 0 would be
    // indistinguishable from a real scrub to the start of the media.
    await expect(page.getByTestId('transport-readout')).toContainText('lastSeek=-1.0');
  });

  test('the seek bar carries an accessible name', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    await player.hover();

    // A bare range input announces only its value. Without a name a screen-reader user
    // is told "50" with no indication that it scrubs the media.
    const slider = player.getByTestId('media-player-transport-demo-seek').locator('input');
    await expect(slider).toHaveAttribute('aria-label', 'Seek');
  });

  test('the transport controls are reachable by keyboard, not hover only', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    const seek = player.getByTestId('media-player-transport-demo-seek').locator('input');

    // Never hover. A visibility:hidden element cannot take focus, so if the overlay only
    // revealed on :hover the Tab below could never land here.
    await player.locator('video').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(seek).toBeFocused();
    await expect(seek).toBeVisible();
  });

  test('the fullscreen button asks the container, not the video, to go fullscreen', async ({
    page
  }) => {
    // Headless Chromium will not grant real fullscreen, so record which element was asked.
    // Patched before the page loads, so the component's own call is the one observed rather
    // than a patch racing the click. The contract under test is the target: asking the
    // <video> would take the overlay's play, mute and seek controls off screen with it.
    await page.addInitScript(() => {
      const store: { target: string } = { target: 'none' };
      Object.defineProperty(window, '__fullscreenTarget', { value: store, writable: false });
      Element.prototype.requestFullscreen = function patched(this: Element) {
        store.target = `${this.tagName.toLowerCase()}.${this.className}`;
        return Promise.resolve();
      };
    });
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId('media-player-transport-demo');
    await player.hover();
    await player.locator('[data-pw="media-player-transport-demo-fullscreen"] button').click();

    const asked = await page.evaluate(
      () =>
        (window as unknown as { __fullscreenTarget: { target: string } }).__fullscreenTarget.target
    );
    expect(asked).toContain('div');
    expect(asked).toContain('media-player');
    expect(asked).not.toContain('video');
  });

  test('a supplied captionsSrc renders a real track element', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    const track = page.getByTestId('media-player-captions-demo').locator('track');
    await expect(track).toHaveAttribute('kind', 'captions');
    await expect(track).toHaveAttribute('label', 'English');
    await expect(track).toHaveAttribute('srclang', 'en');
    const src = await track.getAttribute('src');
    expect(src).toContain('promo-clip.vtt');
  });
});
