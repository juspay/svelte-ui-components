import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// A three-column grid on a 320px phone makes each tile about 79px wide, and 305px (what a desktop
// browser's 15px scrollbar leaves of 320) about 75px. Two default 36px action buttons plus their gap and
// insets need 92px, so the left button used to sit past the tile's overflow:hidden edge: its centre was
// still clickable, but a strip of the button, and its outline, was cut off. These tests read the real
// geometry and hit-test the button's own edges, not just its bounding box.

type Overhang = {
  readonly name: string;
  readonly size: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly edgesReachable: boolean;
};

const measureActions = (page: Page): Promise<readonly Overhang[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll('.gallery-item-actions button')].map((button) => {
      const r = button.getBoundingClientRect();
      const tile = button.closest('.gallery-item')!.getBoundingClientRect();
      const topmostIsButton = (x: number, y: number): boolean => {
        const hit = document.elementFromPoint(x, y);
        return hit !== null && button.contains(hit);
      };
      // Inset 2px so the check lands on the button's own pixels, at all four edges and the centre.
      const points: ReadonlyArray<readonly [number, number]> = [
        [r.left + 2, r.top + r.height / 2],
        [r.right - 2, r.top + r.height / 2],
        [r.left + r.width / 2, r.top + 2],
        [r.left + r.width / 2, r.bottom - 2],
        [r.left + r.width / 2, r.top + r.height / 2]
      ];
      return {
        name: button.getAttribute('aria-label') ?? '',
        size: Math.round(r.width * 10) / 10,
        left: Math.max(0, tile.left - r.left),
        right: Math.max(0, r.right - tile.right),
        top: Math.max(0, tile.top - r.top),
        bottom: Math.max(0, r.bottom - tile.bottom),
        edgesReachable: points.every(([x, y]) => topmostIsButton(x, y))
      };
    })
  );

for (const width of [390, 320, 305]) {
  test(`every item action sits fully inside its tile and is reachable at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoHydrated(page, '/components/gallery');

    const actions = await measureActions(page);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action, action.name).toMatchObject({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        edgesReachable: true
      });
      // Shrunk, but still a usable target (WCAG 2.5.8 minimum is 24px).
      expect(action.size, action.name).toBeGreaterThanOrEqual(24);
    }
  });
}

test('at a roomy width the buttons keep their default 36px size', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoHydrated(page, '/components/gallery');

  const actions = await measureActions(page);
  expect(actions.length).toBeGreaterThan(0);
  for (const action of actions) {
    expect(action.size, action.name).toBe(36);
  }
});

test('a consumer-set size still wins when the tile is narrow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoHydrated(page, '/components/gallery');
  const before = await measureActions(page);

  // The narrow-tile sizes are fallbacks under the public variables, so this must make the buttons
  // bigger than the shrunk default, not be overridden by it.
  await page.addStyleTag({ content: '.gallery { --gallery-item-action-padding: 10px; }' });
  const after = await measureActions(page);

  expect(after.length).toBe(before.length);
  for (let i = 0; i < after.length; i += 1) {
    expect(after[i].size, after[i].name).toBeGreaterThan(before[i].size);
  }
});

// The narrow-tile rule is a container query on the tile, and a container with inline-size containment
// reports no intrinsic width. Inside an ancestor that sizes to its content (inline-block, fit-content, an
// auto-width absolutely positioned box) the grid then had nothing to measure and collapsed to its gaps. The
// default block layout hides this, so the check has to put the gallery in such an ancestor.
const shrinkToFitAncestors: ReadonlyArray<readonly [string, string]> = [
  ['inline-block', 'display: inline-block'],
  ['width: fit-content', 'width: fit-content'],
  ['an auto-width absolutely positioned box', 'position: absolute; left: 0; top: 0']
];

for (const [label, style] of shrinkToFitAncestors) {
  test(`a gallery inside ${label} keeps the width its tiles give it`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHydrated(page, '/components/gallery');

    const size = await page.evaluate((wrapperStyle) => {
      const source = document.querySelector('main .gallery.grid');
      if (source === null) {
        throw new Error('no grid gallery on the page');
      }
      const wrapper = document.createElement('div');
      wrapper.setAttribute('style', wrapperStyle);
      wrapper.append(source.cloneNode(true));
      document.body.append(wrapper);
      const gallery = wrapper.querySelector('.gallery');
      const tile = wrapper.querySelector('.gallery-item');
      if (gallery === null || tile === null) {
        throw new Error('clone lost its gallery');
      }
      return {
        gallery: gallery.getBoundingClientRect().width,
        tile: tile.getBoundingClientRect().width
      };
    }, style);

    // Before the narrow-tile rule these were 880px and 288px; a collapsed grid is 16px and 0px.
    expect(size.tile).toBeGreaterThan(100);
    expect(size.gallery).toBeGreaterThan(size.tile * 2);
  });
}
