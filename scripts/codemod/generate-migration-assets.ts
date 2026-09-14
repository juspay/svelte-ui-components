import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  collectHostDisplayEntries,
  generateStylesheet,
  type HostDisplayEntry
} from '../migrate/host-display-compat.ts';

/**
 * Runs during `build:codemod`, after the tsc step, and writes the three data
 * artifacts a consumer's `node_modules` cannot derive on its own into
 * `dist-codemod`, which the published tarball does ship (see `files` in
 * package.json). Never itself compiled into dist-codemod -- see this
 * directory's `tsconfig.build.json`, which excludes this file the same way
 * it already excludes `generate-maps.ts` -- because it imports across into
 * `scripts/migrate`, and that tree needs `--experimental-strip-types` plus
 * this repo's own git history, neither of which a consumer install has. Only
 * this file's OUTPUT is meant to ship; the file itself is a build tool, run
 * with `node --experimental-strip-types` like every other script under
 * `scripts/migrate`.
 *
 * Reuses `collectHostDisplayEntries`/`generateStylesheet` rather than
 * re-deriving: re-parsing `src/wc/components/*.svelte` here would let this
 * file's answer drift from the tool it is supposedly just packaging for
 * shipment -- exactly the hardcoded-list failure mode the migration tooling
 * was written to avoid in the first place.
 */

export type WcDisplayAsset = {
  readonly tag: string;
  readonly property: string;
  readonly default: string;
};

/**
 * Reuses `collectHostDisplayEntries`'s own parse and applies the same
 * refuse-rather-than-guess rule `host-display-compat.ts`'s own `run()`
 * applies for its CLI: a wrapper missing its `:host` rule must fail this
 * build, not silently disappear from the shim shipped to every consumer.
 * `existsSync` is checked first only for a clearer message than the raw
 * ENOENT `readdirSync` would otherwise throw.
 */
export function collectWcDisplayEntries(componentsDir: string): readonly HostDisplayEntry[] {
  if (!existsSync(componentsDir)) {
    throw new Error(`generate-migration-assets: ${componentsDir} does not exist`);
  }
  const { entries, skipped } = collectHostDisplayEntries(componentsDir);
  if (skipped.length > 0) {
    throw new Error(
      `generate-migration-assets: refusing to ship wc-display.json -- ${skipped.length} ` +
        `wrapper(s) had no readable tag + :host display declaration: ${skipped.join(', ')}`
    );
  }
  if (entries.length === 0) {
    throw new Error(
      `generate-migration-assets: found no wc wrapper with a :host display declaration under ${componentsDir}`
    );
  }
  return entries;
}

/**
 * `tag`/`property`/`default` only -- `HostDisplayEntry.file` is this
 * checkout's own source path and means nothing in a consumer's tree. Sorted
 * by tag for a deterministic, reviewable diff between builds; the source
 * order (`collectHostDisplayEntries` reads directory entries alphabetically
 * by filename) is close but not guaranteed to match a tag ordering.
 */
export function renderWcDisplayJson(entries: readonly HostDisplayEntry[]): string {
  const assets: readonly WcDisplayAsset[] = [...entries]
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .map((entry) => ({ tag: entry.tag, property: entry.property, default: entry.newDefault }));
  return `${JSON.stringify(assets, null, 2)}\n`;
}

export type MigrationAssetsPaths = {
  readonly root: string;
  readonly outDir: string;
};

export type MigrationAssetsSummary = {
  readonly wcDisplayEntryCount: number;
  readonly wrote: readonly string[];
};

/**
 * Writes all three artifacts into `outDir`.
 *
 * All three contents are resolved before anything is written, so a failure
 * leaves outDir with nothing new in it at all rather than two-thirds of a
 * migration-assets directory that looks complete.
 *
 * Two of the three are derived here from `src/wc/components`, which every
 * checkout has. The third is read from a committed asset because deriving it
 * needs repository history, which a build cannot rely on -- see the comment at
 * its read site.
 */
