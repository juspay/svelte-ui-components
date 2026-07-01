import { describe, expect, it } from 'vitest';
import { computeSankeyLayout } from './geometry';

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
    const nodes = [
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
    const links = [
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

    const { nodes: computed } = computeSankeyLayout(nodes, links, 1080 - 16, height, 16, 8, 6, 2);

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
});
