/**
 * How a chart legend summarises a series' values into one number shown
 * beside its label. `'none'` (the default for every series that doesn't set
 * this) shows nothing -- the feature is purely additive.
 */
export type SeriesAggregate = 'sum' | 'average' | 'min' | 'max' | 'none';

/**
 * Reduces a series' values to a single number for its legend entry.
 *
 * Null and non-finite entries (a missing point, or `NaN`/`Infinity` slipping
 * through past the `number` type at runtime) are treated as ABSENT rather
 * than as zero -- they are skipped entirely, not summed/counted as 0. This
 * only changes the result for `average` (skipping shrinks the denominator)
 * and `min`/`max` (an absent point can never set an extreme); `sum` is
 * identical either way since 0 is the additive identity.
 *
 * Zero remaining values after skipping -- an empty series, or one whose
 * points are all absent -- resolves to `null` for EVERY kind, `sum`
 * included: a "total" of 0 for a series with no real data would be a
 * fabricated number, not an observed one, so the legend renders nothing
 * rather than a misleading 0.
 *
 * Aggregation is always over one series' own values, never across a stack --
 * a stacked bar/area chart's per-category stack total is an unrelated,
 * existing computation (the y-domain sum) that this function does not touch.
 */
export function computeSeriesAggregate(
  values: ReadonlyArray<number | null>,
  aggregate: SeriesAggregate
): number | null {
  if (aggregate === 'none') {
    return null;
  }

  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    if (value === null || !Number.isFinite(value)) {
      continue;
    }
    sum += value;
    count += 1;
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  if (count === 0) {
    return null;
  }

  switch (aggregate) {
    case 'sum':
      return sum;
    case 'average':
      return sum / count;
    case 'min':
      return min;
    case 'max':
      return max;
    default:
      return null;
  }
}

/**
 * Computes and formats a series aggregate for legend display in one step,
 * reusing the chart's own value formatter (the same one driving its
 * axis/tooltip) rather than a parallel formatting path. Returns `null` --
 * render nothing -- whenever there is no aggregate to show, so the formatter
 * is never handed `NaN` and a caller never needs its own null guard.
 */
export function formatSeriesAggregate(
  values: ReadonlyArray<number | null>,
  aggregate: SeriesAggregate,
  format: (value: number) => string
): string | null {
  const value = computeSeriesAggregate(values, aggregate);
  return value === null ? null : format(value);
}
