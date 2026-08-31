import { expect, test, type Page } from '@playwright/test';

test.describe('Stepper and Step — suppressRoleAndTabindex', () => {
  test('suppressed steps have no role or tabindex and are not tab-reachable', async ({ page }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-informational');
    const cartStep = container.locator('.step').filter({ hasText: 'Cart' });
    const shippingStep = container.locator('.step').filter({ hasText: 'Shipping' });
    const paymentStep = container.locator('.step').filter({ hasText: 'Payment' });

    await expect(cartStep).not.toHaveAttribute('role');
    await expect(cartStep).not.toHaveAttribute('tabindex');
    await expect(shippingStep).not.toHaveAttribute('role');
    await expect(shippingStep).not.toHaveAttribute('tabindex');
    await expect(paymentStep).not.toHaveAttribute('role');
    await expect(paymentStep).not.toHaveAttribute('tabindex');

    const cartTabIndex = await cartStep.evaluate((element) => (element as HTMLElement).tabIndex);
    expect(cartTabIndex).toBe(-1);
  });

  test('default (unsuppressed) steps keep synthetic button semantics and stay clickable', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    const shippingStep = container.locator('.step').filter({ hasText: 'Shipping' });

    await expect(shippingStep).toHaveAttribute('role', 'button');
    await expect(shippingStep).toHaveAttribute('tabindex', '0');

    await shippingStep.click();
    await expect(shippingStep).toHaveAttribute('aria-current', 'step');
  });
});

test.describe('Stepper and Step — testId', () => {
  test('an explicit per-step testId renders as data-pw on that step, matching a real migration consumer', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    await expect(page.getByTestId('abandoned-checkouts-recovery-strip-step-1')).toHaveText(/Cart/);
    await expect(page.getByTestId('abandoned-checkouts-recovery-strip-step-2')).toHaveText(
      /Shipping/
    );
    await expect(page.getByTestId('abandoned-checkouts-recovery-strip-step-3')).toHaveText(
      /Payment/
    );
  });

  test('an omitted per-step testId derives "<stepperTestId>-step-<n>" (1-based) from the Stepper testId', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    await expect(container.getByTestId('stepper-horizontal-step-1')).toHaveText(/Cart/);
    await expect(container.getByTestId('stepper-horizontal-step-2')).toHaveText(/Shipping/);
    await expect(container.getByTestId('stepper-horizontal-step-3')).toHaveText(/Payment/);
    await expect(container.getByTestId('stepper-horizontal-step-4')).toHaveText(/Confirm/);
  });

  test('a step with no testId anywhere in scope renders no data-pw attribute at all', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.locator('#no-testid-demo');
    const cartStep = container.locator('.step').filter({ hasText: 'Cart' });
    await expect(cartStep).not.toHaveAttribute('data-pw');
  });
});

test.describe('Stepper — wrapping (--container-flex-wrap / --step-container-flex)', () => {
  test('off (default): the row stays nowrap and steps keep their content-fit flex-basis', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-wrap-off');
    const flexWrap = await container.evaluate((element) => getComputedStyle(element).flexWrap);
    expect(flexWrap).toBe('nowrap');

    const stepContainer = container.locator('.step-container').first();
    const flexBasis = await stepContainer.evaluate(
      (element) => getComputedStyle(element).flexBasis
    );
    expect(flexBasis).toBe('auto');

    // All three steps still share a single row on the narrow rail.
    const tops = await container
      .locator('.step-container')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
  });

  test('on: the row wraps and each step claims a full-width flex-basis, stacking one per line', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-wrap-on');
    const flexWrap = await container.evaluate((element) => getComputedStyle(element).flexWrap);
    expect(flexWrap).toBe('wrap');

    const stepContainer = container.locator('.step-container').first();
    const flexBasis = await stepContainer.evaluate(
      (element) => getComputedStyle(element).flexBasis
    );
    expect(flexBasis).toBe('100%');

    // Three steps land on three distinct rows.
    const tops = await container
      .locator('.step-container')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(3);
  });
});

test.describe('Stepper — separator growth (--step-flex-grow / --stepper-separator-flex-grow)', () => {
  test('off (default): the separator keeps its fixed --stepper-separator-width', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-separator-growth-off');
    const separator = container.locator('.separator').first();

    const flexGrow = await separator.evaluate((element) => getComputedStyle(element).flexGrow);
    expect(flexGrow).toBe('0');

    const width = await separator.evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeLessThan(60);
  });

  test('on: the separator grows to absorb the card leftover width', async ({ page }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-separator-growth-on');
    const separator = container.locator('.separator').first();

    const flexGrow = await separator.evaluate((element) => getComputedStyle(element).flexGrow);
    expect(flexGrow).toBe('1');

    const width = await separator.evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(100);
  });
});

