import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// `role`/`aria-label` set directly on `<sui-modal>` land on the host element --
// the ARIAMixin accessors every custom element already has -- not on
// `.modal-content`, the panel two levels inside the shadow tree that actually
// carries `aria-modal` and the accessible name (see Modal.svelte). The host
// wraps the whole full-screen overlay, so the attribute looks like it worked
// (it's right there in the DOM) while assistive tech looking for the dialog
// finds an unnamed, unroled panel. `modalAriaLabel`/`modalRole` (attributes
// `modal-aria-label`/`modal-role`) are the forwarding aliases that reach the
// panel instead -- same prefixed-alias pattern as `<sui-toggle>`'s
// `inputAriaLabel`, proven by tests/toggle-labelling.spec.ts.
const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-modal') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-modal ARIA forwarding', () => {
  test('modal-role and modal-aria-label attributes name the content panel, not the host', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('data-pw', 'wc-modal');
      // Set directly on the host too, so the test also pins that these keep
      // reflecting their own native ARIAMixin accessors, unreplaced.
      modal.setAttribute('role', 'note');
      modal.setAttribute('aria-label', 'Host label');
      modal.setAttribute('modal-role', 'alertdialog');
      modal.setAttribute('modal-aria-label', 'Delete account');
      const body = document.createElement('p');
      body.textContent = "This can't be undone.";
      modal.append(body);
      document.body.append(modal);
    });

    // The accessibility tree resolves this across the shadow boundary --
    // proof the panel itself, not just some element in the document, carries
    // the forwarded role and name.
    const dialog = page.getByRole('alertdialog', { name: 'Delete account' });
    await expect(dialog).toBeVisible();

    const host = page.getByTestId('wc-modal');
    await expect(host).toHaveAttribute('role', 'note');
    await expect(host).toHaveAttribute('aria-label', 'Host label');

    const panel = host.locator('.modal-content');
    await expect(panel).toHaveAttribute('role', 'alertdialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveAttribute('aria-label', 'Delete account');
  });

  test('modalRole and modalAriaLabel properties do the same as the attributes', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('data-pw', 'wc-modal-props');
      document.body.append(modal);
      Reflect.set(modal, 'modalRole', 'dialog');
      Reflect.set(modal, 'modalAriaLabel', 'Edit profile');
    });

    await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
  });

  test('with neither alias set, the panel is unroled and unnamed -- the shipped default', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('data-pw', 'wc-modal-bare');
      document.body.append(modal);
    });

    const panel = page.getByTestId('wc-modal-bare').locator('.modal-content');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('role');
    await expect(panel).not.toHaveAttribute('aria-modal');
    await expect(panel).not.toHaveAttribute('aria-label');
  });

  test('role/aria-label set on the host still do not reach the panel -- which is why the aliases exist', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-label', 'Delete account');
      modal.setAttribute('data-pw', 'wc-modal-host-aria');
      document.body.append(modal);
    });

    const host = page.getByTestId('wc-modal-host-aria');
    const panel = host.locator('.modal-content');
    await expect(panel).toBeVisible();

    // The attributes are really there on the host -- which is exactly what
    // makes this a trap. They look applied, and assistive tech looking for the
    // dialog still finds an unnamed, unroled panel.
    await expect(host).toHaveAttribute('role', 'alertdialog');
    await expect(host).toHaveAttribute('aria-label', 'Delete account');

    await expect(panel).not.toHaveAttribute('role');
    await expect(panel).not.toHaveAttribute('aria-label');

    // This PR is additive: it does not change what host-level attributes do,
    // it adds a spelling that reaches the panel. A consumer relying on the
    // host attributes sees exactly what they saw before.
  });
});
