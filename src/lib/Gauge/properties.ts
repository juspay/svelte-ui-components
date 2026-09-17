export type GaugeProperties = MandatoryGaugeProperties & OptionalGaugeProperties;

export type MandatoryGaugeProperties = {
  value: number;
};

export type OptionalGaugeProperties = {
  /**
   * The maximum value of the gauge. `value` is divided by `max` to compute
   * the fill percentage, so `<Gauge value={50} max={200} />` renders at 25%.
   * Defaults to `100` (making `value` a direct percentage). When `max` is 0
   * or negative the gauge renders empty (0%) to avoid division by zero.
   * @default 100
   */
  max?: number;
  /** Whether to show the centered percentage label. @default true */
  showLabel?: boolean;
  /**
   * Custom label renderer called with the raw `(value, max)` pair. Return any
   * string to replace the default `"${Math.round(percentage)}%"` label.
   * Example: `labelFormatter={(v, m) => \`${v} / ${m}\`}` shows "50 / 200".
   */
  labelFormatter?: (value: number, max: number) => string;
  /**
   * Routes the centered label through `AnimatedNumber` so it rolls to its new
   * value instead of jumping. Both routes pass a complete STRING and diff it
   * character by character: `labelFormatter`'s own output when it is set, and
   * `` `${roundedPercentage}%` `` when it is not. The unit goes inside rather
   * than beside, because the odometer carries `role="img"` with its own
   * accessible name and anything left outside is invisible to a reader
   * navigating by graphic. Only the digits move; the `%` is a literal column
   * that never rolls. Off by default so an unset prop renders the exact static
   * text node it always has.
   * @default false
   */
  animateValue?: boolean;
  /**
   * Accessible label for the gauge element (`role="progressbar"`). Falls back
   * to the computed `labelText` (e.g. `"75%"`) when not provided, so assistive
   * technology announces the current percentage by default.
   */
  ariaLabel?: string;
  /** Value for the `data-pw` attribute on the root element for E2E test selection. */
  testId?: string;
  /** Extra CSS classes applied to the root element for consumer theming. */
  classes?: string;
};
