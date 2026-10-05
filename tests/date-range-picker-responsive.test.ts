import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

const ROUTE = '/components/date-range-picker';
const FIXTURE_ROUTE = `${fixtureBaseURL}/date-range-picker/`;

type Box = { x: number; y: number; width: number; height: number };

const boxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('expected the element to have a bounding box');
  }
  return box;
};

const openPicker = async (page: Page, testId: string): Promise<Locator> => {
  await gotoHydrated(page, ROUTE);
  const picker = page.getByTestId(testId);
  await picker.getByRole('button', { name: 'Open date picker' }).click();
  const panel = page.getByTestId(`${testId}-panel`);
  await expect(panel).toBeVisible();
  return panel;
};

// Test-control scenarios live in the fixture app, not on the public docs demo.
const openFixturePicker = async (page: Page, testId: string): Promise<Locator> => {
  await page.goto(FIXTURE_ROUTE);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  const picker = page.getByTestId(testId);
  await picker.getByRole('button', { name: 'Open date picker' }).click();
  const panel = page.getByTestId(`${testId}-panel`);
  await expect(panel).toBeVisible();
  return panel;
};

const expectInsideViewport = (box: Box, viewport: { width: number; height: number }): void => {
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
};

const APPLIED_RANGE = /\w{3} \d{1,2}, \d{4} – \w{3} \d{1,2}, \d{4}/;

test.describe('DateRangePicker responsiveLayout — phone width', () => {
  const viewport = { width: 390, height: 844 };
  test.use({ viewport });

  test('the panel becomes a fixed sheet inside the viewport with one month and stacked inputs', async ({
    page
  }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel).toHaveCSS('position', 'fixed');
    expectInsideViewport(await boxOf(panel), viewport);

    const applyButton = panel.getByRole('button', { name: 'Apply date selection' });
    await expect(applyButton).toBeVisible();
    expectInsideViewport(await boxOf(applyButton), viewport);

    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(1);

    const startInput = await boxOf(page.getByTestId('drp-responsive-demo-start-date'));
    const endInput = await boxOf(page.getByTestId('drp-responsive-demo-end-date'));
    expect(endInput.y).toBeGreaterThanOrEqual(startInput.y + startInput.height - 0.5);

    const sidebar = await boxOf(panel.locator('.drp-sidebar'));
    const calendars = await boxOf(panel.locator('.drp-calendars'));
    expect(sidebar.y + sidebar.height).toBeLessThanOrEqual(calendars.y + 0.5);
  });

  test('the arrow between the date inputs is hidden', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel.locator('.drp-datetime-arrow').first()).toBeHidden();
  });

  test('the calendar area takes the narrow padding', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel.locator('.drp-calendars')).toHaveCSS('padding', '16px 8px');
  });

  test('Apply is clickable on the sheet and commits the picked preset', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await panel.getByRole('option', { name: 'Last 7 days', exact: true }).click();
    await panel.getByRole('button', { name: 'Apply date selection' }).click();

    await expect(panel).toBeHidden();
    await expect(page.getByTestId('drp-responsive-demo-trigger')).toHaveText(APPLIED_RANGE);
  });

  test('the same picker without responsiveLayout runs off the screen (negative control)', async ({
    page
  }) => {
    const panel = await openFixturePicker(page, 'drp-unconfined-demo');

    await expect(panel).toHaveCSS('position', 'absolute');
    const box = await boxOf(panel);
    expect(box.x + box.width).toBeGreaterThan(viewport.width);
  });
});

