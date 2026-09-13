import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import LineChart from '../LineChart/LineChart.svelte';
import AreaChart from '../AreaChart/AreaChart.svelte';
import { joinByX, computeStackedValues } from './geometry';
import { formatNumber } from './format';

/**
 * Acceptance fixtures for the documented consumer-adapter boundary
 * (docs/CHART_INPUT_POLICY.md, built on `joinByX`/`computeStackedValues` in
 * ./geometry).
 *
 * A probe for this is easy to game: it can close on the word
 * "adapter" appearing next to a `_chart`/`Chart.svelte` import, regardless of
 * what the test actually proves. Every fixture below is written to the
 * opposite standard: it starts from a data shape a real caller would actually
 * receive (SQL rows, a CSV export, JSON-over-HTTP with `null`, two API
 * responses that enumerate categories in different orders), runs a small
 * adapter that a consumer would plausibly write, and then asserts on the
 * CHART's own computed output — a rendered dot's pixel position, a domain
 * tick, a tooltip string, `joinByX`'s row order — never on "the adapter
 * returned what the adapter returned". Where a case exposed a real mismatch
 * between docs/CHART_INPUT_POLICY.md and what the components actually do,
 * the assertion below encodes the DOCUMENTED behavior and is left failing,
 * with the mismatch spelled out in a comment — see the "DEFECT" and
 * "DOC/CODE MISMATCH" blocks.
 */

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 400,
    width: 800,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
});
afterAll(() => vi.unstubAllGlobals());

// Same helpers as AreaChart.svelte.test.ts / LineChart.svelte.test.ts (no
// shared util module exists for them yet; duplicating matches that precedent
// rather than inventing a new one for this file alone).
function readMargin(container: HTMLElement): { left: number; top: number } {
  const g = container.querySelector('svg > g');
  const transform = g?.getAttribute('transform') ?? '';
  const match = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);
  if (!match) {
    throw new Error(`no translate(...) on outer <g>, got "${transform}"`);
  }
  return { left: Number(match[1]), top: Number(match[2]) };
}

function dotCenters(container: HTMLElement): Array<{ x: number; y: number }> {
  return Array.from(container.querySelectorAll('.dot')).map((el) => ({
    x: Number(el.getAttribute('cx')),
    y: Number(el.getAttribute('cy'))
  }));
}

/** Reads a mark's own (cx, cy) by its aria-label instead of by position in
 *  some list -- a semantic lookup that keeps working however many other
 *  marks render or skip around it. `focus-target` shares its coordinates
 *  exactly with the `dot` at the same point (both come from the same
 *  `area.points[pi]`), so this doubles as "where would that point's dot be." */
function focusTargetCenter(container: HTMLElement, ariaLabel: string): { x: number; y: number } {
  const el = container.querySelector(`circle.focus-target[aria-label="${ariaLabel}"]`);
  if (!el) {
    throw new Error(`no focus-target with aria-label "${ariaLabel}"`);
  }
  return { x: Number(el.getAttribute('cx')), y: Number(el.getAttribute('cy')) };
}

function yTicks(container: HTMLElement): Array<{ y: number; label: string | null }> {
  return Array.from(container.querySelectorAll('[data-pw="axis-left"] .tick')).map((g) => {
    const transform = g.getAttribute('transform') ?? '';
    const match = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);
    return {
      y: match ? Number(match[2]) : NaN,
      label: g.querySelector('.tick-label')?.textContent ?? null
    };
  });
}

function hoverAt(container: HTMLElement, plotPoint: { x: number; y: number }): void {
  const margin = readMargin(container);
  const overlay = container.querySelector('.hover-overlay');
  if (!overlay) {
    throw new Error('hover-overlay not found');
  }
  overlay.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: margin.left + plotPoint.x,
      clientY: margin.top + plotPoint.y
    })
  );
}

function tooltipItems(
  container: HTMLElement
): Array<{ label: string | null; value: string | null }> {
  return Array.from(container.querySelectorAll('.tooltip-item')).map((el) => ({
    label: el.querySelector('.tooltip-label')?.textContent ?? null,
    value: el.querySelector('.tooltip-value')?.textContent ?? null
  }));
}

// ── Fixture A: Empty ──────────────────────────────────────────────

