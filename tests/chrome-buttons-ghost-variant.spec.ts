import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// A consumer theme restyles a Button VARIANT by setting --button-* on the variant's
// own container. Lighthouse's embedded Shopify surface does exactly that for
// .variant-primary, pinning the host's ink fill so every primary button matches
// the admin. A composite's chrome button (a sort arrow, a copy icon, a composer
// control) is transparent by design, but it rendered through the default primary
// variant and styled itself from a wrapper. A declaration on the container beats
// anything the wrapper can pass down, so each one painted as a solid ink button.
// These buttons are ghost buttons, and saying so keeps a primary theme off them.
const INK = 'rgb(48, 48, 48)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const pinPrimaryVariant = async (page: Page): Promise<void> => {
  await page.addStyleTag({
    content: `.button-container.variant-primary { --button-color: ${INK}; }`
  });
};

const fillOf = (button: Locator): Promise<string> =>
  button.evaluate((element) => getComputedStyle(element).backgroundColor);

test.describe('Chrome buttons are ghost buttons, so a primary theme does not repaint them', () => {
  test('Table sort buttons', async ({ page }) => {
    await gotoHydrated(page, '/components/table');
    await pinPrimaryVariant(page);

    const sort = page
      .getByTestId('table-keyed-features')
      .getByRole('button', { name: /^Sort by / })
      .first();
    expect(await fillOf(sort)).toBe(TRANSPARENT);
  });

  test('Snippet copy button', async ({ page }) => {
    await gotoHydrated(page, '/components/snippet');
    await pinPrimaryVariant(page);

    const copy = page.getByTestId('snippet-default').getByRole('button').first();
    expect(await fillOf(copy)).toBe(TRANSPARENT);
  });

  test('ChatComposer attach and voice controls, while send stays primary', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-composer');
    await pinPrimaryVariant(page);

    expect(await fillOf(page.locator('.chat-composer .control.attach button').first())).toBe(
      TRANSPARENT
    );
    expect(await fillOf(page.locator('.chat-composer .control.voice button').first())).toBe(
      TRANSPARENT
    );
    // Control: the pin is live on this page. Send is a real primary action and keeps it.
    expect(await fillOf(page.locator('.chat-composer .control.send button').first())).toBe(INK);
  });
});

// Ghost supplies its own hover label (--_btn-hover-text-color); primary supplies
// none, so a primary chrome button's hover label fell through to the wrapper's own
// --button-text-color. Moving to ghost must not change what an unthemed consumer
// sees on hover. Snippet's copy button hovers to a dark fill, so the ghost default
// label there would be dark on dark.
test.describe('An unthemed chrome button keeps its own label color on hover', () => {
  const labelOnHover = async (button: Locator): Promise<{ rest: string; hover: string }> => {
    const rest = await button.evaluate((element) => getComputedStyle(element).color);
    await button.hover();
    const hover = await button.evaluate((element) => getComputedStyle(element).color);
    return { rest, hover };
  };

  test('Snippet copy button', async ({ page }) => {
    await gotoHydrated(page, '/components/snippet');

    const { rest, hover } = await labelOnHover(
      page.getByTestId('snippet-default').getByRole('button').first()
    );
    expect(hover).toBe(rest);
  });

  test('ChatComposer voice control', async ({ page }) => {
    await gotoHydrated(page, '/components/chat-composer');

    const voice = page.getByTestId('dictation-voice');
    await expect(voice).toBeEnabled();
    const { rest, hover } = await labelOnHover(voice);
    expect(hover).toBe(rest);
  });

  // The other two controls #648 moved to ghost. Table sort is the one that never set
  // --button-color: transparent, so it had no wrapper-level fallback before the move.
  // Each theme is its own case: a dark-only hover override would pass in light.
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`${theme} theme`, () => {
      test.use({ colorScheme: theme });

      const sortButton = (page: Page): Locator =>
        page
          .getByTestId('table-keyed-features')
          .getByRole('button', { name: /^Sort by / })
          .first();
      const attachButton = (page: Page): Locator =>
        page.locator('.chat-composer .control.attach button').first();

      test('Table sort button', async ({ page }) => {
        await gotoHydrated(page, '/components/table');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const sort = sortButton(page);
        await expect(sort).toBeEnabled();
        const { rest, hover } = await labelOnHover(sort);
        expect(hover).toBe(rest);
      });

      test('ChatComposer attach control', async ({ page }) => {
        await gotoHydrated(page, '/components/chat-composer');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const attach = attachButton(page);
        await expect(attach).toBeEnabled();
        const { rest, hover } = await labelOnHover(attach);
        expect(hover).toBe(rest);
      });

      // Control: the same measurement must fail when a hover label does change, or a pass
      // above could mean the hover state was never reached.
      test('the measurement detects a hover label change on both controls', async ({ page }) => {
        const RED = 'rgb(255, 0, 0)';
        const withForcedHoverLabel = async (button: Locator): Promise<Locator> => {
          await button.evaluate((element) => element.setAttribute('data-forced-hover-label', ''));
          await button.page().addStyleTag({
            content: `[data-forced-hover-label]:hover { color: ${RED} !important; }`
          });
          return button;
        };

        await gotoHydrated(page, '/components/table');
        const sort = await labelOnHover(await withForcedHoverLabel(sortButton(page)));
        expect(sort.hover).toBe(RED);
        expect(sort.rest).not.toBe(RED);

        await gotoHydrated(page, '/components/chat-composer');
        const attach = await labelOnHover(await withForcedHoverLabel(attachButton(page)));
        expect(attach.hover).toBe(RED);
        expect(attach.rest).not.toBe(RED);
      });
    });
  }
});
