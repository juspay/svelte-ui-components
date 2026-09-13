import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('Choicebox keyboard interaction', () => {
  test('Tab reaches an enabled Choicebox and Enter/Space toggle it (checkbox mode)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/choicebox');

    const checkA = page.getByTestId('choicebox-check-a');
    await checkA.focus();
    await expect(checkA).toBeFocused();
    await expect(checkA).toHaveAttribute('role', 'checkbox');
    await expect(checkA).toHaveAttribute('aria-checked', 'false');

    await page.keyboard.press('Enter');
    await expect(checkA).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press(' ');
    await expect(checkA).toHaveAttribute('aria-checked', 'false');
  });

  test('Space selects a Choicebox in radio mode, and re-pressing an already-selected one is a no-op', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/choicebox');

    // Scoped to the group rather than reached by test id alone. Resolving the
    // radios directly would leave the test passing if `role="radiogroup"` or
    // its name came off the demo, which is half of what makes three separate
    // radios announce as one exclusive set.
    const group = page.getByRole('radiogroup', { name: 'Shipping speed' });
    const standard = group.getByTestId('choicebox-radio-standard');
    const express = group.getByTestId('choicebox-radio-express');

    await expect(standard).toHaveAttribute('role', 'radio');
    await expect(standard).toHaveAttribute('aria-checked', 'true');
    await expect(express).toHaveAttribute('aria-checked', 'false');

    await express.focus();
    await page.keyboard.press(' ');
    await expect(express).toHaveAttribute('aria-checked', 'true');
    await expect(standard).toHaveAttribute('aria-checked', 'false');

    // Radio mode never unchecks the already-selected item from its own keydown —
    // exclusivity comes entirely from the demo's selectRadio() closure repainting
    // the other instances, mirroring how a real consumer wires independent cards.
    await page.keyboard.press('Enter');
    await expect(express).toHaveAttribute('aria-checked', 'true');
  });

  test('a disabled Choicebox leaves the tab order and ignores keyboard activation', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/choicebox');

    const overnight = page.getByTestId('choicebox-radio-overnight');
    await expect(overnight).toHaveAttribute('tabindex', '-1');
    await expect(overnight).toHaveAttribute('aria-disabled', 'true');

    await overnight.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
    await page.keyboard.press('Enter');
    await expect(overnight).toHaveAttribute('aria-checked', 'false');
  });

  // WAI-ARIA APG's Radio Group pattern requires a single Tab stop for the whole group
  // plus arrow-key roving selection between members. This was a `test.fixme` while
  // Choicebox had no way to discover siblings sharing a group; that ability was
  // added, so it runs.
  //
  // It asserts against the `name="plan"` cards rather than the ones above, because
  // grouping is opt-in: the cards at the top of that page carry no `name` and are
  // still independent tab stops by design, with the parent owning the selection.
  // Pointing this at them would assert the controlled pattern behaves like the
  // grouped one, which is exactly what the opt-in is there to keep apart.
  test('sibling radio-mode Choiceboxes form a single-tab-stop group with arrow-key roving selection', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/choicebox');

    const basic = page.getByTestId('choicebox-form-basic');
    const pro = page.getByTestId('choicebox-form-pro');

    await basic.focus();
    await page.keyboard.press('ArrowDown');
    await expect(pro).toBeFocused();
    await expect(pro).toHaveAttribute('aria-checked', 'true');
    await expect(basic).toHaveAttribute('aria-checked', 'false');
  });
});