test.describe('DateRangePicker responsiveLayout — themed sheet', () => {
  const viewport = { width: 390, height: 844 };
  test.use({ viewport });

  const openThemedPicker = async (page: Page, tokens: Record<string, string>): Promise<Locator> => {
    await gotoHydrated(page, ROUTE);
    const picker = page.getByTestId('drp-responsive-demo');
    await picker.evaluate((element, themeTokens) => {
      Object.entries(themeTokens).forEach(([name, value]) => {
        element.style.setProperty(name, value);
      });
    }, tokens);
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    const panel = page.getByTestId('drp-responsive-demo-panel');
    await expect(panel).toBeVisible();
    return panel;
  };

  test('the sheet insets follow the --drp-sheet-* tokens', async ({ page }) => {
    const panel = await openThemedPicker(page, {
      '--drp-sheet-left': '40px',
      '--drp-sheet-right': '24px',
      '--drp-sheet-bottom': '32px'
    });

    const box = await boxOf(panel);
    expect(box.x).toBeCloseTo(40, 0);
    expect(box.x + box.width).toBeCloseTo(viewport.width - 24, 0);
    expect(box.y + box.height).toBeCloseTo(viewport.height - 32, 0);
  });

  test('the sheet stacks at --drp-sheet-z-index', async ({ page }) => {
    const panel = await openThemedPicker(page, { '--drp-sheet-z-index': '4242' });

    await expect(panel).toHaveCSS('z-index', '4242');
  });

  test('the narrow padding follows --drp-calendars-padding-narrow', async ({ page }) => {
    const panel = await openThemedPicker(page, { '--drp-calendars-padding-narrow': '4px 2px' });

    await expect(panel.locator('.drp-calendars')).toHaveCSS('padding', '4px 2px');
  });
});

test.describe('DateRangePicker responsiveLayout — narrowest phone', () => {
  const viewport = { width: 320, height: 640 };
  test.use({ viewport });

  test('the calendar fits the sheet without a horizontal scrollbar', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    expectInsideViewport(await boxOf(panel), viewport);

    const calendarBox = await boxOf(panel.locator('.drp-calendar-embedded'));
    const innerBox = await boxOf(panel.locator('.drp-panel-inner'));
    expect(calendarBox.x + calendarBox.width).toBeLessThanOrEqual(
      innerBox.x + innerBox.width + 0.5
    );

    const scrollsSideways = await panel
      .locator('.drp-panel-inner')
      .evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(scrollsSideways).toBe(false);
  });
});

test.describe('DateRangePicker responsiveLayout — tablet width', () => {
  const viewport = { width: 900, height: 900 };
  test.use({ viewport });

  test('the sheet keeps two months side by side with the presets above them', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel).toHaveCSS('position', 'fixed');
    expectInsideViewport(await boxOf(panel), viewport);

    const sidebar = await boxOf(panel.locator('.drp-sidebar'));
    const calendars = await boxOf(panel.locator('.drp-calendars'));
    expect(sidebar.y + sidebar.height).toBeLessThanOrEqual(calendars.y + 0.5);

    const calendarLocator = panel.locator('.drp-calendar-embedded');
    await expect(calendarLocator).toHaveCount(2);
    const leftMonth = await boxOf(calendarLocator.nth(0));
    const rightMonth = await boxOf(calendarLocator.nth(1));
    expect(Math.abs(leftMonth.y - rightMonth.y)).toBeLessThan(1);
    expect(rightMonth.x).toBeGreaterThanOrEqual(leftMonth.x + leftMonth.width - 0.5);
  });
});

test.describe('DateRangePicker responsiveLayout — tablet width sheet', () => {
  const viewport = { width: 900, height: 900 };
  test.use({ viewport });

  test('the sheet is capped at 48rem and centred', async ({ page }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    // 48rem plus the two 1px borders is narrower than the viewport minus the insets, so
    // the sheet is capped and centred rather than stretched against the left inset.
    const panelBox = await boxOf(panel);
    expect(panelBox.width).toBeCloseTo(770, 0);
    const gapLeft = panelBox.x;
    const gapRight = viewport.width - (panelBox.x + panelBox.width);
    expect(Math.abs(gapLeft - gapRight)).toBeLessThan(1);
  });

  test('the calendar area keeps its normal padding above the narrow breakpoint', async ({
    page
  }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel.locator('.drp-calendars')).toHaveCSS('padding', '16px');
  });
});