test.describe('Step — circle border hook (--step-index-container-*-border)', () => {
  test('default: no status sets a border, matching current behaviour exactly', async ({ page }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    const cartCircle = container
      .locator('.step')
      .filter({ hasText: 'Cart' })
      .locator('.step-index-container');

    const borderStyle = await cartCircle.evaluate(
      (element) => getComputedStyle(element).borderTopStyle
    );
    expect(borderStyle).toBe('none');
  });

  test('themed: completed/active/failure each render their own distinct, non-default border', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-themed-border');
    const readBorder = async (label: string) => {
      const circle = container
        .locator('.step')
        .filter({ hasText: label })
        .locator('.step-index-container');
      return circle.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          style: computed.borderTopStyle,
          width: computed.borderTopWidth,
          color: computed.borderTopColor
        };
      });
    };

    const [completed, active, failure] = await Promise.all([
      readBorder('Cart'),
      readBorder('Shipping'),
      readBorder('Payment')
    ]);

    expect(completed.style).toBe('solid');
    expect(active.style).toBe('solid');
    expect(failure.style).toBe('solid');
    expect(completed.width).toBe('2px');
    expect(active.width).toBe('2px');
    expect(failure.width).toBe('2px');

    // Distinct per state — three statuses, three different border colors.
    const distinctColors = new Set([completed.color, active.color, failure.color]);
    expect(distinctColors.size).toBe(3);
  });
});

test.describe('Step — label font-weight hook (--step-text-font-weight)', () => {
  test('default: the label renders at the normal browser-default weight, matching current behaviour exactly', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    const cartLabel = container.locator('.step').filter({ hasText: 'Cart' }).locator('.step-text');

    const fontWeight = await cartLabel.evaluate((element) => getComputedStyle(element).fontWeight);
    expect(fontWeight).toBe('400');
  });

  test('semibold: an ancestor override reaches .step-text through the new hook', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-semibold-label');
    const cartLabel = container.locator('.step').filter({ hasText: 'Cart' }).locator('.step-text');

    const fontWeight = await cartLabel.evaluate((element) => getComputedStyle(element).fontWeight);
    expect(fontWeight).toBe('600');
  });
});

test.describe('Stepper — status "muted" (smaller, subtly-tinted marker)', () => {
  test('muted renders a smaller circle than the default-sized pending sibling', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-muted');
    const pendingCircle = container
      .locator('.step')
      .filter({ hasText: 'Notes' })
      .locator('.step-index-container');
    const mutedCircle = container
      .locator('.step')
      .filter({ hasText: 'Gift note' })
      .locator('.step-index-container');

    const [pendingWidth, mutedWidth] = await Promise.all([
      pendingCircle.evaluate((element) => element.getBoundingClientRect().width),
      mutedCircle.evaluate((element) => element.getBoundingClientRect().width)
    ]);

    expect(pendingWidth).toBeGreaterThan(25); // unaffected default, ~30px
    expect(mutedWidth).toBeLessThan(pendingWidth);
    expect(mutedWidth).toBeLessThan(25); // muted default, ~20px
  });

  test('muted uses its own tint, distinct from the pending default grey', async ({ page }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-muted');
    const pendingCircle = container
      .locator('.step')
      .filter({ hasText: 'Notes' })
      .locator('.step-index-container');
    const mutedCircle = container
      .locator('.step')
      .filter({ hasText: 'Gift note' })
      .locator('.step-index-container');

    const [pendingColor, mutedColor] = await Promise.all([
      pendingCircle.evaluate((element) => getComputedStyle(element).backgroundColor),
      mutedCircle.evaluate((element) => getComputedStyle(element).backgroundColor)
    ]);

    expect(mutedColor).not.toBe(pendingColor);
  });

  test('existing statuses in the same Stepper are unaffected by a sibling muted step', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    const container = page.getByTestId('stepper-muted');
    const completedCircle = container
      .locator('.step')
      .filter({ hasText: 'Cart' })
      .locator('.step-index-container');

    // Same background as any other unmodified "completed" step (e.g. the
    // per-status demo above), proving the new status class does not leak
    // into its siblings.
    const backgroundColor = await completedCircle.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(36, 170, 90)'); // #24aa5a
  });
});

