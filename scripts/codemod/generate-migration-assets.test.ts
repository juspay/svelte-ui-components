import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { HostDisplayEntry } from '../migrate/host-display-compat.ts';
import {
  collectWcDisplayEntries,
  generateMigrationAssets,
  renderWcDisplayJson,
  run
} from './generate-migration-assets.ts';

function entry(
  tag: string,
  property: string,
  newDefault: string,
  file = `${tag}.wc.svelte`
): HostDisplayEntry {
  return { file, tag, property, newDefault };
}

describe('renderWcDisplayJson', () => {
  it('keeps only tag, property and default -- the source file path means nothing outside this checkout', () => {
    const json = renderWcDisplayJson([entry('sui-badge', '--sui-badge-display', 'block')]);

    expect(JSON.parse(json)).toEqual([
      { tag: 'sui-badge', property: '--sui-badge-display', default: 'block' }
    ]);
    expect(json).not.toContain('.wc.svelte');
  });

  it('sorts by tag regardless of input order, for a deterministic diff between builds', () => {
    const json = renderWcDisplayJson([
      entry('sui-zeta', '--sui-zeta-display', 'block'),
      entry('sui-alpha', '--sui-alpha-display', 'inline-block')
    ]);

    expect(JSON.parse(json).map((a: { tag: string }) => a.tag)).toEqual(['sui-alpha', 'sui-zeta']);
  });

  it('ends with a trailing newline, like every other generated file in this repo', () => {
    const json = renderWcDisplayJson([entry('sui-badge', '--sui-badge-display', 'block')]);

    expect(json.endsWith('\n')).toBe(true);
  });
});

/** Same shape every real wc wrapper has -- mirrors host-display-compat.test.ts's own `wrapper()`. */
function wrapper(tag: string, property: string, defaultValue: string): string {
  return [
    '<svelte:options',
    '  customElement={{',
    `    tag: '${tag}',`,
    "    shadow: 'open',",
    '    props: {}',
    '  }}',
    '/>',
    '',
    '<slot></slot>',
    '',
    '<style>',
    '  :host {',
    `    display: var(${property}, ${defaultValue});`,
    '  }',
    '</style>',
    ''
  ].join('\n');
}

function tempComponentsDir(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'sui-generate-migration-assets-'));
  const dir = join(root, 'src/wc/components');
  mkdirSync(dir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents);
  }
  return dir;
}

describe('collectWcDisplayEntries', () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length > 0) {
      const dir = dirs.pop();
      if (typeof dir === 'string') {
        rmSync(resolve(dir, '..', '..', '..'), { recursive: true, force: true });
      }
    }
  });

  it('reads every wrapper in a fixture dir, matching what collectHostDisplayEntries itself returns', () => {
    const dir = tempComponentsDir({
      'Badge.wc.svelte': wrapper('sui-badge', '--sui-badge-display', 'block'),
      'Avatar.wc.svelte': wrapper('sui-avatar', '--sui-avatar-display', 'inline-block')
    });
    dirs.push(dir);

    const entries = collectWcDisplayEntries(dir);

    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.tag).sort()).toEqual(['sui-avatar', 'sui-badge']);
  });

  it('refuses -- rather than silently shrinking the shim -- when a wrapper has no :host display rule', () => {
    const dir = tempComponentsDir({
      'Badge.wc.svelte': wrapper('sui-badge', '--sui-badge-display', 'block'),
      'Bad.wc.svelte': "<svelte:options customElement={{ tag: 'sui-bad' }} />\n<slot></slot>\n"
    });
    dirs.push(dir);

    expect(() => collectWcDisplayEntries(dir)).toThrow(/Bad\.wc\.svelte/);
  });

  it('fails loudly on a missing components directory instead of letting readdirSync throw a bare ENOENT', () => {
    const missing = join(tmpdir(), 'sui-generate-migration-assets-does-not-exist');

    expect(() => collectWcDisplayEntries(missing)).toThrow(/does not exist/);
  });

  it('fails when the directory exists but contains no wrapper with a :host display rule', () => {
    const dir = tempComponentsDir({ 'NotAWrapper.wc.svelte': '<slot></slot>\n' });
    dirs.push(dir);

    // The one file present has neither a tag nor a :host rule, so it is
    // reported as skipped -- the skipped-entries branch fires before the
    // empty-entries branch would, and this asserts that path specifically.
    expect(() => collectWcDisplayEntries(dir)).toThrow(/NotAWrapper\.wc\.svelte/);
  });
});