test.describe('DateRangePicker responsiveLayout — desktop width', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the panel stays an anchored dropdown with the presets beside the calendars', async ({
    page
  }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');

    await expect(panel).toHaveCSS('position', 'absolute');
    await expect(panel.locator('.drp-datetime-arrow').first()).toBeVisible();
    const sidebar = await boxOf(panel.locator('.drp-sidebar'));
    const calendars = await boxOf(panel.locator('.drp-calendars'));
    expect(sidebar.x + sidebar.width).toBeLessThanOrEqual(calendars.x + 0.5);
  });

  test('a picker with no props at all keeps the unconfined dropdown layout', async ({ page }) => {
    const panel = await openPicker(page, 'drp-range-demo');

    await expect(panel).toHaveCSS('position', 'absolute');
    await expect(panel).not.toHaveClass(/drp-panel-(sheet|narrow|presets-top)/);
    const sidebar = await boxOf(panel.locator('.drp-sidebar'));
    const calendars = await boxOf(panel.locator('.drp-calendars'));
    expect(sidebar.x + sidebar.width).toBeLessThanOrEqual(calendars.x + 0.5);
  });

  test('resizing while the panel is open flips the layout both ways and keeps the draft', async ({
    page
  }) => {
    const panel = await openPicker(page, 'drp-responsive-demo');
    await expect(panel).toHaveCSS('position', 'absolute');

    await panel.getByRole('option', { name: 'Last 30 days', exact: true }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel).toHaveCSS('position', 'fixed');
    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(1);
    expectInsideViewport(await boxOf(panel), { width: 390, height: 844 });
    await expect(panel.getByRole('option', { name: 'Last 30 days', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(panel).toHaveCSS('position', 'absolute');
    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(2);
    await expect(panel.getByRole('option', { name: 'Last 30 days', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await panel.getByRole('button', { name: 'Apply date selection' }).click();
    await expect(panel).toBeHidden();
    await expect(page.getByTestId('drp-responsive-demo-trigger')).toHaveText(APPLIED_RANGE);
  });
});

test.describe('DateRangePicker presetsPosition', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("'top' puts the presets above the calendars in a panel that stays anchored", async ({
    page
  }) => {
    const panel = await openPicker(page, 'drp-presets-top-demo');

    await expect(panel).toHaveCSS('position', 'absolute');
    const sidebar = await boxOf(panel.locator('.drp-sidebar'));
    const calendars = await boxOf(panel.locator('.drp-calendars'));
    expect(sidebar.y + sidebar.height).toBeLessThanOrEqual(calendars.y + 0.5);

    // A wrapping row puts the second preset beside the first; a column would put it below.
    const firstPreset = await boxOf(panel.getByRole('option').nth(0));
    const secondPreset = await boxOf(panel.getByRole('option').nth(1));
    expect(secondPreset.x).toBeGreaterThan(firstPreset.x);
    expect(Math.abs(secondPreset.y - firstPreset.y)).toBeLessThan(1);
  });
});

test.describe('DateRangePicker open panel under a pointer-events: none ancestor', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a keyboard-opened panel can still be clicked and applied', async ({ page }) => {
    await page.goto(FIXTURE_ROUTE);
    await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
    const picker = page.getByTestId('drp-inert-ancestor-demo');
    const trigger = picker.getByRole('button', { name: 'Open date picker' });
    const panel = page.getByTestId('drp-inert-ancestor-demo-panel');

    // The ancestor really is inert: a real mouse click on the trigger reaches nothing.
    const triggerBox = await boxOf(trigger);
    await page.mouse.click(
      triggerBox.x + triggerBox.width / 2,
      triggerBox.y + triggerBox.height / 2
    );
    await expect(panel).toHaveCount(0);

    await trigger.focus();
    await trigger.press('Enter');
    await expect(panel).toBeVisible();

    await panel.getByRole('option', { name: 'Yesterday', exact: true }).click();

    const applyBox = await boxOf(panel.getByRole('button', { name: 'Apply date selection' }));
    const applyCenter = {
      x: applyBox.x + applyBox.width / 2,
      y: applyBox.y + applyBox.height / 2
    };
    const hitIsInsidePanel = await page.evaluate(({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      const panelElement = document.querySelector('[data-pw="drp-inert-ancestor-demo-panel"]');
      return hit !== null && panelElement !== null && panelElement.contains(hit);
    }, applyCenter);
    expect(hitIsInsidePanel).toBe(true);

    await page.mouse.click(applyCenter.x, applyCenter.y);
    await expect(panel).toHaveCount(0);
    await expect(picker.getByRole('button', { name: 'Open date picker' })).toHaveText(
      APPLIED_RANGE
    );
  });

  test('the standalone compare panel can be clicked too', async ({ page }) => {
    await page.goto(FIXTURE_ROUTE);
    await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
    const picker = page.getByTestId('drp-inert-compare-demo');
    const compareTrigger = picker.getByRole('button', { name: 'Open compare period picker' });
    const comparePanel = picker.getByRole('dialog', { name: 'Compare period picker' });
    const cancelButton = comparePanel.getByRole('button', { name: 'Cancel compare selection' });

    await compareTrigger.focus();
    await compareTrigger.press('Enter');
    await expect(comparePanel).toBeVisible();

    // A mouse press that lands outside the picker also closes it, so a closed panel
    // alone would not show the Cancel button was reachable. Check what is under the
    // pointer first, then click through Playwright's own hit-target check.
    const cancelBox = await boxOf(cancelButton);
    const hitIsInsidePanel = await page.evaluate(
      ({ x, y }) => {
        const hit = document.elementFromPoint(x, y);
        const panelElement = document.querySelector('[aria-label="Compare period picker"]');
        return hit !== null && panelElement !== null && panelElement.contains(hit);
      },
      { x: cancelBox.x + cancelBox.width / 2, y: cancelBox.y + cancelBox.height / 2 }
    );
    expect(hitIsInsidePanel).toBe(true);

    await cancelButton.click();
    await expect(comparePanel).toHaveCount(0);
  });
});

test.describe('DateRangePicker single-month calendar (dualMonth=false)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('opens on the selection, follows a preset, the header and a typed date', async ({
    page
  }) => {
    const panel = await openFixturePicker(page, 'drp-single-month-seeded-demo');
    const monthLabel = panel.locator('.drp-calendar-embedded .header-label');

    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(1);
    await expect(monthLabel).toHaveText('March 2019');

    await panel.getByRole('option', { name: 'Fixed February 2020' }).click();
    await expect(monthLabel).toHaveText('February 2020');

    await panel.getByRole('button', { name: 'Next month' }).click();
    await expect(monthLabel).toHaveText('March 2020');

    const startDateInput = page.getByTestId('drp-single-month-seeded-demo-start-date');
    await startDateInput.fill('Jan 5, 2018');
    await startDateInput.press('Enter');
    await expect(monthLabel).toHaveText('January 2018');
  });

  test('enforces maxRangeDays in the grid', async ({ page }) => {
    const panel = await openFixturePicker(page, 'drp-single-month-maxrange-demo');

    await expect(panel.locator('.cell[data-day="20"]')).toBeEnabled();
    await panel.locator('.cell[data-day="10"]').click();

    await expect(panel.locator('.cell[data-day="12"]')).toBeEnabled();
    await expect(panel.locator('.cell[data-day="13"]')).toBeDisabled();
    await expect(panel.locator('.cell[data-day="20"]')).toBeDisabled();
  });

  test('a single-date picker opens on the month of its committed value', async ({ page }) => {
    const panel = await openFixturePicker(page, 'drp-single-seeded-demo');

    await expect(panel.locator('.drp-calendar-embedded .header-label')).toHaveText('March 2019');
  });
});