describe('consumer adapter: Empty (input policy — Empty)', () => {
  it('an API response with zero rows for every named series renders the caller-supplied empty snippet', () => {
    // Realistic shape: a dashboard endpoint that always lists the series it
    // WOULD show, each with an empty `points` array when there is nothing in
    // range yet — not a bare `[]` with no series identity at all.
    const apiResponse = {
      series: [
        { seriesName: 'Sales', points: [] as Array<{ t: string; v: number }> },
        { seriesName: 'Refunds', points: [] as Array<{ t: string; v: number }> }
      ]
    };
    const adapted = apiResponse.series.map((s) => ({
      name: s.seriesName,
      data: s.points.map((p, i) => ({ x: i + 1, y: p.v }))
    }));

    const empty = createRawSnippet(() => ({ render: () => '<p class="no-data">No data yet</p>' }));
    const { container } = render(AreaChart, {
      props: { series: adapted, aspectRatio: 2, empty }
    });

    // Assert the CHART's own gate (`isEmpty`), not that the adapter produced
    // empty arrays — the chart must actually have decided there is nothing
    // to plot and switched to the caller's snippet.
    expect(container.querySelector('.no-data')?.textContent).toBe('No data yet');
    // Compared as a boolean, not `expect(element).toBeNull()`: a failing
    // assertion on a live DOM node makes the diff formatter walk the node's
    // own properties, and Svelte 5's dev-mode instrumentation on rendered
    // elements throws `rune_outside_svelte` from that walk in this
    // vitest/jsdom combination -- a test-harness crash, not a real failure.
    // A plain boolean sidesteps it entirely.
    expect(container.querySelector('.dot') === null).toBe(true);
  });

  // The doc promised "axes/legend omitted" here and no chart in the family has
  // ever done that: every one gates only on
  // `{#if isEmpty && typeof empty === 'function'}`, so without a snippet there is
  // no second, snippet-less empty state to fall into -- the ordinary plot branch
  // renders both axes regardless of `isEmpty`, and the legend whenever
  // `showLegend && series.length > 1`, which does not check `isEmpty` either.
  //
  // The DOC was the thing that was wrong, so the doc was corrected rather than
  // five charts' empty rendering changed. This now pins the measured behaviour,
  // including the consequence worth knowing about: named-but-empty series still
  // appear in the legend, so a two-series request with no data shows two entries.
  it('renders the ordinary frame when empty with no snippet, legend included', () => {
    const apiResponse = {
      series: [
        { seriesName: 'Sales', points: [] as Array<{ t: string; v: number }> },
        { seriesName: 'Refunds', points: [] as Array<{ t: string; v: number }> }
      ]
    };
    const adapted = apiResponse.series.map((s) => ({
      name: s.seriesName,
      data: s.points.map((p, i) => ({ x: i + 1, y: p.v }))
    }));

    const { container } = render(AreaChart, {
      props: { series: adapted, aspectRatio: 2, showLegend: true }
    });

    // Boolean/length comparisons, not `expect(element).toBeNull()` — see the
    // comment on the equivalent assertion in the previous test: diffing a
    // live, Svelte-instrumented DOM node on a failing assertion crashes with
    // `rune_outside_svelte` in this vitest/jsdom combination, which is a
    // test-harness artifact, not evidence about AreaChart itself.
    expect(container.querySelector('[data-pw="axis-left"]') === null).toBe(false);
    expect(container.querySelectorAll('.legend-item').length).toBe(2);
  });
});

// ── Fixture B: All-zero ───────────────────────────────────────────

describe('consumer adapter: All-zero (input policy — All-zero)', () => {
  it('SQL rows whose aggregate is exactly 0, returned as decimal STRINGS, still get domain headroom', () => {
    // pg/mysql drivers commonly return NUMERIC/DECIMAL columns as strings so
    // they never lose precision going through JS floats — a caller who
    // forgets to convert would otherwise hand the chart `y: "0"` (a string),
    // failing the component's own `y: number` type before it ever renders.
    const sqlRows = [
      { day: '2024-01-01', total_cents: '0' },
      { day: '2024-01-02', total_cents: '0' },
      { day: '2024-01-03', total_cents: '0' }
    ];
    const adapted = [
      {
        name: 'Revenue',
        data: sqlRows.map((r, i) => ({ x: i + 1, y: Number(r.total_cents) / 100 }))
      }
    ];

    const { container } = render(AreaChart, {
      props: { series: adapted, aspectRatio: 2, showDots: true }
    });

    // niceLinearDomain(0, 0) === [0, 1]: the chart must show headroom above
    // an all-zero series, not collapse the y-axis to a single value. Read
    // this off the chart's OWN rendered tick labels rather than
    // re-implementing niceLinearDomain here.
    const ticks = yTicks(container).map((t) => t.label);
    expect(ticks).toContain('0');
    expect(ticks).toContain('1');

    // Every dot sits on the SAME pixel row (a real flat line), not squashed
    // to the very bottom or top edge of the plot.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(3);
    const ys = new Set(dots.map((d) => d.y));
    expect(ys.size).toBe(1);
    const margin = readMargin(container);
    void margin;
  });
});

