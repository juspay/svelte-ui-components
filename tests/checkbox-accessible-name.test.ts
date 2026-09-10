import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Checkbox names its role="checkbox" box, and the box is the node assistive technology
// reads. The visible text is a sibling <span>, and the wrapping <label> does not name the
// box either — label/for names form controls, not an element that merely carries a role.
// So a labelled checkbox used to expose an unnamed node while looking correct in review
// and in any test that reads the label text rather than the computed name.
test.describe('Checkbox — accessible name', () => {
  test('the visible text names the box', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');

    const box = page.getByTestId('checkbox-named-by-text-box');
    await expect(box).toHaveAccessibleName('Named by its visible text');
  });

  test('the visible text wins over an explicit ariaLabel, per WCAG 2.5.3', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');

    // Label in Name: the accessible name has to carry the text on screen, so an
    // explicit `ariaLabel` cannot replace it. Letting it win would give a
    // speech-input user a name they cannot see to say — and `properties.ts` has
    // always documented this precedence, so the first version of this fix
    // contradicted its own contract.
    const box = page.getByTestId('checkbox-named-by-aria-label-box');
    await expect(box).toHaveAccessibleName('Visible text always names it');
  });

  test('ariaLabel still names a checkbox that shows no text', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');

    const box = page.getByTestId('checkbox-named-without-text-box');
    await expect(box).toHaveAccessibleName('Named with no visible text');
  });

  test('every checkbox on the page has a name', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');

    // The sweep that found this reported `control-has-no-accessible-name` against the box
    // on five routes, every one of which passed a visible `text`. Asserting one instance
    // would not have caught that; asserting the whole page does.
    //
    // Asserted on the computed name rather than on the attributes: an
    // `aria-labelledby` pointing at an id that does not exist is a non-null
    // attribute and an unnamed control, so an attribute check would report the
    // page clean in exactly the case this test is for.
    const boxes = page.locator('[role="checkbox"]');
    const count = await boxes.count();
    expect(count, 'no checkboxes on the page to sweep').toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = boxes.nth(index);
      const markup = (await box.evaluate((element) => element.outerHTML)).slice(0, 120);
      await expect(box, `checkbox has no accessible name: ${markup}`).not.toHaveAccessibleName('');
    }
  });
});
