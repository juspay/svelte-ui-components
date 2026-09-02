import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import { runCodemod } from './cli.ts';

const POLY_APP = [
  '<script>',
  `  import { Table, Input } from 'polymorph-ui-components';`,
  '  const props = {};',
  '</script>',
  '',
  '<Table onsort={() => {}} {...props} />',
  '<Input onclick={() => {}} />',
  ''
].join('\n');

const SUI_APP = [
  '<script>',
  `  import { Table, Input } from '@juspay/svelte-ui-components';`,
  '  const props = {};',
  '</script>',
  '',
  '<Table onSort={() => {}} {...props} />',
  '<Input onClick={() => {}} />',
  ''
].join('\n');

const PLAIN = '<h1>untouched</h1>\n';
const BARREL = `export { Table } from 'polymorph-ui-components';\n`;

type Fixture = {
  readonly dir: string;
  readonly lines: string[];
  readonly log: (line: string) => void;
};

/**
 * Builds a throwaway project for one test.
 *
 * Per-test rather than shared module state, so no test can observe another
 * one's directory or captured output, and the tree is removed through
 * `onTestFinished` whether the test passes or throws.
 */
function project(): Fixture {
  const dir = mkdtempSync(join(tmpdir(), 'sui-codemod-'));
  onTestFinished(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  writeFileSync(join(dir, 'App.svelte'), POLY_APP);
  writeFileSync(join(dir, 'Plain.svelte'), PLAIN);
  writeFileSync(join(dir, 'barrel.ts'), BARREL);
  mkdirSync(join(dir, 'node_modules', 'dep'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'dep', 'Skip.svelte'), POLY_APP);

  const lines: string[] = [];
  return {
    dir,
    lines,
    log: (line: string) => {
      lines.push(line);
    }
  };
}

describe('runCodemod', () => {
  it('rewrites files in place and reports accurate counts', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod([dir], log);
    expect(summary.exitCode).toBe(0);
    expect(summary.filesScanned).toBe(3);
    expect(summary.filesChanged).toBe(2);
    expect(summary.propsRenamed).toBe(2);
    expect(summary.importsRewritten).toBe(2);
    expect(summary.warnings).toBe(1);
    const rewritten = readFileSync(join(dir, 'App.svelte'), 'utf8');
    expect(rewritten).toContain(`from '@juspay/svelte-ui-components'`);
    expect(rewritten).toContain('<Table onSort={() => {}} {...props} />');
    expect(rewritten).toContain('<Input onClick={() => {}} />');
    expect(readFileSync(join(dir, 'barrel.ts'), 'utf8')).toBe(
      `export { Table } from '@juspay/svelte-ui-components';\n`
    );
    expect(readFileSync(join(dir, 'Plain.svelte'), 'utf8')).toBe(PLAIN);
    expect(readFileSync(join(dir, 'node_modules', 'dep', 'Skip.svelte'), 'utf8')).toBe(POLY_APP);
    const output = lines.join('\n');
    expect(output).toContain('WARN');
    expect(output).toContain('App.svelte:6');
  });

  it('--dry-run prints a diff and writes nothing', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod(['--dry-run', dir], log);
    expect(summary.exitCode).toBe(0);
    expect(summary.filesChanged).toBe(2);
    expect(readFileSync(join(dir, 'App.svelte'), 'utf8')).toBe(POLY_APP);
    expect(readFileSync(join(dir, 'barrel.ts'), 'utf8')).toBe(BARREL);
    const output = lines.join('\n');
    expect(output).toContain(`-   import { Table, Input } from 'polymorph-ui-components';`);
    expect(output).toContain(`+   import { Table, Input } from '@juspay/svelte-ui-components';`);
    expect(output).toContain('- <Table onsort={() => {}} {...props} />');
    expect(output).toContain('+ <Table onSort={() => {}} {...props} />');
  });

  it('--reverse migrates SUI form back to poly form', () => {
    const { dir, lines, log } = project();
    writeFileSync(join(dir, 'App.svelte'), SUI_APP);
    const summary = runCodemod(['--reverse', join(dir, 'App.svelte')], log);
    expect(summary.exitCode).toBe(0);
    expect(summary.filesScanned).toBe(1);
    const rewritten = readFileSync(join(dir, 'App.svelte'), 'utf8');
    expect(rewritten).toContain(`from 'polymorph-ui-components'`);
    expect(rewritten).toContain('<Table onsort={() => {}} {...props} />');
  });

  it('is a no-op when run twice', () => {
    const { dir, lines, log } = project();
    runCodemod([dir], log);
    const second = runCodemod([dir], log);
    expect(second.filesChanged).toBe(0);
    expect(second.propsRenamed).toBe(0);
    expect(second.importsRewritten).toBe(0);
  });

  it('fails usage when no paths are given', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod([], log);
    expect(summary.exitCode).toBe(2);
    expect(lines.join('\n')).toContain('Usage');
  });

  it('fails usage on an unknown flag', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod(['--nope', dir], log);
    expect(summary.exitCode).toBe(2);
  });

  it('fails usage on a nonexistent path', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod([join(dir, 'missing')], log);
    expect(summary.exitCode).toBe(2);
  });
});
