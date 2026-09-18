/**
 * Whether a displayed value is a METRIC worth rolling, or an identifier that
 * merely contains digits.
 *
 * The distinction is not cosmetic. Adopting the odometer across a dashboard
 * mapper animated `demo-store.myshopify.com` and `Shinchan Store GA4 (987654321)`
 * on the anomaly surface: a store domain and a GA4 account id, rolled digit by
 * digit as though they were measurements. Nothing was broken -- they went
 * through the same `statcard-value` slot as `₹60k` -- which is exactly why a
 * blanket "animate this card's values" is the wrong instruction.
 *
 * The rule is digits plus decoration. A metric is allowed to carry a currency
 * symbol, a sign, a percent, group and decimal separators, and SHORT unit words
 * -- `₹60k`, `90%`, `₹1.23Cr`, `12m 15s`, `-8%`. Anything else with a long
 * alphabetic run, a dotted hostname or a parenthesised id is an identifier and
 * is left alone.
 *
 * Deliberately conservative in one direction only: a metric wrongly refused
 * renders exactly as it does today, while an identifier wrongly accepted is a
 * number spinning in a domain name.
 */

/** Unit fragments a metric may carry. Matched case-insensitively, whole-run. */
const UNITS = new Set([
  'k',
  'l',
  'm',
  'b',
  't',
  'cr',
  'lac',
  'lakh',
  'mn',
  'bn',
  's',
  'ms',
  'h',
  'hr',
  'hrs',
  'd',
  'day',
  'days',
  'min',
  'mins',
  'sec',
  'secs',
  'x',
  'pt',
  'pts',
  'px'
]);

/** Decoration that carries no meaning for this decision. */
const DECORATION = /[\p{Nd}\s,.:+%()[\]]|\p{Sc}|\p{Pd}|\p{Sm}/gu;

export const isAnimatableMetric = (text: string): boolean => {
  if (typeof text !== 'string') {
    return false;
  }
  const value = text.trim();
  if (value.length === 0 || !/\p{Nd}/u.test(value)) {
    return false;
  }
  // A dotted hostname or an email is an identifier however many digits it has.
  if (/\.[a-z]{2,}(?:\/|$)|@|\/\//i.test(value)) {
    return false;
  }
  // A parenthesised run of digits is an id in a label, not a measurement:
  // "Shinchan Store GA4 (987654321)".
  if (/\([^)]*\p{Nd}[^)]*\)/u.test(value)) {
    return false;
  }
  // What remains once digits and decoration are removed must be unit words only.
  const remainder = value.replace(DECORATION, ' ');
  const words = remainder.split(/\s+/).filter((word) => word.length > 0);
  return words.every((word) => UNITS.has(word.toLowerCase()));
};
