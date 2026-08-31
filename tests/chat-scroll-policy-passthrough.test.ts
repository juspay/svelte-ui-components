import { expect, test } from '@playwright/test';

test.describe('Chat scroll policy passthrough', () => {
  test('forwards scroll policy, pin hold, jump controls, and scroll state to its message list', async ({
    page
  }) => {
    await page.goto('/components/chat');

    const pinChat = page.getByTestId('chat-scroll-policy-pin');
    const pinList = pinChat.locator('.chat-message-list');
    await expect(pinList).toBeVisible();

    await page.getByTestId('chat-scroll-policy-send').click();
    await expect(pinList.locator('.inner')).toHaveCSS('min-height', /[1-9]\d*px/);
    await expect(page.getByTestId('chat-scroll-policy-state')).toHaveText('scrollable');
    // Move away from the bottom: this distinguishes Chat forwarding jump={false}
    // from silently using ChatMessageList's default jump=true.
    await pinList.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(pinList.getByRole('button')).toHaveCount(0);

    await page.getByTestId('chat-scroll-policy-finish').click();
    await expect(pinList.locator('.inner')).toHaveCSS('min-height', 'auto');

    const jumpChat = page.getByTestId('chat-scroll-policy-jump');
    const jumpList = jumpChat.locator('.chat-message-list');
    await expect(jumpList).toBeVisible();

    await expect
      .poll(() => jumpList.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await jumpList.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event('scroll'));
    });

    const jumpButton = jumpList.getByRole('button', { name: 'Show latest reply' });
    await expect(jumpButton).toBeVisible();
    await expect(jumpButton.locator('[data-pw="chat-scroll-policy-jump-icon"]')).toBeVisible();

    await jumpButton.click();
    await expect.poll(() => jumpList.evaluate((element) => element.scrollTop > 0)).toBe(true);
  });
});
