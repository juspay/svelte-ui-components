import { expect, test } from '@playwright/test';

// `clampLines` collapses the rendered body and makes the bubble its own control. The
// behaviour was being rebuilt by consumers around the `body` snippet, which meant each
// one re-derived the keyboard handling and the clamp CSS; the risk in moving it here is
// that the clamp stops actually hiding anything, so the assertions are about measured
// height and the exposed state rather than about the class names that produce them.
test.describe('ChatMessage — clampLines', () => {
  test('collapses a long message and expands it by click and by keyboard', async ({ page }) => {
    await page.goto('/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo"] .bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    const clamped = (await bubble.boundingBox())?.height ?? 0;
    expect(clamped).toBeGreaterThan(0);

    await bubble.click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
    const expanded = (await bubble.boundingBox())?.height ?? 0;
    // The clamp has to be doing something: a collapsed body must be shorter than an
    // expanded one, or the attribute is decoration.
    expect(expanded).toBeGreaterThan(clamped);

    await bubble.click();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    await bubble.focus();
    await page.keyboard.press('Enter');
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
    await page.keyboard.press(' ');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
  });

  test('clampLines drives the clamp, so a different value clamps differently', async ({ page }) => {
    await page.goto('/components/chat-message');

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
    await page.goto('/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo-toggle"] .bubble');
    const toggle = page.locator('[data-pw="clamp-toggle"]');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    await bubble.click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');

    // Off: no clamp, no control.
    await toggle.click();
    await expect(bubble).not.toHaveAttribute('role', 'button');

    // Back on: clamped again, not still open from before.
    await toggle.click();
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
    await expect(bubble).toHaveAttribute('data-expanded', 'false');
  });

  test('the clamped bubble is named by what it does and reports its state', async ({ page }) => {
    await page.goto('/components/chat-message');

    // A role=button whose accessible name is the message text tells a screen-reader
    // user nothing about what activating it does, and nothing about the current state.
    const bubble = page.locator('[data-pw="clamp-demo"] .bubble');
    await expect(bubble).toHaveAttribute('aria-label', 'Expand message');
    await expect(bubble).toHaveAttribute('aria-expanded', 'false');

    await bubble.click();
    await expect(bubble).toHaveAttribute('aria-label', 'Collapse message');
    await expect(bubble).toHaveAttribute('aria-expanded', 'true');
  });

  test('a consumer stylesheet outranks the prop, which is what the docs promise', async ({
    page
  }) => {
    await page.goto('/components/chat-message');
    const fourBody = page.locator('[data-pw="clamp-demo-four"] .body');
    await expect(fourBody).toHaveCSS('-webkit-line-clamp', '4');

    // Exactly what a consumer theme sheet does: set the token on an ancestor. An
    // inline style carrying the prop would win here and the token would be inert.
    await page.addStyleTag({ content: ':root { --chat-message-clamp-lines: 3; }' });
    await expect(fourBody).toHaveCSS('-webkit-line-clamp', '3');
  });

  test('activating a link inside a clamped message does not also toggle it', async ({ page }) => {
    await page.goto('/components/chat-message');

    const bubble = page.locator('[data-pw="clamp-demo-link"] .bubble');
    const link = page.locator('[data-pw="clamp-inner-link"]');
    await expect(bubble).toHaveAttribute('data-clamped', 'true');

    await link.click();
    // The link did its own job; the bubble must be exactly as it was.
    await expect(bubble).toHaveAttribute('data-clamped', 'true');
    await expect(bubble).toHaveAttribute('aria-expanded', 'false');

    // The bubble itself still toggles, so the guard has not disabled the control.
    await bubble.click({ position: { x: 5, y: 5 } });
    await expect(bubble).toHaveAttribute('aria-expanded', 'true');
  });

  test('the clamped bubble shows a focus ring that survives an outline reset', async ({ page }) => {
    await page.goto('/components/chat-message');

    // Consumer sheets in this ecosystem do reset outlines on message surfaces; the
    // component declares its own ring so keyboard focus stays visible when they do.
    // Not `!important` on purpose -- that beats any non-important rule whatever its
    // specificity, so asserting against it would be testing the cascade, not the fix.
    await page.addStyleTag({ content: '.bubble { outline: none; }' });
    const bubble = page.locator('[data-pw="clamp-demo"] .bubble');
    // :focus-visible needs the focus to read as keyboard-driven.
    await page.keyboard.press('Tab');
    await bubble.focus();

    const ring = await bubble.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        style: styles.outlineStyle,
        width: Number.parseFloat(styles.outlineWidth),
        focusVisible: element.matches(':focus-visible')
      };
    });

    // Assert the selector actually engaged, so a future failure says which half broke.
    expect(ring.focusVisible).toBe(true);
    // `solid` rather than merely "not none": the UA ring is `auto`, so this is what
    // distinguishes the component's own rule from the browser default.
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThan(0);
  });

  test('a message without clampLines gets no interactive role', async ({ page }) => {
    await page.goto('/components/chat-message');
    const plain = page.locator('.chat-message .bubble').first();
    await expect(plain).not.toHaveAttribute('role', 'button');
  });
});
