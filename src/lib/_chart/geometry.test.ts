import { describe, expect, it } from 'vitest';
import { computeAutoLayout, computeSankeyLayout, computeStackedValues, joinByX } from './geometry';

// Real-shaped payment funnel (7 columns, mid-funnel exits, wide value spread) —
// shared by the drift and ribbon-flushness regressions below.
const paymentFunnelNodes = [
  { id: 'START' },
  { id: 'ENTERED MOBILE NUMBER' },
  { id: 'MOBILE NUMBER SKIPPED' },
  { id: 'EXIT AT MOBILE NUMBER' },
  { id: 'ENTERED OTP' },
  { id: 'OTP SKIPPED' },
  { id: 'EXIT AT OTP' },
  { id: 'ADDED PROFILE DETAILS' },
  { id: 'PROFILE DETAILS SKIPPED' },
  { id: 'EXIT AT PROFILE DETAILS' },
  { id: 'ADDED ADDRESS' },
  { id: 'ADDRESS SKIPPED' },
  { id: 'EXIT AT ADDRESS' },
  { id: 'CASH' },
  { id: 'UPI' },
  { id: 'DEBIT CARD' },
  { id: 'NB' },
  { id: 'WALLET' },
  { id: 'PAGE EXPIRED' },
  { id: 'EXIT AT PAYMENT PAGE' },
  { id: 'EXIT AT PREVIOUS STAGE' },
  { id: 'SUCCESS' },
  { id: 'PENDING' },
  { id: 'FAILED' }
];
const paymentFunnelLinks = [
  { source: 'START', target: 'ENTERED MOBILE NUMBER', value: 400 },
  { source: 'START', target: 'MOBILE NUMBER SKIPPED', value: 500 },
  { source: 'START', target: 'EXIT AT MOBILE NUMBER', value: 150 },
  { source: 'ENTERED MOBILE NUMBER', target: 'ENTERED OTP', value: 350 },
  { source: 'ENTERED MOBILE NUMBER', target: 'EXIT AT OTP', value: 50 },
  { source: 'MOBILE NUMBER SKIPPED', target: 'OTP SKIPPED', value: 450 },
  { source: 'MOBILE NUMBER SKIPPED', target: 'EXIT AT OTP', value: 50 },
  { source: 'ENTERED OTP', target: 'ADDED PROFILE DETAILS', value: 300 },
  { source: 'ENTERED OTP', target: 'EXIT AT PROFILE DETAILS', value: 50 },
  { source: 'OTP SKIPPED', target: 'PROFILE DETAILS SKIPPED', value: 400 },
  { source: 'OTP SKIPPED', target: 'EXIT AT PROFILE DETAILS', value: 50 },
  { source: 'ADDED PROFILE DETAILS', target: 'ADDED ADDRESS', value: 250 },
  { source: 'ADDED PROFILE DETAILS', target: 'EXIT AT ADDRESS', value: 50 },
  { source: 'PROFILE DETAILS SKIPPED', target: 'ADDRESS SKIPPED', value: 350 },
  { source: 'PROFILE DETAILS SKIPPED', target: 'EXIT AT ADDRESS', value: 50 },
  { source: 'ADDED ADDRESS', target: 'CASH', value: 20 },
  { source: 'ADDED ADDRESS', target: 'UPI', value: 60 },
  { source: 'ADDED ADDRESS', target: 'DEBIT CARD', value: 100 },
  { source: 'ADDED ADDRESS', target: 'EXIT AT PAYMENT PAGE', value: 70 },
  { source: 'ADDRESS SKIPPED', target: 'NB', value: 30 },
  { source: 'ADDRESS SKIPPED', target: 'WALLET', value: 40 },
  { source: 'ADDRESS SKIPPED', target: 'PAGE EXPIRED', value: 30 },
  { source: 'ADDRESS SKIPPED', target: 'EXIT AT PAYMENT PAGE', value: 250 },
  { source: 'CASH', target: 'SUCCESS', value: 18 },
  { source: 'UPI', target: 'SUCCESS', value: 50 },
  { source: 'DEBIT CARD', target: 'SUCCESS', value: 70 },
  { source: 'DEBIT CARD', target: 'PENDING', value: 20 },
  { source: 'NB', target: 'SUCCESS', value: 20 },
  { source: 'WALLET', target: 'SUCCESS', value: 30 },
  { source: 'PAGE EXPIRED', target: 'FAILED', value: 30 },
  { source: 'EXIT AT PAYMENT PAGE', target: 'EXIT AT PREVIOUS STAGE', value: 320 }
];