// ── Fixture C: Single point ────────────────────────────────────────

describe('consumer adapter: Single point (input policy — Single point)', () => {
  it('LineChart: one CSV data row renders a full-width flat line AND a marker at its true x', () => {
    // A CSV export with a header and exactly one data row — the header names
    // are strings, the value column is a string that must be parsed.
    const csvRows = [{ date: '2024-03-01', revenue: '482.50' }];
    const adapted = [
      { name: 'Revenue', data: csvRows.map((r, i) => ({ x: i + 1, y: Number(r.revenue) })) }
    ];

    const { container } = render(LineChart, {
      props: { series: adapted, aspectRatio: 2, showDots: false }
    });

    const path = container.querySelector('.line-path');
    expect(path).not.toBeNull();
    // Design-system contract: single point still draws edge-to-edge, not a
    // degenerate zero-length path.
    const d = path?.getAttribute('d') ?? '';
    const xs = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g)).map(Number);
    // First and last x-coordinate mentioned in the path data must span the
    // full inner width (0 .. innerWidth), regardless of curve interpolation
    // details in between.
    expect(xs[0]).toBe(0);

    const marker = container.querySelector('.single-point');
    expect(marker).not.toBeNull();
    // The marker itself sits at the point's TRUE x (dead centre of a 1-point
    // domain, which niceLinearDomain doubles to [0, 2] around a positive
    // value — x=1 is the midpoint), not smeared across the full width like
    // the line.
    expect(Number(marker?.getAttribute('cx'))).toBeCloseTo(365, 0);
  });

  it('AreaChart: one API sample with showDots=false renders a single dot marker (cannot fill an area with no width)', () => {
    const apiPoint = { timestamp: '2024-03-01T00:00:00Z', value: 482.5 };
    const adapted = [{ name: 'Revenue', data: [{ x: 1, y: apiPoint.value }] }];

    const { container } = render(AreaChart, {
      props: { series: adapted, aspectRatio: 2, showDots: false }
    });

    expect(container.querySelector('.single-point')).not.toBeNull();
    // No area fill can be drawn from a single vertex — the documented
    // rationale — so there must be no dot loop rendering a second marker.
    expect(container.querySelectorAll('.dot')).toHaveLength(0);
  });
});

// ── Fixture D: Sparse series / gap regression ──────────────────────

