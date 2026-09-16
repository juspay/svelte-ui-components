import { expect, test } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';
import { gotoHydrated } from '../support/hydrated.js';
import { beat, caption, highlight, step } from './support/narrate.js';

/**
 * Walkthroughs for RatingGroup, AspectRatio, Label and Separator -- the four
 * primitives added in this pass.
 *
 * None of this survives a screenshot. A single frame cannot show a slider
 * clamping instead of wrapping, half-star click precision that depends on
 * *where* inside a 24px star the pointer landed, a layout box that was already
 * the right size before its image arrived, native constraint validation
 * redirecting focus to a visible control because the real one is hidden, or an
 * ARIA attribute that renders zero visible pixels of difference. Each of these
 * is a behaviour over time or a fact about the accessibility tree, not the
 * paint -- which is exactly why the functional suite's own recordings of them
 * were too short to be useful as evidence.
 */

const boundingBoxOrThrow = async (
  locator: Locator
): Promise<{ x: number; y: number; width: number; height: number }> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Element has no bounding box -- is it visible?');
  }
  return box;
};

const ratioOf = async (locator: Locator): Promise<number> => {
  const box = await boundingBoxOrThrow(locator);
  return box.width / box.height;
};

/**
 * A minimal, valid 1x1 PNG. AspectRatio's demo images come from
 * images.unsplash.com; fulfilling the request ourselves proves the same
 * layout contract without depending on a third-party host being reachable,
 * and -- for the layout-shift case -- lets the test control the exact instant
 * the image "arrives" instead of racing a real download.
 */
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const fulfillWithPlaceholderImage = async (route: Route): Promise<void> => {
  await route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64')
  });
};

/**
 * Navigates and waits for hydration WITHOUT waiting for the load event.
 *
 * `gotoHydrated` is correct everywhere else and must stay as it is, but it
 * cannot be used by the test below: that test deliberately holds the image
 * request open to prove the box is reserved before any image arrives, and the
 * load event waits for exactly that image. The first run of this spec deadlocked
 * on it and failed at the 180s ceiling. `domcontentloaded` does not wait for
 * images, and hydration runs off module execution rather than load, so the
 * marker still arrives.
 */
const gotoHydratedWithoutLoad = async (page: Page, path: string): Promise<void> => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
};

const holdImageRequests = async (page: Page): Promise<{ release: () => void }> => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://images.unsplash.com/**', async (route) => {
    await held;
    await fulfillWithPlaceholderImage(route);
  });
  return { release };
};

