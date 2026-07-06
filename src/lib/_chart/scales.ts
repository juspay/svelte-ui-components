import type { LinearScale, BandScale } from './types';

export function niceLinearDomain(min: number, max: number): [number, number] {
  if (min === max) {
    return min === 0 ? [0, 1] : [min > 0 ? 0 : min * 2, max > 0 ? max * 2 : 0];
  }
  const range = max - min;
  const exp = Math.floor(Math.log10(range));
  const step = Math.pow(10, exp);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  return [niceMin, niceMax];
}

export function computeLinearTicks(
  domain: [number, number],
  count: number = 5,
  integer: boolean = false
): number[] {
  const [min, max] = domain;
  if (min === max) {
    return [min];
  }
  const rawStep = (max - min) / count;
  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  let step: number;
  const ratio = rawStep / base;
  if (ratio <= 1.5) {
    step = base;
  } else if (ratio <= 3) {
    step = base * 2;
  } else if (ratio <= 7) {
    step = base * 5;
  } else {
    step = base * 10;
  }
  // Category axes (Highcharts semantics): ticks sit on whole category
  // positions, so a fractional step would repeat labels — floor it to 1.
  if (integer && step < 1) {
    step = 1;
  }

  const ticks: number[] = [];
  let tick = Math.ceil(min / step) * step;
  while (tick <= max + step * 0.001) {
    ticks.push(Math.round(tick * 1e10) / 1e10);
    tick += step;
  }
  return ticks;
}

export function createLinearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dSpan = d1 - d0 || 1;
  const rSpan = r1 - r0;

  const fn = (value: number): number => r0 + ((value - d0) / dSpan) * rSpan;

  return Object.assign(fn, {
    domain,
    range,
    ticks: (count?: number, integer?: boolean) => computeLinearTicks(domain, count, integer),
    invert: (pixel: number) => d0 + ((pixel - r0) / rSpan) * dSpan
  });
}

export function createBandScale(
  domain: string[],
  range: [number, number],
  padding: number = 0.1
): BandScale {
  const [r0, r1] = range;
  const n = domain.length || 1;
  const totalRange = r1 - r0;
  // d3-scale band formula (paddingOuter = 0): step = range / (n - padding)
  // Derivation: n*bandwidth + (n-1)*gap = totalRange,
  //   with bandwidth = step*(1-padding) and gap = step*padding
  //   → step*(n - padding) = totalRange
  const step = totalRange / Math.max(1, n - padding);
  const bandwidth = step * (1 - padding);

  const indexMap = new Map<string, number>();
  domain.forEach((label, i) => indexMap.set(label, i));

  const fn = (label: string): number => {
    const idx = indexMap.get(label) ?? 0;
    return r0 + idx * step;
  };

  return Object.assign(fn, {
    domain,
    range,
    bandwidth,
    step
  });
}
