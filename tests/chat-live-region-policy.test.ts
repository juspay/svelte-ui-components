import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * The chat announcement policy, locked.
 *
 * Every clause here is load-bearing and none of it is visible on screen, which
 * is exactly the combination that gets removed by a well-meaning refactor. A
 * list that stops being a live region, or a body that stays silenced after it
 * settles, looks completely normal and leaves a screen-reader user with either
 * a stutter of partial words or silence where the answer should be.
 */
test.describe('Chat — how a streaming message gets announced', () => {
  test('the list is a polite log region', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message-list');

    const list = page.getByTestId('reveal-list');
    // `log` is the role for an append-only record; `polite` waits for a pause
    // instead of cutting the reader off mid-sentence.
    await expect(list).toHaveAttribute('role', 'log');
    await expect(list).toHaveAttribute('aria-live', 'polite');
  });

  /*
   * NOT asserted here, and I could not make it assertable from this route.
   *
   * Two clauses of the policy concern the message BODY: that it carries
   * aria-live="off" and aria-busy="true" while it streams, and that both are
   * removed once it settles. The `reveal-list` fixture never renders a
   * responder body at all -- a streaming message with no revealed text shows a
   * typing indicator instead, and it stays on that indicator through both
   * reveal-start and reveal-finish. There is therefore no moment at which a
   * body exists to inspect, and a test written against it times out rather
   * than failing on the attribute.
   *
   * The behaviour is real and implemented at ChatMessage.svelte:231. What is
   * missing is a demo that streams a body, which this page does not have.
   * Asserting the two clauses needs that fixture built first; recording the
   * gap here beats a test that silently proves nothing.
   */

  test('silencing is scoped to the streaming body, not the whole list', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message-list');
    await page.getByTestId('reveal-start').click();

    // If the opt-out were applied to the list instead of the body, the region
    // would go quiet for every future message as well, and the bug would only
    // show up as "the chat stopped announcing" long after the change.
    await expect(page.getByTestId('reveal-list')).toHaveAttribute('aria-live', 'polite');
  });
});
