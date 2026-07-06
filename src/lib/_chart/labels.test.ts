import { describe, it, expect } from 'vitest';
import {
  resolveEndLabel,
  resolveInsideLabel,
  resolvePointLabels,
  thinTicks,
  truncateToWidth,
  placedLabelRect,
  dropOverlapping
} from './labels';

const plot = { width: 400, height: 300 };

describe('resolveEndLabel — vertical', () => {
  it('places outside above the bar when there is headroom', () => {
    const p = resolveEndLabel({
      bar: { x: 100, y: 50, width: 30, height: 200 },
      plot,
      label: { width: 24, height: 13 },
      orientation: 'vertical'
    });
    expect(p.placement).toBe('outside');
    expect(p.x).toBe(115); // bar center
    expect(p.y).toBe(46); // bar.y - gap(4)
    expect(p.textAnchor).toBe('middle');
    expect(p.dominantBaseline).toBe('auto');
  });

  it('flips inside when the label would overflow the plot top', () => {
    const p = resolveEndLabel({
      bar: { x: 100, y: 8, width: 30, height: 250 },
      plot,
      label: { width: 24, height: 13 },
      orientation: 'vertical'
    });
    expect(p.placement).toBe('inside');
    expect(p.y).toBe(12); // bar.y + padding(4)
    expect(p.dominantBaseline).toBe('hanging');
  });

  it('hides when neither outside nor inside fits', () => {
    const p = resolveEndLabel({
      bar: { x: 100, y: 2, width: 30, height: 10 },
      plot,
      label: { width: 24, height: 13 },
      orientation: 'vertical'
    });
    expect(p.placement).toBe('hidden');
  });

  it('places below the bar for negative values', () => {
    const p = resolveEndLabel({
      bar: { x: 100, y: 150, width: 30, height: 80 },
      plot,
      label: { width: 24, height: 13 },
      orientation: 'vertical',
      negative: true
    });
    expect(p.placement).toBe('outside');
    expect(p.y).toBe(234); // bar.y + bar.height + gap(4)
    expect(p.dominantBaseline).toBe('hanging');
  });
});

describe('resolveEndLabel — horizontal', () => {
  it('places outside right of the bar end', () => {
    const p = resolveEndLabel({
      bar: { x: 0, y: 100, width: 200, height: 20 },
      plot,
      label: { width: 30, height: 13 },
      orientation: 'horizontal'
    });
    expect(p.placement).toBe('outside');
    expect(p.x).toBe(204);
    expect(p.textAnchor).toBe('start');
    expect(p.dominantBaseline).toBe('middle');
  });

  it('flips inside the bar end when it would overflow the plot right edge', () => {
    const p = resolveEndLabel({
      bar: { x: 0, y: 100, width: 390, height: 20 },
      plot,
      label: { width: 30, height: 13 },
      orientation: 'horizontal'
    });
    expect(p.placement).toBe('inside');
    expect(p.x).toBe(386); // bar end - padding(4)
    expect(p.textAnchor).toBe('end');
  });

  it('hides when the sub-band is thinner than the label', () => {
    const p = resolveEndLabel({
      bar: { x: 0, y: 100, width: 390, height: 10 },
      plot,
      label: { width: 30, height: 13 },
      orientation: 'horizontal'
    });
    expect(p.placement).toBe('hidden');
  });
});

describe('resolveInsideLabel', () => {
  it('centers when the segment fits the label plus padding', () => {
    const p = resolveInsideLabel({
      bar: { x: 10, y: 20, width: 60, height: 30 },
      label: { width: 40, height: 13 }
    });
    expect(p.placement).toBe('inside');
    expect(p.x).toBe(40);
    expect(p.y).toBe(35);
    expect(p.textAnchor).toBe('middle');
    expect(p.dominantBaseline).toBe('middle');
  });

  it('hides when the segment is too small', () => {
    const p = resolveInsideLabel({
      bar: { x: 10, y: 20, width: 60, height: 18 },
      label: { width: 40, height: 13 }
    });
    expect(p.placement).toBe('hidden');
  });
});

