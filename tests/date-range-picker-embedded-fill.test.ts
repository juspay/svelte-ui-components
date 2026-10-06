import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

const HOST_WIDTH = 300;
const DEFAULT_CELL_SIZE = 36;
const CUSTOM_CELL_SIZE = 44;
const TRACK_TOLERANCE = 1;

type GridMeasurement = {
  calendarWidth: number;
  gridWidth: number;
  gridTracks: number[];
  dayNameTracks: number[];
  weekCellLefts: number[];
  weekCellWidths: number[];
  weekCellHeights: number[];
  dayNameLefts: number[];
};

const measureGrid = (calendar: Locator): Promise<GridMeasurement> =>
  calendar.evaluate((calendarNode) => {
    const grid = calendarNode.querySelector('.grid');
    const dayNames = calendarNode.querySelector('.day-names');
    const weekRow = calendarNode.querySelector('.week');
    if (grid === null || dayNames === null || weekRow === null) {
      throw new Error('calendar is missing its grid, day-name row or first week row');
    }
    const trackWidths = (node: Element): number[] =>
      getComputedStyle(node)
        .gridTemplateColumns.split(' ')
        .map((track) => Number.parseFloat(track));
    // .grid stacks one grid row per week; each date button sits in a gridcell slot in its row.
    const firstWeek = Array.from(weekRow.children).map((slot) => slot.firstElementChild ?? slot);
    return {
      calendarWidth: calendarNode.getBoundingClientRect().width,
      gridWidth: grid.getBoundingClientRect().width,
      gridTracks: trackWidths(weekRow),
      dayNameTracks: trackWidths(dayNames),
      weekCellLefts: firstWeek.map((cell) => cell.getBoundingClientRect().left),
      weekCellWidths: firstWeek.map((cell) => cell.getBoundingClientRect().width),
      weekCellHeights: firstWeek.map((cell) => cell.getBoundingClientRect().height),
      dayNameLefts: Array.from(dayNames.children).map((name) => name.getBoundingClientRect().left)
    };
  });

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const expectWithin = (label: string, actual: number, expected: number, tolerance: number): void => {
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} should be within ${tolerance} of ${expected}`
  ).toBeLessThanOrEqual(tolerance);
};

// The panel is content-box, so its border sits outside the width the host gives it.
const innerWidthOf = (target: Locator): Promise<number> =>
  target.evaluate((node) => node.clientWidth);

const displayOf = (target: Locator): Promise<string> =>
  target.evaluate((node) => getComputedStyle(node).display);

const widthOf = async (target: Locator): Promise<number> => {
  const box = await target.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box.width;
};

const openPicker = async (page: Page, testId: string) => {
  const picker = page.getByTestId(testId);
  await picker.getByRole('button', { name: 'Open date picker' }).click();
  const panel = page.getByTestId(`${testId}-panel`);
  await expect(panel).toBeVisible();
  return { picker, panel, calendar: panel.locator('.drp-calendar-embedded') };
};

const expectFluidGrid = (measurement: GridMeasurement): void => {
  // The columns share the whole grid instead of sitting in a fixed 7 x 36px block.
  expectWithin(
    '.week tracks (sum) vs .grid width',
    sum(measurement.gridTracks),
    measurement.gridWidth,
    TRACK_TOLERANCE
  );
  expect(measurement.gridTracks, '.week track count').toHaveLength(7);
  for (const track of measurement.gridTracks) {
    expect(track, `.week track ${track}px should be wider than the default cell`).toBeGreaterThan(
      DEFAULT_CELL_SIZE
    );
  }
  // The cells then fill those columns, so no gaps open between the days.
  measurement.weekCellWidths.forEach((cellWidth, column) => {
    expectWithin(
      `.cell width in column ${column} vs its .week track`,
      cellWidth,
      measurement.gridTracks[column],
      TRACK_TOLERANCE
    );
  });
  // The width token does not touch the height, which still follows --calendar-cell-size.
  expect(measurement.weekCellHeights, '.cell heights').toEqual(Array(7).fill(DEFAULT_CELL_SIZE));
  // The day-name row uses the same tracks, so each name stays over its day.
  expect(measurement.dayNameTracks, '.day-names track count').toHaveLength(7);
  measurement.dayNameLefts.forEach((nameLeft, column) => {
    expectWithin(
      `.day-name left in column ${column} vs its .cell left`,
      nameLeft,
      measurement.weekCellLefts[column],
      TRACK_TOLERANCE
    );
  });
};

// The columns, the day-name row and the cells all follow --calendar-cell-size
// until a host sets --calendar-grid-columns or --calendar-cell-width.
const expectSquareGrid = (measurement: GridMeasurement, cellSize: number): void => {
  expect(measurement.gridTracks, '.week tracks').toEqual(Array(7).fill(cellSize));
  expect(measurement.dayNameTracks, '.day-names tracks').toEqual(Array(7).fill(cellSize));
  expect(measurement.weekCellWidths, '.cell widths').toEqual(Array(7).fill(cellSize));
  expect(measurement.weekCellHeights, '.cell heights').toEqual(Array(7).fill(cellSize));
};

const expectDefaultGrid = (measurement: GridMeasurement): void => {
  expectSquareGrid(measurement, DEFAULT_CELL_SIZE);
};

test.describe('DateRangePicker + Calendar — embedded fill tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${fixtureBaseURL}/embedded-fill/`);
    await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  });

  test('a token-driven host makes the root, panel and calendar cells fill it', async ({ page }) => {
    const host = page.getByTestId('fill-host');
    expectWithin('fill host width', await widthOf(host), HOST_WIDTH, 0.5);

    const { picker, panel, calendar } = await openPicker(page, 'fill-picker');
    expect(await displayOf(picker), '.drp-root display').toBe('block');
    expectWithin('.drp-root width', await widthOf(picker), HOST_WIDTH, 0.5);
    expectWithin('.drp-panel inner width', await innerWidthOf(panel), HOST_WIDTH, 0.5);

    expectFluidGrid(await measureGrid(calendar));
  });

  test('the picker tokens alone leave the default 36px calendar cells', async ({ page }) => {
    const { picker, panel, calendar } = await openPicker(page, 'fill-picker-tokens');
    expect(await displayOf(picker), '.drp-root display').toBe('block');
    expectWithin('.drp-root width', await widthOf(picker), HOST_WIDTH, 0.5);
    expectWithin('.drp-panel inner width', await innerWidthOf(panel), HOST_WIDTH, 0.5);

    expectDefaultGrid(await measureGrid(calendar));
  });

  test('with no tokens the root stays inline-block and the cells stay 36px', async ({ page }) => {
    const { picker, panel, calendar } = await openPicker(page, 'fill-picker-default');
    expect(await displayOf(picker), '.drp-root display').toBe('inline-block');
    // An inline-block root shrinks to its trigger instead of filling the host.
    expect(await widthOf(picker), '.drp-root width').toBeLessThan(HOST_WIDTH - 50);
    // The default panel keeps its 320px floor and so overflows a 300px host.
    expect(await widthOf(panel), '.drp-panel width').toBeGreaterThan(HOST_WIDTH);

    expectDefaultGrid(await measureGrid(calendar));
  });

  test('a standalone Calendar fills its host when it gets the two grid tokens', async ({
    page
  }) => {
    const calendar = page.getByTestId('fill-calendar');
    await expect(calendar).toBeVisible();
    expectWithin('standalone .calendar width', await widthOf(calendar), HOST_WIDTH, 0.5);

    expectFluidGrid(await measureGrid(calendar));
  });

  test('a default Calendar keeps its 280px box and 36px cells', async ({ page }) => {
    const calendar = page.getByTestId('fill-calendar-default');
    await expect(calendar).toBeVisible();
    const measurement = await measureGrid(calendar);

    expectWithin('default .calendar width', measurement.calendarWidth, 280, 0.5);
    expectDefaultGrid(measurement);
  });

  test('a Calendar that sets --calendar-cell-size sizes its columns, day names and cells from it', async ({
    page
  }) => {
    const calendar = page.getByTestId('fill-calendar-cell-size');
    await expect(calendar).toBeVisible();
    const measurement = await measureGrid(calendar);

    expectWithin('.calendar width', measurement.calendarWidth, 280, 0.5);
    expectSquareGrid(measurement, CUSTOM_CELL_SIZE);
  });
});

