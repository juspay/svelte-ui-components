import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { chatMessageBodyPoint } from './support/chat-message-pointer';

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
    await bubble.click({ position: await chatMessageBodyPoint(bubble) });
    await expect(bubble).toHaveAttribute('data-expanded', 'false');
    await page.locator('[data-pw="clamp-demo-link-clamp-toggle"]').click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');
  });

  test('a message without clampLines gets no interactive role', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-message');
    const plain = page.locator('.chat-message .bubble').first();
    await expect(plain).not.toHaveAttribute('role', 'button');
  });

  test('a native body hit avoids nested controls and sends a trusted pointer', async ({ page }) => {
    await page.setContent(`
      <style>
        #native-bubble { width: 320px; padding: 13px; border-radius: 16px; background: #eee; }
        .body { position: relative; height: 64px; }
        #native-link { position: absolute; inset: 0 35%; background: #ccc; }
      </style>
      <div id="native-bubble" data-expanded="false">
        <div class="body" id="native-body">Native body <a id="native-link" href="#native-link-target">link</a></div>
      </div>
      <button id="native-toggle" type="button">Expand</button>
    `);
    await page.evaluate(() => {
      const bubble = document.querySelector<HTMLElement>('#native-bubble');
      const toggle = document.querySelector('#native-toggle');
      if (bubble === null || toggle === null) {
        throw new Error('native controls missing');
      }
      bubble.addEventListener('click', (event) => {
        bubble.dataset.pointerTarget = event.target instanceof Element ? event.target.id : '';
        bubble.dataset.trusted = String(event.isTrusted);
      });
      toggle.addEventListener('click', () => {
        bubble.dataset.expanded = 'true';
      });
    });
    const bubble = page.locator('#native-bubble');
    await bubble.click({ position: await chatMessageBodyPoint(bubble) });
    await expect(bubble).toHaveAttribute('data-pointer-target', 'native-body');
    await expect(bubble).toHaveAttribute('data-trusted', 'true');
    await expect(bubble).toHaveAttribute('data-expanded', 'false');
    await page.locator('#native-toggle').click();
    await expect(bubble).toHaveAttribute('data-expanded', 'true');

    // A body entirely occupied by a link has no inert surface to claim.
    await page.addStyleTag({ content: '#native-link { inset: 0; }' });
    await expect(chatMessageBodyPoint(bubble)).rejects.toThrow(
      'no noninteractive painted hit target'
    );
  });

  test('a fractional bordered body hits the verified pixel beside a link', async ({ page }) => {
    await page.setContent(`
      <style>
        #native-bubble { position: absolute; left: 13.4px; top: 11.6px; width: 320px;
          padding: 13px; border: 3px solid #777; border-radius: 16px; background: #eee; }
        .body { position: relative; height: 64px; }
        #native-link { position: absolute; left: 0; right: 0; top: 0; height: 32px; background: #ccc; }
      </style>
      <div id="native-bubble"><div class="body" id="native-body">Body
        <a id="native-link" href="#native-link-target">link</a>
      </div></div>
    `);
    await page.evaluate(() => {
      const bubble = document.querySelector<HTMLElement>('#native-bubble');
      if (bubble === null) {
        throw new Error('native bubble missing');
      }
      bubble.addEventListener('click', (event) => {
        bubble.dataset.pointerTarget = event.target instanceof Element ? event.target.id : '';
        bubble.dataset.trusted = String(event.isTrusted);
        bubble.dataset.clientX = String(event.clientX);
        bubble.dataset.clientY = String(event.clientY);
      });
    });
    const bubble = page.locator('#native-bubble');
    const point = await chatMessageBodyPoint(bubble);
    const verified = await bubble.evaluate((element, offset) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const x = Math.round(rect.left + Number.parseFloat(style.borderLeftWidth) + offset.x);
      const y = Math.round(rect.top + Number.parseFloat(style.borderTopWidth) + offset.y);
      return { x, y, hit: document.elementFromPoint(x, y)?.id };
    }, point);
    await expect(verified.hit).toBe('native-body');
    await bubble.click({ position: point });
    await expect(bubble).toHaveAttribute('data-pointer-target', 'native-body');
    await expect(bubble).toHaveAttribute('data-trusted', 'true');
    await expect(bubble).toHaveAttribute('data-client-x', String(verified.x));
    await expect(bubble).toHaveAttribute('data-client-y', String(verified.y));
    await expect(page).not.toHaveURL(/#native-link-target$/);
  });
});
