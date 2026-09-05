import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import { runCodemod } from './cli.ts';

const APP = [
  '<script>',
  `  import { Modal, Input } from '@juspay/svelte-ui-components';`,
  '  const props = {};',
  '</script>',
  '',
  '<Modal onOverlayClick={() => {}} {...props} />',
  '<Input onclick={() => {}} />',
  ''
].join('\n');

const PLAIN = '<h1>untouched</h1>\n';
// A script is scanned for `children` assignments but never rewritten.
const SCRIPT = [
  `import '@juspay/svelte-ui-components/wc';`,
  `document.querySelector('sui-draggable').children = [panel];`,
  ''
].join('\n');

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

  writeFileSync(join(dir, 'App.svelte'), APP);
  writeFileSync(join(dir, 'Plain.svelte'), PLAIN);
  writeFileSync(join(dir, 'mount.ts'), SCRIPT);
  mkdirSync(join(dir, 'node_modules', 'dep'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'dep', 'Skip.svelte'), APP);

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
    expect(summary.filesChanged).toBe(1);
    // Modal.onOverlayClick -> onoverlayclick is the only rename: Input.onclick
    // already is the lowercase spelling.
    expect(summary.propsRenamed).toBe(1);
    // One spread warning in App.svelte, one `children` assignment in mount.ts.
    expect(summary.warnings).toBe(2);
    const rewritten = readFileSync(join(dir, 'App.svelte'), 'utf8');
    expect(rewritten).toContain('<Modal onoverlayclick={() => {}} {...props} />');
    expect(rewritten).toContain('<Input onclick={() => {}} />');
    expect(readFileSync(join(dir, 'mount.ts'), 'utf8')).toBe(SCRIPT);
    expect(readFileSync(join(dir, 'Plain.svelte'), 'utf8')).toBe(PLAIN);
    expect(readFileSync(join(dir, 'node_modules', 'dep', 'Skip.svelte'), 'utf8')).toBe(APP);
    const output = lines.join('\n');
    expect(output).toContain('App.svelte:6');
    expect(output).toContain('mount.ts:2');
    expect(output).toContain('sui-draggable');
  });

  it('--dry-run prints a diff and writes nothing', () => {
    const { dir, lines, log } = project();
    const summary = runCodemod(['--dry-run', dir], log);
    expect(summary.exitCode).toBe(0);
    expect(summary.filesChanged).toBe(1);
    expect(readFileSync(join(dir, 'App.svelte'), 'utf8')).toBe(APP);
    const output = lines.join('\n');
    expect(output).toContain('- <Modal onOverlayClick={() => {}} {...props} />');
    expect(output).toContain('+ <Modal onoverlayclick={() => {}} {...props} />');
    expect(output).toContain('[dry run]');
  });

  it('is a no-op when run twice', () => {
    const { dir, log } = project();
    runCodemod([dir], log);
    const second = runCodemod([dir], log);
    expect(second.filesChanged).toBe(0);
    expect(second.propsRenamed).toBe(0);
  });

  it('fails usage when no paths are given', () => {
    const { lines, log } = project();
    const summary = runCodemod([], log);
    expect(summary.exitCode).toBe(2);
    expect(lines.join('\n')).toContain('Usage');
  });

  it('fails usage on an unknown flag', () => {
    const { dir, log } = project();
    const summary = runCodemod(['--nope', dir], log);
    expect(summary.exitCode).toBe(2);
  });

  it('fails usage on a nonexistent path', () => {
    const { dir, log } = project();
    const summary = runCodemod([join(dir, 'missing')], log);
    expect(summary.exitCode).toBe(2);
  });
});