test.describe('RatingGroup', () => {
  test('a single slider moves by arrow keys, clamps at the bounds instead of wrapping, and steps by half when allowHalf is set', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/rating-group');

    const basic = page.getByTestId('rating-basic');
    const basicValue = page.getByTestId('rating-basic-value');
    await step(page, 'Focus the rating slider. It starts at 3 out of 5 stars.', async () => {
      await basic.focus();
    });
    await expect(basic).toBeFocused();
    await expect(basicValue).toHaveText('Value: 3');

    await step(page, 'ArrowRight moves the value up one star.', async () => {
      await basic.press('ArrowRight');
    });
    await expect(basicValue).toHaveText('Value: 4');
    await expect(page.getByTestId('rating-basic-star-4')).toHaveAttribute('data-state', 'full');

    await step(page, 'ArrowRight again reaches the max, 5 out of 5.', async () => {
      await basic.press('ArrowRight');
    });
    await expect(basicValue).toHaveText('Value: 5');
    await expect(page.getByTestId('rating-basic-star-5')).toHaveAttribute('data-state', 'full');

    await step(page, 'One more ArrowRight at the max does not wrap back to zero.', async () => {
      await basic.press('ArrowRight');
      await beat(page);
    });
    await expect(basicValue).toHaveText('Value: 5');

    await step(page, 'Home jumps straight to zero -- every star empty.', async () => {
      await basic.press('Home');
    });
    await expect(basicValue).toHaveText('Value: 0');
    await expect(page.getByTestId('rating-basic-star-1')).toHaveAttribute('data-state', 'empty');

    await step(page, 'End jumps straight back to the max.', async () => {
      await basic.press('End');
    });
    await expect(basicValue).toHaveText('Value: 5');

    const half = page.getByTestId('rating-half');
    const halfValue = page.getByTestId('rating-half-value');
    await step(page, 'Move to the half-star slider, starting at 2.5.', async () => {
      await half.focus();
    });
    await expect(halfValue).toHaveText('Value: 2.5');

    await step(page, 'ArrowLeft steps down by half a star, to 2.', async () => {
      await half.press('ArrowLeft');
    });
    await expect(halfValue).toHaveText('Value: 2');

    await step(
      page,
      'ArrowRight steps back up by half, to 2.5 -- a half-filled star.',
      async () => {
        await half.press('ArrowRight');
      }
    );
    await expect(halfValue).toHaveText('Value: 2.5');
    await expect(page.getByTestId('rating-half-star-3')).toHaveAttribute('data-state', 'half');

    await step(page, 'ArrowRight again reaches a full 3, the third star now solid.', async () => {
      await half.press('ArrowRight');
    });
    await expect(halfValue).toHaveText('Value: 3');
    await expect(page.getByTestId('rating-half-star-3')).toHaveAttribute('data-state', 'full');
  });

  test('clicking the left half of a star rates it .5, the right half rates it whole', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/rating-group');

    const halfValue = page.getByTestId('rating-half-value');
    const star4 = page.getByTestId('rating-half-star-4');
    await expect(star4).toHaveAttribute('data-state', 'empty');

    await step(page, 'Click the left quarter of the 4th star -- a half rating.', async () => {
      const box = await boundingBoxOrThrow(star4);
      await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2);
    });
    await expect(halfValue).toHaveText('Value: 3.5');
    await expect(star4).toHaveAttribute('data-state', 'half');
    await highlight(star4);

    await step(
      page,
      'Click the right three-quarters of the same star -- the whole value.',
      async () => {
        const box = await boundingBoxOrThrow(star4);
        await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
      }
    );
    await expect(halfValue).toHaveText('Value: 4');
    await expect(star4).toHaveAttribute('data-state', 'full');
  });

  test('required blocks submission and focuses the slider itself; an unrated value is omitted, a rated one submits', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/rating-group');

    const slider = page.getByTestId('rating-form-stars');
    const result = page.getByTestId('rating-form-result');
    await slider.scrollIntoViewIfNeeded();
    await expect(result).toHaveText('');

    await step(page, 'Submit the form with nothing rated.', async () => {
      await page.getByTestId('rating-form-submit').click();
    });
    // Constraint validation blocked the submit, so capture() never ran.
    await expect(result).toHaveText('');
    // The hidden native input carrying `required` is tabindex="-1" -- the
    // browser's own invalid-focus step is redirected to the visible slider.
    await expect(slider).toBeFocused();
    await highlight(slider, 1_200);

    await step(page, 'Rate the group 4 stars.', async () => {
      await page.getByTestId('rating-form-stars-star-4').click();
    });

    await step(page, 'Submit again, now that a real rating exists.', async () => {
      await page.getByTestId('rating-form-submit').click();
    });
    await expect(result).toHaveText('stars=4');
  });

  test('readonly stays focusable but ignores input; disabled is removed from the tab order entirely', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/rating-group');

    const readonly = page.getByTestId('rating-readonly');
    await step(page, 'Focus the readonly slider -- it starts at 4 out of 5.', async () => {
      await readonly.focus();
    });
    await expect(readonly).toBeFocused();
    await expect(readonly).toHaveAttribute('aria-valuenow', '4');

    await step(
      page,
      'Press ArrowRight three times. A visible focus ring, but nothing moves.',
      async () => {
        await readonly.press('ArrowRight');
        await readonly.press('ArrowRight');
        await readonly.press('ArrowRight');
      }
    );
    await expect(readonly).toHaveAttribute('aria-valuenow', '4');
    await expect(page.getByTestId('rating-readonly-star-5')).toHaveAttribute('data-state', 'empty');

    const controlled = page.getByTestId('rating-controlled');
    await step(
      page,
      'Tab again -- focus skips straight over the disabled slider to what comes next.',
      async () => {
        await page.keyboard.press('Tab');
      }
    );
    await expect(page.getByTestId('rating-disabled')).not.toBeFocused();
    await expect(controlled).toBeFocused();
  });
});