describe('resolvePointLabels', () => {
  it('places labels above points and flips below at the plot top', () => {
    const out = resolvePointLabels({
      points: [
        { x: 0, y: 100 },
        { x: 200, y: 5 }
      ],
      labels: [
        { width: 20, height: 13 },
        { width: 20, height: 13 }
      ],
      plot
    });
    expect(out[0].dominantBaseline).toBe('auto');
    expect(out[0].y).toBe(92); // y - gap(8)
    expect(out[1].dominantBaseline).toBe('hanging');
    expect(out[1].y).toBe(13); // y + gap(8)
  });

  it('thins labels when density exceeds label width', () => {
    const points = Array.from({ length: 21 }, (_, i) => ({ x: i * 10, y: 100 }));
    const labels = points.map(() => ({ width: 24, height: 13 }));
    const out = resolvePointLabels({ points, labels, plot: { width: 200, height: 300 } });
    // step = 200/20 = 10px, need 24+4 → every = ceil(28/10) = 3
    expect(out[0].visible).toBe(true);
    expect(out[1].visible).toBe(false);
    expect(out[3].visible).toBe(true);
  });

  it('thins for the densest run of points, not the average spacing', () => {
    // 3 tightly packed points then one far away: average spacing is generous
    // but the packed run still needs every-3rd thinning (min gap 10px, need 28).
    const points = [
      { x: 0, y: 100 },
      { x: 10, y: 100 },
      { x: 20, y: 100 },
      { x: 200, y: 100 }
    ];
    const labels = points.map(() => ({ width: 24, height: 13 }));
    const out = resolvePointLabels({ points, labels, plot: { width: 200, height: 300 } });
    expect(out.map((o) => o.visible)).toEqual([true, false, false, true]);
  });
});

describe('thinTicks', () => {
  it('keeps horizontal labels when they fit', () => {
    expect(thinTicks({ labelWidths: [30, 32], labelHeight: 13, step: 50 })).toEqual({
      rotate: false,
      every: 1
    });
  });

  it('rotates when labels overlap', () => {
    const r = thinTicks({ labelWidths: [60, 62, 58], labelHeight: 13, step: 50 });
    expect(r.rotate).toBe(true);
    expect(r.every).toBe(1); // rotated footprint ≈ 13*1.414+8 ≈ 26.4 < 50
  });

  it('thins every Nth when rotation alone is not enough', () => {
    const r = thinTicks({ labelWidths: [60, 62, 58], labelHeight: 13, step: 10 });
    expect(r.rotate).toBe(true);
    expect(r.every).toBe(3); // ceil(26.4/10)
  });
});

describe('truncateToWidth (heuristic width = len*size*0.6)', () => {
  it('returns the text unchanged when it fits', () => {
    expect(truncateToWidth('abc', 100, { size: 10 })).toBe('abc');
  });

  it('truncates with an ellipsis to the available width', () => {
    // each char = 6px; 'abcdefghij' = 60px; budget 40px → 5 chars + … = 36px
    expect(truncateToWidth('abcdefghij', 40, { size: 10 })).toBe('abcde…');
  });

  it('returns empty when fewer than 2 chars fit', () => {
    expect(truncateToWidth('abcdefghij', 10, { size: 10 })).toBe('');
  });
});

describe('placedLabelRect + dropOverlapping', () => {
  it('converts an anchored placement into its bounding rect', () => {
    const rect = placedLabelRect(
      { x: 100, y: 50, textAnchor: 'middle', dominantBaseline: 'auto' },
      { width: 40, height: 12 }
    );
    expect(rect).toEqual({ x: 80, y: 38, width: 40, height: 12 });
  });

  it('greedily hides labels that overlap an earlier kept label', () => {
    const keep = dropOverlapping([
      { x: 0, y: 0, width: 30, height: 12 },
      { x: 20, y: 0, width: 30, height: 12 },
      { x: 60, y: 0, width: 30, height: 12 },
      null
    ]);
    expect(keep).toEqual([true, false, true, false]);
  });
});