describe('computeStackedValues negative handling', () => {
  it('treats a negative as a zero contribution rather than inverting the stack', () => {
    // docs/CHART_INPUT_POLICY.md's "Negative values" row promises exactly this,
    // and only AreaChart's `stackNormalize` path implemented it -- plain
    // `stacked: true` came through here, where `base + y` let a negative pull
    // the baseline down for every series above it.
    const stacked = computeStackedValues([[{ x: 1, y: -40 }], [{ x: 1, y: 60 }]]);

    // Zero height, still present in the column.
    expect(stacked[0][0]).toEqual({ x: 1, y0: 0, y1: 0 });
    // And the series above it starts from 0, not from -40.
    expect(stacked[1][0]).toEqual({ x: 1, y0: 0, y1: 60 });
  });

  it('still stacks positives cumulatively', () => {
    // The clamp must not flatten the ordinary case it sits in front of.
    const stacked = computeStackedValues([[{ x: 1, y: 10 }], [{ x: 1, y: 25 }]]);

    expect(stacked[0][0]).toEqual({ x: 1, y0: 0, y1: 10 });
    expect(stacked[1][0]).toEqual({ x: 1, y0: 10, y1: 35 });
  });
});

describe('computeSankeyLayout', () => {
  it('keeps two links apart when their ids concatenate to the same string', () => {
    // `linkKey` joins source and target to index link widths. The separator is
    // the one character an id cannot contain, and nothing tested that choice:
    // swapping it for a hyphen left all 25 specs passing, which is how a future
    // "tidy up that odd escape" commit would silently merge two distinct links.
    //
    // These two ids concatenate identically under any printable separator --
    // 'a-b' + '-' + 'c' and 'a' + '-' + 'b-c' are both 'a-b-c' -- so the pair
    // only stays distinct while the separator is a character neither id can hold.
    const nodes = [{ id: 'a-b' }, { id: 'c' }, { id: 'a' }, { id: 'b-c' }];
    const links = [
      { source: 'a-b', target: 'c', value: 10 },
      { source: 'a', target: 'b-c', value: 90 }
    ];

    const layout = computeSankeyLayout(nodes, links, 400, 200);

    expect(layout.links).toHaveLength(2);
    const widths = layout.links.map((l) => l.width);
    // Merged keys would hand both links one shared width; a 10-vs-90 split
    // cannot legitimately produce two equal widths.
    expect(widths[0]).not.toBe(widths[1]);
  });

  it('produces finite node positions when every link weight is zero (no NaN collapse)', () => {
    // Real-world "store with no funnel completions" case: every transition has
    // zero volume. The weighted-Y relaxation divided by the sum of incoming
    // link values (0), producing NaN node positions and a degenerate chart.
    const nodes = [{ id: 'START' }, { id: 'MOBILE' }, { id: 'OTP' }];
    const links = [
      { source: 'START', target: 'MOBILE', value: 0 },
      { source: 'MOBILE', target: 'OTP', value: 0 }
    ];

    const { nodes: computed } = computeSankeyLayout(nodes, links, 800, 400);

    for (const node of computed) {
      expect(Number.isFinite(node.x), `${node.id}.x is finite`).toBe(true);
      expect(Number.isFinite(node.y), `${node.id}.y is finite`).toBe(true);
      expect(Number.isFinite(node.height), `${node.id}.height is finite`).toBe(true);
      expect(node.y, `${node.id}.y is non-negative`).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps the proportional layout intact for healthy data', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const links = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: 5 }
    ];

    const { nodes: computed, links: computedLinks } = computeSankeyLayout(nodes, links, 800, 400);

    expect(computed).toHaveLength(3);
    expect(computedLinks).toHaveLength(2);
    for (const node of computed) {
      expect(Number.isFinite(node.y), `${node.id}.y is finite`).toBe(true);
    }
  });

  it('centres a single source fanning out to N targets on the source centre, level rather than drifting down', () => {
    // Regression for the "going down" funnel bug: a node splitting into several
    // targets used to stack from the topmost target's ideal position and get
    // shoved downward, instead of staying centred as a block around the
    // source's own vertical centre.
    const height = 300;
    const nodes = [{ id: 'SOURCE' }, { id: 'A' }, { id: 'B' }, { id: 'C' }];
    const links = [
      { source: 'SOURCE', target: 'A', value: 10 },
      { source: 'SOURCE', target: 'B', value: 10 },
      { source: 'SOURCE', target: 'C', value: 10 }
    ];

    const { nodes: computed } = computeSankeyLayout(nodes, links, 600, height, 16, 8, 6, 1);

    const source = computed.find((node) => node.id === 'SOURCE')!;
    const targets = computed.filter((node) => node.column === 1);
    const sourceCentre = source.y + source.height / 2;
    const targetBlockTop = Math.min(...targets.map((node) => node.y));
    const targetBlockBottom = Math.max(...targets.map((node) => node.y + node.height));
    const targetBlockCentre = (targetBlockTop + targetBlockBottom) / 2;

    expect(targetBlockCentre).toBeCloseTo(sourceCentre, 5);
  });

  it('never lets a column drift past the supplied height for a funnel-shaped dataset', () => {
    // Regression for the multi-stage funnel that progressively drifted downward
    // and overflowed its own height budget column-to-column.
    const height = 527;

    const { nodes: computed } = computeSankeyLayout(
      paymentFunnelNodes,
      paymentFunnelLinks,
      1080 - 16,
      height,
      16,
      8,
      6,
      2
    );

    const columnGroups = new Map<number, typeof computed>();
    for (const node of computed) {
      const group = columnGroups.get(node.column) ?? [];
      group.push(node);
      columnGroups.set(node.column, group);
    }

    for (const [column, group] of columnGroups) {
      const columnBottom = Math.max(...group.map((node) => node.y + node.height));
      expect(
        columnBottom,
        `column ${column} bottom (${columnBottom}) exceeds height (${height})`
      ).toBeLessThanOrEqual(height);
    }
  });

  it('keeps every ribbon flush inside both of its nodes — no spill past a bar edge', () => {
    // Regression for ribbons extending below the bottom node row: link widths
    // were sized at the source column's px-per-value scale while target nodes
    // were laid out at their own column's scale, so on real funnel data the
    // incoming stacks overran target bars by 15-27px and painted past the
    // deepest node's bottom edge.
    const { nodes: computed, links: computedLinks } = computeSankeyLayout(
      paymentFunnelNodes,
      paymentFunnelLinks,
      1080 - 16,
      527,
      16,
      14,
      6,
      2
    );

    const nodeById = new Map(computed.map((node) => [node.id, node]));
    const epsilon = 1e-6;
    for (const link of computedLinks) {
      const sourceNode = nodeById.get(link.source)!;
      const targetNode = nodeById.get(link.target)!;
      const label = `${link.source} -> ${link.target}`;
      expect(link.sourceY - link.width / 2, `${label} top vs source top`).toBeGreaterThanOrEqual(
        sourceNode.y - epsilon
      );
      expect(link.sourceY + link.width / 2, `${label} bottom vs source bottom`).toBeLessThanOrEqual(
        sourceNode.y + sourceNode.height + epsilon
      );
      expect(link.targetY - link.width / 2, `${label} top vs target top`).toBeGreaterThanOrEqual(
        targetNode.y - epsilon
      );
      expect(link.targetY + link.width / 2, `${label} bottom vs target bottom`).toBeLessThanOrEqual(
        targetNode.y + targetNode.height + epsilon
      );
    }
  });

  it('renders equal values at equal heights in every column (one global scale)', () => {
    const { nodes: computed } = computeSankeyLayout(
      paymentFunnelNodes,
      paymentFunnelLinks,
      1080 - 16,
      527,
      16,
      8,
      6,
      2
    );

    const heightOf = (id: string): number => computed.find((node) => node.id === id)!.height;

    // Same value (320) in different columns must render identically tall.
    expect(heightOf('EXIT AT PAYMENT PAGE')).toBeCloseTo(heightOf('EXIT AT PREVIOUS STAGE'), 5);
    // Heights stay proportional to values across columns (no per-column stretch).
    expect(heightOf('START') / heightOf('UPI')).toBeCloseTo(1050 / 60, 5);
  });
});