test.describe('AspectRatio', () => {
  test('reserves its layout box before the image arrives, so nothing shifts when it loads', async ({
    page
  }) => {
    const { release } = await holdImageRequests(page);
    await gotoHydratedWithoutLoad(page, '/components/aspect-ratio');

    const box = page.getByTestId('aspect-ratio-16-9-demo');
    const image = box.locator('img');

    await caption(page, 'The image request is held -- nothing has arrived yet.');
    const naturalWidthBeforeLoad = await image.evaluate((node) =>
      node instanceof HTMLImageElement ? node.naturalWidth : -1
    );
    expect(naturalWidthBeforeLoad).toBe(0);

    const reservedBox = await boundingBoxOrThrow(box);
    expect(reservedBox.height).toBeGreaterThan(0);
    // A 16:9 box, purely from the CSS aspect-ratio declaration, with no image
    // painted inside it to have produced that height.
    expect(Math.abs(reservedBox.height - reservedBox.width / (16 / 9))).toBeLessThan(1);
    await highlight(box);

    const empty = page.getByTestId('aspect-ratio-empty-demo');
    await step(
      page,
      'The empty placeholder below reserves the identical 16:9 shape with no content at all.',
      async () => {
        await empty.scrollIntoViewIfNeeded();
        await highlight(empty);
      }
    );
    const emptyBox = await boundingBoxOrThrow(empty);
    expect(Math.abs(emptyBox.height - emptyBox.width / (16 / 9))).toBeLessThan(1);

    await box.scrollIntoViewIfNeeded();
    await step(
      page,
      'Release the image and watch it fill the pre-reserved box with zero shift.',
      async () => {
        release();
        await image.evaluate(
          (node) =>
            new Promise<void>((resolve) => {
              if (!(node instanceof HTMLImageElement)) {
                resolve();
                return;
              }
              if (node.complete && node.naturalWidth > 0) {
                resolve();
                return;
              }
              node.addEventListener('load', () => resolve(), { once: true });
            })
        );
      }
    );

    const finalBox = await boundingBoxOrThrow(box);
    expect(Math.abs(finalBox.width - reservedBox.width)).toBeLessThan(1);
    expect(Math.abs(finalBox.height - reservedBox.height)).toBeLessThan(1);
  });

  test('renders each configured ratio, falls back to a square for an invalid ratio, and can be overridden purely through CSS', async ({
    page
  }) => {
    await page.route('https://images.unsplash.com/**', fulfillWithPlaceholderImage);
    await gotoHydrated(page, '/components/aspect-ratio');

    const sixteenNine = page.getByTestId('aspect-ratio-16-9-demo');
    await step(page, 'The first box is 16 by 9.', async () => {
      await highlight(sixteenNine);
    });
    expect(await ratioOf(sixteenNine)).toBeCloseTo(16 / 9, 1);

    const square = page.getByTestId('aspect-ratio-square-demo');
    await step(page, 'With no ratio prop passed, the default is a 1:1 square.', async () => {
      await square.scrollIntoViewIfNeeded();
      await highlight(square);
    });
    expect(await ratioOf(square)).toBeCloseTo(1, 1);

    const fourThree = page.getByTestId('aspect-ratio-4-3-demo');
    await step(page, 'This one is 4 by 3.', async () => {
      await fourThree.scrollIntoViewIfNeeded();
      await highlight(fourThree);
    });
    expect(await ratioOf(fourThree)).toBeCloseTo(4 / 3, 1);

    const zero = page.getByTestId('aspect-ratio-zero-demo');
    const negative = page.getByTestId('aspect-ratio-negative-demo');
    const nan = page.getByTestId('aspect-ratio-nan-demo');
    await step(
      page,
      'ratio=0, ratio=-2 and ratio=NaN all fall back to the same square instead of collapsing.',
      async () => {
        await zero.scrollIntoViewIfNeeded();
        await highlight(zero);
        await highlight(negative);
        await highlight(nan);
      }
    );
    expect(await ratioOf(zero)).toBeCloseTo(1, 1);
    expect(await ratioOf(negative)).toBeCloseTo(1, 1);
    expect(await ratioOf(nan)).toBeCloseTo(1, 1);

    const overridden = page.getByTestId('aspect-ratio-css-override-demo');
    await step(
      page,
      'This box is passed ratio={16/9} as a prop, but a CSS custom property overrides it to a square.',
      async () => {
        await overridden.scrollIntoViewIfNeeded();
        await highlight(overridden);
      }
    );
    expect(await ratioOf(overridden)).toBeCloseTo(1, 1);
  });
});

