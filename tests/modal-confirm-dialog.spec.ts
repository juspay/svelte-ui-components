import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// The primary Modal example opened its "Confirm Action" overlay without a role, aria-modal or
// a name, so the browser exposed no dialog at all. Modal documents `role` as a caller opt-in
// and must keep doing so; the defect was that the example the docs lead with never opted in.
// A confirmation that interrupts to ask for an answer is an alertdialog.
const NAME = 'Confirm Action';

const openByKeyboard = async (page: Page): Promise<Locator> => {
  await gotoHydrated(page, '/components/modal');
  // Focus and Enter rather than a click: Safari does not focus a button on pointer click, so a
  // click would leave nothing for the modal to hand focus back to in WebKit.
  const trigger = page.getByRole('button', { name: 'Open Modal', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alertdialog', { name: NAME })).toBeVisible();
  return trigger;
};

const activeName = (page: Page): Promise<string | null> =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el === null
      ? null
      : (el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().replace(/\s+/g, ' '));
  });

const activeInsidePanel = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const panel = document.querySelector('[role="alertdialog"]');
    return (
      panel !== null && document.activeElement !== null && panel.contains(document.activeElement)
    );
  });

test.describe('Primary Modal example: Confirm Action', () => {
  test('exposes exactly one alertdialog, named by its heading, as a modal', async ({ page }) => {
    await openByKeyboard(page);

    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toHaveCount(1);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toHaveAccessibleName(NAME);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The name has to be the heading's own text, so a reader hears the visible title.
    await expect(dialog.locator('.header-text')).toHaveText(NAME);

    await expect(dialog).toMatchAriaSnapshot(`
      - alertdialog "${NAME}":
        - text: ${NAME}
        - button "Close dialog"
        - paragraph: Are you sure you want to proceed with this action?
        - button "Cancel"
        - button "Confirm"
    `);
  });

  test('is described by the confirmation message, not only named by its heading', async ({
    page
  }) => {
    await openByKeyboard(page);
    const dialog = page.getByRole('alertdialog');

    // The browser's own computed description, as assistive technology receives it.
    await expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to proceed with this action?'
    );
    // And the reference has to resolve: a dangling id satisfies an attribute check and announces
    // nothing, so read what the id actually points at.
    const resolved = await dialog.evaluate((el) => {
      const id = el.getAttribute('aria-describedby');
      const target = id === null ? null : el.ownerDocument.getElementById(id);
      return {
        id,
        text: target?.textContent?.trim() ?? null,
        inside: target !== null && el.contains(target)
      };
    });
    expect(resolved).toEqual({
      id: 'confirm-modal-message',
      text: 'Are you sure you want to proceed with this action?',
      inside: true
    });
  });

  test('moves focus to the close control and keeps Tab inside the dialog in both directions', async ({
    page
  }) => {
    await openByKeyboard(page);
    await expect(page.getByTestId('confirm-modal-close')).toBeFocused();

    const forward: Array<string | null> = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      forward.push(await activeName(page));
      expect(await activeInsidePanel(page)).toBe(true);
    }
    expect(forward).toEqual([
      'Cancel',
      'Confirm',
      'Close dialog',
      'Cancel',
      'Confirm',
      'Close dialog'
    ]);

    const backward: Array<string | null> = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+Tab');
      backward.push(await activeName(page));
      expect(await activeInsidePanel(page)).toBe(true);
    }
    expect(backward).toEqual([
      'Confirm',
      'Cancel',
      'Close dialog',
      'Confirm',
      'Cancel',
      'Close dialog'
    ]);
  });

  const dismissals: ReadonlyArray<readonly [string, (page: Page) => Promise<void>]> = [
    ['Escape', (page) => page.keyboard.press('Escape')],
    ['the close control', (page) => page.getByTestId('confirm-modal-close').click()],
    ['Cancel', (page) => page.getByRole('button', { name: 'Cancel', exact: true }).click()],
    [
      'a click on the overlay',
      (page) => page.locator('.modal.overlay-active').click({ position: { x: 10, y: 10 } })
    ]
  ];

  for (const [label, dismiss] of dismissals) {
    test(`closing with ${label} removes the dialog and returns focus to the trigger`, async ({
      page
    }) => {
      const trigger = await openByKeyboard(page);
      await dismiss(page);
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }

  test('reopening after a close yields one dialog again, not a stale second one', async ({
    page
  }) => {
    const trigger = await openByKeyboard(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alertdialog', { name: NAME })).toHaveCount(1);
    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toHaveCount(1);
  });
});

// Opting into a role must not change which layer Escape belongs to. These are the two nested
// shapes the example page already carries, now asserted with the dialog semantics in place.
test.describe('Nested dismissal with dialog semantics', () => {
  test('a menu inside a dialog closes first, then the dialog, and focus goes back to the trigger', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/modal');
    const trigger = page.getByTestId('nested-menu-modal-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Row actions' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[role="dialog"], [role="alertdialog"]')).toHaveCount(1);

    await page.getByTestId('nested-menu').getByRole('button', { name: 'Row actions' }).click();
    const edit = page.getByRole('menuitem', { name: 'Edit' });
    await expect(edit).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(edit).toBeHidden();
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('with two modals stacked, Escape closes only the inner one and hands focus back to its opener', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/modal');
    await page.getByTestId('nested-lock-open-outer').click();
    const outer = page.getByTestId('nested-lock-outer-modal').locator('.modal-content');
    const inner = page.getByTestId('nested-lock-inner-modal').locator('.modal-content');
    await expect(outer).toBeVisible();

    const openInner = page.getByTestId('nested-lock-open-inner');
    await openInner.focus();
    await page.keyboard.press('Enter');
    await expect(inner).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(inner).toBeHidden();
    await expect(outer).toBeVisible();
    await expect(openInner).toBeFocused();
  });
});

// A dialog name has to survive the two places Modal moves or wraps its panel: <sui-modal>'s
// shadow root, and usePortal, which relocates the overlay. The name is an aria-label on the
// panel itself rather than a reference by id, so it cannot be left behind by either.
test.describe('sui-modal: dialog name resolves through the shadow root and portal', () => {
  test('modal-role + modal-aria-label name the panel when the overlay is portalled', async ({
    page
  }) => {
    await page.goto('/wc-form-demo.html');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-modal') !== 'undefined', null, {
      timeout: 30_000
    });
    await page.evaluate((name) => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('data-pw', 'wc-confirm-modal');
      modal.setAttribute('modal-role', 'alertdialog');
      modal.setAttribute('modal-aria-label', name);
      modal.toggleAttribute('use-portal', true);
      Reflect.set(modal, 'header', { text: name });
      const body = document.createElement('p');
      body.textContent = 'Are you sure you want to proceed with this action?';
      modal.append(body);
      document.body.append(modal);
    }, NAME);

    const dialog = page.getByRole('alertdialog', { name: NAME });
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Portalled, but into the host's own shadow root rather than document.body.
    const placement = await page.evaluate(() => {
      const host = document.querySelector('[data-pw="wc-confirm-modal"]');
      const overlay = host?.shadowRoot?.querySelector('.modal') ?? null;
      return {
        inShadowRoot: overlay !== null,
        onBody: document.body.querySelector(':scope > .modal') !== null
      };
    });
    expect(placement).toEqual({ inShadowRoot: true, onBody: false });
  });
});

