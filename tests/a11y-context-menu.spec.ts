import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// WAI-ARIA APG menu pattern. ContextMenu previously never returned focus to whatever
// opened it (see the openerElement fix alongside this spec) — every one of these tests
// after the first exercises a real keyboard-only round trip through the menu.
test.describe('ContextMenu keyboard interaction (WAI-ARIA menu pattern)', () => {
  test('right-clicking the target opens the menu and focuses the first item', async ({ page }) => {
    await gotoHydrated(page, '/components/context-menu');

    await page.getByTestId('context-menu-target').click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Cut' })).toBeFocused();
  });

  test('ArrowDown/ArrowUp move focus between items and wrap at the ends', async ({ page }) => {
    await gotoHydrated(page, '/components/context-menu');
    await page.getByTestId('context-menu-target').click({ button: 'right' });

    const cut = page.getByRole('menuitem', { name: 'Cut' });
    const copy = page.getByRole('menuitem', { name: 'Copy' });
    const paste = page.getByRole('menuitem', { name: 'Paste' });

    await expect(cut).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(copy).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(paste).toBeFocused();

    // Wraps past the last item back to the first.
    await page.keyboard.press('ArrowDown');
    await expect(cut).toBeFocused();

    // And wraps the other way past the first item back to the last.
    await page.keyboard.press('ArrowUp');
    await expect(paste).toBeFocused();
  });

  test('Home and End jump to the first and last item', async ({ page }) => {
    await gotoHydrated(page, '/components/context-menu');
    await page.getByTestId('context-menu-target').click({ button: 'right' });

    await page.keyboard.press('End');
    await expect(page.getByRole('menuitem', { name: 'Paste' })).toBeFocused();

    await page.keyboard.press('Home');
    await expect(page.getByRole('menuitem', { name: 'Cut' })).toBeFocused();
  });

  test('Escape closes the menu and returns focus to the element that opened it', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/context-menu');

    const target = page.getByTestId('context-menu-target');
    await target.focus();
    await target.click({ button: 'right' });

    await expect(page.getByRole('menuitem', { name: 'Cut' })).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('menu')).toBeHidden();
    await expect(target).toBeFocused();
  });

  test('Tab closes the menu instead of trapping focus inside it', async ({ page }) => {
    await gotoHydrated(page, '/components/context-menu');

    await page.getByTestId('context-menu-target').click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Cut' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('menu')).toBeHidden();
  });

  test('Enter selects the focused item, closes the menu, and returns focus to the opener', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/context-menu');

    const target = page.getByTestId('context-menu-target');
    await target.focus();
    await target.click({ button: 'right' });

    const activations: string[] = [];
    page.on('dialog', async (dialog) => {
      activations.push(dialog.message());
      await dialog.dismiss();
    });

    await page.keyboard.press('ArrowDown'); // Cut -> Copy
    await page.keyboard.press('Enter');

    await expect.poll(() => activations.length).toBe(1);
    expect(activations).toEqual(['Context: Copy']);
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(target).toBeFocused();
  });

  test('closing by clicking a focusable element outside leaves focus there, not on the opener', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/context-menu');

    const target = page.getByTestId('context-menu-target');
    const outside = page.getByTestId('context-menu-outside-button');

    await target.focus();
    await target.click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();

    await outside.click();

    // The browser focuses the clicked button; restoring focus to the opener
    // unconditionally would yank it straight back and lose the user's place.
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(outside).toBeFocused();
  });

  test('right-clicking a focusable target while focus is elsewhere returns focus to the target', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/context-menu');

    const target = page.getByTestId('context-menu-target');
    const outside = page.getByTestId('context-menu-outside-button');

    // The case the other tests cannot see, because they all focus the target
    // before right-clicking it: here focus starts somewhere else entirely, so
    // "the element that was focused" and "the element the menu was opened on"
    // are two different elements and the choice between them is visible.
    await outside.focus();
    await expect(outside).toBeFocused();

    await target.click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');

    // APG's menu pattern returns focus to the element that invoked the menu,
    // and for a context menu that is the element it was opened on — not
    // wherever focus happened to be beforehand.
    await expect(target).toBeFocused();
  });

  test('closing with Escape still returns focus to the opener', async ({ page }) => {
    await gotoHydrated(page, '/components/context-menu');

    const target = page.getByTestId('context-menu-target');
    await target.focus();
    await target.click({ button: 'right' });
    await page.keyboard.press('Escape');

    // The other half of the same rule: focus was still inside the menu, so it
    // was loose and does belong back on the opener.
    //
    // Escape is pressed straight after the right-click, without waiting for the
    // first item to take focus, so this also pins the race the opening frame
    // used to lose: that frame is cancelled on close now, and letting it run
    // after the menu was gone left nothing focused at all. It reproduced only
    // under the right timing, which is why it is asserted here rather than left
    // to the sibling test above that waits for the item first.
    await expect(target).toBeFocused();
  });

  test('the application role is scoped to while the menu is open, and the menu carries menu/menuitem roles', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/context-menu');

    // role="application" makes a screen reader pass every keystroke through.
    // That is right while a menu owns the keyboard and wrong the rest of the
    // time, because this container wraps arbitrary consumer content whose
    // normal browse-mode navigation should keep working.
    const container = page.getByTestId('context-menu-demo');
    await expect(container).not.toHaveAttribute('role', 'application');

    await page.getByTestId('context-menu-target').click({ button: 'right' });

    await expect(container).toHaveAttribute('role', 'application');

    // Scoped to the menu itself: the surrounding docs layout renders its own
    // unrelated <hr> separator, which a bare page-wide getByRole('separator')
    // would also match.
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Cut' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Paste' })).toBeVisible();
    await expect(menu.getByRole('separator')).toBeVisible();
  });
});
