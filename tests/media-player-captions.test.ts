import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-031: the shipped captions example rendered a `<track>` whose mode stayed `disabled`
 * and offered nothing a viewer could press to change that -- the custom overlay replaces the
 * browser's own controls, and the captions menu with them.
 *
 * What these tests drive is the real thing in each engine: a real `<video>` playing the real
 * promo clip, a real WebVTT file fetched and parsed by the browser, and the browser painting
 * the cues. A track whose `mode` a test sets to `hidden` proves only that cues LOAD, so none
 * of the claims below rests on that -- each goes through the toggle a viewer would use, then
 * reads what the browser did (mode, cues, active cue) and, for display, what it painted.
 *
 * The one stand-in is the native-controls case: Playwright cannot operate a browser's own
 * captions menu, so a test there sets `textTracks[0].mode` itself, which is the same write the
 * menu performs. It proves the component follows the track; it does not drive the menu.
 */

const PLAYER = 'media-player-captions-demo';
const CUE_ONE = 'Introducing the new collection.';
const CUE_TWO = 'Available now, in every size.';

type TrackState = { mode: string | null; cues: number | null; active: string[] };

const trackState = (video: Locator): Promise<TrackState> =>
  video.evaluate((el: HTMLVideoElement) => {
    const track = el.textTracks[0];
    return {
      mode: track ? track.mode : null,
      cues: track && track.cues ? track.cues.length : null,
      active:
        track && track.activeCues ? Array.from(track.activeCues, (cue) => (cue as VTTCue).text) : []
    };
  });

// `exact`: the demo page also has a host button whose label mentions "captions", and role-name
// matching is a case-insensitive substring by default.
const toggleOf = (player: Locator): Locator =>
  player.getByRole('button', { name: 'Captions', exact: true });

// The video element itself is also a role=button with the same name, so the overlay's own
// transport button is addressed through its wrapper.
const transportButton = (player: Locator): Locator => player.locator('.center-control button');

type Rect = { x0: number; y0: number; x1: number; y1: number };

/**
 * Pixels that differ between two same-size PNGs, with the box they occupy, leaving out a
 * rectangle (the toggle, whose own glyph changes with its state). Decoded in the page because
 * the test process has no image decoder; the data is local, so the canvas is not tainted.
 */
const diffPngs = (
  page: Page,
  a: Buffer,
  b: Buffer,
  ignore: Rect
): Promise<{ changed: number; box: Rect | null; width: number; height: number }> =>
  page.evaluate(
    async ([aData, bData, skip]) => {
      const decode = async (data: string): Promise<ImageData> => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (context === null) {
          throw new Error('no 2d context');
        }
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      };
      const first = await decode(aData as string);
      const second = await decode(bData as string);
      const ignored = skip as Rect;
      let changed = 0;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -1;
      let y1 = -1;
      for (let y = 0; y < first.height; y++) {
        for (let x = 0; x < first.width; x++) {
          if (x >= ignored.x0 && x <= ignored.x1 && y >= ignored.y0 && y <= ignored.y1) {
            continue;
          }
          const i = (y * first.width + x) * 4;
          const delta =
            Math.abs(first.data[i] - second.data[i]) +
            Math.abs(first.data[i + 1] - second.data[i + 1]) +
            Math.abs(first.data[i + 2] - second.data[i + 2]);
          if (delta > 90) {
            changed++;
            x0 = Math.min(x0, x);
            y0 = Math.min(y0, y);
            x1 = Math.max(x1, x);
            y1 = Math.max(y1, y);
          }
        }
      }
      return {
        changed,
        box: changed > 0 ? { x0, y0, x1, y1 } : null,
        width: first.width,
        height: first.height
      };
    },
    [a.toString('base64'), b.toString('base64'), ignore] as const
  );

/**
 * A screenshot taken once the painted frame has stopped changing. A paused `<video>` repaints a
 * few frames after a seek or a track-mode change, and an engine can hand back the previous frame
 * for a moment -- comparing such a capture would measure the stale frame, not the caption.
 */
const settledShot = async (target: Locator): Promise<Buffer> => {
  let previous = await target.screenshot({ animations: 'disabled' });
  for (let attempt = 0; attempt < 15; attempt++) {
    await target.page().waitForTimeout(150);
    const next = await target.screenshot({ animations: 'disabled' });
    if (next.equals(previous)) {
      return next;
    }
    previous = next;
  }
  throw new Error('the painted frame never settled');
};

