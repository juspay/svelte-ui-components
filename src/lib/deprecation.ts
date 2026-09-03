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
