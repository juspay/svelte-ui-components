import { expect, test } from '@playwright/test';

// `typewriter` renders the message through TypewriterText instead of painting it at once.
// The risk in wiring two components together is that the reveal silently stops being a
// reveal — either showing everything immediately, or never completing — so the assertions
// are about how much text is on screen at a given moment, not about which component ran.
test.describe('ChatMessage — typewriter', () => {
  test('reveals a streamed message progressively and completes when streaming stops', async ({
    page
  }) => {
    await page.goto('/components/chat-message');

    // Deliberately the slow demo (200ms/char), not the human-paced one. At the demo's
    // own 30ms a 51-character reveal closes in ~1.5s, which a stalled runner can step
    // over — the partial-window assertion would then read the complete string and fail
    // for a reason that has nothing to do with the behaviour under test.
    const body = page.locator('[data-pw="typewriter-slow"] .body');
    const full = 'A deliberately slow reveal, so the partial window stays open.';

    await page.locator('[data-pw="typewriter-slow-start"]').click();

    // Mid-reveal: some text, but not all of it. This is the assertion that fails if the
    // wiring degrades into "render everything immediately".
    await expect(body).not.toHaveText('');
    const partial = (await body.textContent()) ?? '';
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(full.length);

    // It keeps going on its own while streaming.
    await expect
      .poll(async () => ((await body.textContent()) ?? '').length, { timeout: 5000 })
      .toBeGreaterThan(partial.length);

    // Ending the stream shows the remainder at once.
    await page.locator('[data-pw="typewriter-slow-finish"]').click();
    await expect(body).toHaveText(full);
  });

  test('types markdown through the markdown pipeline, not as raw syntax', async ({ page }) => {
    await page.goto('/components/chat-message');
    await page.locator('[data-pw="typewriter-start"]').click();
    await page.locator('[data-pw="typewriter-finish"]').click();

    const body = page.locator('[data-pw="typewriter-demo"] .body');
    // The source is `**streamed**`. Rendered, that is a <strong> and the asterisks are gone.
    await expect(body.locator('strong')).toHaveText('streamed');
    await expect(body).not.toContainText('**');
  });

  test('the revealing body is silenced for the surrounding live region', async ({ page }) => {
    await page.goto('/components/chat-message');
    // The demo starts with no text, so nothing renders until a stream begins.
    await page.locator('[data-pw="typewriter-start"]').click();

    // ChatMessageList is role="log" aria-live="polite". A body whose text grows one
    // character at a time would otherwise be announced as it grows.
    await expect(page.locator('[data-pw="typewriter-demo"] .body')).toHaveAttribute(
      'aria-live',
      'off'
    );
    // Paired with aria-busy: aria-live="off" is the spec answer, aria-busy is the
    // purpose-built one, so the contract does not rest on a single AT behaviour.
    await expect(page.locator('[data-pw="typewriter-demo"] .body')).toHaveAttribute(
      'aria-busy',
      'true'
    );

    // Only the revealing body: a normal message must stay readable by the live region.
    await expect(page.locator('[data-pw="chat-message-settled-bubble"] .body')).not.toHaveAttribute(
      'aria-live',
      'off'
    );

    // And only WHILE revealing. Left off after the stream ends, the settled message would
    // never be announced -- which is the announcement the live region exists for.
    await page.locator('[data-pw="typewriter-finish"]').click();
    await expect(page.locator('[data-pw="typewriter-demo"] .body')).not.toHaveAttribute(
      'aria-live',
      'off'
    );
    await expect(page.locator('[data-pw="typewriter-demo"] .body')).not.toHaveAttribute(
      'aria-busy',
      'true'
    );

    // A typewriter message that never streamed is not silenced either.
    await expect(page.locator('[data-pw="typewriter-static"] .body')).not.toHaveAttribute(
      'aria-live',
      'off'
    );
  });

  test('markdown set before mount still renders as markdown', async ({ page }) => {
    // The markdown renderer loads asynchronously, so a message whose markdown is already
    // set when the component mounts races it. What must hold is that the settled message
    // is rendered markdown, never the source string.
    await page.goto('/components/chat-message');

    const body = page.locator('[data-pw="typewriter-at-load"] .body');
    await expect(body.locator('strong')).toHaveText('bold');
    await expect(body).toHaveText('A bold claim present at first paint.');
  });

  test('a non-streaming typewriter message is shown in full', async ({ page }) => {
    await page.goto('/components/chat-message');
    const body = page.locator('[data-pw="typewriter-static"] .body');
    await expect(body).toHaveText('A message that is not streaming shows in full immediately.');
  });

  test('without the prop the message is painted at once, with no typewriter', async ({ page }) => {
    await page.goto('/components/chat-message');
    const plain = page.locator('[data-pw="chat-message-settled-bubble"]');
    await expect(plain.locator('.typewriter-text')).toHaveCount(0);
  });
});

// The list forwards `typewriter`/`typewriterSpeed` off each ChatMessageData. The failure this
// guards against is the field being dropped silently in the middle: the message still renders,
// just all at once, which looks correct in a screenshot and is only visible over time.
test.describe('ChatMessageList — forwards the per-message typewriter', () => {
  test('reveals only the message that carries the flag', async ({ page }) => {
    await page.goto('/components/chat-message-list');

    const list = page.locator('[data-pw="reveal-list"]');
    const responder = list.locator('.chat-message').nth(1).locator('.body');
    const full =
      'Yes — the list forwards the reveal per message, so only this one types itself out.';

    await page.locator('[data-pw="reveal-start"]').click();

    // Mid-reveal. If the field were dropped, the body would already hold the whole string.
    const partial = (await responder.textContent()) ?? '';
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(full.length);

    // The sender message is the in-page control: same list, same render path, no flag.
    // It must be complete at the same instant the responder is not.
    const sender = list.locator('.chat-message').nth(0).locator('.body');
    await expect(sender).toHaveText('Does the list forward the typewriter?');

    await page.locator('[data-pw="reveal-finish"]').click();
    await expect(responder).toHaveText(full);
  });
});