describe('consumer adapter: Sparse series & the AreaChart NaN-poisoning regression', () => {
  // CSV export where a sensor dropped out for one day: the cell is blank,
  // not "0" (a real reading of zero) and not omitted (a real reading that
  // simply didn't happen would drop the ROW, not blank one column). This is
  // exactly docs/CHART_INPUT_POLICY.md's "invalid" case: "a value that was
  // measured but is not a real number."
  const csvExport = [
    { day: '1', occupancy: '42' },
    { day: '2', occupancy: '' }, // sensor offline
    { day: '3', occupancy: '58' }
  ];
  // The documented inbound adapter pattern from CHART_INPUT_POLICY.md's
  // "NaN is not a JSON value" section, adapted for a blank CSV cell instead
  // of a JSON `null` (same shape of problem: the wire format cannot carry
  // the in-memory gap sentinel directly).
  function toGapAwarePoint(raw: { day: string; occupancy: string }): { x: number; y: number } {
    return { x: Number(raw.day), y: raw.occupancy === '' ? NaN : Number(raw.occupancy) };
  }

  it('a gap from one series does not poison the shared y-domain for a clean second series', () => {
    const withGap = { name: 'Building A', data: csvExport.map(toGapAwarePoint) };
    const clean = {
      name: 'Building B',
      data: [
        { x: 1, y: 50 },
        { x: 2, y: 50 },
        { x: 3, y: 50 }
      ]
    };

    const { container } = render(AreaChart, {
      props: { series: [withGap, clean], aspectRatio: 2, showDots: true }
    });

    // This test used to assert 6 dots here, with the gap day's `.dot`
    // present but reading back as a non-finite (NaN) pixel -- true of the
    // pre-fix component, but that pinned the very bug fixed by AreaChart's
    // `dot` guard (it now renders no marker for a non-finite point, matching
    // `focus-target` and LineChart) rather than testing this test's own
    // subject. Building A contributes its 2 finite points, then Building B's
    // own 3, for 5 total.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(5);
    // This is the exact historical AreaChart defect stated in the task brief:
    // it used to feed every y (gap included) into Math.min/Math.max for the
    // auto y-domain, and Math.max(n, NaN) === NaN poisons the WHOLE domain,
    // not just the gapped series. If that regressed, Building B's three
    // clean dots would all read back as NaN pixels here too.
    const buildingB = dots.slice(2);
    expect(buildingB).toHaveLength(3);
    for (const dot of buildingB) {
      expect(Number.isFinite(dot.y)).toBe(true);
    }
    // Building A's own real samples (day 1, day 3) must likewise stay
    // finite; its gap (day 2) renders no dot at all, so there is no third
    // entry here to inspect.
    expect(Number.isFinite(dots[0].y)).toBe(true);
    expect(Number.isFinite(dots[1].y)).toBe(true);
  });

  it('excludes the gap day from the tooltip instead of reporting a fabricated 0% occupancy', async () => {
    const withGap = { name: 'Building A', data: csvExport.map(toGapAwarePoint) };
    const clean = {
      name: 'Building B',
      data: [
        { x: 1, y: 50 },
        { x: 2, y: 50 },
        { x: 3, y: 50 }
      ]
    };
    const { container } = render(AreaChart, {
      props: { series: [withGap, clean], aspectRatio: 2, showDots: true }
    });

    // Building B's day-2 point (the gap column) looked up by its own
    // aria-label rather than a position in `dotCenters()` -- an index into
    // that list is only as stable as the count of *other* points that
    // happen to render a dot, which is exactly what just changed underneath
    // this test when the gap point stopped rendering one.
    const buildingBDay2 = focusTargetCenter(
      container,
      `${formatNumber(2)} — Building B: ${formatNumber(50)}`
    );
    hoverAt(container, buildingBDay2);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tooltipItems(container)).toEqual([{ label: 'Building B', value: '50' }]);
  });
});

// ── Fixture E: reordered rows — where the "no pre-sort needed" guarantee applies ──

