import { expect, test } from '@playwright/test';

// Pill had no way to put an arbitrary data-*/aria-* attribute on its root --
// the gap juspay/svelte-ui-components#545 asks for. A consumer hit this by
// wrapping Pill in an extra element just to hold e.g. `data-state="waiting"`,
// then styling that wrapper not to disturb layout. Card closed the identical
// gap with an `attrs` prop (see tests/card-attrs-and-as.test.ts and #521);
// this mirrors that same API shape onto Pill.
//
// This spec fails against a Pill with no `attrs` prop declared: an undeclared
// prop is silently dropped by Svelte 5's destructuring `$props()`, so `attrs`
// never reaches the DOM.
test.describe('Pill attrs', () => {
  test('attrs spreads arbitrary data-* attributes onto the root', async ({ page }) => {
    await page.goto('/components/pill');

    const pill = page.getByTestId('attrs-data-state-pill');
    await expect(pill).toHaveAttribute('data-state', 'waiting');
    await expect(pill).toHaveAttribute('data-density', 'compact');
    // Passthrough must not replace the existing data-pw/testID hook.
    await expect(pill).toHaveAttribute('data-pw', 'attrs-data-state-pill');
  });

  test('attrs cannot override the attributes Pill already manages (data-pw, class, role, tabindex)', async ({
    page
  }) => {
    await page.goto('/components/pill');

    // This pill passes attrs = { 'data-pw': 'hijacked', class: 'attrs-injected-class',
    // role: 'not-a-button', tabindex: '5' } alongside testId="attrs-collision-pill",
    // classes="attrs-collision-marker-class" and an onclick (which makes the pill
    // interactive, so it owns role="button"/tabindex="0" itself) -- an object spread
    // in Svelte lets a later key win over an earlier one of the same name, so attrs
    // must be applied BEFORE Pill's own class/data-pw/testID/role/tabindex attributes
    // on the element, not after, or a consumer's passthrough object could silently
    // break the very test hook (data-pw) this suite selects elements by, and the
    // interactive/keyboard contract those attributes carry.
    const pill = page.getByTestId('attrs-collision-pill');
    await expect(pill).toHaveAttribute('data-pw', 'attrs-collision-pill');
    await expect(pill).toHaveClass(/attrs-collision-marker-class/);
    const className = await pill.getAttribute('class');
    expect(className).not.toContain('attrs-injected-class');
    // Interactive (onclick supplied), so Pill renders role="button"/tabindex="0"
    // itself -- attrs' attempted role="not-a-button"/tabindex="5" must not land.
    await expect(pill).toHaveAttribute('role', 'button');
    await expect(pill).toHaveAttribute('tabindex', '0');
  });

  test('omitting attrs leaves the pill root unaffected (no regression)', async ({ page }) => {
    await page.goto('/components/pill');

    const pill = page.getByTestId('attrs-none-pill');
    await expect(pill).not.toHaveAttribute('data-state', /.*/);
    await expect(pill).not.toHaveAttribute('role', /.*/);
  });
});