// ------------------------------------------------ against this repo's own real components

describe('collectWcDisplayEntries — against this repo’s own real src/wc/components', () => {
  it('proves reachability: the real directory this build reads from yields the 99 rules the docs claim, with nothing skipped', () => {
    const realDir = resolve(process.cwd(), 'src/wc/components');

    const entries = collectWcDisplayEntries(realDir);

    expect(entries.length).toBe(99);
    expect(new Set(entries.map((e) => e.tag)).size).toBe(99);
  });
});

// ------------------------------------------------------------- end to end, git-backed

/** A throwaway repo standing in for a consumer's own checkout at build time. */
function fixtureRepo(): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), 'sui-generate-migration-assets-repo-'));
  const run = (args: readonly string[]): string =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' });

  const componentsDir = join(root, 'src/wc/components');
  mkdirSync(componentsDir, { recursive: true });
  mkdirSync(join(root, 'src/lib/Tabs'), { recursive: true });
  writeFileSync(
    join(componentsDir, 'Badge.wc.svelte'),
    wrapper('sui-badge', '--sui-badge-display', 'block')
  );
  writeFileSync(
    join(root, 'src/lib/Tabs/Tabs.svelte'),
    '.item { color: var(--tabs-active-color, #1a73e8); }\n'
  );
  writeFileSync(join(root, 'package.json'), '{ "version": "4.27.6" }\n');

  run(['init', '-q']);
  run(['config', 'user.email', 'test@example.com']);
  run(['config', 'user.name', 'Test']);
  run(['add', '-A']);
  run(['commit', '-q', '-m', 'baseline']);
  const base = run(['rev-parse', 'HEAD']).trim();

  // The committed asset the generator copies. It exists in the fixture because
  // it exists in the real repo: deriving it needs repository history, which a
  // build cannot rely on, so it is generated once and checked in.
  mkdirSync(join(root, 'scripts/codemod/assets'), { recursive: true });
  writeFileSync(
    join(root, 'scripts/codemod/assets/legacy-palette.css'),
    ':root { --tabs-active-color: #1a73e8; }   /* was the 4.27.x default */\n'
  );

  // The working tree the build actually runs against: a real palette change,
  // so legacy-palette.css comes out non-empty too.
  writeFileSync(
    join(root, 'src/lib/Tabs/Tabs.svelte'),
    '.item { color: var(--tabs-active-color, #0b57d0); }\n'
  );

  return { root, base };
}

