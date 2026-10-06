import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it, onTestFinished } from 'vitest';
import { builtCodemodState, requiresBuiltCodemod } from './built-codemod.test-support.ts';
import { loadWcDisplay } from './migrate-audit.ts';
import {
  COMPILED_CODEMOD_DIRNAME,
  DIST_CODEMOD_DIRNAME,
  LEGACY_DISPLAY_CSS_FILENAME,
  LEGACY_PALETTE_CSS_FILENAME,
  MIGRATION_ASSETS_DIRNAME,
  MIGRATION_ASSET_FILENAMES,
  WC_DISPLAY_FILENAME,
  builtMigrationAssetsDir,
  migrationAssetsDirBeside
} from './migration-assets-layout.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

/**
 * ISSUE-032. The migrate-audit real-artifact checks looked for
 * `dist-codemod/migration-assets`, the build wrote
 * `dist-codemod/codemod/migration-assets`, and the mismatch surfaced only as a
 * skip. The directory is now one shared constant; these tests are what keep the
 * constant itself from drifting away from the configuration that really decides
 * the layout, which is tsc's `outDir`/`rootDir` and package.json's `bin`/`files`.
 */

describe('migration-assets layout — pinned to the configuration that decides it', () => {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    join(here, 'tsconfig.build.json'),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} }
  );

  it('reads tsconfig.build.json', () => {
    expect(parsed).toBeDefined();
    expect(parsed?.errors ?? []).toEqual([]);
  });

  it('puts scripts/codemod/migrate-audit.js where tsc emits it, so "beside the compiled module" is the shared location', () => {
    const outDir = parsed?.options.outDir;
    const rootDir = parsed?.options.rootDir;
    if (typeof outDir !== 'string' || typeof rootDir !== 'string') {
      throw new Error('tsconfig.build.json must set both outDir and rootDir');
    }
    // What tsc does with `rootDir`: the path of a source file under it is kept
    // under `outDir`.
    const emitted = join(outDir, relative(rootDir, join(here, 'migrate-audit.ts'))).replace(
      /\.ts$/,
      '.js'
    );

    expect(dirname(emitted)).toBe(join(repoRoot, DIST_CODEMOD_DIRNAME, COMPILED_CODEMOD_DIRNAME));
    expect(migrationAssetsDirBeside(dirname(emitted))).toBe(builtMigrationAssetsDir(repoRoot));
  });

  it('is the directory the published bin and file list reach', () => {
    const pkg: unknown = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const record = typeof pkg === 'object' && pkg !== null ? pkg : {};
    const bin: unknown = Reflect.get(record, 'bin');
    const files: unknown = Reflect.get(record, 'files');

    expect(bin).toEqual({
      'sui-codemod': `./${DIST_CODEMOD_DIRNAME}/${COMPILED_CODEMOD_DIRNAME}/bin.js`
    });
    // `files` is an allow-list: the assets only ship because the whole
    // `dist-codemod` directory does.
    expect(files).toEqual(expect.arrayContaining([DIST_CODEMOD_DIRNAME]));
  });

  it('is written by build:codemod after the compile step, from the committed generator', () => {
    const pkg: unknown = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const scripts: unknown =
      typeof pkg === 'object' && pkg !== null ? Reflect.get(pkg, 'scripts') : null;
    const buildCodemod: unknown =
      typeof scripts === 'object' && scripts !== null
        ? Reflect.get(scripts, 'build:codemod')
        : null;

    expect(buildCodemod).toContain(`rm -rf ${DIST_CODEMOD_DIRNAME}`);
    expect(buildCodemod).toContain('scripts/codemod/tsconfig.build.json');
    expect(buildCodemod).toContain('scripts/codemod/generate-migration-assets.ts');
  });

  it('names every file the generator writes, and the reader’s own constants agree', () => {
    expect([...MIGRATION_ASSET_FILENAMES].sort()).toEqual(
      [WC_DISPLAY_FILENAME, LEGACY_DISPLAY_CSS_FILENAME, LEGACY_PALETTE_CSS_FILENAME].sort()
    );
    expect(MIGRATION_ASSETS_DIRNAME).toBe('migration-assets');
    expect(builtMigrationAssetsDir('/pkg')).toBe(
      join('/pkg', 'dist-codemod', 'codemod', 'migration-assets')
    );
  });
});