test.describe('MediaPlayer captions (ISSUE-031)', () => {
  test('the captions example offers a named toggle with a pressed state, and starts off', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId(PLAYER);
    const toggle = toggleOf(player);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('type', 'button');

    // Off until the viewer chooses: nothing paints, and nothing has been fetched to paint.
    const state = await trackState(player.locator('video'));
    expect(state.mode).not.toBe('showing');
  });

  test('the toggle is opt-in and exists only where a caption track does', async ({ page }) => {
    await gotoHydrated(page, '/components/media-player');

    // Exactly one player on the page is given `captionsButton`, so exactly one toggle. The
    // plain, transport and native-controls players are unchanged: no extra control appears.
    await expect(page.getByRole('button', { name: 'Captions', exact: true })).toHaveCount(1);
    await expect(toggleOf(page.getByTestId('media-player-video-demo'))).toHaveCount(0);
    await expect(toggleOf(page.getByTestId('media-player-transport-demo'))).toHaveCount(0);
    await expect(
      page.getByTestId('media-player-video-demo').locator('.control button')
    ).toHaveCount(2);
    // Native controls draw the browser's own menu; the overlay toggle is not layered on top.
    await expect(toggleOf(page.getByTestId('media-player-native-controls-demo'))).toHaveCount(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`a viewer shows real cues during real playback and hides them again (${theme} theme)`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/media-player');
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme
      );

      const player = page.getByTestId(PLAYER);
      const video = player.locator('video');
      const toggle = toggleOf(player);

      // User-driven: the example starts paused, so the viewer decides when playback begins.
      await expect(video).toHaveJSProperty('paused', true);
      await transportButton(player).click();
      await expect(video).toHaveJSProperty('paused', false);
      await expect
        .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
        .toBeGreaterThan(0.2);

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('captions-readout')).toContainText('captionsVisible=true');
      await expect(page.getByTestId('captions-readout')).toContainText('lastCaptionChange=shown');

      // The browser fetched and parsed the WebVTT: both cues of promo-clip.vtt are loaded.
      await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('showing');
      await expect.poll(() => trackState(video).then((s) => s.cues)).toBe(2);

      // Real playback crosses the cue boundary at 2s, so the active cue changes by itself.
      // The clip loops, so both are reachable whenever the toggle was pressed.
      await expect
        .poll(() => trackState(video).then((s) => s.active), { timeout: 15_000 })
        .toEqual([CUE_ONE]);
      await expect
        .poll(() => trackState(video).then((s) => s.active), { timeout: 15_000 })
        .toEqual([CUE_TWO]);

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('hidden');
      // Hidden keeps the cues loaded, so showing them again does not refetch.
      expect((await trackState(video)).cues).toBe(2);
      await expect(page.getByTestId('captions-readout')).toContainText('lastCaptionChange=hidden');
    });

    test(`the browser paints the whole cue clear of the controls when shown, nothing when hidden (${theme} theme)`, async ({
      page
    }) => {
      await gotoHydrated(page, '/components/media-player');
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme
      );

      const player = page.getByTestId(PLAYER);
      const video = player.locator('video');
      const toggle = toggleOf(player);

      // Hold a frame inside the first cue so the only thing that can differ between captures is
      // the caption. Pausing through the overlay is the viewer's own action; the seek is the
      // fixture choosing which frame to hold.
      await transportButton(player).click();
      await expect(video).toHaveJSProperty('paused', false);
      await transportButton(player).click();
      await expect(video).toHaveJSProperty('paused', true);
      await video.evaluate(
        (el: HTMLVideoElement) =>
          new Promise<void>((resolve) => {
            el.addEventListener('seeked', () => resolve(), { once: true });
            el.currentTime = 1;
          })
      );
      await page.mouse.move(0, 0);

      const hiddenBefore = await settledShot(player);

      await toggle.click();
      await expect.poll(() => trackState(video).then((s) => s.active)).toEqual([CUE_ONE]);
      await page.mouse.move(0, 0);
      const shown = await settledShot(player);

      await toggle.click();
      await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('hidden');
      await page.mouse.move(0, 0);
      const hiddenAfter = await settledShot(player);

      // Geometry from the DOM, scaled into the screenshot's own pixels: WebKit's desktop
      // profile captures at device scale 2.
      const scale = await page.evaluate(() => window.devicePixelRatio);
      const playerBox = await player.boundingBox();
      const toggleBox = await toggle.boundingBox();
      const controlTops = await player
        .locator('.bottom-controls button')
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top));
      if (playerBox === null || toggleBox === null) {
        throw new Error('the player or its toggle has no box');
      }
      const skip: Rect = {
        x0: Math.floor((toggleBox.x - playerBox.x - 6) * scale),
        y0: Math.floor((toggleBox.y - playerBox.y - 6) * scale),
        x1: Math.ceil((toggleBox.x - playerBox.x + toggleBox.width + 6) * scale),
        y1: Math.ceil((toggleBox.y - playerBox.y + toggleBox.height + 6) * scale)
      };
      const controlsTop = (Math.min(...controlTops) - playerBox.y) * scale;

      // Control: hidden-before vs hidden-after is the same frame with nothing painted. If this
      // is not ~0 the comparison below is measuring video drift, not the caption.
      const control = await diffPngs(page, hiddenBefore, hiddenAfter, skip);
      expect(control.changed).toBeLessThan(20 * scale * scale);

      const caption = await diffPngs(page, hiddenBefore, shown, skip);
      expect(caption.box).not.toBeNull();
      const box = caption.box as Rect;
      // A caption line is hundreds of glyph and backdrop pixels.
      expect(caption.changed).toBeGreaterThan(300 * scale * scale);
      // Whole: inside the player on both sides. The shipped layout once clipped it mid-word.
      expect(box.x0).toBeGreaterThanOrEqual(4 * scale);
      expect(box.x1).toBeLessThanOrEqual(caption.width - 4 * scale);
      // Centred, as the browser lays a cue out by default.
      expect(Math.abs((box.x0 + box.x1) / 2 - caption.width / 2)).toBeLessThan(24 * scale);
      // Clear of the overlay's control row, which would otherwise sit on top of the text.
      expect(box.y1).toBeLessThan(controlsTop);
    });
  }

  test('keyboard: Tab reaches the toggle, Enter and Space flip it, and playback is untouched', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');
    await page.mouse.move(0, 0);

    const player = page.getByTestId(PLAYER);
    const video = player.locator('video');
    const toggle = toggleOf(player);

    // Real sequential navigation from the video, no hover and no click on the toggle.
    await video.focus();
    const reached: string[] = [];
    for (let presses = 0; presses < 6; presses++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? ''
      );
      reached.push(label);
      if (label === 'Captions') {
        break;
      }
    }
    expect(reached).toContain('Captions');
    await expect(toggle).toBeFocused();
    // After mute, before any fullscreen control: the order a viewer expects.
    expect(reached.indexOf('Captions')).toBeGreaterThan(reached.indexOf('Unmute'));

    const wasPaused = await video.evaluate((el: HTMLVideoElement) => el.paused);

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('showing');

    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('hidden');

    await expect(toggle).toBeFocused();
    expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(wasPaused);
  });

  test('bind:captionsVisible: a host write shows and hides the track without reporting a viewer change', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const player = page.getByTestId(PLAYER);
    const video = player.locator('video');
    const toggle = toggleOf(player);

    await page.getByTestId('external-captions-toggle').click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('showing');
    await expect.poll(() => trackState(video).then((s) => s.cues)).toBe(2);
    // The host did this, not the viewer, so the viewer-change callback stays silent.
    await expect(page.getByTestId('captions-readout')).toContainText('lastCaptionChange=none');

    await page.getByTestId('external-captions-toggle').click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => trackState(video).then((s) => s.mode)).toBe('hidden');

    // A viewer's press afterwards is reported, and lands on the same bound state.
    await toggle.click();
    await expect(page.getByTestId('captions-readout')).toContainText('captionsVisible=true');
    await expect(page.getByTestId('captions-readout')).toContainText('lastCaptionChange=shown');
  });

  test('native controls: the bound value follows the browser track mode (stand-in for its menu)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/media-player');

    const native = page.getByTestId('media-player-native-controls-demo');
    const video = native.locator('video');
    await expect(video).toHaveAttribute('controls', '');
    await expect(page.getByTestId('native-captions-readout')).toContainText(
      'nativeCaptionsVisible=false'
    );

    await video.evaluate((el: HTMLVideoElement) => {
      el.textTracks[0].mode = 'showing';
    });
    await expect(page.getByTestId('native-captions-readout')).toContainText(
      'nativeCaptionsVisible=true'
    );

    await video.evaluate((el: HTMLVideoElement) => {
      el.textTracks[0].mode = 'disabled';
    });
    await expect(page.getByTestId('native-captions-readout')).toContainText(
      'nativeCaptionsVisible=false'
    );
  });
});

