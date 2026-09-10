/**
 * Runtime counterpart to the `@deprecated` markers on `attrs` (#576).
 *
 * Both Card and Pill spread `attrs` onto their root FIRST and write their own
 * managed attributes after, so an entry for a managed key is accepted, spread,
 * and then overwritten. 4.19.0 made that visible in the type by deprecating
 * those keys, which reaches someone reading TypeScript in an editor and nobody
 * else: a plain-JS consumer, or anyone driving `<sui-card>` / `<sui-pill>` as a
 * web component, has no types at all and still gets silence.
 *
 * These maps carry the same guidance the `@deprecated` tags carry, as data the
 * components can read at runtime. `attrs-discard.test.ts` pins each list
 * against its `*StrictAttrs` type so the two cannot drift apart.
 */

/** What Card writes on its own root, and what a consumer should reach for instead. */
export const CARD_MANAGED_ATTRS = {
  class: 'use the `classes` prop',
  style: 'use the `cssVars` prop',
  role: 'Card derives it from `onclick`/`href`; there is no prop for it',
  tabindex: 'Card derives it from `onclick`/`href`; there is no prop for it',
  href: 'use the `href` prop',
  target: 'use the `target` prop',
  rel: 'use the `rel` prop',
  onclick: 'use the `onclick` prop',
  onkeydown: 'Card binds its own to activate on Enter/Space; there is no prop for it',
  'data-pw': 'use the `testId` prop',
  testID: 'use the `testId` prop'
} as const;

/** What Pill writes on its own root, and what a consumer should reach for instead. */
export const PILL_MANAGED_ATTRS = {
  class: 'use the `classes` prop',
  type: 'Pill always supplies `type="button"` on a button root; there is no prop for it',
  role: 'Pill derives it from whether it is interactive; there is no prop for it',
  tabindex: 'Pill derives it from whether it is interactive; there is no prop for it',
  title: 'use the `title` prop',
  onclick: 'use the `onclick` prop',
  onkeydown: 'Pill binds its own to activate on Enter/Space; there is no prop for it',
  'data-pw': 'use the `testId` prop',
  testID: 'use the `testId` prop',
  'aria-disabled': 'Pill derives it from the `disabled` prop',
  'aria-expanded': 'Pill derives it from the `ariaExpanded` prop',
  'aria-pressed': 'Pill derives it from the `ariaPressed` prop'
} as const;

/**
 * The messages for every managed key present in `attrs`, in the order the
 * component's own list declares them. Pure: the caller decides whether the
 * environment is one that should be told, and does the reporting.
 *
 * `attrs` is the optional trailing parameter so an absent one is simply not
 * passed: the repo bans the `undefined` keyword outright.
 *
 * Only own properties count. An object built on a prototype that happens to
 * carry `class` did not ask for that attribute to be spread, and warning about
 * it would be noise a consumer cannot act on.
 */
export const discardedAttrWarnings = (
  component: string,
  managed: Readonly<Record<string, string>>,
  attrs?: Readonly<Record<string, string>>
): readonly string[] => {
  if (!attrs) {
    return [];
  }

  return Object.keys(managed)
    .filter((key) => Object.prototype.hasOwnProperty.call(attrs, key))
    .map(
      (key) =>
        `[svelte-ui-components] ${component}: the "${key}" entry in \`attrs\` is discarded, ` +
        `because ${component} writes its own "${key}" after spreading \`attrs\` — ${managed[key]}.`
    );
};
