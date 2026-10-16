import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

function silence() {
  const buffer = Buffer.alloc(44 + 16000);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(16000, 40);
  return buffer;
}
async function fixture(page: Page) {
  await page.route('**/review-audio.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: silence() })
  );
  await page.route('**/review-clip.mp4', (route) =>
    route.fulfill({
      contentType: 'video/mp4',
      body: readFileSync('static/demo-media/promo-clip.mp4')
    })
  );
  await page.route('**/review-clip.vtt', (route) =>
    route.fulfill({
      contentType: 'text/vtt',
      body: readFileSync('static/demo-media/promo-clip.vtt')
    })
  );
  await page.goto(`${fixtureBaseURL}/native-review/`);
  await page.waitForFunction(() => document.documentElement.dataset.nativeReviewReady === 'true');
}
async function wc(page: Page, name: string) {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction((name) => Boolean(customElements.get(name)), name);
}

test('review: native file selection participates in forms, supports reselection and preserves a simulated cancel', async ({
  page
}) => {
  await fixture(page);
  const input = page.getByTestId('review-native-file');
  const file = { name: 'same.txt', mimeType: 'text/plain', buffer: Buffer.from('demo') };
  for (const count of [1, 2]) {
    const picker = page.waitForEvent('filechooser');
    await input.click();
    await (await picker).setFiles(file);
    await expect(page.getByTestId('review-file-selections')).toHaveText(String(count));
    expect(await input.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(true);
  }
  // Model the native cancel notification without opening an OS dialog in headless QA.
  const restored = await input.evaluate((node: HTMLInputElement) => {
    window.addEventListener('click', (event) => event.preventDefault(), { once: true });
    node.click();
    const during = node.files?.length;
    node.dispatchEvent(new Event('cancel'));
    return { during, name: node.files?.[0]?.name };
  });
  expect(restored).toEqual({ during: 0, name: 'same.txt' });
  await page.getByRole('button', { name: 'Submit native file', exact: true }).click();
  await expect(page.getByTestId('review-file-submission')).toHaveText('same.txt:4');
});

test('review: literal quoted SVG URLs paint the expected mask shape and color', async ({
  page
}) => {
  await fixture(page);
  await page.evaluate(async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="12" height="24" fill="black"/></svg>';
    await Promise.all(
      [svg, encodeURIComponent(svg)].map(async (body) => {
        const image = new Image();
        image.src = `data:image/svg+xml,${body}`;
        await image.decode();
      })
    );
  });
  await expect(async () => {
    const captures = [];
    for (const hook of [
      'review-quoted-mask',
      'review-encoded-mask',
      'review-empty-mask',
      'review-mask-color'
    ]) {
      captures.push((await page.getByTestId(hook).screenshot()).toString('base64'));
    }
    // Decode pixels rather than comparing PNG compression/metadata. Sample both
    // halves: an invalid mask paints either nothing or a solid box, and fails.
    const [quoted, encoded, empty, color] = await page.evaluate(
      async (captures) =>
        Promise.all(
          captures.map(async (data) => {
            const image = new Image();
            image.src = `data:image/png;base64,${data}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('2d context unavailable');
            }
            context.drawImage(image, 0, 0);
            return [0.25, 0.75].map((x) =>
              Array.from(
                context.getImageData(
                  Math.floor(image.width * x),
                  Math.floor(image.height / 2),
                  1,
                  1
                ).data
              )
            );
          })
        ),
      captures
    );
    expect(color[0]).not.toEqual(empty[0]);
    expect(encoded).toEqual([color[0], empty[0]]);
    expect(quoted).toEqual(encoded);
  }).toPass({ timeout: 5000 });
});

test('review: Svelte media children select sources and expose tracks in every rendering mode', async ({
  page
}) => {
  await fixture(page);
  // Preload is a hint; WebKit may defer audio metadata until an explicit gesture.
  await page.getByRole('button', { name: 'Load native media metadata', exact: true }).click();
  for (const variant of ['audio', 'native-video', 'styled-video']) {
    const media =
      variant === 'styled-video'
        ? page.getByTestId(`review-${variant}`).locator('video')
        : page.getByTestId(`review-${variant}`);
    await expect
      .poll(() => media.evaluate((node: HTMLMediaElement) => node.readyState), {
        message: `${variant} loads its selected child source`
      })
      .toBeGreaterThanOrEqual(1);
    expect(await media.evaluate((node: HTMLMediaElement) => node.currentSrc)).toContain(
      variant === 'audio' ? '/review-audio.wav' : '/review-clip.mp4'
    );
    expect(await media.evaluate((node: HTMLMediaElement) => node.textTracks.length)).toBe(1);
    await expect(media).toHaveJSProperty('paused', true);
  }
});

test('review: WC input refs survive each icon-slot branch and prop updates', async ({ page }) => {
  await fixture(page);
  await wc(page, 'sui-input');
  const refs = await page.evaluate(async () => {
    const results = [];
    for (const slots of [[], ['left-icon'], ['right-icon'], ['left-icon', 'right-icon']]) {
      const field = document.createElement('sui-input') as HTMLElement & {
        element: HTMLInputElement;
        label: string;
        placeholder: string;
      };
      field.label = 'Review field';
      slots.forEach((name) => {
        const icon = document.createElement('span');
        icon.slot = name;
        icon.textContent = '*';
        field.append(icon);
      });
      document.body.append(field);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      field.placeholder = 'Updated placeholder';
      await new Promise((resolve) => requestAnimationFrame(resolve));
      results.push(field.element === field.shadowRoot?.querySelector('input'));
    }
    return results;
  });
  expect(refs).toEqual([true, true, true, true]);
});

test('review: WC source/track nodes belong to the native player across rendering changes', async ({
  page
}) => {
  await fixture(page);
  await wc(page, 'sui-media-player');
  await page.evaluate(() => {
    const player = document.createElement('sui-media-player') as HTMLElement & {
      type: string;
      src: string;
      autoplay: boolean;
      unstyled: boolean;
      nativeAttrs: object;
      playing: boolean;
    };
    player.id = 'review-wc-media';
    player.type = 'video';
    player.src = '';
    player.autoplay = false;
    player.nativeAttrs = { preload: 'metadata' };
    const source = document.createElement('source');
    source.src = '/review-clip.mp4';
    source.type = 'video/mp4';
    const track = document.createElement('track');
    track.src = '/review-clip.vtt';
    track.kind = 'captions';
    track.srclang = 'en';
    track.label = 'Review captions';
    player.append(source, track);
    document.body.append(player);
    const button = document.createElement('button');
    button.textContent = 'Play projected media';
    button.onclick = () => {
      player.playing = true;
    };
    document.body.append(button);
    Object.assign(window, { reviewSource: source, reviewTrack: track });
  });
  for (const variant of ['styled-video', 'native-video', 'audio']) {
    await page.evaluate((variant) => {
      const player = document.getElementById('review-wc-media') as HTMLElement & {
        type: string;
        unstyled: boolean;
        playing: boolean;
      };
      const source = (window as unknown as { reviewSource: HTMLSourceElement }).reviewSource;
      source.src = variant === 'audio' ? '/review-audio.wav' : '/review-clip.mp4';
      source.type = variant === 'audio' ? 'audio/wav' : 'video/mp4';
      player.playing = false;
      player.unstyled = variant === 'native-video';
      player.type = variant === 'audio' ? 'audio' : 'video';
    }, variant);
    const media = page.locator('#review-wc-media').locator(variant === 'audio' ? 'audio' : 'video');
    await expect
      .poll(() => media.evaluate((node: HTMLMediaElement) => node.readyState))
      .toBeGreaterThanOrEqual(1);
    expect(await media.evaluate((node: HTMLMediaElement) => node.currentSrc)).toContain(
      variant === 'audio' ? '/review-audio.wav' : '/review-clip.mp4'
    );
    expect(await media.evaluate((node: HTMLMediaElement) => node.textTracks.length)).toBe(1);
    expect(
      await media.evaluate(
        (node) =>
          node.querySelector('source') ===
            (window as unknown as { reviewSource: HTMLSourceElement }).reviewSource &&
          node.querySelector('track') ===
            (window as unknown as { reviewTrack: HTMLTrackElement }).reviewTrack
      )
    ).toBe(true);
    await expect(media).toHaveJSProperty('paused', true);
    await page.getByRole('button', { name: 'Play projected media', exact: true }).click();
    await expect(media).toHaveJSProperty('paused', false);
  }
});

test('render: shared loading variants preserve the legacy ring and orbit geometry', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await fixture(page);
  await page.evaluate(async () => {
    const animations = document
      .getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations === Infinity);
    animations.forEach((animation) => animation.pause());
    await Promise.all(animations.map((animation) => animation.ready));
    animations.forEach((animation) => {
      animation.currentTime = 0;
    });
  });
  for (const variant of ['border', 'orbit']) {
    const pair = await page.evaluate((variant) => {
      const properties = [
        'width',
        'height',
        'box-sizing',
        'position',
        'border-top-width',
        'border-top-color',
        'border-left-color',
        'border-radius',
        'background-color',
        'animation-duration',
        'animation-timing-function',
        'transform',
        'transform-origin'
      ];
      return ['legacy', 'shared'].map((kind) => {
        const node = document.querySelector(`[data-pw="${kind}-${variant}"]`)!;
        return [null, '::before', '::after'].map((pseudo) => {
          const style = getComputedStyle(node, pseudo);
          return Object.fromEntries(
            properties.map((property) => [property, style.getPropertyValue(property)])
          );
        });
      });
    }, variant);
    expect(pair[1]).toEqual(pair[0]);
  }
});

test('render: segmented tour progress preserves legacy responsive label and bar bounds', async ({
  page
}) => {
  await fixture(page);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const pair = await page.evaluate(() =>
      ['legacy', 'shared'].map((kind) => {
        const root = document.querySelector(`[data-pw="${kind}-progress"]`)!;
        const box = root.getBoundingClientRect();
        // Firefox returns float32 coordinates; translation changes the last bits.
        // 0.001 CSS px remains smaller than a layout unit or device pixel.
        const scalar = (value: number) => Math.round(value * 1000) / 1000;
        const nodes = [
          root.querySelector('.left')!,
          ...root.querySelectorAll(kind === 'legacy' ? '.legacy-segment' : '.segment'),
          root.querySelector('.right')!
        ];
        return {
          width: scalar(box.width),
          height: scalar(box.height),
          children: nodes.map((node) => {
            const r = node.getBoundingClientRect();
            const s = getComputedStyle(node);
            return {
              x: scalar(r.x - box.x),
              y: scalar(r.y - box.y),
              width: scalar(r.width),
              height: scalar(r.height),
              color: s.backgroundColor,
              font: s.font,
              radius: s.borderRadius
            };
          })
        };
      })
    );
    expect(pair[1], `${width}px legacy/shared progress geometry`).toEqual(pair[0]);
  }
});

test('render: reduced motion keeps new loading shapes visible without looping', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixture(page);
  for (const hook of ['shared-border', 'shared-orbit']) {
    const loader = page.getByTestId(hook);
    await expect(loader).toBeVisible();
    expect(await loader.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
});

test('render: WC loading and segmented progress expose names without replacing native ARIA accessors', async ({
  page
}) => {
  await fixture(page);
  await wc(page, 'sui-progress');
  await page.evaluate(() => {
    const loader = document.createElement('sui-loader') as HTMLElement & {
      variant: string;
      loaderAriaLabel: string;
    };
    loader.id = 'review-wc-loader';
    loader.variant = 'orbit';
    loader.loaderAriaLabel = 'Loading review data';
    const progress = document.createElement('sui-progress') as HTMLElement & {
      value: number;
      segments: number;
      progressAriaLabel: string;
    };
    progress.id = 'review-wc-progress';
    progress.value = 40;
    progress.segments = 3;
    progress.progressAriaLabel = 'Review progress';
    const label = document.createElement('span');
    label.slot = 'trailing-label';
    label.textContent = '03';
    progress.append(label);
    document.body.append(loader, progress);
  });
  await expect(
    page.locator('#review-wc-loader').getByRole('status', { name: 'Loading review data' })
  ).toBeVisible();
  await expect(
    page.locator('#review-wc-progress').getByRole('progressbar', { name: 'Review progress' })
  ).toHaveAttribute('aria-valuenow', '40');
  await expect(page.locator('#review-wc-progress').getByText('03', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      ['sui-loader', 'sui-progress'].map((name) =>
        Object.hasOwn(customElements.get(name)!.prototype, 'ariaLabel')
      )
    )
  ).toEqual([false, false]);
});
