import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

// Waits for an element's box to stop changing, rather than for a fixed
// duration. A `transitionend` listener is the obvious alternative but races:
// if the transition has already ended by the time the listener attaches, it
// never fires and the test hangs until timeout. Frame-stability settles
// correctly whether the animation is still running, already finished, or was
// never started (prefers-reduced-motion, or a consumer overriding the
// duration to 0).
const settled = (locator: Locator): Promise<void> =>
  locator.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        let last = Number.NaN;
        let stableFrames = 0;
        const tick = (): void => {
          const height = el.getBoundingClientRect().height;
          if (height === last) {
            stableFrames += 1;
            if (stableFrames >= 3) {
              resolve();
              return;
            }
          } else {
            stableFrames = 0;
            last = height;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
  );

// Issue #550: an Accordion placed directly inside a grid container did not
// grow to fit its content when expanded. The children were in the DOM and
// correctly rendered — the panel containing them was squeezed down to
// whatever height the grid happened to hand it (as little as 0px, depending
// on the surrounding layout), disconnected from what its content actually
// needed, so part or all of the fold was invisible while the trigger still
// toggled and any chevron still rotated. That reads to a consumer as "the
// content failed to render", when the content was fine all along.
//
// Root cause: `.accordion` needs `overflow: hidden` to animate
// `grid-template-rows` 0fr -> 1fr, but `overflow` other than `visible` also
// zeroes an element's automatic minimum size. As a GRID ITEM of the
// consumer's own grid container, the panel was then free to be stretched
// down to fit whatever space the grid assigned it — measured here against
// the demo's 300px-tall grid parent, whose content actually needs ~500px —
// so the panel rendered clipped to exactly 300px, silently discarding
// everything past it, independent of how tall its children actually were.
test.describe('Accordion inside a grid container (#550)', () => {
  test('the expanded panel sizes from its own content, not from whatever height the grid parent happens to have', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const panel = page.getByTestId('accordion-grid-nested');
    const toggle = page.getByTestId('accordion-grid-toggle');
    const content = panel.locator('.accordion-content');

    // Collapsed: the fold stays 0px, exactly as it did before this fix.
    await expect(panel).not.toHaveClass(/expanded/);
    const collapsedBox = await panel.boundingBox();
    expect(collapsedBox).not.toBeNull();
    expect(collapsedBox?.height ?? -1).toBeLessThanOrEqual(1);

    await toggle.click();
    await expect(panel).toHaveClass(/expanded/);
    // Let the grid-template-rows transition finish before measuring, by
    // observing that it has, rather than by assuming a duration.
    await settled(panel);

    // The panel's content is authored to need comfortably more than the
    // 300px grid parent around it. Before align-self: start, the panel was
    // stretched to fit that parent's own box instead of its content, so this
    // measured exactly 300px here — this is the assertion that failed on the
    // shipped build.
    const expandedBox = await panel.boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(expandedBox?.height ?? 0).toBeGreaterThan(400);

    // Compare against the content's own natural (scrollHeight) size rather
    // than a second magic number: the panel must be tall enough to show all
    // of it, not merely "tall enough to pass a fixed threshold".
    const scrollHeight = await content.evaluate((el) => el.scrollHeight);
    expect(expandedBox?.height ?? 0).toBeGreaterThanOrEqual(scrollHeight - 1);

    // The content itself must actually be laid out and visible, not merely
    // present with a non-zero panel height for some unrelated reason.
    const lastParagraph = panel.locator('p').last();
    await expect(lastParagraph).toBeVisible();

    // Re-collapsing must still animate back to 0 — the fix must not pin the
    // panel open or otherwise disturb the collapse path.
    await toggle.click();
    await expect(panel).not.toHaveClass(/expanded/);
    await settled(panel);
    const recollapsedBox = await panel.boundingBox();
    expect(recollapsedBox).not.toBeNull();
    expect(recollapsedBox?.height ?? -1).toBeLessThanOrEqual(1);
  });

  test('the grid parent itself is unaffected — its own box stays the same collapsed or expanded', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const parent = page.getByTestId('accordion-grid-parent');
    const toggle = page.getByTestId('accordion-grid-toggle');

    // The 300px CSS height plus its 1px border on each edge (content-box
    // sizing), read from the live layout rather than restated as a literal
    // so a border-width or box-sizing change elsewhere can't make this a
    // brittle, unrelated failure.
    const collapsedHeight = await parent.evaluate((el) => el.getBoundingClientRect().height);
    expect(collapsedHeight).toBeGreaterThan(0);

    await toggle.click();
    await settled(page.getByTestId('accordion-grid-nested'));

    // align-self: start on the panel must not change the fixed-height grid
    // parent around it — only the panel's own box should ever move.
    const expandedHeight = await parent.evaluate((el) => el.getBoundingClientRect().height);
    expect(expandedHeight).toBe(collapsedHeight);
  });
});