test.describe('sui-date-range-picker — embedded fill tokens', () => {
  const FLUID_TOKENS = [
    '--drp-root-display: block',
    '--drp-panel-min-width: 100%',
    '--calendar-width: 100%',
    '--calendar-grid-columns: repeat(7, minmax(0, 1fr))',
    '--calendar-cell-width: 100%'
  ].join('; ');

  const mountPicker = async (page: Page, elementStyle: string): Promise<Locator> => {
    await page.goto('about:blank');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => typeof customElements.get('sui-date-range-picker') === 'function'
    );
    await page.evaluate(
      ({ hostStyle, pickerStyle }) => {
        const host = document.createElement('div');
        host.style.cssText = hostStyle;
        const picker = document.createElement('sui-date-range-picker');
        picker.id = 'wc-picker';
        picker.setAttribute('mode', 'single');
        picker.style.cssText = pickerStyle;
        host.append(picker);
        document.body.append(host);
      },
      { hostStyle: `width: ${HOST_WIDTH}px; ${FLUID_TOKENS}`, pickerStyle: elementStyle }
    );
    const picker = page.locator('#wc-picker');
    await expect(picker.getByRole('button', { name: 'Open date picker' })).toBeVisible();
    return picker;
  };

  test('the host display token lets the element, its root, panel and cells fill the host', async ({
    page
  }) => {
    const picker = await mountPicker(page, '--sui-date-range-picker-display: block');
    expectWithin('sui-date-range-picker width', await widthOf(picker), HOST_WIDTH, 0.5);

    await picker.getByRole('button', { name: 'Open date picker' }).click();
    const panel = picker.getByRole('dialog');
    await expect(panel).toBeVisible();
    expectWithin('.drp-panel inner width', await innerWidthOf(panel), HOST_WIDTH, 0.5);

    expectFluidGrid(await measureGrid(picker.locator('.drp-calendar-embedded')));
  });

  test('without the host display token the element stays inline-block and shrinks to its trigger', async ({
    page
  }) => {
    const picker = await mountPicker(page, '');
    expect(await widthOf(picker), 'sui-date-range-picker width').toBeLessThan(HOST_WIDTH - 50);
  });
});
