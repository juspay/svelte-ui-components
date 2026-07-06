import { measureText, type FontSpec } from './measure';

export type LabelRect = { x: number; y: number; width: number; height: number };
export type LabelSize = { width: number; height: number };

export type LabelPlacement = {
  x: number;
  y: number;
  placement: 'outside' | 'inside' | 'hidden';
  textAnchor: 'start' | 'middle' | 'end';
  dominantBaseline: 'auto' | 'middle' | 'hanging';
};

/**
 * Highcharts-style end-of-bar label chain: place just past the bar's value end
 * (outside) → justify back inside the bar end when the plot area would clip it →
 * hide (crop) when the bar cannot fit the label either.
 */
export function resolveEndLabel(opts: {
  bar: LabelRect;
  plot: LabelSize;
  label: LabelSize;
  orientation: 'vertical' | 'horizontal';
  negative?: boolean;
  gap?: number;
  padding?: number;
}): LabelPlacement {
  const { bar, plot, label, orientation } = opts;
  const gap = opts.gap ?? 4;
  const padding = opts.padding ?? 4;
  const negative = opts.negative ?? false;

  if (orientation === 'vertical') {
    const x = bar.x + bar.width / 2;
    const insideFits = bar.height >= label.height + 2 * padding;
    if (!negative) {
      if (bar.y - gap - label.height >= 0) {
        return {
          x,
          y: bar.y - gap,
          placement: 'outside',
          textAnchor: 'middle',
          dominantBaseline: 'auto'
        };
      }
      if (insideFits) {
        return {
          x,
          y: bar.y + padding,
          placement: 'inside',
          textAnchor: 'middle',
          dominantBaseline: 'hanging'
        };
      }
      return { x, y: 0, placement: 'hidden', textAnchor: 'middle', dominantBaseline: 'auto' };
    }
    const end = bar.y + bar.height;
    if (end + gap + label.height <= plot.height) {
      return {
        x,
        y: end + gap,
        placement: 'outside',
        textAnchor: 'middle',
        dominantBaseline: 'hanging'
      };
    }
    if (insideFits) {
      return {
        x,
        y: end - padding,
        placement: 'inside',
        textAnchor: 'middle',
        dominantBaseline: 'auto'
      };
    }
    return { x, y: 0, placement: 'hidden', textAnchor: 'middle', dominantBaseline: 'auto' };
  }

  const y = bar.y + bar.height / 2;
  // A sub-band thinner than the label height cannot host a legible label in
  // either position (generalises the old `bar.height >= 13` special case).
  if (bar.height < label.height) {
    return { x: 0, y, placement: 'hidden', textAnchor: 'start', dominantBaseline: 'middle' };
  }
  const insideFits = bar.width >= label.width + 2 * padding;
  if (!negative) {
    const end = bar.x + bar.width;
    if (end + gap + label.width <= plot.width) {
      return {
        x: end + gap,
        y,
        placement: 'outside',
        textAnchor: 'start',
        dominantBaseline: 'middle'
      };
    }
    if (insideFits) {
      return {
        x: end - padding,
        y,
        placement: 'inside',
        textAnchor: 'end',
        dominantBaseline: 'middle'
      };
    }
    return { x: 0, y, placement: 'hidden', textAnchor: 'start', dominantBaseline: 'middle' };
  }
  if (bar.x - gap - label.width >= 0) {
    return {
      x: bar.x - gap,
      y,
      placement: 'outside',
      textAnchor: 'end',
      dominantBaseline: 'middle'
    };
  }
  if (insideFits) {
    return {
      x: bar.x + padding,
      y,
      placement: 'inside',
      textAnchor: 'start',
      dominantBaseline: 'middle'
    };
  }
  return { x: 0, y, placement: 'hidden', textAnchor: 'start', dominantBaseline: 'middle' };
}

/** Center a label inside a segment (stacked bars, funnel stages); hide when it cannot fit. */
export function resolveInsideLabel(opts: {
  bar: LabelRect;
  label: LabelSize;
  padding?: number;
}): LabelPlacement {
  const { bar, label } = opts;
  const padding = opts.padding ?? 4;
  const fits = bar.width >= label.width + 2 * padding && bar.height >= label.height + 2 * padding;
  return {
    x: bar.x + bar.width / 2,
    y: bar.y + bar.height / 2,
    placement: fits ? 'inside' : 'hidden',
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  };
}

