import { expect, test } from '@playwright/test';

test.describe('Choicebox keyboard interaction', () => {
  test('Tab reaches an enabled Choicebox and Enter/Space toggle it (checkbox mode)', async ({
    page
  }) => {
    await page.goto('/components/choicebox');

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
    await page.goto('/components/choicebox');

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
    await page.goto('/components/choicebox');

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
  // plus arrow-key roving selection between members. Each Choicebox here is instead
  // its own independent tab stop (mode="radio" gives it role="radio", but nothing
  // groups sibling instances into a radiogroup or moves focus between them on
  // ArrowUp/Down) — a real gap, but fixing it needs a way to discover sibling
  // Choiceboxes that share a group, which the component has no concept of today (no
  // `name`/group prop, no radiogroup wrapper). Threading that through safely is a
  // feature addition, not a small keyboard-handler fix, so this is left failing on
  // purpose rather than papered over with a fragile DOM-sibling walk.
  test.fixme('sibling radio-mode Choiceboxes form a single-tab-stop group with arrow-key roving selection', async ({
    page
  }) => {
    await page.goto('/components/choicebox');

    const standard = page.getByTestId('choicebox-radio-standard');
    const express = page.getByTestId('choicebox-radio-express');

    await standard.focus();
    await page.keyboard.press('ArrowDown');
    await expect(express).toBeFocused();
    await expect(express).toHaveAttribute('aria-checked', 'true');
  });
});