describe('computeAutoLayout (heuristic text widths: len * 11 * 0.6 = 6.6px/char)', () => {
  it('sizes the left margin to the widest y tick label', () => {
    const layout = computeAutoLayout({
      width: 600,
      height: 400,
      yTickLabels: ['0', '50,000', '1,00,000'],
      xTickLabels: ['A', 'B']
    });
    // '1,00,000' = 8 chars * 6.6 = 52.8 → ceil 53 + tickPad 10 + 6 = 69
    expect(layout.margin.left).toBe(69);
    expect(layout.xRotate).toBe(false);
    expect(layout.xEvery).toBe(1);
  });

  it('respects base minimums and reserves title bands', () => {
    const layout = computeAutoLayout({
      width: 600,
      height: 400,
      yTickLabels: ['0'],
      xTickLabels: ['A'],
      hasYAxisLabel: true,
      base: { left: 50, bottom: 40 }
    });
    // tiny label → measured left (1*6.6→7+16+18=41) loses to base 50
    expect(layout.margin.left).toBe(50);
    expect(layout.margin.bottom).toBeGreaterThanOrEqual(40);
  });

  it('rotates and thins crowded x labels and deepens the bottom margin', () => {
    const labels = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
    const layout = computeAutoLayout({
      width: 400,
      height: 300,
      yTickLabels: ['0', '100'],
      xTickLabels: labels
    });
    expect(layout.xRotate).toBe(true);
    expect(layout.xEvery).toBeGreaterThanOrEqual(2);
    expect(layout.margin.bottom).toBeGreaterThan(40);
  });

  it('places the bottom axis title baseline inside the reserved title band', () => {
    const layout = computeAutoLayout({
      width: 600,
      height: 400,
      yTickLabels: ['0'],
      xTickLabels: ['A'],
      hasXAxisLabel: true
    });
    // tick band depth = TICK_PAD(10) + ceil(11 * 1.2) = 24; title band = 18
    expect(layout.xLabelOffset).toBe(42);
    expect(layout.margin.bottom).toBe(48);
    expect(layout.xLabelOffset).toBeLessThan(layout.margin.bottom);
  });
});

