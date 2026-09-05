import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transformSvelte } from '../codemod/transform.ts';
import type { TransformOptions, TransformWarning } from '../codemod/transform.ts';

/**
 * The consumer codemod, pointed at this repository itself.
 *
 * Wiring the deprecation warnings (phase 2) turned every internal use of a
 * legacy spelling into a warning a consumer would see in their own console
 * for something they did not write — `Table` handing `onclick` to `Toggle`
 * warned about `Toggle.onclick` on every page with a boolean cell — and the
 * 4.0.0 removal would have broken those same call sites. This walks `src/`
 * and applies the identical rename table, resolving the import forms this
 * repository uses: a default import of `$lib/X/X.svelte` or `../X/X.svelte`
 * is component `X`, and named imports from `$lib` are the exported names.
 *
 *   node --experimental-strip-types scripts/migrate/rename-internal-usages.ts [--apply] [--root <repo>]
 *
 * `rename-internal-usages.test.ts` runs the same walk in report mode and
 * fails if anything would change, so a legacy spelling cannot creep back in.
 */

const INTERNAL_ROOTS: readonly string[] = ['src'];

function isInternalComponentImport(specifier: string): boolean {
  if (specifier === '$lib' || specifier.startsWith('$lib/')) {
    return true;
  }
  return specifier.startsWith('.') && specifier.endsWith('.svelte');
}

function defaultImportComponent(specifier: string): string | null {
  if (!specifier.endsWith('.svelte')) {
    return null;
  }
  return basename(specifier, '.svelte');
}

export const INTERNAL_OPTIONS: TransformOptions = {
  isLibraryImport: isInternalComponentImport,
  defaultImportComponent
};

function collectSvelteFiles(path: string, out: string[]): void {
  const stats = statSync(path);
  if (stats.isFile()) {
    if (path.endsWith('.svelte')) {
      out.push(path);
    }
    return;
  }
  if (!stats.isDirectory()) {
    return;
  }
  for (const entry of readdirSync(path).sort()) {
    collectSvelteFiles(join(path, entry), out);
  }
}

export type InternalRename = {
  readonly file: string;
  readonly code: string;
  readonly propsRenamed: number;
  readonly warnings: ReadonlyArray<TransformWarning>;
};

/** Every file under `src/` the rename table would change, with its rewritten text. */
export function planInternalRenames(root: string): readonly InternalRename[] {
  const files: string[] = [];
  for (const dir of INTERNAL_ROOTS) {
    collectSvelteFiles(join(root, dir), files);
  }
  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const result = transformSvelte(source, file, INTERNAL_OPTIONS);
    return result.changed
      ? [{ file, code: result.code, propsRenamed: result.propsRenamed, warnings: result.warnings }]
      : [];
  });
}

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  const apply = process.argv.includes('--apply');
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag === -1 ? process.cwd() : (process.argv.at(rootFlag + 1) ?? process.cwd());
  const plan = planInternalRenames(root);
  for (const item of plan) {
    console.log(`${item.file}: ${item.propsRenamed} prop(s)`);
    for (const warning of item.warnings) {
      console.log(`  ${warning.line}:${warning.column} WARN ${warning.message}`);
    }
    if (apply) {
      writeFileSync(item.file, item.code);
    }
  }
  const total = plan.reduce((sum, item) => sum + item.propsRenamed, 0);
  console.log(`${apply ? 'rewrote' : 'would rewrite'} ${total} prop(s) in ${plan.length} file(s)`);
}
