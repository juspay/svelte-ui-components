import { expect, test } from '@playwright/test';

// pin-sender-turn reserves headroom on the inner wrapper so the newest sender message can reach
// the top of the viewport, then scrolls it there. Two things used to conspire to lose that pin on
// any turn whose reply was shorter than the frame, which is exactly when pinning matters most:
//
//   1. .chat-message-list sets scroll-behavior: smooth, so `scrollTop = x` starts an ANIMATION.
//   2. Without pinHold the reservation was cleared in the same microtask, shrinking the scrollable
//      range below the target offset while that animation was still in flight.
//
// The browser clamped the half-finished scroll and the question slid back down. Measured on the
// demo below: the sender settled 265px down instead of at the top; it now rests at 12px, which is
// the row's own top margin and the same offset the pinHold demo settles at. The bound is 16px so
// the check is about "at the top", not about that margin's exact value.
test.describe('ChatMessageList — pin-sender-turn without pinHold', () => {
  test('a reply shorter than the frame still leaves the sender message pinned to the top', async ({
    page
  }) => {
    await page.goto('/components/chat-message-list');

    const list = page.locator('[data-pw="pin-nohold-list"]');
    await expect(list).toBeVisible();

    await page.getByTestId('pin-nohold-send').click();

    // Assert what the reader sees -- the newest question resting at the top of the viewport --
    // rather than scrollTop or the reservation, so the test does not encode how the pin works.
    await expect
      .poll(
        async () =>
          list.evaluate((element) => {
            const senders = Array.from(element.querySelectorAll('.chat-message.party-sender'));
            const target = senders[senders.length - 1];
            if (!(target instanceof HTMLElement)) {
              return null;
            }
            const paddingTop = Number.parseFloat(getComputedStyle(element).paddingTop) || 0;
            return Math.round(
              target.getBoundingClientRect().top - element.getBoundingClientRect().top - paddingTop
            );
          }),
        { timeout: 5000 }
      )
      .toBeLessThanOrEqual(16);
  });

  test('a second turn re-pins, so the reservation tracks the newest question', async ({ page }) => {
    await page.goto('/components/chat-message-list');
    const list = page.locator('[data-pw="pin-nohold-list"]');
    await expect(list).toBeVisible();

    await page.getByTestId('pin-nohold-send').click();
    await page.getByTestId('pin-nohold-send').click();

    await expect
      .poll(
        async () =>
          list.evaluate((element) => {
            const senders = Array.from(element.querySelectorAll('.chat-message.party-sender'));
            const target = senders[senders.length - 1];
            if (!(target instanceof HTMLElement)) {
              return null;
            }
            const paddingTop = Number.parseFloat(getComputedStyle(element).paddingTop) || 0;
            return Math.round(
              target.getBoundingClientRect().top - element.getBoundingClientRect().top - paddingTop
            );
          }),
        { timeout: 5000 }
      )
      .toBeLessThanOrEqual(16);
  });
});