// aria-describedby is an id reference and resolves inside the tree that holds the referencing element.
// The panel is inside <sui-modal>'s shadow root, so the id has to name something in that root. Content
// supplied through the content snippet property is there; light-DOM content passed through the default
// slot is not, and gives no description. Both halves are asserted so the documented limit is a tested one.
test.describe('sui-modal: aria-describedby resolves only inside the shadow root', () => {
  type WcModule = {
    createRawSnippet?: (factory: () => { render: () => string }) => unknown;
  };

  const MESSAGE = 'Are you sure you want to proceed with this action?';

  const loadBundleModule = async (page: Page): Promise<void> => {
    await page.goto('/wc-form-demo.html');
    await page.route('**/__sui-wc.js', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: readFileSync('dist-wc/index.js', 'utf8')
      })
    );
    await page.addScriptTag({
      content: `import('/__sui-wc.js').then((module) => { window.__suiWcModule = module; });`,
      type: 'module'
    });
    await page.waitForFunction(
      () =>
        typeof customElements.get('sui-modal') !== 'undefined' &&
        typeof (window as Window & { __suiWcModule?: WcModule }).__suiWcModule === 'object',
      null,
      { timeout: 30_000 }
    );
  };

  test('an id inside the content snippet describes the panel', async ({ page }) => {
    await loadBundleModule(page);
    await page.evaluate((message) => {
      const module = (window as Window & { __suiWcModule?: WcModule }).__suiWcModule;
      if (typeof module?.createRawSnippet !== 'function') {
        throw new Error('the WC entry must export createRawSnippet');
      }
      const modal = document.createElement('sui-modal');
      modal.setAttribute('modal-role', 'alertdialog');
      modal.setAttribute('modal-aria-label', 'Confirm Action');
      modal.setAttribute('aria-describedby', 'snippet-message');
      Reflect.set(modal, 'header', { text: 'Confirm Action' });
      Reflect.set(
        modal,
        'content',
        module.createRawSnippet(() => ({
          render: () => `<p id="snippet-message">${message}</p>`
        }))
      );
      document.body.append(modal);
    }, MESSAGE);

    const dialog = page.getByRole('alertdialog', { name: 'Confirm Action' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-describedby', 'snippet-message');
    await expect(dialog).toHaveAccessibleDescription(MESSAGE);
  });

  test('an id naming slotted light-DOM content does not describe the panel', async ({ page }) => {
    await loadBundleModule(page);
    await page.evaluate((message) => {
      const modal = document.createElement('sui-modal');
      modal.setAttribute('modal-role', 'alertdialog');
      modal.setAttribute('modal-aria-label', 'Confirm Action');
      modal.setAttribute('aria-describedby', 'light-message');
      Reflect.set(modal, 'header', { text: 'Confirm Action' });
      const body = document.createElement('p');
      body.id = 'light-message';
      body.textContent = message;
      modal.append(body);
      document.body.append(modal);
    }, MESSAGE);

    const dialog = page.getByRole('alertdialog', { name: 'Confirm Action' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-describedby', 'light-message');
    // The attribute is present and resolves to nothing: the limit docs/Modal.md states.
    await expect(dialog).toHaveAccessibleDescription('');
  });
});
