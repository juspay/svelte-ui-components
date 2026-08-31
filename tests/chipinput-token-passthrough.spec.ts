import { expect, test } from '@playwright/test';

// ChipInput re-declares --pill-* on the pill element to expose its own --chip-input-pill-* API.
// Because a declaration on the element beats an inherited one, that mapping used to swallow any
// --pill-background/--pill-color a consuming app had set app-wide, and fall through to the
// library's hardcoded light-mode hexes. A consumer theming Pill for a dark surface got light
// chips. The mapping now falls back to the surrounding cascade's value, captured on the ChipInput
// root under a distinct name (reading --pill-background in the same declaration that sets it would
// be a custom-property cycle).
//
// The three precedence levels below are the whole contract: explicit component token > inherited
// app theme > library default.
//
// Locators below use the per-chip `-item-<index>` / draft `-add` test ids (see
// chipinput-testids-and-editing.test.ts) rather than the old flat `-chip`/`-input` ids every
// chip and the draft field used to share -- each demo row below commits exactly one chip, at
// index 0, before these run.
test.describe('ChipInput token passthrough', () => {
  test('falls back to the library default when nothing is themed', async ({ page }) => {
    await page.goto('/components/chip-input');

    const pill = page.getByTestId('chip-input-tags-item-0');
    await expect(pill).toBeVisible();

    await expect(pill).toHaveCSS('background-color', 'rgb(224, 224, 224)');
    await expect(pill).toHaveCSS('color', 'rgb(51, 51, 51)');
  });

  test('an explicit --chip-input-pill-* override still wins', async ({ page }) => {
    await page.goto('/components/chip-input');

    const pill = page.getByTestId('chip-input-accent-item-0');
    await expect(pill).toBeVisible();

    // #d1ecf1 / #0c5460 from the demo's .chip-input-accent recipe.
    await expect(pill).toHaveCSS('background-color', 'rgb(209, 236, 241)');
    await expect(pill).toHaveCSS('color', 'rgb(12, 84, 96)');
  });

  test("inherits the app's own Pill theme when no component override is set", async ({ page }) => {
    await page.goto('/components/chip-input');

    const pill = page.getByTestId('chip-input-inherited-item-0');
    await expect(pill).toBeVisible();

    // #2f3542 / #f1f2f6 are set as --pill-background/--pill-color on an ancestor, exactly as a
    // consuming app's theme would. Before the fix these resolved to the library's #e0e0e0/#333333.
    await expect(pill).toHaveCSS('background-color', 'rgb(47, 53, 66)');
    await expect(pill).toHaveCSS('color', 'rgb(241, 242, 246)');
  });

  // Colour was only the visible half. Size and shape were swallowed by the identical mechanism,
  // so an app whose Pill is a larger, squarer chip still got a 13px 999px-radius one. These assert
  // the passthrough covers appearance as a whole rather than the subset that happened to be noticed.
  test("inherits the app's Pill size and shape, not just its colours", async ({ page }) => {
    await page.goto('/components/chip-input');

    const pill = page.getByTestId('chip-input-inherited-item-0');
    await expect(pill).toBeVisible();

    await expect(pill).toHaveCSS('font-size', '17px');
    await expect(pill).toHaveCSS('padding', '3px 14px');
    await expect(pill).toHaveCSS('border-radius', '5px');
  });

  // The flip side of the contract: tokens the component owns structurally must NOT follow the app,
  // or the draft field stops sitting inline among the chips.
  test('keeps the draft field structural tokens regardless of the app Input theme', async ({
    page
  }) => {
    await page.goto('/components/chip-input');

    const draft = page.getByTestId('chip-input-inherited-add');
    await expect(draft).toBeVisible();

    await expect(draft).toHaveCSS('padding', '0px 2px');
    await expect(draft).toHaveCSS('margin', '0px');
    await expect(draft).toHaveCSS('box-shadow', 'none');
  });
});
