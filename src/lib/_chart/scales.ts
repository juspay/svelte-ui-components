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

  const buildTicks = (tickStep: number): number[] => {
    const ticks: number[] = [];
    let tick = Math.ceil(min / tickStep) * tickStep;
    while (tick <= max + tickStep * 0.001) {
      ticks.push(Math.round(tick * 1e10) / 1e10);
      tick += tickStep;
    }
    return ticks;
  };

  // The next rung up the 1-2-5-10 ladder, e.g. 0.2 → 0.5, 2 → 5, 5 → 10.
  const nextNiceStep = (current: number): number => {
    const stepExp = Math.floor(Math.log10(current) + 1e-10);
    const stepBase = Math.pow(10, stepExp);
    const mantissa = current / stepBase;
    if (mantissa < 1.5) {
      return stepBase * 2;
    }
    if (mantissa < 3.5) {
      return stepBase * 5;
    }
    return stepBase * 10;
  };

  // `count` is a hard maximum (design-system chart spec: "max 6 ticks"), not a
  // hint — the nice-step ladder can overshoot it (range 14 at count 6 picks
  // step 2 → 7 ticks). Escalate the step until the ticks fit: category axes
  // step through whole numbers (any integer stride is a valid category step,
  // so 15 days at max 6 lands on the natural every-3rd-day), numeric axes
  // climb the ladder so tick values stay round.
  let ticks = buildTicks(step);
  const maxTicks = Math.max(2, count);
  while (ticks.length > maxTicks) {
    step = integer ? Math.floor(step) + 1 : nextNiceStep(step);
    ticks = buildTicks(step);
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
