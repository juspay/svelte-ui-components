/**
 * Documented, tested calendar-tick helpers for the temporal limitation in
 * Line/AreaChart's x axis -- see docs/CHART_INPUT_POLICY.md#calendar--temporal-axes
 * for the full policy this satisfies.
 *
 * Line/AreaChart's x axis is a plain numeric linear scale (`createLinearScale`
 * in `./scales`). Epoch-millisecond x values preserve relative distance --
 * `t2 - t1` still means the same thing in pixels as it does in time -- but
 * `computeLinearTicks`'s "nice round number" ticks are not calendar-aware:
 * they land on values like 1_700_000_000_000 or a rounded step in
 * milliseconds, not on UTC midnight/week/month boundaries. `xTickFormat`
 * only changes how a tick's existing numeric position is labelled; it cannot
 * move that position onto a calendar boundary, and neither chart accepts an
 * explicit tick-position override today (`Axis.svelte`, shared by every chart
 * type in this package, always derives its own tick positions from the
 * scale) -- wiring one in is deliberately out of scope here, since it would
 * change a contract every other chart consumes, not just these two.
 *
 * `computeUtcTicks`/`formatUtcTick` are the disclosed alternative: pure,
 * fully-tested functions a caller can use to compute correct UTC calendar
 * tick positions and labels for their own presentation (a custom axis
 * overlay, a legend of period boundaries, or pre-bucketing data into
 * calendar-aligned x values before it ever reaches the chart). They do not
 * replace the chart's linear scale with array indices, and they impose
 * nothing on a caller who does not import this module -- both charts behave
 * exactly as before.
 */

const MS_PER_DAY = 86_400_000;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

export type UtcTickUnit = 'day' | 'week' | 'month';

function startOfUtcDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function startOfUtcMonth(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/**
 * Computes UTC calendar-aligned tick positions (epoch ms) covering
 * `[domain[0], domain[1]]`. `unit` picks the calendar grain; ticks are
 * thinned so the count stays at or under `maxTicks` (mirrors Line/AreaChart's
 * own tick-count capping).
 *
 * Returns `[]` for a non-finite or inverted domain -- callers pass this
 * straight into `xTicks`, and an empty array there just falls back to no
 * override (see LineChart/AreaChart docs).
 */
export function computeUtcTicks(
  domain: readonly [number, number],
  unit: UtcTickUnit,
  maxTicks: number = 8
): number[] {
  const [minMs, maxMs] = domain;
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || maxMs < minMs) {
    return [];
  }

  if (unit === 'month') {
    const approxMonths = Math.max(1, Math.round((maxMs - minMs) / (MS_PER_DAY * 30)));
    const stepMonths = Math.max(1, Math.ceil((approxMonths + 1) / maxTicks));
    const ticks: number[] = [];
    let cursor = startOfUtcMonth(minMs);
    // Bounded by the month count rather than a time delta -- months vary in
    // length, so stepping by calendar month (not a fixed ms step) is what
    // makes these boundaries actually land on the 1st in UTC.
    let guard = 0;
    while (cursor <= maxMs && guard < 10_000) {
      ticks.push(cursor);
      const d = new Date(cursor);
      cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + stepMonths, 1);
      guard++;
    }
    return ticks;
  }

  const stepDays = unit === 'week' ? 7 : 1;
  const stepMs = stepDays * MS_PER_DAY;
  const spanSteps = Math.max(1, (maxMs - minMs) / stepMs);
  const thinning = Math.max(1, Math.ceil(spanSteps / maxTicks));

  const ticks: number[] = [];
  let cursor = startOfUtcDay(minMs);
  let i = 0;
  let guard = 0;
  while (cursor <= maxMs && guard < 10_000) {
    if (i % thinning === 0) {
      ticks.push(cursor);
    }
    cursor += stepMs;
    i++;
    guard++;
  }
  return ticks;
}

/**
 * Formats an epoch-ms tick value produced by `computeUtcTicks` as a UTC
 * calendar label ("Mar 4" for day/week, "Mar 2026" for month). Pass as
 * `xTickFormat` alongside `xTicks={computeUtcTicks(...)}`.
 */
export function formatUtcTick(value: number, unit: UtcTickUnit = 'day'): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  const d = new Date(value);
  const month = MONTH_NAMES[d.getUTCMonth()];
  if (unit === 'month') {
    return `${month} ${d.getUTCFullYear()}`;
  }
  return `${month} ${d.getUTCDate()}`;
}
