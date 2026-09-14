import { createRawSnippet } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import FunnelChart from './FunnelChart.svelte';
import type { FunnelStage } from './properties';

// Same jsdom stubbing the chart family's other specs use (see
// PieChart/legend.test.ts, LineChart/keyboard.test.ts): ChartContainer
// measures with getBoundingClientRect() on mount, and jsdom otherwise reports
// an all-zero rect, so no <svg> and no bars are ever rendered.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
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

function getBar(container: HTMLElement, index: number): Element {
  const el = container.querySelector(`[data-pw="funnel-bar-${index}"]`);
  if (el === null) {
    throw new Error(`funnel-bar-${index} not found`);
  }
  return el;
}

// One bad stage sandwiched between two good ones, so a guard that only
// protects the bad stage's own geometry (and not its neighbours') is
// distinguishable from one that corrupts everything.
const dataWithNaN: FunnelStage[] = [
  { category: 'Visits', value: 1000 },
  { category: 'Product View', value: Number.NaN },
  { category: 'Purchase', value: 300 }
];

describe('FunnelChart non-finite guards -- NaN input', () => {
  // Pre-fix, `NaN > max` is always false, so maxValue itself stayed correct
  // and the damage was local to the bad stage's own <rect>: barHeight fed it
  // straight into a division, producing height="NaN" y="NaN" while its
  // neighbours kept rendering off the (still-correct) max.
  it('keeps the NaN stage bar finite while its neighbours stay proportional', () => {
    const { container } = render(FunnelChart, { data: dataWithNaN, aspectRatio: 2 });

    const badBar = getBar(container, 1);
    const height = Number(badBar.getAttribute('height'));
    const y = Number(badBar.getAttribute('y'));
    expect(Number.isFinite(height)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);

    const visitsHeight = Number(getBar(container, 0).getAttribute('height'));
    const purchaseHeight = Number(getBar(container, 2).getAttribute('height'));
    expect(visitsHeight).toBeGreaterThan(purchaseHeight);
    expect(purchaseHeight).toBeGreaterThan(2);
  });

  // The trapezoid connectors read barY/barHeight for BOTH stages they join,
  // so the bad stage's NaN used to leak into two of each adjacent polygon's
  // four coordinates.
  it('keeps every connector polygon free of "NaN" coordinates', () => {
    const { container } = render(FunnelChart, { data: dataWithNaN, aspectRatio: 2 });
    const polygons = container.querySelectorAll('polygon.funnel-connector');
    expect(polygons).toHaveLength(2);
    for (const polygon of polygons) {
      const points = polygon.getAttribute('points');
      expect(points).not.toBeNull();
      expect(points).not.toContain('NaN');
    }
  });

  // aria-label is the bar's only accessible name (it is role="button" with
  // no visible text guaranteed to survive truncation) -- pre-fix it read
  // literally "Product View: NaN  |  NaN%".
  it('keeps the accessible name free of "NaN" for the bad stage', () => {
    const { container } = render(FunnelChart, { data: dataWithNaN, aspectRatio: 2 });
    expect(getBar(container, 1).getAttribute('aria-label')).toBe('Product View: 0  |  0%');
  });

  // The hover tooltip's value column is `formatLabel(stage)` for the
  // hovered stage -- the exact same call the aria-label and in-bar label
  // make, so a fix to one and not the others would still leak "NaN" here.
  it('reports the same sanitized value in the hover tooltip', async () => {
    const { container } = render(FunnelChart, { data: dataWithNaN, aspectRatio: 2 });
    await fireEvent.pointerEnter(getBar(container, 1));
    const tooltipValue = container.querySelector('.tooltip-value');
    expect(tooltipValue?.textContent).toBe('0  |  0%');
  });

  // The in-bar label goes through the same formatLabel, but only renders at
  // all once the bar clears a minimum-fit height -- the bad stage's own bar
  // floors to 2px, so hover-expand it past that floor to actually see it.
  it('renders the in-bar value label through the same formatLabel used elsewhere', async () => {
    const { container } = render(FunnelChart, {
      data: dataWithNaN,
      aspectRatio: 2,
      onHoverExpand: 25
    });
    await fireEvent.pointerEnter(getBar(container, 1));

    const labels = container.querySelectorAll('.funnel-value-label');
    // Visits and Purchase are always tall enough to show their full label;
    // the bad stage only clears the fit threshold once hover-expanded.
    expect(labels).toHaveLength(3);
    expect(labels[1].textContent).toBe('0  |  0%');
  });
});

describe('FunnelChart non-finite guards -- Infinity input', () => {
  // Pre-fix, `Infinity > max` IS true, so maxValue itself became Infinity --
  // every FINITE stage's value/max ratio then degenerates to 0 and floors to
  // 2px, indistinguishable from each other and from a genuine zero-value
  // stage. This is the opposite failure shape from the NaN case above: global
  // collapse instead of local corruption.
  const dataWithInfinity: FunnelStage[] = [
    { category: 'Visits', value: 500 },
    { category: 'Signups', value: Number.POSITIVE_INFINITY },
    { category: 'Purchase', value: 1000 }
  ];

  it('keeps the finite stages proportional instead of every bar collapsing to the 2px floor', () => {
    const { container } = render(FunnelChart, { data: dataWithInfinity, aspectRatio: 2 });

    const visitsHeight = Number(getBar(container, 0).getAttribute('height'));
    const purchaseHeight = Number(getBar(container, 2).getAttribute('height'));

    expect(visitsHeight).toBeGreaterThan(2);
    // Visits is half of Purchase's value, so it should render at half the
    // height -- not collapse to the same 2px floor as Purchase would if
    // maxValue had become Infinity.
    expect(visitsHeight / purchaseHeight).toBeCloseTo(0.5, 5);
  });

  // The Infinity stage's OWN bar is still, correctly, a 2px floor -- a
  // non-finite value is a 0 contribution (see barHeight's own comment), same
  // as the NaN case above. That is the intended floor; the guard's job is
  // only to stop it leaking onto neighbours, which the assertion above covers.
  it('still floors the Infinity stage itself to the minimum bar height', () => {
    const { container } = render(FunnelChart, { data: dataWithInfinity, aspectRatio: 2 });
    expect(Number(getBar(container, 1).getAttribute('height'))).toBe(2);
  });
});

describe('FunnelChart non-finite guards -- documented open question', () => {
  // isEmpty is `data.every((stage) => stage.value === 0)`. NaN !== 0, so an
  // ALL-NaN dataset is NOT considered empty and instead renders every bar at
  // the 2px floor rather than the `empty` snippet. This is EXISTING,
  // unguarded behaviour -- pinning it here so a future change to isEmpty is
  // visible in this file's diff, not an endorsement that it is correct.
  it('does not treat an all-NaN dataset as empty, so bars render instead of the empty snippet', () => {
    const allNaN: FunnelStage[] = [
      { category: 'A', value: Number.NaN },
      { category: 'B', value: Number.NaN }
    ];
    const empty = createRawSnippet(() => ({ render: () => '<p class="no-data">No data</p>' }));
    const { container } = render(FunnelChart, { data: allNaN, aspectRatio: 2, empty });

    expect(container.querySelector('.no-data')).toBeNull();
    const bars = container.querySelectorAll('.funnel-bar');
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(bar.getAttribute('height')).toBe('2');
    }
  });
});
