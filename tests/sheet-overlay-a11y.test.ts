import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Two pre-existing a11y defects on Sheet, shipped on every side since 4.0.0:
//
// 1. The overlay carried role="button" unconditionally, with no accessible
//    name — a role with no name is announced as an unlabelled button. The
//    overlay also contains the dialog, so a button role on it nested the whole
//    panel inside a button. The overlay now carries no role; while it is
//    dismissible (dismissOnOutsideClick) a named native <button> sits behind
//    the panel as the dismiss control.
// 2. `.sheet-panel` set `outline: none` unconditionally, which left a
//    keyboard user with no visible sign that focus had moved into the panel
//    on open (the panel is the initial focus target, and the only one on the
//    "Raw" variant). A `:focus-visible` rule restores the ring for
//    keyboard/programmatic focus without adding one for a mouse-opened sheet.
test.describe('Sheet overlay accessible name', () => {
  test('a dismissible overlay (side="right", default dismissOnOutsideClick) is a named button', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-right-trigger').click();
    const overlay = page.getByTestId('sheet-right');
    await expect(overlay).toBeVisible();

    expect(await overlay.getAttribute('role')).toBeNull();
    await expect(overlay.locator(':scope > button.sheet-backdrop')).toHaveAccessibleName(
      'Close sheet'
    );
  });

  test('a non-dismissible overlay (dismissOnOutsideClick=false) carries no role at all', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-blocking-trigger').click();
    const overlay = page.getByTestId('sheet-blocking');
    await expect(overlay).toBeVisible();

    // Clicking it is already a no-op (dismissOnOutsideClick=false), so it must
    // not be announced as a focusable "button" that does nothing.
    expect(await overlay.getAttribute('role')).toBeNull();
    expect(await overlay.getAttribute('aria-label')).toBeNull();
    await expect(overlay.locator('button.sheet-backdrop')).toHaveCount(0);
  });

  test('overlayAriaLabel overrides the default name (side="left")', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-custom-overlay-label-trigger').click();
    const overlay = page.getByTestId('sheet-custom-overlay-label');
    await expect(overlay).toBeVisible();

    expect(await overlay.getAttribute('role')).toBeNull();
    await expect(overlay.locator(':scope > button.sheet-backdrop')).toHaveAccessibleName('Fermer');
  });

  test('an invisible-but-dismissible overlay (showOverlay=false) is still a named button', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-anchored-trigger').click();
    const overlay = page.getByTestId('sheet-anchored');
    await expect(overlay).toBeVisible();

    expect(await overlay.getAttribute('role')).toBeNull();
    await expect(overlay.locator(':scope > button.sheet-backdrop')).toHaveAccessibleName(
      'Close sheet'
    );
  });
});

test.describe('Sheet panel focus indicator', () => {
  test('a keyboard-opened sheet (side="right") shows a visible focus ring on the panel', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    // .press() dispatches a real key event, which is what puts the browser in
    // keyboard input modality -- the precondition :focus-visible checks before
    // showing a ring for the panel's subsequent programmatic focus() call.
    // The testId lands on Button's real <button> element, which is what makes
    // Enter a synthetic click rather than a keypress on an inert text node.
    await page.getByTestId('sheet-right-trigger').press('Enter');
    const panel = page.getByTestId('sheet-right-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    await expect(panel).toBeFocused();
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');
  });

  test('a keyboard-opened sheet (side="bottom") shows a visible focus ring on the panel', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-bottom-trigger').press('Enter');
    const panel = page.getByTestId('sheet-bottom-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    await expect(panel).toBeFocused();
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');
  });

  test('a mouse-opened sheet (side="right") keeps the panel default outline unchanged', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-right-trigger').click();
    const panel = page.getByTestId('sheet-right-panel');
    await expect(panel).toBeVisible();
    // `fly` animates an inline transform; Svelte drops that inline style when
    // the intro ends, and these sides have no resting transform of their own.
    // Waiting on the settled value is deterministic where a fixed timeout only
    // approximates it -- and flakes on a slow runner.
    await expect(panel).toHaveCSS('transform', 'none');

    // A mouse click is not keyboard modality, so :focus-visible must not
    // match here -- the existing visual design (no ring) stays unchanged for
    // the common mouse-driven case.
    const outlineStyle = await panel.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('none');
  });
});

test.describe('Sheet overlay keyboard activation', () => {
  test('a dismissible overlay closes on Enter from its backdrop button', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-right-trigger').click();
    const overlay = page.getByTestId('sheet-right');
    await expect(overlay).toBeVisible();

    // tabindex="-1" keeps the backdrop out of the Tab sequence, so focus gets
    // there the way an interrupted drag leaves it: programmatically.
    await overlay
      .locator(':scope > button.sheet-backdrop')
      .evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press('Enter');

    await expect(overlay).toBeHidden();
  });

  test('a non-dismissible overlay ignores Enter', async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');

    await page.getByTestId('sheet-blocking-trigger').click();
    const overlay = page.getByTestId('sheet-blocking');
    await expect(overlay).toBeVisible();

    await overlay.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press('Enter');

    // It carries no role and no backdrop button, so there is nothing for Enter to activate.
    await expect(overlay).toBeVisible();
  });
});
