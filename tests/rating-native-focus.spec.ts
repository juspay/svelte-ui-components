import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test('RatingGroup first star accepts the first pointer after invalid native submit', async ({
  page
}) => {
  await gotoHydrated(page, '/components/rating-group');
  const submit = page.getByTestId('rating-form-submit');
  const owner = page.getByTestId('rating-form-stars');
  const result = page.getByTestId('rating-form-result');
  await submit.click();
  await expect(result).toHaveText('');
  await expect(owner).toBeFocused();
  await page.getByTestId('rating-form-stars-star-1').click();
  await expect(owner).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByTestId('rating-form-stars-native-input')).toHaveValue('1');
  await submit.click();
  await expect(result).toHaveText('stars=1');
});

test('RatingGroup validity query stays silent, report focuses its owner and keyboard supplies a value', async ({
  page
}) => {
  await gotoHydrated(page, '/components/rating-group');
  const form = page.getByTestId('rating-form-demo');
  await form.evaluate((form) => {
    const before = document.createElement('input');
    before.id = 'rating-before';
    form.prepend(before);
  });
  const before = page.locator('#rating-before');
  const owner = page.getByTestId('rating-form-stars');
  await before.click();
  expect(await form.evaluate((form) => (form as HTMLFormElement).checkValidity())).toBe(false);
  await expect(before).toBeFocused();
  expect(await form.evaluate((form) => (form as HTMLFormElement).reportValidity())).toBe(false);
  await expect(owner).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(owner).toHaveAttribute('aria-valuenow', '1');
  await page.getByTestId('rating-form-submit').click();
  await expect(page.getByTestId('rating-form-result')).toHaveText('stars=1');
});

for (const adopted of [false, true]) {
  test(`WC Rating carrier first pointer and keyboard selection${adopted ? ' after iframe adoption' : ''}`, async ({
    page
  }) => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-rating-group')));
    await page.evaluate(async (adopted) => {
      const host = document.createElement('sui-rating-group');
      host.id = 'native-rating';
      host.setAttribute('name', 'score');
      host.setAttribute('required', '');
      host.setAttribute('aria-label', 'Actual rating');
      document.querySelector('main')!.prepend(host);
      let target = document;
      if (adopted) {
        const frame = document.createElement('iframe');
        frame.id = 'rating-frame';
        document.querySelector('main')!.prepend(frame);
        await new Promise<void>((resolve) => {
          frame.onload = () => resolve();
          frame.srcdoc = '<!doctype html><html><body></body></html>';
        });
        target = frame.contentDocument!;
        target.body.append(target.adoptNode(host));
      }
      const before = target.createElement('input');
      before.id = 'wc-rating-before';
      host.before(before);
    }, adopted);
    const root = adopted ? page.frameLocator('#rating-frame') : page;
    const host = root.locator('#native-rating');
    const carrier = host.locator('input.native-input');
    const owner = host.getByRole('slider', { name: 'Actual rating', exact: true });
    const before = root.locator('#wc-rating-before');
    await before.click();
    expect(await carrier.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(
      false
    );
    await expect(before).toBeFocused();
    expect(await carrier.evaluate((input) => (input as HTMLInputElement).reportValidity())).toBe(
      false
    );
    await expect(owner).toBeFocused();
    await host.locator('.star').first().click();
    await expect(owner).toHaveAttribute('aria-valuenow', '1');
    await expect(carrier).toHaveValue('1');
    await page.keyboard.press('ArrowRight');
    await expect(owner).toHaveAttribute('aria-valuenow', '2');
    await expect(carrier).toHaveValue('2');
  });
}