describe('generateMigrationAssets (end to end)', () => {
  const roots: string[] = [];
  afterEach(() => {
    while (roots.length > 0) {
      const root = roots.pop();
      if (typeof root === 'string') {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it('writes all three artifacts with real, non-empty, cross-checked content', () => {
    const { root } = fixtureRepo();
    roots.push(root);
    const outDir = join(root, 'out');

    const lines: string[] = [];
    const summary = generateMigrationAssets({ root, outDir }, (line) => lines.push(line));

    expect(summary.wcDisplayEntryCount).toBe(1);
    expect(summary.wrote).toHaveLength(3);
    expect(existsSync(join(outDir, 'wc-display.json'))).toBe(true);
    expect(existsSync(join(outDir, 'legacy-display.css'))).toBe(true);
    expect(existsSync(join(outDir, 'legacy-palette.css'))).toBe(true);

    const wcDisplay = JSON.parse(readFileSync(join(outDir, 'wc-display.json'), 'utf8'));
    expect(wcDisplay).toEqual([
      { tag: 'sui-badge', property: '--sui-badge-display', default: 'block' }
    ]);

    const legacyDisplay = readFileSync(join(outDir, 'legacy-display.css'), 'utf8');
    expect(legacyDisplay).toContain('sui-badge { --sui-badge-display: inline; }');

    const legacyPalette = readFileSync(join(outDir, 'legacy-palette.css'), 'utf8');
    expect(legacyPalette).toContain(
      ':root { --tabs-active-color: #1a73e8; }   /* was the 4.27.x default */'
    );

    expect(lines.some((l) => l.includes('wrote 1 entrie(s)'))).toBe(true);
  });

  it('writes nothing at all -- not even the output directory -- when the committed palette asset is missing', () => {
    // Replaces an older test that fed an unresolvable git ref. The build no
    // longer reads repository history at all -- that dependency took down
    // build, checks and visual together on a shallow, tagless CI checkout --
    // so the remaining way this can fail is the committed asset being absent.
    // It must fail loudly: shipping two of three artifacts would leave every
    // consumer a migration-assets directory that looks complete and silently
    // has no palette in it.
    const { root } = fixtureRepo();
    roots.push(root);
    rmSync(join(root, 'scripts/codemod/assets/legacy-palette.css'));
    const outDir = join(root, 'out-failure');

    expect(() => generateMigrationAssets({ root, outDir }, () => {})).toThrow(
      /legacy-palette\.css/
    );

    expect(existsSync(outDir)).toBe(false);
  });

  it('fails before touching the filesystem when the components directory itself is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'sui-generate-migration-assets-nodir-'));
    roots.push(root);
    writeFileSync(join(root, 'package.json'), '{ "version": "0.0.0" }\n');
    execFileSync('git', ['init', '-q'], { cwd: root });
    const outDir = join(root, 'out');

    expect(() => generateMigrationAssets({ root, outDir }, () => {})).toThrow(/does not exist/);
    expect(existsSync(outDir)).toBe(false);
  });
});

// -------------------------------------------------------------------------- CLI (`run`)

describe('run (CLI)', () => {
  const roots: string[] = [];
  afterEach(() => {
    while (roots.length > 0) {
      const root = roots.pop();
      if (typeof root === 'string') {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it('--help prints usage and exits 0 without touching the filesystem', () => {
    const lines: string[] = [];
    const code = run(['--help'], (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('Usage:');
  });

  it('an unknown flag exits 2 with the parse error and usage, mirroring every other scripts/migrate CLI', () => {
    const lines: string[] = [];
    const code = run(['--nope'], (line) => lines.push(line));

    expect(code).toBe(2);
    expect(lines.join('\n')).toContain('Usage:');
  });

  it('honours explicit --root/--out and writes real files there', () => {
    const { root } = fixtureRepo();
    roots.push(root);
    const outDir = join(root, 'cli-out');

    const lines: string[] = [];
    const code = run(['--root', root, '--out', outDir], (line) => lines.push(line));

    expect(code).toBe(0);
    expect(readdirSync(outDir).sort()).toEqual([
      'legacy-display.css',
      'legacy-palette.css',
      'wc-display.json'
    ]);
    expect(lines.some((l) => l.includes('wrote 3 file(s), 1 wc-display entrie(s)'))).toBe(true);
  });

  it('needs no repository history at all -- the reason the --base flag is gone', () => {
    // The generator used to derive legacy-palette.css by diffing against a git
    // ref, which is fine from a full checkout and wrong in a build: CI checks
    // out shallow and tagless, and a source tarball has no history. That took
    // down build, checks and visual together on one unresolvable ref. The
    // palette is now a committed asset, so this asserts the property directly
    // by running the CLI against a fixture with its .git removed entirely.
    const { root } = fixtureRepo();
    roots.push(root);
    rmSync(join(root, '.git'), { recursive: true, force: true });
    const outDir = join(root, 'cli-out-no-git');

    const lines: string[] = [];
    const code = run(['--root', root, '--out', outDir], (line) => lines.push(line));

    expect(code).toBe(0);
    expect(readdirSync(outDir).sort()).toEqual([
      'legacy-display.css',
      'legacy-palette.css',
      'wc-display.json'
    ]);
  });
});
