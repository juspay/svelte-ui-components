import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `tsconfig.json` must declare `types: ["node"]` itself rather than inherit it.
 *
 * It extends `./.svelte-kit/tsconfig.json`, which SvelteKit generates. Kit 2.63
 * emitted `types: ["node"]` into that file; 2.70 stopped, and the root config
 * was the one place in the repo relying on the injection. The result was 28
 * errors of the form `Cannot find name 'node:fs'` across tests and scripts,
 * with nothing in the diff to point at — the failure arrived on a dependency
 * bump that touched no source file. It cost one investigation here and a second
 * on Dependabot's own PR (#584) before the cause was located.
 *
 * The line looks redundant beside a generated config that used to supply it,
 * which is precisely what makes it easy to delete. This test turns that
 * deletion into a failure that names the cause, instead of a wall of
 * unresolved-global errors that names nothing.
 *
 * The four tsconfigs under `scripts/` already declare `types` explicitly and
 * were unaffected by the bump; this brings the root config in line with them.
 */

const ROOT_TSCONFIG = join(import.meta.dirname, '..', 'tsconfig.json');

const declaredTypes = (): readonly unknown[] | null => {
  const parsed: unknown = JSON.parse(readFileSync(ROOT_TSCONFIG, 'utf8'));
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const compilerOptions = Reflect.get(parsed, 'compilerOptions');
  if (typeof compilerOptions !== 'object' || compilerOptions === null) {
    return null;
  }
  const types = Reflect.get(compilerOptions, 'types');
  return Array.isArray(types) ? types : null;
};

describe('root tsconfig', () => {
  it('declares node types itself rather than inheriting them from SvelteKit', () => {
    const types = declaredTypes();

    expect(
      types,
      'tsconfig.json must declare compilerOptions.types — SvelteKit no longer injects it'
    ).not.toBeNull();
    expect(types).toContain('node');
  });
});
