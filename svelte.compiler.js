/**
 * The repo's Svelte compiler options, in one place. SvelteKit 3 no longer reads
 * `svelte.config.js`, so these are passed to `sveltekit()` in vite.config.ts and imported
 * directly by everything else that needs the same options: both ESLint configs and
 * src/lib/compiler-warning-dispositions.test.ts, which compiles sources with exactly
 * these options to prove which warnings the repo really reports.
 */

/**
 * `src/wc/components/*.wc.svelte` declare `<svelte:options customElement={{ tag, ... }} />`
 * and are real custom elements, but the `customElement: true` compile option that the
 * compiler's hint refers to is set only by `vite.config.wc.ts` -- the build that ships them.
 * Every other reader of those files has no such option: `svelte-check`'s main program reaches
 * `Card.wc.svelte` through `src/wc-card-footer-slot.test.ts`, and vitest compiles the wrappers
 * through the `sveltekit()` plugin. Each reports `options_missing_custom_element` about a file
 * that is already compiled correctly where it matters, which is a warning about the reader
 * rather than about the code.
 *
 * Scoped to that one code AND to `.wc.svelte` filenames: the same option on any other file still
 * warns, and every other warning on a wrapper is untouched. Not a switch for the option itself --
 * `customElement: true` here would make the app and the library build compile every component as
 * a custom element.
 *
 * @param {{ code: string; filename?: string }} warning
 * @returns {boolean} true to keep the warning
 */
const keepWarning = (warning) =>
  !(
    warning.code === 'options_missing_custom_element' &&
    typeof warning.filename === 'string' &&
    /\.wc\.svelte$/.test(warning.filename)
  );

/** @satisfies {import('svelte/compiler').CompileOptions} */
export const compilerOptions = {
  runes: true,
  warningFilter: keepWarning
};
