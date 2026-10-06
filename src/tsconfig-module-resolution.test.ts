import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * No tsconfig in the repo may select the `node10` module resolution (spelled `node` or `Node` in
 * a tsconfig). TypeScript 6 deprecates it, `pnpm run check` reported it on both the root and the
 * web-component program, and TypeScript 7 stops honouring it, at which point the type-check and
 * the declaration emit of `svelte-package` would fail on an upgrade rather than on a change.
 *
 * The root config had carried `"moduleResolution": "Node"` since the project was created, long
 * before anything depended on it: SvelteKit's generated `.svelte-kit/tsconfig.json`, which it
 * extends, already selects `bundler`, and the library is consumed and built through Vite. The
 * root now says `bundler` itself so the answer does not depend on a generated file, and
 * `tsconfig.wc.json` inherits it. The `scripts/*` programs run under Node and use `NodeNext`.
 *
 * What this does NOT change is what a consumer's own resolution does with the published package:
 * that follows the `exports` map in package.json, which is untouched.
 *
 * The values are read from the JSON on purpose, without resolving `extends`: the generated file
 * is absent on a fresh clone until `svelte-kit sync` runs, and the point here is what each file
 * chooses, not what it happens to inherit.
 */

const ROOT = join(import.meta.dirname, '..');

const TSCONFIGS = [
  'tsconfig.json',
  'tsconfig.wc.json',
  'scripts/codemod/tsconfig.json',
  'scripts/codemod/tsconfig.build.json',
  'scripts/migrate/tsconfig.json',
  'scripts/release/tsconfig.json',
  'scripts/wc-parity/tsconfig.json'
];

const DEPRECATED_NODE10 = new Set(['node', 'node10']);

function declaredModuleResolution(file: string): string | null {
  const { config, error } = ts.readConfigFile(join(ROOT, file), ts.sys.readFile);
  if (error || typeof config !== 'object' || config === null) {
    throw new Error(`could not read ${file}`);
  }
  const compilerOptions: unknown = Reflect.get(config, 'compilerOptions');
  if (typeof compilerOptions !== 'object' || compilerOptions === null) {
    return null;
  }
  const value: unknown = Reflect.get(compilerOptions, 'moduleResolution');
  return typeof value === 'string' ? value.toLowerCase() : null;
}

describe('tsconfig module resolution', () => {
  it.each(TSCONFIGS)('%s does not select the deprecated node10 resolution', (file) => {
    const declared = declaredModuleResolution(file);

    expect(declared === null || !DEPRECATED_NODE10.has(declared)).toBe(true);
  });

  it('the root config names bundler itself rather than leaning on the generated file', () => {
    expect(declaredModuleResolution('tsconfig.json')).toBe('bundler');
  });

  it('bundler is a legal pairing with the root module setting', () => {
    const { config } = ts.readConfigFile(join(ROOT, 'tsconfig.json'), ts.sys.readFile);
    const module: unknown = Reflect.get(Reflect.get(config, 'compilerOptions'), 'module');
    const resolved = ts.convertCompilerOptionsFromJson(
      { module, moduleResolution: 'bundler', noEmit: true },
      ROOT
    );

    expect(resolved.errors).toEqual([]);
    expect(resolved.options.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler);
  });
});
