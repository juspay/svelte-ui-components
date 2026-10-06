import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ISSUE-003: Calendar declared role="grid" but put date buttons straight under it, with no
// row or gridcell between (axe aria-required-children) and the weekday names outside the
// grid altogether. These specs prove, in each engine, that the rendered grid is a real
// grid > row > columnheader/gridcell tree, that the date controls are named with their
// full date, that selected/current/disabled are carried by ARIA, and that the keyboard and
// month navigation that already worked still do.
//
// Playwright's role locators and aria snapshots are computed from the DOM by Playwright
// itself, so they run identically in Chromium, Firefox and WebKit. The browser's OWN
// accessibility tree is only reachable over CDP, which exists in Chromium alone; the CDP
// test below covers that, and is skipped (not faked) elsewhere.
//
// The demos show the current month, and the clock is deliberately NOT pinned: Playwright's
// fake Date is a function that returns a native Date, so `class SvelteDate extends Date`
// loses its reactive overrides under it and month navigation stops updating. Expected
// names and cell counts are derived from the page's real "today" instead.

test.use({ locale: 'en-US' });

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const longDateFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const longDate = (date: Date): string => longDateFormat.format(date);
const monthLabel = (date: Date): string => monthFormat.format(date);
const pad = (n: number): string => String(n).padStart(2, '0');
const slashDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);
const dayOf = (month: Date, day: number): Date =>
  new Date(month.getFullYear(), month.getMonth(), day);

// Sunday-first weeks, the demos' default. Leading/trailing are the other-month fillers.
const shapeOf = (
  month: Date
): { days: number; leading: number; rows: number; cells: number; trailing: number } => {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const rows = Math.ceil((leading + days) / 7);
  return { days, leading, rows, cells: rows * 7, trailing: rows * 7 - leading - days };
};

type Opened = { calendars: Locator; today: Date; month: Date };

const openCalendars = async (page: Page, theme: 'light' | 'dark' = 'light'): Promise<Opened> => {
  await gotoHydrated(page, '/components/calendar');
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
  const [year, monthIndex, day] = await page.evaluate(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth(), now.getDate()];
  });
  return {
    calendars: page.getByRole('application', { name: 'Calendar' }),
    today: new Date(year, monthIndex, day),
    month: new Date(year, monthIndex, 1)
  };
};

type HierarchyReport = {
  gridChildRoles: string[];
  headerRowChildRoles: string[];
  weekRowChildRoles: string[][];
  buttonParentRoles: string[];
  strayDirectChildren: number;
};

// Reads the DOM parent/child roles, not just role counts: Playwright's getByRole does not
// check that a gridcell actually sits inside a row, which is the exact defect.
const hierarchyOf = (calendar: Locator): Promise<HierarchyReport> =>
  calendar.getByRole('grid').evaluate((grid): HierarchyReport => {
    const roleOf = (el: Element): string => el.getAttribute('role') ?? `<${el.localName}>`;
    const rows = Array.from(grid.children);
    return {
      gridChildRoles: rows.map(roleOf),
      headerRowChildRoles: Array.from(rows[0]?.children ?? []).map(roleOf),
      weekRowChildRoles: rows.slice(1).map((row) => Array.from(row.children).map(roleOf)),
      buttonParentRoles: Array.from(grid.querySelectorAll('button')).map((b) =>
        b.parentElement ? roleOf(b.parentElement) : 'none'
      ),
      strayDirectChildren: rows.filter((el) => el.localName === 'button' || el.localName === 'span')
        .length
    };
  });

const selectedDayNames = (calendar: Locator): Promise<string[]> =>
  calendar
    .getByRole('gridcell', { selected: true })
    .evaluateAll((els) =>
      els.map((el) => el.querySelector('button')?.getAttribute('aria-label') ?? '')
    );