test.describe('<sui-media-player> captions (ISSUE-031)', () => {
  const mount = async (page: Page, slotted = false): Promise<void> => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-media-player')));
    await page.evaluate((withSlots) => {
      const host = document.createElement('sui-media-player');
      host.setAttribute('data-pw', 'wc-captions-player');
      host.setAttribute('src', '/demo-media/promo-clip.mp4');
      host.setAttribute('type', 'video');
      host.setAttribute('captions-src', '/demo-media/promo-clip.vtt');
      host.setAttribute('captions-label', 'English');
      host.setAttribute('captions-src-lang', 'en');
      host.setAttribute('captions-button', '');
      host.addEventListener('captionschange', (event) => {
        const log = ((window as unknown as { __captionEvents?: unknown[] }).__captionEvents ??= []);
        log.push((event as CustomEvent).detail);
      });
      if (withSlots) {
        // Light-DOM glyphs go in before the element connects: Svelte reads the slotted
        // children once, when the custom element is first connected.
        for (const name of ['captions-icon', 'captions-on-icon']) {
          const glyph = document.createElement('span');
          glyph.setAttribute('slot', name);
          glyph.setAttribute('data-pw', `glyph-${name}`);
          glyph.textContent = name === 'captions-icon' ? 'OFF' : 'ON';
          host.append(glyph);
        }
      }
      document.body.append(host);
    }, slotted);
  };

  test('the shadow-root toggle shows the track, reflects the attribute and dispatches captionschange', async ({
    page
  }) => {
    await mount(page);

    const host = page.getByTestId('wc-captions-player');
    const toggle = host.getByRole('button', { name: 'Captions', exact: true });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() =>
        host.evaluate(
          (el) => (el.shadowRoot?.querySelector('video') as HTMLVideoElement).textTracks[0].mode
        )
      )
      .toBe('showing');
    expect(await host.evaluate((el) => el.hasAttribute('captions-visible'))).toBe(true);
    expect(
      await host.evaluate((el) => (el as unknown as { captionsVisible: boolean }).captionsVisible)
    ).toBe(true);
    expect(
      await page.evaluate(
        () => (window as unknown as { __captionEvents: unknown[] }).__captionEvents
      )
    ).toEqual([true]);
  });

  test('a host property write drives the same track, without a captionschange event', async ({
    page
  }) => {
    await mount(page);

    const host = page.getByTestId('wc-captions-player');
    const toggle = host.getByRole('button', { name: 'Captions', exact: true });
    await expect(toggle).toBeVisible();

    await host.evaluate((el) => {
      (el as unknown as { captionsVisible: boolean }).captionsVisible = true;
    });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() =>
        host.evaluate(
          (el) => (el.shadowRoot?.querySelector('video') as HTMLVideoElement).textTracks[0].mode
        )
      )
      .toBe('showing');
    expect(
      await page.evaluate(
        () => (window as unknown as { __captionEvents?: unknown[] }).__captionEvents ?? []
      )
    ).toEqual([]);
  });

  test('slotted glyphs replace the built-in ones, one per state', async ({ page }) => {
    await mount(page, true);

    const host = page.getByTestId('wc-captions-player');
    const toggle = host.getByRole('button', { name: 'Captions', exact: true });
    const assigned = (slot: string): Promise<string[]> =>
      host.evaluate(
        (el, name) =>
          Array.from(
            el.shadowRoot?.querySelectorAll<HTMLSlotElement>(
              `button.captions-toggle slot[name="${name}"]`
            ) ?? [],
            (node) =>
              node
                .assignedNodes()
                .map((n) => n.textContent ?? '')
                .join('')
          ),
        slot
      );

    // Captions hidden: the off glyph is the slotted one, the built-in is not drawn.
    await expect.poll(() => assigned('captions-icon')).toEqual(['OFF']);
    await expect(toggle.locator('svg')).toHaveCount(0);

    await toggle.click();
    await expect.poll(() => assigned('captions-on-icon')).toEqual(['ON']);
    await expect.poll(() => assigned('captions-icon')).toEqual([]);
  });
});
