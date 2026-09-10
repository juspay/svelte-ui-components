import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// `clampLines` collapses the rendered body and makes the bubble its own control. The
// behaviour was being rebuilt by consumers around the `body` snippet, which meant each
// one re-derived the keyboard handling and the clamp CSS; the risk in moving it here is
// that the clamp stops actually hiding anything, so the assertions are about measured
// height and the exposed state rather than about the class names that produce them.
test.describe('ChatMessage — clampLines', () => {
  test('collapses a long message and expands it by click and by keyboard', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo"] .bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    const clamped = (await bubble.boundingBox())?.height ?? 0;
    expect(clamped).toBeGreaterThan(0);

    const toggle = page.locator('[data-pw="clamp-demo-clamp-toggle"]');

    await toggle.click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
    const expanded = (await bubble.boundingBox())?.height ?? 0;
    // The clamp has to be doing something: a collapsed body must be shorter than an
    // expanded one, or the attribute is decoration.
    expect(expanded).toBeGreaterThan(clamped);

    await toggle.click();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    // Reachable and operable by keyboard alone, which is the point of it being a Button.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
    await page.keyboard.press(' ');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
  });

  test('clampLines drives the clamp, so a different value clamps differently', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const twoBody = page.locator('[data-pw="clamp-demo"] .body');
    const fourBody = page.locator('[data-pw="clamp-demo-four"] .body');
    await expect(twoBody).toBeVisible();
    await expect(fourBody).toBeVisible();

    // The prop has to reach the stylesheet. It previously did not: the CSS read a
    // consumer token with a hardcoded fallback of 2, so every value clamped at two
    // lines and a test using the default could not tell the difference.
    await expect(twoBody).toHaveCSS('-webkit-line-clamp', '2');
    await expect(fourBody).toHaveCSS('-webkit-line-clamp', '4');

    const twoHeight = (await twoBody.boundingBox())?.height ?? 0;
    const fourHeight = (await fourBody.boundingBox())?.height ?? 0;
    expect(twoHeight).toBeGreaterThan(0);
    expect(fourHeight).toBeGreaterThan(twoHeight);
  });

  test('withdrawing clampLines re-clamps the message when it is restored', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo-toggle"] .bubble');
    const toggle = page.locator('[data-pw="clamp-toggle"]');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    await page.locator('[data-pw="clamp-demo-toggle-clamp-toggle"]').click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');

    // Off: no clamp, no control at all.
    await toggle.click();
    await expect(page.locator('[data-pw="clamp-demo-toggle-clamp-toggle"]')).toHaveCount(0);

    // Back on: clamped again, not still open from before.
    await toggle.click();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
    await expect(bubble).toHaveAttribute('data-expanded', 'false');
  });

  test('the clamped bubble is named by what it does and reports its state', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    // The disclosure control is a real button with its own name and state. The bubble
    // must NOT be one: a button flattens the semantics of everything inside it, and a
    // message body renders paragraphs and lists.
    const bubble = page.locator('[data-pw="clamp-demo"] .bubble');
    const toggle = page.locator('[data-pw="clamp-demo-clamp-toggle"]');

    await expect(bubble).not.toHaveAttribute('role', 'button');
    await expect(bubble).not.toHaveAttribute('tabindex', '0');

    await expect(toggle).toHaveRole('button');
    await expect(toggle).toHaveText('Expand message');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // The control names the region it governs, and that region is the clamped body.
    const controls = await toggle.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    await expect(page.locator(`#${controls}`)).toHaveClass(/body/);

    await toggle.click();
    await expect(toggle).toHaveText('Collapse message');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('a consumer stylesheet outranks the prop, which is what the docs promise', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/chat-message');
    const fourBody = page.locator('[data-pw="clamp-demo-four"] .body');
    await expect(fourBody).toHaveCSS('-webkit-line-clamp', '4');

    // Exactly what a consumer theme sheet does: set the token on an ancestor. An
    // inline style carrying the prop would win here and the token would be inert.
    await page.addStyleTag({ content: ':root { --chat-message-clamp-lines: 3; }' });
    await expect(fourBody).toHaveCSS('-webkit-line-clamp', '3');
  });

  test('activating a link inside a clamped message does not also toggle it', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo-link"] .bubble');
    const link = page.locator('[data-pw="clamp-inner-link"]');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    await link.click();
    // The link did its own job. Nothing else on the bubble can claim that click,
    // because the bubble is not a control -- only the toggle Button is.
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
    await expect(bubble).toHaveAttribute('data-expanded', 'false');

    // Clicking the message body is inert; the control is the Button.
    await bubble.click({ position: { x: 5, y: 5 } });
    await expect(bubble).toHaveAttribute('data-expanded', 'false');
    await page.locator('[data-pw="clamp-demo-link-clamp-toggle"]').click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
  });

  test('a message without clampLines gets no interactive role', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');
    const plain = page.locator('.chat-message .bubble').first();
    await expect(plain).not.toHaveAttribute('role', 'button');
  });
});
