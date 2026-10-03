import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Regression for a real false positive: rules 1 and 2 (an unregistered
 * `<sui-*>` tag, an `addEventListener` example for an event nothing
 * dispatches) validate a page's examples against ONE real component's own
 * registered tag and dispatched events. That is meaningless for a reference
 * page that documents no single component -- CHANGELOG.md's auto-generated
 * release narrative quoted `addEventListener('keydown', ...)` from an
 * earlier commit's own message and was flagged as if it were a broken
 * component example, because `basename('CHANGELOG.md', '.md')` resolved to
 * a `.wc.svelte` wrapper that was never going to exist.
 *
 * `src/lib/<name>/<name>.svelte` existing is the signal the fix checks for a
 * real component (including a Svelte-only one with no web-component
 * wrapper), so this fixture needs that file for the "real component" case
 * and must NOT have it for the "reference page" case.
 */

const SCRIPT = join(process.cwd(), 'scripts/check-docs-contract.js');

const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (typeof root === 'string') {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

/** A throwaway repo root holding the few paths this script reads. */
const fixture = (docs: Record<string, string>, components: readonly string[] = []): string => {
  const root = mkdtempSync(join(tmpdir(), 'sui-docs-contract-'));
  roots.push(root);
  mkdirSync(join(root, 'docs'), { recursive: true });
  for (const [name, contents] of Object.entries(docs)) {
    writeFileSync(join(root, 'docs', name), contents);
  }
  mkdirSync(join(root, 'src/wc/components'), { recursive: true });
  writeFileSync(join(root, 'src/wc/index.ts'), '');
  for (const name of components) {
    mkdirSync(join(root, 'src/lib', name), { recursive: true });
    writeFileSync(join(root, 'src/lib', name, `${name}.svelte`), '<div></div>\n');
  }
  return root;
};

type Run = { readonly code: number; readonly out: string };

const run = (root: string): Run => {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (error: unknown) {
    // A non-zero exit is the behaviour under test, and execFileSync reports it
    // by throwing an error carrying the status and the captured output. The
    // violation list prints on stderr (console.error), the clean summary on
    // stdout, so a failing run's useful text is in stderr.
    if (
      error !== null &&
      typeof error === 'object' &&
      'status' in error &&
      'stdout' in error &&
      'stderr' in error
    ) {
      const { status, stdout, stderr } = error;
      return {
        code: typeof status === 'number' ? status : -1,
        out: `${typeof stdout === 'string' ? stdout : ''}${typeof stderr === 'string' ? stderr : ''}`
      };
    }
    throw error;
  }
};

const undispatchedExample = "el.addEventListener('keydown', handleKey);\n";

describe('the docs-contract gate', () => {
  it('does not flag an undispatched-event example on a page with no matching component', () => {
    const root = fixture({ 'CHANGELOG.md': `# Changelog\n\n${undispatchedExample}` });

    const { code, out } = run(root);

    expect(code, out).toBe(0);
    expect(out).toContain('0 doc-contract violation');
  });

  it('still flags the same shape on a real component page', () => {
    const root = fixture({ 'Toggle.md': `# Toggle\n\n${undispatchedExample}` }, ['Toggle']);

    const { code, out } = run(root);

    expect(
      code,
      'an undispatched-event example on a real component page did not fail the gate'
    ).toBe(1);
    expect(out).toContain('undispatched-event');
    expect(out).toContain('keydown');
  });

  it('still flags an unregistered <sui-*> tag on a real component page', () => {
    const root = fixture({ 'Toggle.md': '# Toggle\n\n<sui-toggle></sui-toggle>\n' }, ['Toggle']);

    const { code, out } = run(root);

    expect(code, 'an unregistered tag on a real component page did not fail the gate').toBe(1);
    expect(out).toContain('unregistered-element');
  });

  it('does not flag the same unregistered tag on a page with no matching component', () => {
    const root = fixture({ 'GUIDELINES.md': '# Guidelines\n\n<sui-toggle></sui-toggle>\n' });

    const { code, out } = run(root);

    expect(code, out).toBe(0);
  });
});
