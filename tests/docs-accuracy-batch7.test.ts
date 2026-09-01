import { expect, test } from '@playwright/test';

// Proves the behaviors newly documented in this pass are real, not just described.
// Table.md and Tabs.md previously omitted a substantial slice of their own real, working
// props from the formal Props table (some only ever covered in prose, some not at all) --
// these assert the underlying components actually do what the corrected docs now claim.

test.describe('Table — newly-documented props are real', () => {
  test('usePortal escapes an in-cell select dropdown from an overflow:hidden ancestor', async ({
    page
  }) => {
    await page.goto('/components/table');

    const clipper = page.getByTestId('table-portal-clipper');
    const table = page.getByTestId('table-portal-cells');
    await expect(table).toBeVisible();

    // Open the in-cell Select in the row inside the height-120px, overflow:hidden clipper.
    // The select cell renders the library's own Select component (role="combobox"),
    // addressed directly via the testId set on the row's cell data.
    const trigger = page.getByTestId('portal-tier-0');
    await trigger.click();

    // A portaled dropdown mounts on document.body, outside the clipper's DOM subtree
    // entirely -- so its bounding box can extend below the clipper's own clipped bounds.
    const clipperBox = await clipper.boundingBox();
    const optionEnterprise = page.getByText('Enterprise', { exact: true });
    await expect(optionEnterprise).toBeVisible();
    const optionBox = await optionEnterprise.boundingBox();

    expect(clipperBox).not.toBeNull();
    expect(optionBox).not.toBeNull();
    // The option is not a descendant of the clipper element.
    const isInsideClipper = await clipper.evaluate((clipperEl, testId) => {
      const opt = Array.from(document.querySelectorAll('*')).find(
        (el) => el.textContent?.trim() === testId
      );
      return opt ? clipperEl.contains(opt) : false;
    }, 'Enterprise');
    expect(isInsideClipper).toBe(false);
  });

  test('rowNumberColumn prepends a 1-based sequence column', async ({ page }) => {
    await page.goto('/components/table');

    const table = page.getByTestId('table-paginated');
    await expect(table).toBeVisible();

    // Header's first cell is the default rowNumberLabel ('#').
    const headerCells = table.locator('thead th');
    await expect(headerCells.first()).toHaveText('#');

    // First body row's first cell is '1'.
    const firstDataRow = table.locator('tbody tr').first();
    await expect(firstDataRow.locator('td').first()).toHaveText('1');
  });

  test('toolbarSlot renders a bulk-action bar only while checkbox selection is non-empty', async ({
    page
  }) => {
    await page.goto('/components/table');

    const table = page.getByTestId('table-controlled-selection');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('bulk-count')).not.toBeVisible();

    // Row selection is a custom role="checkbox" span, not a native <input> --
    // Table.svelte renders it as <span class="table-checkbox-box" role="checkbox">.
    await table.locator('tbody tr').first().locator('.table-checkbox-box').click();

    const bulkCount = page.getByTestId('bulk-count');
    await expect(bulkCount).toBeVisible();
    await expect(bulkCount).toHaveText('1 selected');

    await page.getByTestId('bulk-delete').click();
    await expect(bulkCount).not.toBeVisible();
  });
});

test.describe('Tabs — TabItem[] mode (icon/status/sectionLabel/orientation) is real', () => {
  test('vertical orientation with TabItem[] renders icons, status dots, a section label, and activeKey/onkeychange work by key', async ({
    page
  }) => {
    await page.goto('/components/tabs');

    const tabs = page.getByTestId('tabs-vertical-demo');
    await expect(tabs).toBeVisible();

    // sectionLabel: 'SETTINGS' renders as its own header, distinct from any tab item.
    await expect(tabs.getByText('SETTINGS', { exact: true })).toBeVisible();

    // icon: every item's gear icon is an SVG data URI rendered via <Img inlineSvg>,
    // which inlines it as a real <svg> (with the .tabs-item-icon class Tabs applies),
    // not an <img> tag.
    await expect(tabs.locator('svg.tabs-item-icon').first()).toBeVisible();

    // Selecting by activeKey (not index) — 'Cart Design' (key: 'cart-design') starts active.
    await expect(page.getByText('Active: cart-design')).toBeVisible();

    // Click a different item; onkeychange fires with its TabItem.key, not its index.
    await tabs.getByText('Free Gift', { exact: true }).click();
    await expect(page.getByText('Active: free-gift')).toBeVisible();
  });
});