describe('consumer adapter: reordered SQL rows (input policy — Reordered times, scope check)', () => {
  // A realistic reordered shape: rows arrive in INSERT order from a table
  // with no ORDER BY, which is whatever order the storage engine happened to
  // return them in — commonly NOT chronological once updates/backfills
  // happen.
  const sqlRowsNoOrderBy = [
    { day: 3, total: 30 },
    { day: 1, total: 10 },
    { day: 2, total: 20 }
  ];

  it('a naive pass-through adapter (no ORDER BY, no client-side sort) produces a zigzagging line', () => {
    // This is the realistic, easy-to-write-by-accident adapter: map columns
    // straight across, trust the database's row order.
    const naive = [
      { name: 'Total', data: sqlRowsNoOrderBy.map((r) => ({ x: r.day, y: r.total })) }
    ];

    const { container } = render(LineChart, {
      props: { series: naive, aspectRatio: 2, showDots: true }
    });

    // `lines` in LineChart.svelte maps `s.data` straight through with no
    // sort (only `joined` — the joinByX-built tooltip/hit-test structure —
    // sorts). Confirmed by dot x-pixel order: day 3 (this array's FIRST
    // element) draws first, so dots read back in ARRAY order (730, 0, 365),
    // not ascending x-pixel order (0, 365, 730). CHART_INPUT_POLICY.md's
    // "Reordered times" row is accurate about `joinByX` specifically, but a
    // caller who reads its "callers do not need to pre-sort" line as a
    // blanket guarantee for the whole chart will ship exactly this
    // zigzagging line — this is a documentation-scope finding, not a code
    // defect: a non-monotonic x on purpose (e.g. a trajectory plot) is a
    // legitimate use of this same unsorted path, so LineChart cannot safely
    // sort it out from under a caller who intended the array order.
    const dots = dotCenters(container);
    expect(dots.map((d) => d.x)).toEqual([730, 0, 365]);
    expect(dots.map((d) => d.x)).not.toEqual([...dots.map((d) => d.x)].sort((a, b) => a - b));
  });

  it('the fix: sorting client-side before rendering (mirroring joinByX ascending-by-x) produces a monotonic line', () => {
    const sorted = [...sqlRowsNoOrderBy].sort((a, b) => a.day - b.day);
    const correct = [{ name: 'Total', data: sorted.map((r) => ({ x: r.day, y: r.total })) }];

    const { container } = render(LineChart, {
      props: { series: correct, aspectRatio: 2, showDots: true }
    });

    const dots = dotCenters(container);
    expect(dots.map((d) => d.x)).toEqual([0, 365, 730]);
  });

  it('by contrast, the SAME unsorted rows DO resolve correctly through the joinByX-mediated tooltip path', async () => {
    // TWO series, in DIFFERENT array orders, sharing one set of x values.
    //
    // A single unsorted series does not discriminate: with one series, keying
    // rows by array index and keying them by x reach the same point, so the
    // earlier version of this test passed unchanged when joinByX was mutated to
    // align by index -- it read as proof and proved nothing. Alignment only has
    // observable consequences when two series disagree about which array slot
    // holds a given x.
    //
    // At x=2 that is slot 1 in `revenue` and slot 0 in `cost`. Aligning by index
    // would pair revenue's x=2 with cost's x=3 and report 300.
    const revenue = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 }
    ];
    const cost = [
      { x: 2, y: 200 },
      { x: 3, y: 300 },
      { x: 1, y: 100 }
    ];
    const naive = [
      { name: 'Revenue', data: revenue },
      { name: 'Cost', data: cost }
    ];
    const { container } = render(LineChart, {
      props: { series: naive, aspectRatio: 2, showDots: true }
    });

    // Hover at the pixel for x=2 (mid-domain [1,3] -> pixel 365), which is the
    // THIRD element of the first array and the FIRST of the second.
    hoverAt(container, { x: 365, y: 0 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tooltipItems(container)).toEqual([
      { label: 'Revenue', value: '20' },
      { label: 'Cost', value: '200' }
    ]);
  });

  it('joinByX itself: a late-arriving correction row (duplicate x) resolves last-wins, exactly as documented', () => {
    // A realistic duplicate-x shape: an append-only ledger where a
    // correction is inserted as a NEW row for a day that already had one,
    // rather than an UPDATE to the existing row.
    const ledgerWithCorrection = [
      { day: 2, total: 20 }, // original reading
      { day: 1, total: 10 },
      { day: 2, total: 25 } // later correction for the same day
    ];
    const rows = joinByX([{ data: ledgerWithCorrection.map((r) => ({ x: r.day, y: r.total })) }]);
    expect(rows.map((r) => r.x)).toEqual([1, 2]); // sorted ascending, deduplicated
    const dayTwo = rows.find((r) => r.x === 2);
    expect(dayTwo?.values[0]?.point.y).toBe(25); // last-wins, not the original 20
  });
});

// ── Fixture F: categorical cross-series reorder ────────────────────