test.describe('Label', () => {
  test('clicking label text focuses the control it names, explicit or implicit, and required is announced alongside the asterisk', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/label');

    const emailInput = page.locator('#demo-email');
    await step(page, "Click the 'Email address' label text.", async () => {
      await page.getByTestId('label-explicit-demo').click();
    });
    await expect(emailInput).toBeFocused();

    const nameInput = page.locator('#demo-name');
    const requiredLabel = page.getByTestId('label-required-demo');
    await step(
      page,
      "Click the required 'Full name' label -- the same focus behaviour.",
      async () => {
        await requiredLabel.click();
      }
    );
    await expect(nameInput).toBeFocused();

    const requiredMarker = requiredLabel.locator('.required-marker');
    await step(
      page,
      "The accessible name includes the word 'required', not just the visual asterisk.",
      async () => {
        await highlight(requiredMarker);
      }
    );
    await expect(nameInput).toHaveAccessibleName(/required/i);
    // The asterisk itself carries no announcement -- it is decorative only.
    await expect(requiredMarker).toHaveAttribute('aria-hidden', 'true');

    const implicitLabel = page.getByTestId('label-implicit-demo');
    const checkbox = implicitLabel.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();

    const labelBox = await boundingBoxOrThrow(implicitLabel);
    const checkboxBox = await boundingBoxOrThrow(checkbox);
    const textClickX = labelBox.x + labelBox.width - 10;
    // Proves the click below genuinely lands past the checkbox, on the text --
    // not a coincidental hit on the control itself.
    expect(textClickX).toBeGreaterThan(checkboxBox.x + checkboxBox.width);

    await step(
      page,
      "Click directly on 'Subscribe to updates', well past the checkbox itself.",
      async () => {
        await page.mouse.click(textClickX, labelBox.y + labelBox.height / 2);
      }
    );
    await expect(checkbox).toBeChecked();
  });
});

test.describe('Separator', () => {
  test('renders a themeable divider, full-width horizontal or full-height vertical', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/separator');

    const horizontal = page.getByTestId('separator-horizontal-demo');
    await step(page, 'A horizontal divider runs the full width between two sections.', async () => {
      await highlight(horizontal);
    });
    await expect(horizontal).toHaveAttribute('data-orientation', 'horizontal');
    const horizontalBox = await boundingBoxOrThrow(horizontal);
    expect(horizontalBox.width).toBeGreaterThan(horizontalBox.height * 10);

    const vertical = page.getByTestId('separator-vertical-demo');
    await step(page, 'Two vertical dividers split the Edit / Duplicate / Delete row.', async () => {
      await vertical.scrollIntoViewIfNeeded();
      await highlight(vertical);
    });
    await expect(vertical).toHaveAttribute('data-orientation', 'vertical');
    const verticalBox = await boundingBoxOrThrow(vertical);
    expect(verticalBox.height).toBeGreaterThan(verticalBox.width * 10);

    const themed = page.getByTestId('separator-themed-demo');
    await step(
      page,
      'The themed divider at the bottom is thicker, purple, and only 60% the length.',
      async () => {
        await themed.scrollIntoViewIfNeeded();
        await highlight(themed);
      }
    );
    const themedBox = await boundingBoxOrThrow(themed);
    const horizontalColor = await horizontal.evaluate(
      (node) => getComputedStyle(node).backgroundColor
    );
    const themedColor = await themed.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(themedColor).not.toBe(horizontalColor);
    expect(themedBox.height).toBeGreaterThan(horizontalBox.height * 2);
    expect(themedBox.width).toBeLessThan(horizontalBox.width);
  });

  test('a decorative separator carries no role and is aria-hidden; a non-decorative one takes role="separator"', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/separator');

    const decorative = page.getByTestId('separator-horizontal-demo');
    await caption(
      page,
      'These two lines render pixel-identical -- the difference only exists in the accessibility tree.'
    );
    await step(page, 'The decorative divider: no role, aria-hidden.', async () => {
      await highlight(decorative);
    });
    await expect(decorative).not.toHaveAttribute('role', /.*/);
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');

    const nonDecorative = page.getByTestId('separator-non-decorative-demo');
    await step(page, 'This one, inside the menu, is marked non-decorative.', async () => {
      await nonDecorative.scrollIntoViewIfNeeded();
      await highlight(nonDecorative);
    });
    await expect(nonDecorative).toHaveAttribute('role', 'separator');
    await expect(nonDecorative).not.toHaveAttribute('aria-hidden', /.*/);

    // Same geometry despite the ARIA difference -- confirms the two really are
    // visually indistinguishable, not just similar.
    const decorativeBox = await boundingBoxOrThrow(decorative);
    const nonDecorativeBox = await boundingBoxOrThrow(nonDecorative);
    expect(nonDecorativeBox.height).toBe(decorativeBox.height);
    await beat(page, 1_000);
  });
});
