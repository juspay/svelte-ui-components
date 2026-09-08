import { expect, test, type Page } from '@playwright/test';

// #414 item 1. `--select-trigger-min-height` / `--select-trigger-padding` /
// `--select-font-size` have always been themeable individually, so this is not "add
// sizing" — it names the coherent combinations, so a consumer picking a denser control
// does not have to know which three to set and keep in step. (Lighthouse hand-rolled a
// light-theme-only `36px !important` in shopify.css rather than do that.)
//
// Geometry is read from the rendered trigger rather than asserted against the class list:
// a `.size-sm` class that set nothing would still pass a class-name assertion.

const triggerBox = (page: Page, testId: string) =>
  page.locator(`[data-pw="${testId}"] .select-trigger`).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      minHeight: s.minHeight,
      padding: s.padding,
      fontSize: s.fontSize,
      height: Math.round(el.getBoundingClientRect().height)
    };
  });

test.beforeEach(async ({ page }) => {
  await page.goto('/components/select');
});

test('each size renders a distinct, ordered trigger height', async ({ page }) => {
  const sm = await triggerBox(page, 'select-size-sm');
  const md = await triggerBox(page, 'select-size-md');
  const lg = await triggerBox(page, 'select-size-lg');

  expect(sm.minHeight).toBe('32px');
  expect(md.minHeight).toBe('40px');
  expect(lg.minHeight).toBe('48px');

  // Ordering measured on the real box, not just the declared token — a padding that
  // fought the min-height would show up here and not above.
  expect(sm.height).toBeLessThan(md.height);
  expect(md.height).toBeLessThan(lg.height);
});

test('font size scales with the preset', async ({ page }) => {
  expect((await triggerBox(page, 'select-size-sm')).fontSize).toBe('13px');
  expect((await triggerBox(page, 'select-size-md')).fontSize).toBe('14px');
  expect((await triggerBox(page, 'select-size-lg')).fontSize).toBe('15px');
});

// The compatibility guarantee: omitting the prop must be byte-identical to `md`, since
// `md` deliberately emits no class at all.
test('omitting size is identical to md', async ({ page }) => {
  expect(await triggerBox(page, 'select-size-unset')).toEqual(
    await triggerBox(page, 'select-size-md')
  );
});

test('an unset select carries no size class', async ({ page }) => {
  const classes = await page
    .locator('[data-pw="select-size-unset"]')
    .evaluate((el) => el.className);

  expect(classes).not.toContain('size-');
});

// Precedence, matching what Pill's `tone` does relative to `--pill-background`: an
// explicit token set by the consumer beats the preset, because it sits earlier in the
// var() chain.
test('an explicit --select-trigger-min-height beats the preset', async ({ page }) => {
  const overridden = await triggerBox(page, 'select-size-override');

  expect(overridden.minHeight).toBe('60px');
  // ...while the rest of the preset still applies, so overriding one token does not
  // silently discard the others.
  expect(overridden.fontSize).toBe('13px');
});
