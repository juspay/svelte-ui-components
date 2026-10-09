import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

for (const adopted of [false, true]) {
  test(`WC invalid carrier preserves query and pointer selection${adopted ? ' after iframe adoption' : ''}`, async ({
    page
  }) => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-choicebox')));
    await page.evaluate(async (adopted) => {
      const host = document.createElement('sui-choicebox');
      host.id = 'native-choice';
      host.textContent = 'Accept choice';
      host.setAttribute('mode', 'checkbox');
      host.setAttribute('name', 'choice');
      host.setAttribute('value', 'accepted');
      host.setAttribute('required', '');
      document.querySelector('main')?.prepend(host);
      if (adopted) {
        const frame = document.createElement('iframe');
        frame.id = 'choice-frame';
        document.querySelector('main')?.prepend(frame);
        await new Promise<void>((resolve) => {
          frame.onload = () => resolve();
          frame.srcdoc = '<!doctype html><html><body></body></html>';
        });
        const target = frame.contentDocument;
        if (target === null) {
          throw new Error('Iframe document unavailable');
        }
        target.body.append(target.adoptNode(host));
        const before = target.createElement('input');
        before.id = 'choice-before';
        target.body.prepend(before);
      } else {
        const before = document.createElement('input');
        before.id = 'choice-before';
        host.before(before);
      }
    }, adopted);
    const root = adopted ? page.frameLocator('#choice-frame') : page;
    const host = root.locator('#native-choice');
    const carrier = host.locator('input.native-control');
    const owner = host.getByRole('checkbox', { name: 'Accept choice', exact: true });
    const before = root.locator('#choice-before');
    await before.click();
    expect(await carrier.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(
      false
    );
    await expect(before).toBeFocused();
    expect(await carrier.evaluate((input) => (input as HTMLInputElement).reportValidity())).toBe(
      false
    );
    await expect(owner).toBeFocused();
    await owner.click();
    await expect(owner).toBeChecked();
    await expect(carrier).toBeChecked();
    expect(await carrier.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(
      true
    );
  });
}
