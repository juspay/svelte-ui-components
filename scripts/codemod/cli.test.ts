import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

let dir = '';
let lines: string[] = [];
const log = (line: string) => {
  lines.push(line);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sui-codemod-'));
  lines = [];
  writeFileSync(join(dir, 'App.svelte'), POLY_APP);
  writeFileSync(join(dir, 'Plain.svelte'), PLAIN);
  writeFileSync(join(dir, 'barrel.ts'), BARREL);
  mkdirSync(join(dir, 'node_modules', 'dep'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'dep', 'Skip.svelte'), POLY_APP);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('runCodemod', () => {
  it('rewrites files in place and reports accurate counts', () => {
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
    writeFileSync(join(dir, 'App.svelte'), SUI_APP);
    const summary = runCodemod(['--reverse', join(dir, 'App.svelte')], log);
    expect(summary.exitCode).toBe(0);
    expect(summary.filesScanned).toBe(1);
    const rewritten = readFileSync(join(dir, 'App.svelte'), 'utf8');
    expect(rewritten).toContain(`from 'polymorph-ui-components'`);
    expect(rewritten).toContain('<Table onsort={() => {}} {...props} />');
  });

  it('is a no-op when run twice', () => {
    runCodemod([dir], log);
    const second = runCodemod([dir], log);
    expect(second.filesChanged).toBe(0);
    expect(second.propsRenamed).toBe(0);
    expect(second.importsRewritten).toBe(0);
  });

  it('fails usage when no paths are given', () => {
    const summary = runCodemod([], log);
    expect(summary.exitCode).toBe(2);
    expect(lines.join('\n')).toContain('Usage');
  });

  it('fails usage on an unknown flag', () => {
    const summary = runCodemod(['--nope', dir], log);
    expect(summary.exitCode).toBe(2);
  });

  it('fails usage on a nonexistent path', () => {
    const summary = runCodemod([join(dir, 'missing')], log);
    expect(summary.exitCode).toBe(2);
  });
});