const isWholeTree = (report: HierarchyReport, weekRows: number): boolean =>
  report.gridChildRoles.length === weekRows + 1 &&
  report.gridChildRoles.every((role) => role === 'row') &&
  report.headerRowChildRoles.length === 7 &&
  report.headerRowChildRoles.every((role) => role === 'columnheader') &&
  report.weekRowChildRoles.length === weekRows &&
  report.weekRowChildRoles.every(
    (cells) => cells.length === 7 && cells.every((r) => r === 'gridcell')
  );

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Calendar ARIA grid structure (${theme} theme)`, () => {
    test('all three demonstrated grids are grid > row > columnheader/gridcell trees', async ({
      page
    }) => {
      const { calendars, month } = await openCalendars(page, theme);
      const shape = shapeOf(month);
      await expect(calendars).toHaveCount(3);

      for (let i = 0; i < 3; i++) {
        const calendar = calendars.nth(i);
        await expect(calendar.getByRole('grid')).toHaveCount(1);

        const report = await hierarchyOf(calendar);
        expect(report.gridChildRoles, `calendar ${i + 1}: grid owns only rows`).toEqual(
          Array(shape.rows + 1).fill('row')
        );
        expect(report.headerRowChildRoles).toEqual(Array(7).fill('columnheader'));
        expect(report.weekRowChildRoles).toEqual(Array(shape.rows).fill(Array(7).fill('gridcell')));
        expect(report.buttonParentRoles, 'every date button sits inside a gridcell').toEqual(
          Array(shape.days).fill('gridcell')
        );
        expect(report.strayDirectChildren).toBe(0);

        // The same through role queries, which is how an assistive-technology user
        // (or a test) finds them.
        await expect(calendar.getByRole('row')).toHaveCount(shape.rows + 1);
        await expect(calendar.getByRole('columnheader')).toHaveCount(7);
        await expect(calendar.getByRole('gridcell')).toHaveCount(shape.cells);
        for (const [index, weekday] of WEEKDAYS.entries()) {
          await expect(calendar.getByRole('columnheader').nth(index)).toHaveAccessibleName(weekday);
        }
      }
    });

    test('each grid is named by its visible month and each date control by its full date', async ({
      page
    }) => {
      const { calendars, month } = await openCalendars(page, theme);
      const { days } = shapeOf(month);

      for (let i = 0; i < 3; i++) {
        const calendar = calendars.nth(i);
        await expect(calendar.getByRole('grid', { name: monthLabel(month) })).toBeVisible();
        await expect(
          calendar.getByRole('button', { name: longDate(dayOf(month, 1)), exact: true })
        ).toBeVisible();
        await expect(
          calendar.getByRole('button', { name: longDate(dayOf(month, days)), exact: true })
        ).toBeVisible();
      }
    });

    test('the first demo grid exposes the expected tree in the aria snapshot', async ({ page }) => {
      const { calendars, month } = await openCalendars(page, theme);
      const { leading } = shapeOf(month);
      const grid = calendars.first().getByRole('grid');

      const weekRow = (weekIndex: number): string[] => {
        const lines = ['- row:'];
        for (let col = 0; col < 7; col++) {
          const date = dayOf(month, 1 - leading + weekIndex * 7 + col);
          const name = longDate(date);
          if (date.getMonth() !== month.getMonth()) {
            lines.push(`  - gridcell "${name}" [disabled]`);
          } else {
            lines.push(`  - gridcell "${name}":`, `    - button "${name}"`);
          }
        }
        return lines;
      };

      const template = [
        `- grid "${monthLabel(month)}":`,
        '  - row "Sunday Monday Tuesday Wednesday Thursday Friday Saturday":',
        ...WEEKDAYS.map((day) => `    - columnheader "${day}"`),
        ...weekRow(0).map((line) => `  ${line}`),
        ...weekRow(1).map((line) => `  ${line}`)
      ].join('\n');

      await expect(grid).toMatchAriaSnapshot(template);
    });
  });
}

test.describe('Calendar ARIA states', () => {
  test('a selected day is aria-selected on its gridcell, alone, and follows the selection', async ({
    page
  }) => {
    const { calendars, month } = await openCalendars(page);
    const calendar = calendars.first();
    const fourth = dayOf(month, 4);
    const fifth = dayOf(month, 5);

    expect(await selectedDayNames(calendar)).toEqual([]);

    await calendar.getByRole('button', { name: longDate(fourth) }).click();
    expect(await selectedDayNames(calendar)).toEqual([longDate(fourth)]);
    await expect(
      calendar.getByRole('gridcell', { name: longDate(fourth), selected: true })
    ).toHaveCount(1);

    await calendar.getByRole('button', { name: longDate(fifth) }).click();
    expect(await selectedDayNames(calendar)).toEqual([longDate(fifth)]);
    await expect(page.getByText(`Selected: ${slashDate(fifth)}`)).toBeVisible();

    await expect(calendar.getByRole('grid')).not.toHaveAttribute('aria-multiselectable', /.*/);
  });

  test('today carries aria-current=date on its date control and no other cell does', async ({
    page
  }) => {
    const { calendars, today } = await openCalendars(page);

    for (let i = 0; i < 3; i++) {
      const current = calendars.nth(i).locator('[aria-current]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute('aria-current', 'date');
      await expect(current).toHaveAccessibleName(longDate(today));
    }
  });

  test('disabled days are aria-disabled on the gridcell and natively disabled on the button', async ({
    page
  }) => {
    const { calendars, month } = await openCalendars(page);
    const { leading, trailing } = shapeOf(month);
    const disabledDemo = page.getByTestId('calendar-disabled-dates-demo');
    await expect(disabledDemo).toBeVisible();

    for (const day of [10, 12, 15]) {
      const name = longDate(dayOf(month, day));
      await expect(disabledDemo.getByRole('gridcell', { name })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      await expect(disabledDemo.getByRole('button', { name })).toBeDisabled();
    }
    const sixteenth = longDate(dayOf(month, 16));
    await expect(disabledDemo.getByRole('gridcell', { name: sixteenth })).not.toHaveAttribute(
      'aria-disabled',
      /.*/
    );
    await expect(disabledDemo.getByRole('button', { name: sixteenth })).toBeEnabled();

    // The other-month filler days complete the rows and are disabled, dated cells too --
    // but not buttons, so there is nothing to focus or click in them.
    if (leading > 0) {
      const filler = disabledDemo.getByRole('gridcell', {
        name: longDate(dayOf(month, 0)),
        exact: true
      });
      await expect(filler).toHaveAttribute('aria-disabled', 'true');
      await expect(filler.getByRole('button')).toHaveCount(0);
    }

    // The first demo has no disabled dates, so only filler days are disabled there.
    await expect(calendars.first().locator('[role="gridcell"][aria-disabled="true"]')).toHaveCount(
      leading + trailing
    );
  });

  test('range mode marks start, end and the days between selected on a multiselectable grid', async ({
    page
  }) => {
    const { calendars, month } = await openCalendars(page);
    const calendar = calendars.nth(1);
    const start = dayOf(month, 8);
    const end = dayOf(month, 12);

    await expect(calendar.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');

    await calendar.getByRole('button', { name: longDate(start) }).click();
    expect(await selectedDayNames(calendar)).toEqual([longDate(start)]);

    await calendar.getByRole('button', { name: longDate(end) }).click();
    expect(await selectedDayNames(calendar)).toEqual(
      [8, 9, 10, 11, 12].map((day) => longDate(dayOf(month, day)))
    );
    await expect(page.getByText(`Range: ${slashDate(start)} — ${slashDate(end)}`)).toBeVisible();
  });
});

test.describe('Calendar keyboard and month navigation are unchanged by the grid structure', () => {
  test('Tab lands on one date control; arrows, Enter and Space behave as before', async ({
    page
  }) => {
    const { calendars, today } = await openCalendars(page);
    const calendar = calendars.first();
    const named = (date: Date): Locator => calendar.getByRole('button', { name: longDate(date) });

    await calendar.getByRole('button', { name: 'Next month' }).focus();
    await page.keyboard.press('Tab');
    await expect(named(today)).toBeFocused();

    // Exactly one date control is in the tab order, the roving-tabindex contract.
    await expect(calendar.locator('button[data-day][tabindex="0"]')).toHaveCount(1);

    await page.keyboard.press('ArrowLeft');
    await expect(named(addDays(today, -1))).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(named(addDays(today, 6))).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(named(addDays(today, -1))).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(named(today)).toBeFocused();

    await page.keyboard.press('Enter');
    expect(await selectedDayNames(calendar)).toEqual([longDate(today)]);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    expect(await selectedDayNames(calendar)).toEqual([longDate(addDays(today, 1))]);

    // Tab leaves the grid (it is one stop) rather than stepping through the days.
    await page.keyboard.press('Tab');
    await expect(calendars.nth(1).getByRole('button', { name: 'Previous month' })).toBeFocused();
  });

  test('arrow keys skip a disabled run and cross a month boundary, in the disabled-dates demo', async ({
    page
  }) => {
    const { month } = await openCalendars(page);
    const { days } = shapeOf(month);
    const demo = page.getByTestId('calendar-disabled-dates-demo');
    const named = (date: Date): Locator => demo.getByRole('button', { name: longDate(date) });

    // The 10th-15th are disabled every month, so 9 -> 16 and back.
    await named(dayOf(month, 9)).click();
    await page.keyboard.press('ArrowRight');
    await expect(named(dayOf(month, 16))).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(named(dayOf(month, 9))).toBeFocused();

    await named(dayOf(month, days)).click();
    await page.keyboard.press('ArrowRight');
    const nextMonth = addMonths(month, 1);
    await expect(demo.getByRole('grid', { name: monthLabel(nextMonth) })).toBeVisible();
    await expect(named(dayOf(nextMonth, 1))).toBeFocused();
  });

  test('month navigation rebuilds a valid grid and renames it', async ({ page }) => {
    const { calendars, month } = await openCalendars(page);
    const calendar = calendars.first();

    const next = addMonths(month, 1);
    const nextShape = shapeOf(next);
    await calendar.getByRole('button', { name: 'Next month' }).click();
    await expect(calendar.getByRole('grid', { name: monthLabel(next) })).toBeVisible();
    await expect(calendar.getByRole('row')).toHaveCount(nextShape.rows + 1);
    await expect(calendar.getByRole('gridcell')).toHaveCount(nextShape.cells);
    expect(isWholeTree(await hierarchyOf(calendar), nextShape.rows)).toBe(true);
    expect((await hierarchyOf(calendar)).buttonParentRoles).toEqual(
      Array(nextShape.days).fill('gridcell')
    );
    // The month heading is the live region that announces the change.
    await expect(calendar.getByText(monthLabel(next), { exact: true })).toHaveAttribute(
      'aria-live',
      'polite'
    );

    const previous = addMonths(month, -1);
    const previousShape = shapeOf(previous);
    await calendar.getByRole('button', { name: 'Previous month' }).click();
    await calendar.getByRole('button', { name: 'Previous month' }).click();
    await expect(calendar.getByRole('grid', { name: monthLabel(previous) })).toBeVisible();
    await expect(
      calendar.getByRole('button', { name: longDate(dayOf(previous, 1)), exact: true })
    ).toBeVisible();
    expect(isWholeTree(await hierarchyOf(calendar), previousShape.rows)).toBe(true);
  });
});

test.describe('Calendar in the browser accessibility tree (Chromium CDP)', () => {
  type AxValue = { value?: unknown };
  type AxNode = {
    nodeId: string;
    ignored?: boolean;
    role?: AxValue;
    name?: AxValue;
    childIds?: string[];
    properties?: { name: string; value: AxValue }[];
  };
  type AxSummary = {
    role: string;
    name: string;
    selected?: unknown;
    disabled?: unknown;
    multiselectable?: unknown;
    children: AxSummary[];
  };

  test('grid > row > columnheader/gridcell > button is what the browser itself exposes', async ({
    page,
    context,
    browserName
  }) => {
    test.skip(
      browserName !== 'chromium',
      'CDP Accessibility.getFullAXTree exists only in Chromium; Firefox and WebKit are covered by the aria-snapshot and role tests above, computed by Playwright from the DOM.'
    );

    const { calendars, month } = await openCalendars(page);
    const shape = shapeOf(month);
    const fourth = dayOf(month, 4);
    await calendars
      .first()
      .getByRole('button', { name: longDate(fourth) })
      .click();

    const client = await context.newCDPSession(page);
    await client.send('Accessibility.enable');
    const { nodes }: { nodes: AxNode[] } = await client.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const prop = (node: AxNode, name: string): unknown =>
      node.properties?.find((p) => p.name === name)?.value.value;

    // An ignored node is not in the tree an assistive technology walks; its children
    // belong to its nearest exposed ancestor.
    const exposedChildren = (node: AxNode): AxNode[] =>
      (node.childIds ?? []).flatMap((id) => {
        const child = byId.get(id);
        if (!child) {
          return [];
        }
        return child.ignored === true ? exposedChildren(child) : [child];
      });
    const summarize = (node: AxNode): AxSummary => ({
      role: String(node.role?.value),
      name: String(node.name?.value ?? ''),
      selected: prop(node, 'selected'),
      disabled: prop(node, 'disabled'),
      multiselectable: prop(node, 'multiselectable'),
      children: exposedChildren(node).map(summarize)
    });

    const grids = nodes
      .filter((node) => node.ignored !== true && node.role?.value === 'grid')
      .map(summarize);
    expect(grids).toHaveLength(3);
    // Only the range demo's grid is multiselectable in the browser's own tree.
    expect(grids.map((grid) => grid.multiselectable === true)).toEqual([false, true, false]);

    for (const grid of grids) {
      expect(grid.name).toBe(monthLabel(month));
      expect(grid.children.map((row) => row.role)).toEqual(Array(shape.rows + 1).fill('row'));

      const [header, ...weeks] = grid.children;
      expect(header.children.map((cell) => cell.role)).toEqual(Array(7).fill('columnheader'));
      expect(header.children.map((cell) => cell.name)).toEqual(WEEKDAYS);

      for (const week of weeks) {
        expect(week.children.map((cell) => cell.role)).toEqual(Array(7).fill('gridcell'));
      }
      const cells = weeks.flatMap((week) => week.children);
      expect(cells).toHaveLength(shape.cells);

      const dated = cells.filter((cell) => cell.children.some((child) => child.role === 'button'));
      expect(dated).toHaveLength(shape.days);
      for (const cell of dated) {
        const button = cell.children.find((child) => child.role === 'button');
        expect(button?.name).toMatch(/^\w+day, \w+ \d{1,2}, \d{4}$/);
      }

      // The other-month fillers are exposed as disabled cells with full dates.
      const filler = cells.filter((cell) => !cell.children.some((c) => c.role === 'button'));
      expect(filler).toHaveLength(shape.leading + shape.trailing);
      for (const cell of filler) {
        expect(cell.disabled).toBe(true);
        expect(cell.name).toMatch(/^\w+day, \w+ \d{1,2}, \d{4}$/);
      }
    }

    // State reaches the browser's tree: the clicked day is a selected gridcell. (CDP has
    // no property for aria-current; that attribute is asserted from the DOM above.)
    const selected = grids[0].children
      .flatMap((row) => row.children)
      .filter((cell) => cell.selected === true);
    expect(selected.map((cell) => cell.name)).toEqual([longDate(fourth)]);

    await client.detach();
  });
});

test.describe('sui-calendar exposes the same grid through its shadow root', () => {
  test('rows, cells and the heading id that names the grid all resolve inside the shadow root', async ({
    page
  }) => {
    await page.goto('/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => Boolean(customElements.get('sui-calendar')));

    await page.evaluate(() => {
      for (const month of [5, 6]) {
        const el = document.createElement('sui-calendar') as HTMLElement & { initialMonth: Date };
        el.setAttribute('locale', 'en-US');
        el.initialMonth = new Date(2024, month, 1);
        document.body.append(el);
      }
    });
    const hosts = page.locator('sui-calendar');
    await expect(hosts).toHaveCount(2);
    await expect(hosts.first().getByRole('grid', { name: 'June 2024' })).toBeVisible();
    await expect(hosts.nth(1).getByRole('grid', { name: 'July 2024' })).toBeVisible();
    await expect(
      hosts.first().getByRole('button', { name: 'Saturday, June 15, 2024', exact: true })
    ).toBeVisible();

    const report = await page.evaluate(() =>
      Array.from(document.querySelectorAll('sui-calendar')).map((host) => {
        const root = host.shadowRoot;
        const grid = root?.querySelector('[role="grid"]');
        const labelledby = grid?.getAttribute('aria-labelledby') ?? '';
        const roleOf = (el: Element): string => el.getAttribute('role') ?? `<${el.localName}>`;
        const rows = Array.from(grid?.children ?? []);
        return {
          labelledby,
          resolvedHeading: root?.getElementById(labelledby)?.textContent?.trim() ?? null,
          resolvedFromDocument: document.getElementById(labelledby) !== null,
          rowRoles: rows.map(roleOf),
          weekCellRoles: rows.slice(1).map((row) => Array.from(row.children).map(roleOf)),
          headerRoles: Array.from(rows[0]?.children ?? []).map(roleOf)
        };
      })
    );

    expect(report[0].resolvedHeading).toBe('June 2024');
    expect(report[1].resolvedHeading).toBe('July 2024');
    expect(report[0].labelledby).not.toBe(report[1].labelledby);
    for (const entry of report) {
      expect(entry.resolvedFromDocument, 'the id lives in the shadow root, not the page').toBe(
        false
      );
      expect(entry.headerRoles).toEqual(Array(7).fill('columnheader'));
      expect(entry.rowRoles.every((role) => role === 'row')).toBe(true);
      expect(entry.weekCellRoles.every((cells) => cells.every((role) => role === 'gridcell'))).toBe(
        true
      );
    }
  });
});

test.describe('DateRangePicker embeds Calendar grids that stay valid', () => {
  test('both months of the dual picker are named grids of rows and cells, and picking a day works', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/date-range-picker');

    const picker = page.getByTestId('drp-range-demo');
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    const panel = page.getByTestId('drp-range-demo-panel');
    await expect(panel).toBeVisible();

    const grids = panel.getByRole('grid');
    await expect(grids).toHaveCount(2);

    // Dual mode hides each Calendar's own heading with display:none; aria-labelledby
    // still resolves to it, so each month's grid keeps its name.
    const names = await grids.evaluateAll((els) =>
      els.map((el) => {
        const heading = document.getElementById(el.getAttribute('aria-labelledby') ?? '');
        return heading?.textContent?.trim() ?? '';
      })
    );
    expect(names[0]).toMatch(/^[A-Z]\w+ \d{4}$/);
    expect(names[1]).toMatch(/^[A-Z]\w+ \d{4}$/);
    expect(names[0]).not.toBe(names[1]);
    await expect(grids.first()).toHaveAccessibleName(names[0]);
    await expect(grids.nth(1)).toHaveAccessibleName(names[1]);

    for (let i = 0; i < 2; i++) {
      const report = await hierarchyOf(panel.getByRole('application', { name: 'Calendar' }).nth(i));
      expect(report.gridChildRoles.every((role) => role === 'row')).toBe(true);
      expect(report.headerRowChildRoles).toEqual(Array(7).fill('columnheader'));
      expect(
        report.weekRowChildRoles.every((cells) => cells.every((role) => role === 'gridcell'))
      ).toBe(true);
    }

    // The demo caps selectable dates, so pick the first day that is actually enabled
    // rather than assuming one; the picked day becomes the one selected gridcell.
    const first = grids.first();
    const target = first.locator('button[data-day]:enabled').first();
    const label = await target.getAttribute('aria-label');
    expect(label).toMatch(/^\w+day, \w+ \d{1,2}, \d{4}$/);
    await target.click();
    await expect(first.getByRole('gridcell', { name: label ?? '', selected: true })).toHaveCount(1);
    await expect(first.getByRole('gridcell', { selected: true })).toHaveCount(1);
  });
});