// Two series with different x coverage must never have a value
// attributed to the wrong column. This is the exact counterexample from
// TABLE-CHART-TASKS.md.
const seriesA = {
  data: [
    { x: 1, y: 10 },
    { x: 2, y: 20 }
  ]
};
const seriesB = {
  data: [
    { x: 2, y: 200 },
    { x: 3, y: 300 }
  ]
};

describe('joinByX', () => {
  it('joins the counterexample by x, not by array position', () => {
    const rows = joinByX([seriesA, seriesB]);
    expect(rows.map((r) => r.x)).toEqual([1, 2, 3]);

    // x=1: only A has a sample. B must be absent, never a fabricated 0.
    expect(rows[0].values[0]?.point).toEqual({ x: 1, y: 10 });
    expect(rows[0].values[1]).toBeNull();

    // x=2: A's second point (20) and B's first point (200) share this column
    // -- the whole point of the fix. A positional join would instead pair
    // A[1] with B[1] (x=3, y=300), attributing B's x=3 value to x=2.
    expect(rows[1].values[0]?.point).toEqual({ x: 2, y: 20 });
    expect(rows[1].values[1]?.point).toEqual({ x: 2, y: 200 });

    // x=3: only B has a sample.
    expect(rows[2].values[0]).toBeNull();
    expect(rows[2].values[1]?.point).toEqual({ x: 3, y: 300 });
  });

  it('reproduces exact positional pairing for the common aligned case (no second code path)', () => {
    const aligned1 = {
      data: [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 }
      ]
    };
    const aligned2 = {
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 }
      ]
    };
    const rows = joinByX([aligned1, aligned2]);
    expect(rows.map((r) => [r.values[0]?.point.y, r.values[1]?.point.y])).toEqual([
      [1, 10],
      [2, 20],
      [3, 30]
    ]);
  });

  it('sorts reordered (non-time-ordered) input by x', () => {
    const reordered = {
      data: [
        { x: 3, y: 30 },
        { x: 1, y: 10 },
        { x: 2, y: 20 }
      ]
    };
    const rows = joinByX([reordered]);
    expect(rows.map((r) => r.x)).toEqual([1, 2, 3]);
  });

  it('duplicate x within one series: the later point wins, and it is documented, not silent', () => {
    const dup = {
      data: [
        { x: 1, y: 10 },
        { x: 1, y: 999 }
      ]
    };
    const rows = joinByX([dup]);
    expect(rows).toHaveLength(1);
    expect(rows[0].values[0]).toEqual({ index: 1, point: { x: 1, y: 999 } });
  });

  it('a gap point (finite x, NaN y) still occupies its column instead of vanishing', () => {
    const withGap = {
      data: [
        { x: 1, y: 10 },
        { x: 2, y: NaN },
        { x: 3, y: 30 }
      ]
    };
    const rows = joinByX([withGap]);
    expect(rows[1].values[0]?.point.y).toBeNaN();
  });

  it('excludes a non-finite x -- it cannot be placed in any column', () => {
    const badX = {
      data: [
        { x: 1, y: 10 },
        { x: NaN, y: 20 }
      ]
    };
    const rows = joinByX([badX]);
    expect(rows.map((r) => r.x)).toEqual([1]);
  });

  it('offset/uneven series of different lengths align by x, not by shared index', () => {
    const short = { data: [{ x: 5, y: 50 }] };
    const long = {
      data: [
        { x: 1, y: 1 },
        { x: 5, y: 500 },
        { x: 9, y: 900 }
      ]
    };
    const rows = joinByX([short, long]);
    const atFive = rows.find((r) => r.x === 5);
    expect(atFive?.values[0]?.point.y).toBe(50);
    expect(atFive?.values[1]?.point.y).toBe(500);
  });
});