export function generateMigrationAssets(
  paths: MigrationAssetsPaths,
  log: (line: string) => void
): MigrationAssetsSummary {
  const componentsDir = join(paths.root, 'src/wc/components');
  const entries = collectWcDisplayEntries(componentsDir);
  const wcDisplayJson = renderWcDisplayJson(entries);
  const legacyDisplayCss = generateStylesheet(entries);
  // Read from a committed asset, NOT regenerated here.
  //
  // `buildLegacyPalette` needs repository history: it diffs every
  // `var(--x, literal)` fallback against the pre-4.28 tag. That is fine from a
  // full checkout and fatal in a build, which is where this runs. CI checks out
  // shallow and without tags (ci.yml, visual.yml, pages.yml), and a source
  // tarball has no history at all, so deriving this at build time made `build`,
  // `checks` and `visual` all fail on one missing ref -- correctly, via the
  // guard that stops an unresolvable base silently producing an empty
  // stylesheet, but a build should not depend on that history in the first
  // place.
  //
  // So the derivation happens once, deliberately, and the result is committed
  // and reviewable. `legacy-palette-drift.test.ts` regenerates it and compares,
  // so it cannot go stale unnoticed -- and skips itself when the tag is not
  // reachable, because that is an environment gap rather than a defect.
  const legacyPaletteCss = readFileSync(
    join(paths.root, 'scripts/codemod/assets/legacy-palette.css'),
    'utf8'
  );

  mkdirSync(paths.outDir, { recursive: true });

  const wcDisplayJsonPath = join(paths.outDir, 'wc-display.json');
  writeFileSync(wcDisplayJsonPath, wcDisplayJson);
  log(`wrote ${entries.length} entrie(s) to ${wcDisplayJsonPath}`);

  const legacyDisplayCssPath = join(paths.outDir, 'legacy-display.css');
  writeFileSync(legacyDisplayCssPath, legacyDisplayCss);
  log(`wrote ${legacyDisplayCssPath}`);

  const legacyPaletteCssPath = join(paths.outDir, 'legacy-palette.css');
  writeFileSync(legacyPaletteCssPath, legacyPaletteCss);
  log(`wrote ${legacyPaletteCssPath} (from the committed asset)`);

  return {
    wcDisplayEntryCount: entries.length,
    wrote: [wcDisplayJsonPath, legacyDisplayCssPath, legacyPaletteCssPath]
  };
}

// --------------------------------------------------------------------- CLI

const USAGE = [
  'Usage: node --experimental-strip-types scripts/codemod/generate-migration-assets.ts',
  '',
  'Build-time only -- not shipped (see tsconfig.build.json). Writes the three data artifacts',
  'dist-codemod ships and a consumer checkout cannot derive on its own:',
  '  wc-display.json, legacy-display.css  (from scripts/migrate/host-display-compat.ts)',
  '  legacy-palette.css                   (copied from scripts/codemod/assets/, which is committed',
  '                                        because deriving it needs repository history a build lacks)',
  '',
  '  --root <repo>  repo to read src/wc/components from (default: this file’s own repo)',
  '  --out <dir>    directory to write into (default: <root>/dist-codemod/codemod/migration-assets)',
  '  --help         show this help'
].join('\n');

/**
 * This file's own repo root, derived from its own URL so it is correct
 * regardless of the caller's cwd -- not `new URL('../..', import.meta.url)`,
 * which Vite's static analysis special-cases as an asset-URL reference and
 * rewrites under vitest (same reason `scripts/migrate/cli.ts`'s own
 * `libraryRoot()` uses this form).
 */
function repoRoot(): string {
  const here = fileURLToPath(import.meta.url);
  return resolve(here, '..', '..', '..');
}

export function run(argv: readonly string[], log: (line: string) => void): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        root: { type: 'string' },
        out: { type: 'string' },
        help: { type: 'boolean', default: false }
      },
      allowPositionals: false
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    log(USAGE);
    return 2;
  }

  if (parsed.values.help === true) {
    log(USAGE);
    return 0;
  }

  const rootFlag = parsed.values.root;
  const root = resolve(typeof rootFlag === 'string' ? rootFlag : repoRoot());
  const outFlag = parsed.values.out;
  // Beside the compiled code that reads them, not at the dist root: the build
  // emits two source trees (see tsconfig.build.json's rootDir), so
  // `migrate-audit.js` lands in dist-codemod/codemod/ and resolves these
  // assets off its own `import.meta.url`. Writing them one level up would put
  // them somewhere nothing looks, and the reader's "assets missing" path would
  // report it as an unmigrated consumer rather than a broken build.
  const outDir = resolve(
    typeof outFlag === 'string'
      ? outFlag
      : join(root, 'dist-codemod', 'codemod', 'migration-assets')
  );

  const summary = generateMigrationAssets({ root, outDir }, log);
  log(
    `generate-migration-assets: wrote ${summary.wrote.length} file(s), ` +
      `${summary.wcDisplayEntryCount} wc-display entrie(s)`
  );
  return 0;
}

// Comparing against a basename split on '/' fails on Windows, where argv[1]
// uses backslashes and the split yields the whole path -- normalising both
// sides to a file URL is platform-agnostic. (Same guard as every other
// scripts/migrate and scripts/codemod entry point.)
const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url === pathToFileURL(resolve(entrypoint)).href;

if (invokedDirectly) {
  try {
    process.exitCode = run(process.argv.slice(2), (line) => console.log(line));
  } catch (error) {
    // Loud, not swallowed: an unresolvable --base (or any other failure below)
    // must fail `npm run build:codemod`, never fall back to writing a partial
    // or empty artifact that looks complete.
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