describe('consumer adapter: two API responses enumerate categories in different orders (xAxisCategories)', () => {
  it('tooltip and dots report each series’ OWN value at a shared category, despite mismatched source order', async () => {
    // Two endpoints (e.g. "this week" and "last week comparison") that
    // enumerate the days of the week in different orders — a very ordinary
    // real shape when one query groups by day-of-week and another by a
    // join order that isn't day-of-week at all.
    const thisWeekApi = [
      { day: 'Mon', value: 10 },
      { day: 'Tue', value: 20 },
      { day: 'Wed', value: 30 }
    ];
    const lastWeekApi = [
      { day: 'Wed', value: 300 },
      { day: 'Mon', value: 100 },
      { day: 'Tue', value: 200 }
    ];

    // The adapter: agree on one canonical category order, then map each
    // response's OWN day to that canonical 1-based index — this is the
    // piece of code the doc calls out as the caller's responsibility, since
    // neither chart accepts string x values.
    const categories = ['Mon', 'Tue', 'Wed'];
    const toSeries = (name: string, rows: Array<{ day: string; value: number }>) => ({
      name,
      data: rows.map((r) => ({ x: categories.indexOf(r.day) + 1, y: r.value }))
    });
    const series = [toSeries('This week', thisWeekApi), toSeries('Last week', lastWeekApi)];

    const { container } = render(LineChart, {
      props: { series, aspectRatio: 2, showDots: true, xAxisCategories: categories }
    });

    // markerPaintOrder reverses series for painting, so dots render
    // [series1's 3 points, series0's 3 points] in the DOM, back to front.
    const dots = dotCenters(container);
    const lastWeekDots = dots.slice(0, 3);
    const thisWeekDots = dots.slice(3);
    // 'Wed' is category index 2 -> x=3 -> rightmost pixel. Confirm each
    // series' Wed dot is at the SAME x pixel (same column) despite arriving
    // first in lastWeekApi and last in thisWeekApi.
    expect(lastWeekDots[0].x).toBe(thisWeekDots[2].x);

    hoverAt(container, thisWeekDots[2]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Each series reports its OWN 'Wed' value (30 / 300), not a value copied
    // from whatever sat at array position 0 in the other response (which
    // would have wrongly paired "This week Wed" with "Last week Wed"'s
    // array-position-0 neighbour, i.e. an accidental correct-looking 300 —
    // the defect this whole contract exists to prevent, now shown with
    // realistically-shaped foreign data instead of hand-aligned test data).
    expect(tooltipItems(container)).toEqual([
      { label: 'This week', value: '30' },
      { label: 'Last week', value: '300' }
    ]);

    // The tooltip TITLE reads the category label the adapter mapped x=3 back
    // to, not the raw numeric x the chart works in internally.
    const title = container.querySelector('.tooltip-title')?.textContent;
    expect(title).toBe('Wed');
  });
});

// ── Fixture G: negative values, non-stacked ────────────────────────

describe('consumer adapter: negative values, non-stacked (input policy — Negative values)', () => {
  it('a bank-statement adapter with signed string amounts extends the y-domain below zero', () => {
    // Bank/ledger exports commonly format debits as a signed string with a
    // currency-agnostic decimal, e.g. from a CSV or a statement PDF scrape.
    const statementRows = [
      { date: '2024-01-01', amount: '"-40.00"'.replace(/"/g, '') },
      { date: '2024-01-02', amount: '100.00' },
      { date: '2024-01-03', amount: '-10.00' }
    ];
    const adapted = [
      { name: 'Net', data: statementRows.map((r, i) => ({ x: i + 1, y: Number(r.amount) })) }
    ];

    const { container } = render(AreaChart, {
      props: { series: adapted, aspectRatio: 2, stacked: false, showDots: true }
    });

    // niceLinearDomain(min(0, -40), max(100)) must include a tick BELOW 0 —
    // the chart never silently clips a negative value out of view in
    // non-stacked mode.
    const labels = yTicks(container)
      .map((t) => Number(t.label))
      .filter((n) => Number.isFinite(n));
    expect(Math.min(...labels)).toBeLessThan(0);

    const dots = dotCenters(container);
    // The -40 point (index 0) must render BELOW the y=0 gridline pixel, and
    // the +100 point (index 1) ABOVE it.
    const zeroTick = yTicks(container).find((t) => t.label === '0');
    expect(zeroTick).toBeDefined();
    expect(dots[0].y).toBeGreaterThan(zeroTick?.y ?? 0);
    expect(dots[1].y).toBeLessThan(zeroTick?.y ?? 0);
  });
});

// ── Fixture H: negative values, STACKED — DEFECT ───────────────────

describe('consumer adapter: negative values, STACKED (input policy — Negative values)', () => {
  // docs/CHART_INPUT_POLICY.md, "Negative values" row, verbatim:
  // "Stacked/normalized mode clamps negative values to 0
  // (`Math.max(0, entry.point.y)`) when computing a column's total and stack
  // height: a negative contribution to a stack ... is treated as a 0
  // contribution rather than inverting the stack."
  //
  // `Math.max(0, entry.point.y)` is real code — but it lives ONLY in
  // AreaChart.svelte's `columnTotalAtX`/`normalizedSeries`, both of which
  // are gated behind `stackNormalize`. `normalizedSeries` is a literal
  // pass-through when `stackNormalize` is false:
  //   let normalizedSeries = $derived.by(() => {
  //     if (!stackNormalize) { return series.map((s) => s.data); }
  //     ...
  //   });
  // and `computeStackedValues` in ./geometry.ts (the function plain
  // `stacked: true` actually renders through) has NO clamp of its own:
  //   const y1 = base + entry.point.y;
  // A negative `entry.point.y` REDUCES `base` for the next series, which is
  // exactly "inverting the stack" — the outcome the doc says is avoided.
  //
  // This is a REAL DEFECT, not a documentation-wording nit: it is
  // demonstrated below at both the pure-function level (computeStackedValues)
  // and the rendered-DOM level (AreaChart with stacked: true), the second of
  // which shows the negative segment's dots rendering OUTSIDE the visible
  // plot (yExtent for isStacked is hardcoded to start at 0 —
  // `niceLinearDomain(0, Math.max(...topValues))` — so a negative baseline
  // has no domain room and its dots project to pixels below the chart's own
  // bottom edge). Both assertions below encode the DOCUMENTED (clamped)
  // behavior and are EXPECTED TO FAIL against current code. See this file's
  // reported defect / negativeControlOutput for the evidence this is not an
  // authoring mistake.
  it('[DEFECT] computeStackedValues should clamp a negative contribution to 0, not invert the stack', () => {
    // A refund ledger: refunds are naturally negative in the source system
    // (money leaving), and a caller stacks them under gross sales to show
    // "sales net of refunds" as one area stack.
    const refunds = [
      { x: 1, y: -40 },
      { x: 2, y: -10 }
    ];
    const sales = [
      { x: 1, y: 100 },
      { x: 2, y: 90 }
    ];
    const [refundStack, salesStack] = computeStackedValues([refunds, sales]);

    // Documented behavior: a negative contribution counts as 0, so the
    // refund segment should have zero height and the sales segment should
    // stack from 0, not from a negative baseline.
    expect(refundStack[0]).toEqual({ x: 1, y0: 0, y1: 0 });
    expect(salesStack[0]).toEqual({ x: 1, y0: 0, y1: 100 });
  });

  it('[DEFECT] AreaChart (stacked: true) should render the refund segment clamped at the zero baseline, not below the visible plot', () => {
    const refund = {
      name: 'Refunds',
      data: [
        { x: 1, y: -40 },
        { x: 2, y: -10 }
      ]
    };
    const sales = {
      name: 'Sales',
      data: [
        { x: 1, y: 100 },
        { x: 2, y: 90 }
      ]
    };
    const { container } = render(AreaChart, {
      props: { series: [refund, sales], stacked: true, aspectRatio: 2, showDots: true }
    });

    const dots = dotCenters(container);
    const dims = readMargin(container);
    void dims;
    // Documented behavior: a clamped refund point renders AT the y=0
    // baseline pixel, not below the chart's own bottom axis line. Read the
    // chart's own y=0 tick pixel rather than hand-deriving it.
    const zeroTick = yTicks(container).find((t) => t.label === '0');
    expect(zeroTick).toBeDefined();
    expect(dots[0].y).toBe(zeroTick?.y); // Refunds, x=1 — should sit ON the baseline
    expect(dots[1].y).toBe(zeroTick?.y); // Refunds, x=2 — should sit ON the baseline
  });
});

// ── Fixture I: unknown totals in stackNormalize ────────────────────

describe('consumer adapter: unknown totals (input policy — Unknown totals, stackNormalize)', () => {
  it('a column where every series is absent/zero normalizes to a literal 0%, not NaN% or Infinity%', async () => {
    // A day where two product lines both reported nothing sold (e.g. a
    // holiday closure day pulled from an inventory system) alongside days
    // with real volume.
    const productA = {
      name: 'A',
      data: [
        { x: 1, y: 40 },
        { x: 2, y: 0 }
      ]
    };
    const productB = {
      name: 'B',
      data: [
        { x: 1, y: 60 },
        { x: 2, y: 0 }
      ]
    };

    const { container } = render(AreaChart, {
      props: {
        series: [productA, productB],
        stacked: true,
        stackNormalize: true,
        aspectRatio: 2,
        showDots: true
      }
    });

    const dots = dotCenters(container);
    // dots[1] and dots[3] are A/B's x=2 points (the all-zero column).
    hoverAt(container, dots[1]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const items = tooltipItems(container);
    for (const item of items) {
      expect(item.value).toBe('0%');
      expect(item.value).not.toMatch(/NaN|Infinity/);
    }
  });
});
