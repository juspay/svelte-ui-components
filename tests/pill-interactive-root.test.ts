import { expect, test } from '@playwright/test';

// #469: Pill's root is a non-interactive <div>, with a synthetic
// role="button"/tabindex/keydown shim bolted on when `onclick` is supplied. Anything
// chip-shaped that needs REAL control semantics — an aria-expanded disclosure chip, an
// aria-pressed toggle — therefore could not be built on Pill, which is why ToolCallLog
// kept bespoke <button> chips rather than composing it (recorded in its docs as a
// deliberate deviation). `as="button"` renders a real <button type="button"> instead.

test.beforeEach(async ({ page }) => {
  await page.goto('/components/pill');
});

test('as="button" renders a real button element, not a div with role=button', async ({ page }) => {
  const pill = page.locator('[data-pw="pill-as-button-activate"]');

  expect(await pill.evaluate((el) => el.tagName)).toBe('BUTTON');
  // A real button needs no synthetic shim, and carrying one would be redundant at best
  // and a duplicate announcement at worst.
  expect(await pill.getAttribute('type')).toBe('button');
  expect(await pill.getAttribute('role')).toBeNull();
  expect(await pill.getAttribute('tabindex')).toBeNull();
});

test('the default root is still a div, so existing consumers are unaffected', async ({ page }) => {
  const pill = page.locator('[data-pw="pill-default-root"]');

  expect(await pill.evaluate((el) => el.tagName)).toBe('DIV');
  expect(await pill.getAttribute('role')).toBe('button');
  expect(await pill.getAttribute('tabindex')).toBe('0');
});

test('ariaExpanded and ariaPressed reach the button root and track state', async ({ page }) => {
  const disclosure = page.locator('[data-pw="pill-as-button-expanded"]');
  const toggle = page.locator('[data-pw="pill-as-button-pressed"]');

  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

// The point of a real button: the browser supplies keyboard activation, so this passes
// with no keydown handler of Pill's own.
test('a button root is activated by Enter and Space natively', async ({ page }) => {
  const pill = page.locator('[data-pw="pill-as-button-activate"]');
  const count = page.locator('[data-pw="pill-as-button-activation-count"]');

  await expect(count).toHaveText('0');
  await pill.focus();
  await expect(pill).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(count).toHaveText('1');

  await page.keyboard.press(' ');
  await expect(count).toHaveText('2');
});

test('a disabled button root stays discoverable but ignores activation', async ({ page }) => {
  const pill = page.locator('[data-pw="pill-as-button-disabled"]');
  const count = page.locator('[data-pw="pill-as-button-activation-count"]');

  const before = await count.textContent();

  // aria-disabled rather than the native `disabled` attribute: a natively disabled button
  // leaves the tab order entirely, so a keyboard user never reaches it and never learns it
  // is disabled. This matches what the div root already does.
  await expect(pill).toHaveAttribute('aria-disabled', 'true');
  expect(await pill.getAttribute('disabled')).toBeNull();

  await pill.focus();
  await expect(pill).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(count).toHaveText(before ?? '0');
});

// Raised in review, and correct: `aria-disabled` was gated on `onclick` being supplied, but
// `as="button"` produces a real, focusable control whether or not one is. A disabled pill with
// no handler was therefore a focusable native <button> carrying neither `disabled` nor
// `aria-disabled` — reachable by keyboard with nothing announcing that it is inert. This is a
// regression the button root introduced: before it, the same props rendered a non-focusable
// <div> nobody could tab to.
test('a disabled button root is announced as disabled even with no onclick', async ({ page }) => {
  const pill = page.locator('[data-pw="pill-as-button-disabled-no-handler"]');

  expect(await pill.evaluate((el) => el.tagName)).toBe('BUTTON');
  await expect(pill).toHaveAttribute('aria-disabled', 'true');

  // Still keyboard-reachable, which is the whole reason `aria-disabled` is used here rather
  // than the native attribute — otherwise the control leaves the tab order and the user never
  // learns it exists.
  await pill.focus();
  await expect(pill).toBeFocused();
});

// `as="button"` is meant to change semantics, not appearance. A native button arrives with
// user-agent styling a div never had — its own font stack and size, a margin in some
// engines, the native control appearance — so without explicitly neutralising those, opting
// into better semantics would silently restyle the chip.
test('a button root is visually identical to a div root', async ({ page }) => {
  const readStyles = (testId: string) =>
    page.locator(`[data-pw="${testId}"]`).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        padding: s.padding,
        margin: s.margin,
        borderRadius: s.borderRadius,
        borderWidth: s.borderWidth,
        backgroundColor: s.backgroundColor,
        color: s.color,
        height: `${Math.round(el.getBoundingClientRect().height)}px`
      };
    });

  expect(await readStyles('pill-as-button-activate')).toEqual(
    await readStyles('pill-default-root')
  );
});

// A <button> may not contain another button, and a dismissible pill is inherently two
// controls. Rather than emit invalid markup, the combination degrades to the div root —
// the same graceful-degradation rule Card already applies to `as="a"` with no `href`.
test('as="button" with dismissible degrades to the div root instead of nesting buttons', async ({
  page
}) => {
  const pill = page.locator('[data-pw="pill-as-button-dismissible"]');

  expect(await pill.evaluate((el) => el.tagName)).toBe('DIV');
  expect(await pill.getAttribute('role')).toBe('button');

  // The dismiss control is still there and is still a real button — just not nested
  // inside another one.
  const dismiss = page.locator('[data-pw="pill-as-button-dismissible-dismiss"]');
  await expect(dismiss).toBeVisible();
  expect(await pill.evaluate((el) => el.querySelectorAll('button').length)).toBe(1);
});
