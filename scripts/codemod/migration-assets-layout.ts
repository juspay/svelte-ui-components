import { join } from 'node:path';

/**
 * Where the migration assets live in the BUILT package, in one place.
 *
 * Three different pieces of code have to agree on this directory and, before
 * this module, each spelled it out on its own: the generator that writes it
 * (`generate-migration-assets.ts`), the compiled reader that finds it
 * (`migrate-audit.ts`) and the unit tests that check the real artifact. When
 * `tsconfig.build.json` gained a second source tree the compiled layout moved
 * from `dist-codemod/migration-assets` to `dist-codemod/codemod/migration-assets`;
 * the generator and the reader were updated and the test's hand-written copy of
 * the old path was not, so its "run build:codemod first" skip kept firing after
 * a complete build and the real-artifact checks silently stopped running.
 *
 * The assets sit BESIDE the compiled `migrate-audit.js` and are resolved off
 * its own `import.meta.url`, so the layout is "a `migration-assets` directory
 * next to the compiled module", not an absolute location:
 *
 *   dist-codemod/                     <- tsconfig.build.json `outDir`
 *     codemod/                        <- `scripts/codemod`, relative to its `rootDir` (`scripts`)
 *       bin.js  migrate-audit.js  ...
 *       migration-assets/             <- written by generate-migration-assets.ts
 *         wc-display.json  legacy-display.css  legacy-palette.css
 *
 * `migration-assets-layout.test.ts` pins these constants to `tsconfig.build.json`
 * (`outDir`, `rootDir`) and to package.json (`bin`, `files`) so a change to any
 * of them fails there instead of being discovered as a skipped test.
 *
 * Compiled into `dist-codemod` (it is imported by `migrate-audit.ts`) and also
 * imported by the build-only generator, which node runs with
 * `--experimental-strip-types`: keep it to erasable TypeScript.
 */

/** Package-root directory `build:codemod` emits into; `tsconfig.build.json` `outDir`. */
export const DIST_CODEMOD_DIRNAME = 'dist-codemod';

/** `scripts/codemod` as it appears under `DIST_CODEMOD_DIRNAME`, because `rootDir` is `scripts`. */
export const COMPILED_CODEMOD_DIRNAME = 'codemod';

export const MIGRATION_ASSETS_DIRNAME = 'migration-assets';

export const WC_DISPLAY_FILENAME = 'wc-display.json';
export const LEGACY_DISPLAY_CSS_FILENAME = 'legacy-display.css';
export const LEGACY_PALETTE_CSS_FILENAME = 'legacy-palette.css';

/** Everything the generator writes into the assets directory. */
export const MIGRATION_ASSET_FILENAMES: readonly string[] = [
  WC_DISPLAY_FILENAME,
  LEGACY_DISPLAY_CSS_FILENAME,
  LEGACY_PALETTE_CSS_FILENAME
];

/**
 * The assets directory that sits beside a compiled module. The runtime lookup:
 * `migrate-audit.ts` passes its own directory.
 */
export function migrationAssetsDirBeside(compiledModuleDir: string): string {
  return join(compiledModuleDir, MIGRATION_ASSETS_DIRNAME);
}

/**
 * The assets directory a build of the package rooted at `packageRoot` produces
 * and the published tarball ships. The generator's default `--out`, and what
 * the real-artifact tests read.
 */
export function builtMigrationAssetsDir(packageRoot: string): string {
  return migrationAssetsDirBeside(
    join(packageRoot, DIST_CODEMOD_DIRNAME, COMPILED_CODEMOD_DIRNAME)
  );
}
