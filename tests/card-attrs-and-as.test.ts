import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Card had no way to (a) put an arbitrary data-*/aria-* attribute on its root
// or (b) render a tag other than <div>/<a> — the two things
// juspay/svelte-ui-components#521 asks for. Consumers hit this migrating
// existing markup onto Card: a `[data-state="waiting"]` selector became a
// second `classes` modifier instead of a real attribute, and a card-styled
// <figure> stayed a hand-rolled <figure> wrapping an appearance-only Card
// because Card's own root could never itself be the <figure>.
//
// `attrs` and `as` close both gaps. These specs fail against a Card with
// neither prop declared: an undeclared prop is silently dropped by Svelte 5's
// destructuring `$props()`, so `attrs` never reaches the DOM and `as` never
// changes the rendered tag away from its href-derived default.
test.describe('Card attrs and as', () => {
  test('attrs spreads arbitrary data-* attributes onto the root', async ({ page }) => {
    await gotoHydrated(page, '/components/card');

    const card = page.getByTestId('attrs-data-state-card');
    await expect(card).toHaveAttribute('data-state', 'waiting');
    await expect(card).toHaveAttribute('data-density', 'compact');
    // Passthrough must not replace the existing data-pw/testID hook.
    await expect(card).toHaveAttribute('data-pw', 'attrs-data-state-card');
  });

  test('as="figure" renders the root as a real <figure>, not a <div>', async ({ page }) => {
    await gotoHydrated(page, '/components/card');

    const card = page.getByTestId('as-figure-card');
    await expect(card).toHaveCount(1);
    const tagName = await card.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('figure');
    // Card's own header still renders normally on the new tag.
    await expect(card.locator('.card-title')).toHaveText('Backdrop tile');
  });

  test('as overrides the href-derived default: a figure with href renders no href attribute', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/card');

    const card = page.getByTestId('as-figure-with-href-card');
    const tagName = await card.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('figure');
    await expect(card).not.toHaveAttribute('href', /.*/);
  });

  test('attrs cannot override the attributes Card already manages (data-pw, class, role)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/card');

    // This card passes attrs = { 'data-pw': 'hijacked', class: 'attrs-injected-class',
    // role: 'not-a-button' } alongside testId="attrs-collision-card" and
    // classes="attrs-collision-marker-class" -- an object spread in Svelte lets a
    // later key win over an earlier one of the same name, so attrs must be applied
    // BEFORE Card's own class/data-pw/testID/role attributes on the element, not
    // after, or a consumer's passthrough object could silently break the very
    // test hook (data-pw) this suite selects elements by.
    const card = page.getByTestId('attrs-collision-card');
    await expect(card).toHaveAttribute('data-pw', 'attrs-collision-card');
    await expect(card).toHaveClass(/attrs-collision-marker-class/);
    const className = await card.getAttribute('class');
    expect(className).not.toContain('attrs-injected-class');
    // Not interactive (no href/onclick), so Card renders no role attribute at
    // all -- attrs' attempted role="not-a-button" must not land either.
    await expect(card).not.toHaveAttribute('role', /.*/);
  });

  test('omitting attrs/as leaves the default div root unaffected (no regression)', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/card');

    // Regression guard for every existing consumer: a card given neither prop
    // still renders a plain <div> with no attributes it didn't have before.
    const card = page.getByTestId('metric-row-card');
    const tagName = await card.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('div');
    await expect(card).not.toHaveAttribute('data-state', /.*/);
  });

  // Regression for a bug in the anchor/shim split: `isAnchor` used to be
  // `rootTag === 'a'` alone, so `as="a"` with an `onclick` but no `href`
  // was treated as an anchor and the interactive-div keyboard shim
  // (role/tabindex/onkeydown) was suppressed -- leaving a bare <a> with no
  // href, no tabindex and no keydown handler: neither Tab-reachable nor
  // Enter/Space-activatable. `isAnchor` now also requires `href` to be set,
  // so this case keeps the shim instead.
  test('as="a" without href still gets the interactive-div keyboard shim', async ({ page }) => {
    await gotoHydrated(page, '/components/card');

    const card = page.getByTestId('as-a-no-href-card');
    const tagName = await card.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
    await expect(card).not.toHaveAttribute('href', /.*/);
    await expect(card).toHaveAttribute('role', 'button');
    await expect(card).toHaveAttribute('tabindex', '0');

    // Tab-reachable: the nearest preceding focusable element on the page is
    // the "Anchor / Div Layout Parity" section's real <a href> card -- every
    // card between it and this one (the rest of the Attribute Passthrough
    // section) has neither href nor onclick, so it carries no tabindex and
    // is not part of the tab order. One real Tab press from there must land
    // on this card, proving it -- not the bare-anchor bug it regresses --
    // is what the browser's tab order actually reaches.
    const precedingAnchorCard = page.getByTestId('parity-anchor-card');
    await precedingAnchorCard.focus();
    await expect(precedingAnchorCard).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(card).toBeFocused();

    // Enter activates it, same as an onclick-only interactive <div>.
    await page.keyboard.press('Enter');
    await expect(page.locator('.click-status')).toContainText('as-a-no-href');

    // Space also activates it (and must not scroll the page, per the shim's
    // preventDefault on the space keydown).
    await card.focus();
    await page.keyboard.press(' ');
    await expect(page.locator('.click-status')).toContainText('as-a-no-href');
  });
});