test.describe('Stepper — suppressContainerTestId', () => {
  test('off (default): the container still claims testId, colliding with an ancestor that carries the same data-pw', async ({
    page
  }) => {
    await page.goto('/components/stepper');

    // The demo's wrapping element and the Stepper's own container both render
    // data-pw="checkout-rail-default" — exactly the collision the opt-out exists for.
    await expect(page.locator('[data-pw="checkout-rail-default"]')).toHaveCount(2);
  });

  test("on: the container no longer claims testId, leaving only the ancestor's data-pw, while per-step ids are unaffected", async ({
    page
  }) => {
    await page.goto('/components/stepper');

    await expect(page.locator('[data-pw="checkout-rail-suppressed"]')).toHaveCount(1);

    const container = page.locator('[data-pw="checkout-rail-suppressed"]');
    await expect(container).not.toHaveClass(/container/);

    await expect(page.getByTestId('checkout-rail-suppressed-step-1')).toHaveText(/Cart/);
    await expect(page.getByTestId('checkout-rail-suppressed-step-2')).toHaveText(/Shipping/);
    await expect(page.getByTestId('checkout-rail-suppressed-step-3')).toHaveText(/Payment/);
  });
});

test.describe('Step used on its own, outside a Stepper', () => {
  // Step never read its own `status` for colour: the per-status remapping lived only in
  // Stepper's scoped `.status-<name>` wrapper. A bare Step therefore rendered every status
  // at the same neutral default — the component could not express its own state unless it
  // was composed. Caught by the one bare-Step call site in the consuming app, where the
  // install pill lost its pending/active/done distinction entirely.
  const circleBackground = async (page: Page, testId: string) =>
    page
      .locator(
        `[data-pw="${testId}"] .step-index-container, [data-pw="${testId}"] .step-icon-container`
      )
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);

  test('a bare Step renders a different marker colour per status', async ({ page }) => {
    await page.goto('/components/stepper');
    await expect(page.getByTestId('bare-step-completed')).toBeVisible();

    const completed = await circleBackground(page, 'bare-step-completed');
    const active = await circleBackground(page, 'bare-step-active');
    const pending = await circleBackground(page, 'bare-step-pending');

    expect(completed).not.toBe(pending);
    expect(active).not.toBe(pending);
    expect(completed).not.toBe(active);
  });

  test('a bare muted Step is smaller than a bare pending Step', async ({ page }) => {
    await page.goto('/components/stepper');
    await expect(page.getByTestId('bare-step-muted')).toBeVisible();

    const muted = await page
      .locator('[data-pw="bare-step-muted"] .step-index-container')
      .first()
      .boundingBox();
    const pending = await page
      .locator('[data-pw="bare-step-pending"] .step-index-container')
      .first()
      .boundingBox();

    expect(muted).not.toBeNull();
    expect(pending).not.toBeNull();
    expect(muted!.width).toBeLessThan(pending!.width);
  });
});

test.describe('muted status legibility', () => {
  // `muted` shipped with white numerals on a pale circle (1.53:1) and a #a9b4c0 label on a
  // light surface (2.10:1) — both under WCAG AA. Nothing caught it because nothing used the
  // status until a consumer adopted it. Asserting the ratio rather than the hex means a
  // future palette change cannot quietly reintroduce an illegible pair.
  const relativeLuminance = (rgb: string): number => {
    const parts = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const channels = parts.map((value) => {
      const proportion = value / 255;
      return proportion <= 0.03928
        ? proportion / 12.92
        : Math.pow((proportion + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const contrastRatio = (foreground: string, background: string): number => {
    const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
      (first, second) => second - first
    );
    return (lighter + 0.05) / (darker + 0.05);
  };

  test('a muted step index reads against its own circle', async ({ page }) => {
    await page.goto('/components/stepper');
    const marker = page.locator('[data-pw="bare-step-muted"] .step-index-container').first();
    await expect(marker).toBeVisible();

    const { color, backgroundColor } = await marker.evaluate((node) => {
      const computed = getComputedStyle(node);
      return { color: computed.color, backgroundColor: computed.backgroundColor };
    });

    expect(contrastRatio(color, backgroundColor)).toBeGreaterThanOrEqual(3);
  });
});
