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
  showLabel?: boolean;
  /**
   * Custom label renderer called with the raw `(value, max)` pair. Return any
   * string to replace the default `"${Math.round(percentage)}%"` label.
   * Example: `labelFormatter={(v, m) => \`${v} / ${m}\`}` shows "50 / 200".
   */
  labelFormatter?: (value: number, max: number) => string;
  testId?: string;
  classes?: string;
};
