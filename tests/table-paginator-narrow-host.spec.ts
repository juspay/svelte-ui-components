import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

/**
 * Table's built-in paginator is a select plus a Pagination stepper. In this
 * fixture that is about 320px wide on page 1 and 440px on the page with the
 * widest stepper, and it grows with the digits in the page numbers. The outer
 * footer row wrapped, but the row holding those two controls did not, so a Table
 * in a container narrower than that (a Modal at phone width) clipped its own
 * footer under `.table-container`'s overflow: Next was 0px visible at a 288px
 * host and could not be clicked.
 *
 * The fixture is a plain element of a stated width around a Table, so the width
 * the paginator has to live inside is the input here, not the docs layout's.
 * Eight pages of ten rows, so page 4 renders the widest stepper (Prev, 1, ...,
 * 3, 4, 5, ..., 8, Next).
 */
test.use({ viewport: { width: 1280, height: 1000 } });

const NARROW_HOST_WIDTHS = [400, 340, 320, 288, 260, 240] as const;
const START_PAGES = [1, 4] as const;

const open = async (
  page: Page,
  options: { width: number; startPage?: number; variant?: string }
): Promise<void> => {
  const { width, startPage = 1, variant = 'builtin' } = options;
  await page.goto(
    `${fixtureBaseURL}/table-paginator/?width=${width}&variant=${variant}&page=${startPage}`
  );
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

type ControlReport = { name: string; outsideHost: boolean; hittable: boolean };

/**
 * Where every interactive paginator control actually is, measured against the
 * host rather than the footer: the host is what a reader sees. `hittable` is the
 * real hit test at the control's centre, which a real pointer click needs and a
 * clipped control fails even when its box is partly visible. Playwright's
 * `locator.click()` is not that test: it scrolls a clipped control into view
 * first, so it succeeds on a control a reader cannot reach.
 */
const reportControls = async (page: Page, controls: Locator): Promise<ControlReport[]> => {
  const hostBox = await page.getByTestId('paginator-host').boundingBox();
  if (hostBox === null) {
    throw new Error('the paginator host is not rendered');
  }
  return controls.evaluateAll(
    (elements, host) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return {
          name: element.getAttribute('aria-label') ?? 'page-size select',
          outsideHost: rect.left < host.x - 0.5 || rect.right > host.x + host.width + 0.5,
          hittable: hit !== null && (hit === element || element.contains(hit))
        };
      }),
    hostBox
  );
};

const paginatorControls = (page: Page): Locator =>
  page
    .getByTestId('paginator')
    .locator('[data-pw="paginator-page-size"], nav.pagination .page-button');

for (const startPage of START_PAGES) {
  for (const width of NARROW_HOST_WIDTHS) {
    test(`page ${startPage} in a ${width}px host: every control stays inside it and Next works`, async ({
      page
    }) => {
      await open(page, { width, startPage });

      const reports = await reportControls(page, paginatorControls(page));
      expect(reports.length).toBeGreaterThanOrEqual(5);
      expect(reports.filter((report) => report.outsideHost).map((report) => report.name)).toEqual(
        []
      );
      expect(reports.filter((report) => !report.hittable).map((report) => report.name)).toEqual([]);

      // Nothing is hidden behind the container's overflow either.
      const container = page.getByTestId('paginator-table');
      const overflow = await container.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

      const range = page.getByTestId('paginator-table-paginator-range');
      const before = await range.textContent();
      const nextBox = await page.getByRole('button', { name: 'Next page' }).boundingBox();
      if (nextBox === null) {
        throw new Error('Next page is not rendered');
      }
      await page.mouse.click(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2);
      await expect(range).not.toHaveText(before ?? '');
      await expect(range).toHaveText(startPage === 1 ? '11-20 of 80' : '41-50 of 80');
    });
  }
}

test('with the page-size selector suppressed the stepper still stays inside a 240px host', async ({
  page
}) => {
  await open(page, { width: 240, startPage: 4, variant: 'no-size' });

  const reports = await reportControls(page, paginatorControls(page));
  expect(reports.length).toBeGreaterThanOrEqual(5);
  expect(reports.filter((report) => report.outsideHost).map((report) => report.name)).toEqual([]);
  expect(reports.filter((report) => !report.hittable).map((report) => report.name)).toEqual([]);
});

test('when only the select has to move, it wraps above the stepper and the stepper stays whole', async ({
  page
}) => {
  // 400px leaves a 368px footer: the stepper (356px) fits on a line of its own,
  // the select plus the stepper (440px) do not. Wrapping the controls row is
  // what keeps the stepper in one piece; wrapping only the stepper would split
  // it beside the select instead.
  await open(page, { width: 400, startPage: 4 });

  const rows = await page.evaluate(() => {
    const footer = document.querySelector('.table-paginator');
    const select = footer?.querySelector('.table-paginator-size');
    return {
      selectBottom: select?.getBoundingClientRect().bottom ?? NaN,
      selectLeft: select?.getBoundingClientRect().left ?? NaN,
      stepperLeft: footer?.querySelector('.prev-button')?.getBoundingClientRect().left ?? NaN,
      buttons: Array.from(footer?.querySelectorAll('nav.pagination .page-button') ?? []).map(
        (button) => button.getBoundingClientRect().top
      )
    };
  });

  expect(rows.buttons.length).toBe(7);
  expect(new Set(rows.buttons).size).toBe(1);
  // Wholly above, not merely centred a pixel higher: the select is 38px tall
  // beside 36px buttons, so a shared row also puts its top edge slightly higher.
  expect(rows.selectBottom).toBeLessThanOrEqual(rows.buttons[0]);
  // Wrapped lines start-align, as the outer row's wrapped lines do: the select
  // and the stepper begin at the same edge.
  expect(Math.abs(rows.selectLeft - rows.stepperLeft)).toBeLessThan(1);
});

test('a host wide enough for the whole footer keeps range, select and stepper on one row', async ({
  page
}) => {
  await open(page, { width: 900, startPage: 4 });

  const centres = await page.evaluate(() => {
    const centreY = (element: Element | null): number | null => {
      if (element === null) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return rect.y + rect.height / 2;
    };
    const footer = document.querySelector('.table-paginator');
    return {
      range: centreY(footer?.querySelector('.table-paginator-range') ?? null),
      select: centreY(footer?.querySelector('.table-paginator-size') ?? null),
      previous: centreY(footer?.querySelector('.prev-button') ?? null),
      next: centreY(footer?.querySelector('.next-button') ?? null)
    };
  });

  const { range, select, previous, next } = centres;
  if (range === null || select === null || previous === null || next === null) {
    throw new Error('the built-in paginator did not render');
  }
  expect(Math.abs(select - range)).toBeLessThan(2);
  expect(Math.abs(previous - range)).toBeLessThan(2);
  expect(Math.abs(next - range)).toBeLessThan(2);
});
