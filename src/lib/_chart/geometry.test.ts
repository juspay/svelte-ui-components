import { describe, expect, it } from 'vitest';
import { computeAutoLayout, computeSankeyLayout } from './geometry';

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

describe('computeSankeyLayout', () => {
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