test.describe('DateRangePicker responsiveLayout — one month at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a date typed in the following month moves the single calendar to it', async ({ page }) => {
    const panel = await openFixturePicker(page, 'drp-seeded-responsive-demo');
    const monthLabel = panel.locator('.drp-calendar-embedded .header-label');

    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(1);
    await expect(monthLabel).toHaveText('March 2019');

    // Two months would already show April; one month does not, so the picker has to
    // navigate to the typed date.
    const endDateInput = page.getByTestId('drp-seeded-responsive-demo-end-date');
    await endDateInput.fill('Apr 5, 2019');
    await endDateInput.press('Enter');
    await expect(monthLabel).toHaveText('April 2019');
  });
});

test.describe('DateRangePicker responsiveLayout — focus when the layout flips', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('focus stays inside the panel when two months collapse to one under it', async ({
    page
  }) => {
    const panel = await openFixturePicker(page, 'drp-seeded-responsive-demo');
    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(2);

    const dayInSecondMonth = panel
      .locator('.drp-calendar-embedded')
      .nth(1)
      .locator('button.cell:not(:disabled)')
      .first();
    await dayInSecondMonth.focus();
    await expect(dayInSecondMonth).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel.locator('.drp-calendar-embedded')).toHaveCount(1);

    // The focused day was destroyed with the second month. Without a restore, focus is on
    // the body and the panel's Tab trap never sees the next key press.
    await expect(panel.locator(':focus')).toHaveCount(1);
  });
});