describe('builtCodemodState — what counts as "not built"', () => {
  function packageRootWith(files: readonly string[]): string {
    const root = mkdtempSync(join(tmpdir(), 'sui-built-codemod-state-'));
    onTestFinished(() => {
      rmSync(root, { recursive: true, force: true });
    });
    for (const file of files) {
      const path = join(root, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, '');
    }
    return root;
  }

  const assets = MIGRATION_ASSET_FILENAMES.map(
    (name) =>
      `${DIST_CODEMOD_DIRNAME}/${COMPILED_CODEMOD_DIRNAME}/${MIGRATION_ASSETS_DIRNAME}/${name}`
  );
  const compiled = ['bin.js', 'migrate-audit.js'].map(
    (name) => `${DIST_CODEMOD_DIRNAME}/${COMPILED_CODEMOD_DIRNAME}/${name}`
  );

  it('is "not-built" only when dist-codemod does not exist at all', () => {
    expect(builtCodemodState(packageRootWith([]))).toEqual({ kind: 'not-built' });
  });

  it('is "complete" when the compiled entry points and every asset are at the shared location', () => {
    expect(builtCodemodState(packageRootWith([...compiled, ...assets]))).toEqual({
      kind: 'complete'
    });
  });

  it('is "incomplete", not "not-built", when the assets are at the OLD location — the exact failure this replaces', () => {
    // dist-codemod/migration-assets/*: where the stale test looked. A directory
    // that exists with its assets in the wrong place must fail, never skip.
    const stale = MIGRATION_ASSET_FILENAMES.map(
      (name) => `${DIST_CODEMOD_DIRNAME}/${MIGRATION_ASSETS_DIRNAME}/${name}`
    );
    const root = packageRootWith([...compiled, ...stale]);
    const state = builtCodemodState(root);

    expect(state.kind).toBe('incomplete');
    if (state.kind === 'incomplete') {
      expect(state.missing.map((path) => relative(root, path))).toEqual(assets);
    }
  });

  it('is "incomplete" when only some assets were written', () => {
    const state = builtCodemodState(packageRootWith([...compiled, assets[0] ?? '']));

    expect(state.kind).toBe('incomplete');
  });
});

// The checks above need no build. Everything below reads the REAL `dist-codemod`
// and so can only run after `build:codemod` -- see migrate-audit.test.ts for why
// "never built" skips and "built but wrong" fails.
describe('the built dist-codemod package', () => {
  const state = builtCodemodState(repoRoot);

  if (state.kind === 'not-built' && !requiresBuiltCodemod()) {
    it.skip(`skipped: run "pnpm run build:codemod" first (${join(repoRoot, DIST_CODEMOD_DIRNAME)} not built)`, () => {});
    return;
  }

  const assetsDir = builtMigrationAssetsDir(repoRoot);

  it('is complete: compiled entry points and every migration asset exist at the shared location', () => {
    expect(state).toEqual({ kind: 'complete' });
  });

  it('wrote a non-empty, valid wc-display.json and both shim stylesheets there', () => {
    const wcDisplay = loadWcDisplay(join(assetsDir, WC_DISPLAY_FILENAME));
    expect(wcDisplay.status).toBe('ok');
    for (const filename of [LEGACY_DISPLAY_CSS_FILENAME, LEGACY_PALETTE_CSS_FILENAME]) {
      expect(readFileSync(join(assetsDir, filename), 'utf8').trim().length).toBeGreaterThan(0);
    }
  });

  it('did not also copy the assets to the old dist-codemod/migration-assets location', () => {
    // The fix is to look in the right place, not to put a second copy in the
    // wrong one so a stale path keeps passing.
    expect(existsSync(join(repoRoot, DIST_CODEMOD_DIRNAME, MIGRATION_ASSETS_DIRNAME))).toBe(false);
  });

  it('resolves its assets at run time through the compiled sui-codemod bin, with no assetsDir override', () => {
    // The only check that exercises `defaultAssetsDir()` -- the lookup a
    // consumer's installed binary performs -- rather than a path a test passes in.
    const consumer = mkdtempSync(join(tmpdir(), 'sui-built-codemod-consumer-'));
    onTestFinished(() => {
      rmSync(consumer, { recursive: true, force: true });
    });
    mkdirSync(join(consumer, 'src'));
    writeFileSync(
      join(consumer, 'src', 'Toolbar.svelte'),
      '<div><sui-badge></sui-badge><sui-badge></sui-badge></div>'
    );

    const output = execFileSync(
      process.execPath,
      [
        join(repoRoot, DIST_CODEMOD_DIRNAME, COMPILED_CODEMOD_DIRNAME, 'bin.js'),
        'migrate',
        consumer
      ],
      { encoding: 'utf8' }
    );

    expect(output).toContain(`wc-display.json: ok (`);
    expect(output).toContain(`at ${join(assetsDir, WC_DISPLAY_FILENAME)})`);
    expect(output).not.toContain('NOT FOUND at');
    expect(output).toContain('host-display-inline');
    expect(output).toContain(
      `${LEGACY_DISPLAY_CSS_FILENAME}: present at ${join(assetsDir, LEGACY_DISPLAY_CSS_FILENAME)}`
    );
    expect(output).toContain(
      `${LEGACY_PALETTE_CSS_FILENAME}: present at ${join(assetsDir, LEGACY_PALETTE_CSS_FILENAME)}`
    );
  });
});