/** Line/area point-value labels: above the point, flipped below at the plot top, thinned by density. */
export function resolvePointLabels(opts: {
  points: Array<{ x: number; y: number }>;
  labels: LabelSize[];
  plot: LabelSize;
  gap?: number;
}): Array<{ x: number; y: number; visible: boolean; dominantBaseline: 'auto' | 'hanging' }> {
  const gap = opts.gap ?? 8;
  const n = opts.points.length;
  // Thinning cadence from the tightest real gap between consecutive points —
  // non-uniform x data must thin for its densest run, not the average spread.
  let step = Number.POSITIVE_INFINITY;
  for (let i = 1; i < n; i++) {
    step = Math.min(step, Math.abs(opts.points[i].x - opts.points[i - 1].x));
  }
  const maxWidth = opts.labels.reduce((m, l) => Math.max(m, l.width), 0);
  const every = Math.max(1, Math.ceil((maxWidth + 4) / step));
  return opts.points.map((point, i) => {
    const label = opts.labels[i] ?? { width: 0, height: 0 };
    const flip = point.y - gap - label.height < 0;
    return {
      x: point.x,
      y: flip ? point.y + gap : point.y - gap,
      visible: i % every === 0,
      dominantBaseline: flip ? 'hanging' : 'auto'
    };
  });
}

/**
 * Axis tick-label crowding chain: horizontal → rotate -45° → thin to every Nth,
 * where N is the smallest integer such that rotated labels no longer overlap.
 */
export function thinTicks(opts: {
  labelWidths: number[];
  labelHeight: number;
  step: number;
  gap?: number;
}): { rotate: boolean; every: number } {
  const gap = opts.gap ?? 8;
  const maxWidth = opts.labelWidths.reduce((m, w) => Math.max(m, w), 0);
  if (opts.step <= 0) {
    return { rotate: false, every: 1 };
  }
  if (maxWidth + gap <= opts.step) {
    return { rotate: false, every: 1 };
  }
  // A -45°-rotated label's horizontal footprint is governed by its line height
  // projected onto the axis: height * √2.
  const rotatedFootprint = opts.labelHeight * Math.SQRT2 + gap;
  return { rotate: true, every: Math.max(1, Math.ceil(rotatedFootprint / opts.step)) };
}

/** Measurement-based ellipsis truncation; empty string when fewer than 2 chars fit. */
export function truncateToWidth(text: string, maxWidth: number, font: FontSpec): string {
  if (measureText(text, font).width <= maxWidth) {
    return text;
  }
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measureText(text.slice(0, mid) + '…', font).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo >= 2 ? text.slice(0, lo) + '…' : '';
}

/** Convert an anchored SVG text placement into its bounding rect for collision checks. */
export function placedLabelRect(
  p: Pick<LabelPlacement, 'x' | 'y' | 'textAnchor' | 'dominantBaseline'>,
  label: LabelSize
): LabelRect {
  const x =
    p.textAnchor === 'middle'
      ? p.x - label.width / 2
      : p.textAnchor === 'end'
        ? p.x - label.width
        : p.x;
  const y =
    p.dominantBaseline === 'middle'
      ? p.y - label.height / 2
      : p.dominantBaseline === 'hanging'
        ? p.y
        : p.y - label.height;
  return { x, y, width: label.width, height: label.height };
}

/**
 * Highcharts `allowOverlap: false` equivalent: greedy first-come pass that hides
 * any label whose rect intersects an already-kept label. `null` entries are
 * pre-hidden labels and always return false.
 */
export function dropOverlapping(rects: Array<LabelRect | null>, gap: number = 2): boolean[] {
  const kept: LabelRect[] = [];
  return rects.map((r) => {
    if (r === null) {
      return false;
    }
    const collides = kept.some(
      (k) =>
        r.x < k.x + k.width + gap &&
        k.x < r.x + r.width + gap &&
        r.y < k.y + k.height + gap &&
        k.y < r.y + r.height + gap
    );
    if (collides) {
      return false;
    }
    kept.push(r);
    return true;
  });
}
