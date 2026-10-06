import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMPILED_CODEMOD_DIRNAME,
  DIST_CODEMOD_DIRNAME,
  MIGRATION_ASSET_FILENAMES,
  builtMigrationAssetsDir
} from './migration-assets-layout.ts';

/**
 * Whether `build:codemod` has produced this checkout's `dist-codemod`, for the
 * tests that exercise the real artifact rather than a synthetic fixture.
 *
 * Three states, not two. "Not built" is a legitimate reason to skip -- the
 * directory is gitignored build output, so a fresh clone (and CI's unit step,
 * which runs before any build) does not have it. "Incomplete" is not: a
 * `dist-codemod` that exists but lacks a file the build is meant to write is a
 * broken build, or a stale path in the check looking for it, and treating that
 * as "not built" is exactly how these tests spent a release cycle skipping
 * after a complete build. It is reported as a failure naming what is missing.
 *
 * Compiled neither into the package nor into `dist-codemod`: see the
 * `*.test-support.ts` exclude in tsconfig.build.json.
 */
export type BuiltCodemodState =
  | { readonly kind: 'not-built' }
  | { readonly kind: 'incomplete'; readonly missing: readonly string[] }
  | { readonly kind: 'complete' };

export function builtCodemodState(packageRoot: string): BuiltCodemodState {
  const distRoot = join(packageRoot, DIST_CODEMOD_DIRNAME);
  if (!existsSync(distRoot)) {
    return { kind: 'not-built' };
  }
  const compiledDir = join(distRoot, COMPILED_CODEMOD_DIRNAME);
  const assetsDir = builtMigrationAssetsDir(packageRoot);
  const expected = [
    join(compiledDir, 'bin.js'),
    join(compiledDir, 'migrate-audit.js'),
    ...MIGRATION_ASSET_FILENAMES.map((filename) => join(assetsDir, filename))
  ];
  const missing = expected.filter((path) => !existsSync(path));
  return missing.length === 0 ? { kind: 'complete' } : { kind: 'incomplete', missing };
}

/**
 * `SUI_REQUIRE_BUILT_CODEMOD=1` turns "not built" from a skip into a failure,
 * for a gate that has just run the build and must not pass by skipping.
 */
export function requiresBuiltCodemod(): boolean {
  return process.env.SUI_REQUIRE_BUILT_CODEMOD === '1';
}