test.describe('DateRangePicker responsiveLayout — a trigger with no room below', () => {
  test.describe('from a sheet to a dropdown', () => {
    test.use({ viewport: { width: 900, height: 800 } });

    test('widening the window while open puts the dropdown above the trigger', async ({ page }) => {
      const panel = await openFixturePicker(page, 'drp-low-trigger-demo');
      await expect(panel).toHaveCSS('position', 'fixed');
      await expect(panel).not.toHaveClass(/drp-panel-above/);

      await page.setViewportSize({ width: 1280, height: 800 });

      await expect(panel).toHaveCSS('position', 'absolute');
      await expect(panel).toHaveClass(/drp-panel-above/);
      expectInsideViewport(await boxOf(panel), { width: 1280, height: 800 });
    });
  });

  test.describe('from a dropdown to a sheet', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('narrowing the window while open drops the above marker', async ({ page }) => {
      const panel = await openFixturePicker(page, 'drp-low-trigger-demo');
      await expect(panel).toHaveClass(/drp-panel-above/);

      await page.setViewportSize({ width: 900, height: 800 });

      await expect(panel).toHaveCSS('position', 'fixed');
      await expect(panel).not.toHaveClass(/drp-panel-above/);
    });
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test('a sheet is pinned to the viewport and never marked as opening upward', async ({
      page
    }) => {
      const panel = await openFixturePicker(page, 'drp-low-trigger-demo');

      await expect(panel).toHaveCSS('position', 'fixed');
      await expect(panel).not.toHaveClass(/drp-panel-above/);
      expectInsideViewport(await boxOf(panel), { width: 390, height: 800 });
    });
  });
});

test('the date-range-picker fixture is absent from the published docs app', async ({ request }) => {
  const response = await request.get('/date-range-picker/');
  expect(response.status()).toBe(404);
});

test.describe('sui-date-range-picker attributes', () => {
  const openElement = async (page: Page, markup: string): Promise<Locator> => {
    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-date-range-picker')));
    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, markup);
    await page.locator('sui-date-range-picker button').first().click();
    const panel = page.locator('sui-date-range-picker .drp-panel');
    await expect(panel).toBeVisible();
    return panel;
  };

  test.describe('at phone width', () => {
    const viewport = { width: 390, height: 844 };
    test.use({ viewport });

    test('responsive-layout turns the panel into a sheet inside the viewport', async ({ page }) => {
      const panel = await openElement(
        page,
        '<sui-date-range-picker responsive-layout></sui-date-range-picker>'
      );

      await expect(panel).toHaveClass(/drp-panel-sheet/);
      await expect(panel).toHaveCSS('position', 'fixed');
      expectInsideViewport(await boxOf(panel), viewport);
    });

    test('the element without the attribute stays an anchored dropdown', async ({ page }) => {
      const panel = await openElement(page, '<sui-date-range-picker></sui-date-range-picker>');

      await expect(panel).not.toHaveClass(/drp-panel-sheet/);
      await expect(panel).toHaveCSS('position', 'absolute');
    });
  });

  test.describe('at desktop width', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('presets-position="top" puts the presets above the calendars', async ({ page }) => {
      const panel = await openElement(
        page,
        '<sui-date-range-picker presets-position="top"></sui-date-range-picker>'
      );

      await expect(panel).toHaveClass(/drp-panel-presets-top/);
      await expect(panel).not.toHaveClass(/drp-panel-sheet/);
      await expect(panel).toHaveCSS('position', 'absolute');
    });
  });
});
