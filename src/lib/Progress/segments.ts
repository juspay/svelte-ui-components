/**
 * Number of segments to render as filled in segmented mode.
 *
 * Floors fractional input, clamps to the `[0, segments]` range, and treats any
 * negative value (the continuous-mode indeterminate signal) as zero filled —
 * indeterminate animation is not honoured for discrete segmented progress.
 */
export const clampFilledSegments = (value: number, segments: number): number =>
  Math.max(0, Math.min(segments, Math.floor(value)));
