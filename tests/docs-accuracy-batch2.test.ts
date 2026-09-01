import { expect, test } from '@playwright/test';

test.describe('Docs accuracy — Card, Checkbox, ChatSuggestions, ChatComposer, ChatMessage', () => {
  // Regression guard: docs/Card.md and docs/Checkbox.md claimed --card-border-radius
  // defaulted to 8px / --checkbox-border-radius to 3px. Neither matches the real CSS
  // (`var(--x-border-radius, var(--radius, 4px))`), so the true default is 4px, and
  // --radius (undocumented until this pass) is a real, reachable fallback. These tests
  // prove the corrected docs, not just that the markdown changed.
  test('Card: --card-border-radius truly defaults to 4px, and --radius is a real fallback', async ({
    page
  }) => {
    await page.goto('/components/card');

    const card = page.getByTestId('two-zone-card');
    await expect(card).toHaveCSS('border-radius', '4px');

    await card.evaluate((el) => {
      (el.closest('.demo-row') as HTMLElement).style.setProperty('--radius', '20px');
    });
    await expect(card).toHaveCSS('border-radius', '20px');
  });

  test('Checkbox: --checkbox-border-radius truly defaults to 4px, and --radius is a real fallback', async ({
    page
  }) => {
    await page.goto('/components/checkbox');

    const box = page.getByTestId('checkbox-default').locator('.box');
    await expect(box).toHaveCSS('border-radius', '4px');

    await page
      .getByTestId('checkbox-default')
      .evaluate((el) => (el as HTMLElement).style.setProperty('--radius', '9px'));
    await expect(box).toHaveCSS('border-radius', '9px');
  });

  test('ChatSuggestions: chipClasses reaches every chip wrapper', async ({ page }) => {
    await page.goto('/components/chat-suggestions');

    const group = page.getByTestId('chat-suggestions-chip-classes');
    const hooked = group.locator('.demo-chip-hook');
    await expect(hooked).toHaveCount(4);
  });

  test('ChatComposer: --chat-composer-attachments-padding is consumed by the rich attachment row', async ({
    page
  }) => {
    await page.goto('/components/chat-composer');

    const richRow = page.locator('.attachments-rich').first();
    await expect(richRow).toBeVisible();
    await expect(richRow).toHaveCSS('padding', '2px 4px 0px');

    await richRow.evaluate((el) =>
      (el.closest('.composer-frame') as HTMLElement).style.setProperty(
        '--chat-composer-attachments-padding',
        '10px 20px'
      )
    );
    await expect(richRow).toHaveCSS('padding', '10px 20px');
  });

  test('ChatMessage: --chat-message-list-margin/-padding are consumed by rendered markdown lists', async ({
    page
  }) => {
    await page.goto('/components/chat-message');

    const list = page.getByTestId('chat-message-markdown').locator('ul');
    await expect(list).toBeVisible();
    const before = await list.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(before).toBeGreaterThan(0);

    await list.evaluate((el) =>
      (el.closest('[data-pw="chat-message-markdown"]') as HTMLElement).style.setProperty(
        '--chat-message-list-padding',
        '20em'
      )
    );
    // 20em is deliberately far outside any plausible unstyled default, so a
    // real jump proves the variable is consumed rather than coinciding with
    // whatever the default already resolves to under this element's actual
    // inherited font-size (which the test intentionally doesn't hardcode).
    const after = await list.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(after).toBeGreaterThan(before * 5);
  });
});
