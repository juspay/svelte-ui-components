import { describe, expect, it } from 'vitest';
import { computeSankeyLayout } from '../_chart/geometry';

// Realistic 5-node / 3-column graph: two sources feed one mid node, which
// fans out to two sinks. Deliberately NOT a synthetic all-bad-data shape --
// this is the case the fix targets, where the pxPerValue backstop
// (geometry.ts:~244) never fires (three of the four links are entirely
// healthy) but, pre-fix, all 5 nodes still ended up with y=NaN. The actual
// mechanism: the poisoned node's NaN height reaches the per-column recentre
// step, whose `recentreShift !== 0` guard passes for NaN (NaN !== 0 is true),
// broadcasting NaN to every node sharing its column; the relaxation loop then
// carries that into every downstream column too.
const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }];
const goodLinks = [
  { source: 'A', target: 'C', value: 40 },
  { source: 'B', target: 'C', value: 60 },
  { source: 'C', target: 'D', value: 70 },
  { source: 'C', target: 'E', value: 30 }
];
// One of the four links -- B -> C -- is non-finite; the other three
// (including both of C's own outgoing links to D and E) are entirely finite.
const badLinks = goodLinks.map((l) =>
  l.source === 'B' && l.target === 'C' ? { ...l, value: Number.NaN } : l
);

describe('computeSankeyLayout non-finite guard', () => {
  it('keeps every node y and height finite with one NaN link among four', () => {
    const { nodes: computed } = computeSankeyLayout(nodes, badLinks, 400, 300);
    expect(computed).toHaveLength(5);
    for (const node of computed) {
      expect(Number.isFinite(node.y), `${node.id}.y is finite`).toBe(true);
      expect(Number.isFinite(node.height), `${node.id}.height is finite`).toBe(true);
    }
  });

  it('never lets the NaN link leak the literal token "NaN" into a rendered link path', () => {
    const { links: computedLinks } = computeSankeyLayout(nodes, badLinks, 400, 300);
    expect(computedLinks).toHaveLength(4);
    for (const link of computedLinks) {
      expect(link.path).not.toContain('NaN');
    }
  });

  it('keeps correct geometry for D and E, two hops downstream of the bad B->C link, whose own links are finite', () => {
    // docs/CHART_INPUT_POLICY.md's contract for this file is "non-finite
    // becomes a zero contribution" (see pieSliceValue's precedent) -- so the
    // graph with the bad link must produce EXACTLY the geometry a graph with
    // that same link already zeroed out produces. This is the sharpest
    // available check on "correct", since it doesn't hand-derive expected
    // pixel numbers out of band; it pins the guard to its own documented
    // behaviour instead.
    const zeroedLinks = badLinks.map((l) => (Number.isFinite(l.value) ? l : { ...l, value: 0 }));
    const { nodes: badComputed } = computeSankeyLayout(nodes, badLinks, 400, 300);
    const { nodes: zeroComputed } = computeSankeyLayout(nodes, zeroedLinks, 400, 300);

    for (const id of ['D', 'E']) {
      const bad = badComputed.find((n) => n.id === id)!;
      const zero = zeroComputed.find((n) => n.id === id)!;
      expect(bad.y, `${id}.y matches the zeroed-link reference`).toBeCloseTo(zero.y, 6);
      expect(bad.height, `${id}.height matches the zeroed-link reference`).toBeCloseTo(
        zero.height,
        6
      );
    }
  });

  it('does not make an all-bad-links graph indistinguishable from a genuinely empty one', () => {
    // A genuinely empty graph renders nothing at all.
    const emptyLayout = computeSankeyLayout([], [], 400, 300);
    expect(emptyLayout.nodes).toHaveLength(0);
    expect(emptyLayout.links).toHaveLength(0);

    // A graph whose nodes are real but EVERY link is non-finite is a
    // different thing: it must still come back as 5 distinct, finite-geometry
    // nodes (the degenerate "no volume anywhere" render), not as an emptied
    // or crashed layout. Unguarded, an all-NaN-links graph stays NaN end to
    // end even through the pxPerValue backstop -- linkRenderWidth multiplies
    // the (still-NaN) raw value by pxPerValue, and NaN * 0 is still NaN.
    const allBadLinks = goodLinks.map((l) => ({ ...l, value: Number.NaN }));
    const { nodes: poisoned, links: poisonedLinks } = computeSankeyLayout(
      nodes,
      allBadLinks,
      400,
      300
    );
    expect(poisoned).toHaveLength(5);
    expect(poisonedLinks).toHaveLength(4);
    for (const node of poisoned) {
      expect(Number.isFinite(node.y), `${node.id}.y is finite`).toBe(true);
      expect(Number.isFinite(node.height), `${node.id}.height is finite`).toBe(true);
    }
  });

  it('keeps the proportional layout intact when every link is finite (sanity baseline)', () => {
    const { nodes: computed } = computeSankeyLayout(nodes, goodLinks, 400, 300);
    const d = computed.find((n) => n.id === 'D')!;
    const e = computed.find((n) => n.id === 'E')!;
    // C splits 70/30 between D and E, so D's rendered bar must be taller.
    expect(d.height).toBeGreaterThan(e.height);
  });
});
