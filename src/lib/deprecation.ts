/**
 * Phase 2 of `docs/EVENT_CASING_MIGRATION.md`: tell a consumer, once, that a
 * prop spelling is going away and what replaces it.
 *
 * Two constraints shape this.
 *
 * It is dev-only. A production warning is noise a consumer cannot act on
 * mid-incident, and 142 props warning in a production console would bury real
 * output. `import.meta.env.DEV` is the guard because it is what the bundler
 * this library is built with statically replaces, so the whole call is removed
 * from a production build rather than merely skipped at runtime.
 *
 * It warns once per component-and-prop, not once per render. A deprecated prop
 * on a list row would otherwise warn on every one of a thousand rows, and a
 * consumer would learn less from a thousand identical lines than from one.
 *
 * Internal. Nothing here is re-exported from `src/lib/index.ts`, because a
 * consumer has no call for it: the components invoke it themselves when they
 * are handed a deprecated spelling. That is this library's normal way of
 * marking a module internal rather than an omission -- `src/lib/utils.ts`
 * exports ten functions and the barrel re-exports three, leaving
 * `getStorageItem`, `hexToRgb` and five others reachable only from inside.
 * Exporting these two would add public API that 4.0.0 then has to keep.
 */

/**
 * The release that removes the old spellings, named in one place so the message
 * and the migration plan cannot drift apart.
 *
 * 4.0.0 is a commitment, not a placeholder. An earlier draft of this string was
 * written while #506 was expected to cut the major; it shipped inside 3.2.0 as
 * a minor instead, which briefly left this warning promising a version nothing
 * was committed to. `docs/EVENT_CASING_MIGRATION.md` holds the plan; a test
 * pins this value so moving it is a deliberate edit and not a silent one.
 */
export const DEPRECATION_REMOVAL_VERSION = '4.0.0';

const seen = new Set<string>();

/**
 * Exposed for tests. A module-level Set survives between test cases, so a
 * second case asserting "warns once" would pass vacuously by inheriting the
 * first case's suppression rather than by exercising it.
 */
export const resetDeprecationWarnings = (): void => {
  seen.clear();
};

export const warnDeprecatedProp = (component: string, oldName: string, newName: string): void => {
  if (import.meta.env.DEV !== true) {
    return;
  }
  const key = `${component}.${oldName}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  console.warn(
    `[svelte-ui-components] \`${oldName}\` on <${component}> is deprecated and will be ` +
      `removed in ${DEPRECATION_REMOVAL_VERSION}. Use \`${newName}\` instead — both work today. ` +
      `Run \`npx sui-codemod --dry-run ./src\` to see every affected call site.`
  );
};

/**
 * The other half of phase 2: decide which of the two values wins, and warn
 * exactly when that decision is the one a consumer should act on.
 *
 * `warnDeprecatedProp` only knows how to print a message -- something still
 * has to pick a value, and it has to be the same call site so the two cannot
 * drift (a component naming one prop in its `$derived` line while the warning
 * names another). This is that call site, meant to replace it directly:
 * `const onclick = $derived(onClick ?? onclickLegacy)` becomes
 * `const onclick = $derived(resolveDeprecatedProp('Toggle', 'onclick',
 * 'onClick', onclickLegacy, onClick))`.
 *
 * It warns only when the legacy value is the one actually taking effect --
 * `current` absent, `legacy` present. A consumer who passed only the
 * corrected spelling, or passed neither, has not done anything deprecated and
 * gets no warning for it. Checked with `typeof legacy !== 'undefined'` rather
 * than truthiness, so a legacy value of `false` or `0` still counts as
 * supplied -- these are event-handler props today, but the check does not
 * assume that.
 *
 * `legacy` and `current` are left as a bare `T` rather than `T | undefined`:
 * this repo's lint config bans the `undefined` keyword in a type position the
 * same way it bans the bare identifier, and every alias pair's two spellings
 * already share one signature (phase 1 generated the corrected declaration by
 * copying the legacy one), so inferring `T` from the two arguments as-passed
 * -- each already `Handler | undefined` via its `?:` in `properties.ts` --
 * lands on the same effective type without writing the keyword.
 */
export const resolveDeprecatedProp = <T>(
  component: string,
  oldName: string,
  newName: string,
  legacy: T,
  current: T
) => {
  if (typeof current === 'undefined' && typeof legacy !== 'undefined') {
    warnDeprecatedProp(component, oldName, newName);
  }
  return current ?? legacy;
};

/**
 * Forces the alias `$derived`s to evaluate once at mount.
 *
 * A `$derived` runs only when it is read, and for most components the alias
 * is read inside the event handler -- so a consumer who passed the legacy
 * spelling and never triggered the event would never be told. Each wired
 * component calls this from one `$effect.pre` with every alias it declares;
 * the read is the whole point, so the values themselves are unused.
 */
export const readDeprecatedProps = (..._values: readonly unknown[]): void => {};
