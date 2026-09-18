/** How value changes are exposed to assistive technology. */
export type AnimatedNumberLive = 'off' | 'polite' | 'assertive';

export type AnimatedNumberProperties = MandatoryAnimatedNumberProperties &
  OptionalAnimatedNumberProperties;

export type MandatoryAnimatedNumberProperties = {
  /**
   * The value to display. A `number` is formatted through `Intl.NumberFormat`
   * and decomposed semantically, so the component knows a group separator from
   * a currency symbol. A `string` is taken as already-formatted and diffed
   * against the previous string instead -- which is what lets a consumer's own
   * formatter, or a pre-formatted prop like `StatCard.value`, animate without
   * anyone having to surface the underlying number.
   */
  value: number | string;
};

export type OptionalAnimatedNumberProperties = {
  /**
   * BCP 47 locale used to format a numeric `value`. Defaults to a fixed
   * `'en-US'` rather than the runtime's ambient default: `Intl.NumberFormat`
   * with an undefined locale resolves against whatever the executing
   * environment reports, which differs between the process that prerenders a
   * page and the browser that hydrates it. Pinning it keeps the server and the
   * first client frame byte-identical.
   * @default 'en-US'
   */
  locale?: string;
  /** `Intl.NumberFormat` options applied when `value` is a number. */
  format?: Intl.NumberFormatOptions;
  /**
   * Whether value changes are announced. Left `'off'`, the accessible name
   * still updates -- it is simply not interrupted into. Reserve `'polite'` for
   * values that change infrequently; a rapidly changing value queues one
   * announcement per change, with no coalescing.
   * @default 'off'
   */
  live?: AnimatedNumberLive;
  /**
   * Rolls every column up from zero when the number first appears, instead of
   * painting it outright.
   *
   * Off by default, because a number that was always going to be on screen
   * should not make the reader wait for it. Turn it on where the figure ARRIVES
   * -- a dashboard whose metrics land after a fetch, a total that appears at the
   * end of a flow -- and especially where the value then never changes again:
   * without this, such a number is static for its whole life and the odometer
   * does nothing at all.
   *
   * Independent of the rolls that follow. A later change animates either way,
   * and this only governs the first paint.
   * @default false
   */
  animateOnMount?: boolean;
  /** Overrides the accessible name, which otherwise mirrors the visible text. */
  ariaLabel?: string;
  /** Value for the `data-pw` attribute on the root element for E2E selection. */
  testId?: string;
  /** Extra CSS classes applied to the root element for consumer theming. */
  classes?: string;
};
