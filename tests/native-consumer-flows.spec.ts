import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('native consumer integration', () => {
  test('web-component native refs and load callbacks preserve host accessors', async ({ page }) => {
    await gotoHydrated(page, '/components/dialog');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => customElements.get('sui-img') && customElements.get('sui-iframe-viewer')
    );
    await page.evaluate(() => {
      const image = document.createElement('sui-img') as HTMLElement & {
        src: string;
        alt: string;
        unstyled: boolean;
        onimageload: (event: Event) => void;
        nativeAttrs: { width: number; height: number };
      };
      image.id = 'proof-image';
      image.src = '/favicon.png';
      image.alt = 'Example';
      image.unstyled = true;
      image.nativeAttrs = { width: 42, height: 42 };
      image.onimageload = () =>
        (image.dataset.callback = String(Number(image.dataset.callback ?? 0) + 1));
      image.addEventListener(
        'imageload',
        () => (image.dataset.event = String(Number(image.dataset.event ?? 0) + 1))
      );
      document.body.append(image);
      const frame = document.createElement('sui-iframe-viewer') as HTMLElement & {
        src: string;
        unstyled: boolean;
        classes: string;
        onframeload: () => void;
      };
      frame.id = 'proof-frame';
      frame.src = 'data:text/html,Frame%20proof';
      frame.unstyled = true;
      frame.classes = 'proof-frame-layout';
      frame.onframeload = () =>
        (frame.dataset.callback = String(Number(frame.dataset.callback ?? 0) + 1));
      document.body.append(frame);
    });
    await expect(page.locator('#proof-image')).toHaveAttribute('data-callback', '1');
    await expect(page.locator('#proof-image')).toHaveAttribute('data-event', '1');
    await expect(page.locator('#proof-frame')).toHaveAttribute('data-callback', '1');
    const state = await page.evaluate(() => {
      const image = document.getElementById('proof-image') as HTMLElement & {
        element: HTMLImageElement;
      };
      const frame = document.getElementById('proof-frame') as HTMLElement & {
        element: HTMLIFrameElement;
      };
      return {
        imageRef: image.element === image.shadowRoot?.querySelector('img'),
        frameRef: frame.element === frame.shadowRoot?.querySelector('iframe'),
        nativeLoadAccessor: !Object.hasOwn(Object.getPrototypeOf(image), 'onload'),
        frameClass: frame.element?.classList.contains('proof-frame-layout')
      };
    });
    expect(state).toEqual({
      imageRef: true,
      frameRef: true,
      nativeLoadAccessor: true,
      frameClass: true
    });
  });

  test('web-component links deliver one native click and one named hook', async ({ page }) => {
    await gotoHydrated(page, '/components/dialog');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => customElements.get('sui-link'));
    await page.evaluate(() => {
      const link = document.createElement('sui-link') as HTMLElement & {
        href: string;
        onlinkclick: (event: MouseEvent) => void;
      };
      link.id = 'proof-link';
      link.href = '#link-proof';
      link.textContent = 'Link proof';
      link.onlinkclick = (event) => {
        event.preventDefault();
        link.dataset.hook = String(Number(link.dataset.hook ?? 0) + 1);
      };
      link.onclick = () => (link.dataset.native = String(Number(link.dataset.native ?? 0) + 1));
      link.addEventListener(
        'linkclick',
        () => (link.dataset.event = String(Number(link.dataset.event ?? 0) + 1))
      );
      document.body.append(link);
    });
    await page.locator('#proof-link a').click();
    await expect(page.locator('#proof-link')).toHaveAttribute('data-hook', '1');
    await expect(page.locator('#proof-link')).toHaveAttribute('data-native', '1');
    await expect(page.locator('#proof-link')).toHaveAttribute('data-event', '1');
    expect(
      await page
        .locator('#proof-link')
        .evaluate((element) => Object.hasOwn(Object.getPrototypeOf(element), 'onclick'))
    ).toBe(false);
  });

  test('web-component dialogs contain slotted focus and restore native visibility', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/dialog');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => customElements.get('sui-dialog'));
    await page.evaluate(() => {
      const trigger = document.createElement('button');
      trigger.id = 'proof-dialog-trigger';
      trigger.textContent = 'Open proof';
      document.body.append(trigger);
      const dialog = document.createElement('sui-dialog') as HTMLElement & {
        open: boolean;
        nativeAttrs: { 'aria-label': string };
        ondialogclose: () => void;
        returnFocusTo: HTMLElement;
      };
      dialog.id = 'proof-dialog';
      dialog.returnFocusTo = trigger;
      dialog.nativeAttrs = { 'aria-label': 'WC product details' };
      dialog.ondialogclose = () =>
        (dialog.dataset.closed = String(Number(dialog.dataset.closed ?? 0) + 1));
      const close = document.createElement('button');
      close.textContent = 'Close proof';
      close.id = 'proof-dialog-close';
      close.onclick = () => (dialog.open = false);
      dialog.append(close);
      document.body.append(dialog);
      trigger.onclick = () => (dialog.open = true);
    });
    await page.locator('#proof-dialog-trigger').click();
    await expect(page.getByRole('dialog', { name: 'WC product details' })).toBeVisible();
    await expect(page.locator('#proof-dialog-close')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#proof-dialog-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'WC product details' })).not.toBeVisible();
    await expect(page.locator('#proof-dialog-trigger')).toBeFocused();
    await expect(page.locator('#proof-dialog')).toHaveAttribute('data-closed', '1');
  });

  for (const width of [320, 375, 768, 1440]) {
    test(`retains native form validation and submission at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoHydrated(page, '/components/dialog');
      await expect(page.getByTestId('native-consumer-refs')).toHaveText('7');
      await expect(page.getByTestId('native-consumer-mount-refs')).toHaveText('7');
      const phone = page.getByTestId('native-consumer-phone');
      const platform = page.getByTestId('native-consumer-select');
      await phone.fill('123');
      await page.getByTestId('native-consumer-submit').click();
      await expect(page.getByTestId('native-consumer-result')).toBeEmpty();
      expect(
        await phone.evaluate((element: HTMLInputElement) => element.validity.patternMismatch)
      ).toBe(true);
      await phone.fill('9876543210');
      await page.getByTestId('native-consumer-submit').click();
      expect(
        await platform.evaluate((element: HTMLSelectElement) => element.validity.valueMissing)
      ).toBe(true);
      await platform.selectOption('shopify');
      await page.getByTestId('native-consumer-submit').click();
      await expect(page.getByTestId('native-consumer-result')).toHaveText('9876543210:shopify');
      await expect(phone).toHaveAccessibleName('Indian mobile number');
      await expect(phone).toHaveAttribute('aria-describedby', 'phone-hint');
    });
  }

  test('dialog enters the browser top layer, contains focus, and restores focus and scrolling', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/dialog');
    const trigger = page.getByTestId('native-consumer-open');
    const dialog = page.getByTestId('native-consumer-dialog');
    await trigger.click();
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
    await expect(dialog).toHaveAccessibleName('Product details');
    await expect(page.getByTestId('native-consumer-close')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await trigger.click();
    await page.getByTestId('native-consumer-close').click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('keyboard card activation does not activate the newly focused dialog close button', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/dialog');
    const card = page.getByTestId('native-consumer-card');
    const dialog = page.getByTestId('native-consumer-dialog');
    for (const key of ['Enter', 'Space']) {
      await card.focus();
      await page.keyboard.press(key);
      await expect(dialog).toBeVisible();
      await expect(page.getByTestId('native-consumer-close')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

  test('native controls isolate library appearance even when consumer class names collide', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/dialog');
    const field = page.getByTestId('native-placeholder-contract');
    const placeholderColor = await field.evaluate(
      (element) => getComputedStyle(element, '::placeholder').color
    );
    expect(placeholderColor).toBe('rgb(12, 34, 56)');
    const styledPlaceholder = await page
      .getByTestId('styled-placeholder-contract')
      .evaluate((element) => getComputedStyle(element, '::placeholder').color);
    expect(styledPlaceholder).toBe('rgb(90, 100, 110)');
    const selection = page.getByTestId('native-selector-contract');
    await expect(selection).toHaveCSS('display', 'block');
    const appearance = (element: Element) => {
      const style = getComputedStyle(element);
      return {
        display: style.display,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        minHeight: style.minHeight,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize
      };
    };
    // Native WebKit selects retain platform padding. Compare the shared control
    // with an equally styled browser-native reference, not a Chromium-only value.
    expect(await selection.evaluate(appearance)).toEqual(
      await page.getByTestId('native-select-reference').evaluate(appearance)
    );
  });

  test('mask icons retain dimensions and inherit changing theme colors', async ({ page }) => {
    await gotoHydrated(page, '/components/dialog');
    const icon = page.getByTestId('native-mask-contract');
    await expect(icon).toHaveAccessibleName('Native mask icon');
    await expect(icon).toHaveCSS('width', '18px');
    await expect(icon).toHaveCSS('height', '18px');
    await expect(icon).toHaveCSS('background-color', 'rgb(31, 65, 91)');
    await page.locator('.native-mask-stage').evaluate((element) => {
      (element as HTMLElement).style.color = 'rgb(121, 90, 44)';
    });
    await expect(icon).toHaveCSS('background-color', 'rgb(121, 90, 44)');
    const action = page.getByTestId('native-mask-action');
    await action.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('native-mask-activations')).toHaveText('1');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('native-mask-activations')).toHaveText('2');
  });

  test('native disclosure works with JavaScript disabled', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}/components/dialog`);
      const details = page.getByTestId('native-consumer-disclosure');
      await expect(details).not.toHaveAttribute('open', '');
      await details.locator('summary').click();
      await expect(page.getByTestId('native-consumer-disclosure-content')).toBeVisible();
      await expect(details).toHaveAttribute('open', '');
    } finally {
      await context.close();
    }
  });

  test('media and frame contracts survive wrapper-free rendering', async ({ page }) => {
    await gotoHydrated(page, '/components/dialog');
    const image = page.getByTestId('native-consumer-image');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('width', '42');
    const frame = page.getByTestId('native-consumer-frame');
    await expect(frame).toHaveClass(/native-frame-layout/);
    await expect(frame).toHaveAttribute('allow', 'microphone; autoplay');
    await expect(frame).not.toHaveAttribute('sandbox', /.*/);
    await expect(frame).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByTestId('native-consumer-frame-loads')).toHaveText('1');
    const video = page.getByTestId('native-consumer-video');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).not.toHaveAttribute('src', /.*/);
    await expect(video.locator('source')).toHaveCount(2);
    const audio = page.getByTestId('native-consumer-audio');
    expect(
      await audio.evaluate((element) => element instanceof HTMLAudioElement && !element.muted)
    ).toBe(true);
    await expect(audio).toHaveAttribute('autoplay', '');
    await expect(video.locator('source').first()).toHaveAttribute('media', '(min-width: 600px)');
    await expect(
      page.getByTestId('native-consumer-stage').locator(':scope > .button-container')
    ).toHaveCount(0);
  });
});
