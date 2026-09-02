import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from './cli.ts';

const LIB = '@juspay/svelte-ui-components';

function project(manifest: object, files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'sui-migrate-'));
  writeFileSync(join(root, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, contents);
  }
  return root;
}

const silent = (): void => {};

describe('migrate cli', () => {
  it('reports a clean project as needing only a bump, and writes nothing without --apply', () => {
    const root = project({
      dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' }
    });

    const summary = run([root], silent);

    expect(summary.exitCode).toBe(0);
    expect(summary.findings).toEqual([]);
    expect(summary.applied).toBe(false);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"2.136.0"');
  });

  it('rewrites only the version range under --apply, leaving the rest of the manifest alone', () => {
    const root = project({
      name: 'consumer',
      dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' }
    });

    const summary = run([root, '--apply'], silent);
    const manifest = readFileSync(join(root, 'package.json'), 'utf8');

    expect(summary.applied).toBe(true);
    expect(manifest).toContain(`"${LIB}": "^3.0.0"`);
    expect(manifest).toContain('"name": "consumer"');
    expect(manifest).toContain('"svelte": "^5.55.9"');
  });

  it('refuses to apply while a blocker stands, rather than producing an uninstallable tree', () => {
    const root = project({ dependencies: { [LIB]: '1.34.0', svelte: '^4.2.8' } });

    const summary = run([root, '--apply'], silent);

    expect(summary.exitCode).toBe(1);
    expect(summary.applied).toBe(false);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toContain('"1.34.0"');
  });

  it('surfaces an affected Toolbar usage with its file and line', () => {
    const root = project(
      { dependencies: { [LIB]: '2.136.0', svelte: '^5.55.9' } },
      {
        'src/Page.svelte': `<script>import { Toolbar } from '${LIB}';</script>\n<Toolbar />`
      }
    );

    const summary = run([root], silent);

    expect(summary.findings).toHaveLength(1);
    expect(summary.findings[0]?.file).toBe('src/Page.svelte');
    expect(summary.findings[0]?.line).toBe(2);
  });

  it('exits 2 on a path that is not a project', () => {
    expect(run([join(tmpdir(), 'definitely-not-a-project')], silent).exitCode).toBe(2);
  });

  it('exits 2 when no path is given', () => {
    expect(run([], silent).exitCode).toBe(2);
  });
});