describe('computeStackedValues (built on joinByX)', () => {
  it('stacks the counterexample without the 101.488% overshoot', () => {
    // Same counterexample, fed through the actual stacking function this
    // time. Before the fix, index-based normalization upstream (see
    // AreaChart's normalizedSeries) could feed values here that summed past
    // 100%; computeStackedValues itself must still cap each real column's
    // total to the sum of what is actually present there.
    const stacked = computeStackedValues([seriesA.data, seriesB.data]);
    // A: x=1 -> [0,10]; x=2 -> [0,20] (A's own baseline is always 0 first)
    expect(stacked[0]).toEqual([
      { x: 1, y0: 0, y1: 10 },
      { x: 2, y0: 0, y1: 20 }
    ]);
    // B stacks on top of A only where both exist (x=2): base=20 -> 220.
    // At x=3, A is absent, so B's baseline is 0, not a fabricated carry-over.
    expect(stacked[1]).toEqual([
      { x: 2, y0: 20, y1: 220 },
      { x: 3, y0: 0, y1: 300 }
    ]);
    const totalAtX2 = stacked[1][0].y1;
    expect(totalAtX2).toBe(220); // exactly A(20) + B(200), not 101.488...% of anything
  });

  it('a NaN (gap) value contributes no segment and does not poison the baseline for series above it', () => {
    const a = [
      { x: 1, y: 10 },
      { x: 2, y: NaN },
      { x: 3, y: 10 }
    ];
    const b = [
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 }
    ];
    const stacked = computeStackedValues([a, b]);
    // A has no segment at x=2 (its own gap).
    expect(stacked[0].map((p) => p.x)).toEqual([1, 3]);
    // B's baseline at x=2 is 0 (A absent there), not NaN and not carried
    // over from x=1's baseline.
    const bAtX2 = stacked[1].find((p) => p.x === 2);
    expect(bAtX2).toEqual({ x: 2, y0: 0, y1: 5 });
  });

  it('reorders a non-time-ordered series into ascending x before stacking', () => {
    const reordered = [
      { x: 3, y: 30 },
      { x: 1, y: 10 },
      { x: 2, y: 20 }
    ];
    const stacked = computeStackedValues([reordered]);
    expect(stacked[0].map((p) => p.x)).toEqual([1, 2, 3]);
  });

  it('empty input returns no series', () => {
    expect(computeStackedValues([])).toEqual([]);
  });
});
