import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import type { Direction } from './map.ts';
import { transformModuleSpecifiers, transformSvelte } from './transform.ts';
import type { TransformResult } from './transform.ts';
import { findChildrenAssignments } from './wc-children.ts';

export type CliSummary = {
  readonly exitCode: number;
  readonly filesScanned: number;
  readonly filesChanged: number;
  readonly propsRenamed: number;
  readonly importsRewritten: number;
  readonly warnings: number;
};

const USAGE = [
  'Usage: node scripts/codemod/cli.ts [--reverse] [--dry-run] <path...>',
  '',
  'Migrates consumer sources from polymorph-ui-components to',
  '@juspay/svelte-ui-components: rewrites import specifiers and renames the',
  'casing-only synthetic event props on library components (see map.ts).',
  '',
  '  --reverse   migrate @juspay/svelte-ui-components -> polymorph-ui-components',
  '  --dry-run   print every change as a diff without writing any file',
  '  --help      show this help',
  '',
  'Paths may be files or directories; directories are walked recursively,',
  'skipping node_modules, .git, .svelte-kit, dist, dist-wc, build, coverage,',
  'playwright-report and test-results.'
].join('\n');

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svelte-kit',
  'dist',
  'dist-wc',
  'build',
  'coverage',
  'playwright-report',
  'test-results'
]);

const SCRIPT_FILE = /\.(ts|js|mts|mjs|cts|cjs)$/;

function collectFiles(path: string, out: Set<string>): void {
  const stats = statSync(path);
  if (stats.isFile()) {
    if (path.endsWith('.svelte') || SCRIPT_FILE.test(path)) {
      out.add(path);
    }
    return;
  }
  if (!stats.isDirectory()) {
    return;
  }
  const entries = [...readdirSync(path, { withFileTypes: true })].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        collectFiles(join(path, entry.name), out);
      }
    } else if (entry.isFile()) {
      collectFiles(join(path, entry.name), out);
    }
  }
}

/**
 * Every edit the transform makes stays on a single line, so old and new text
 * always have the same line count and a pairwise comparison is an exact diff.
 */
function printLineDiff(
  file: string,
  before: string,
  after: string,
  log: (line: string) => void
): void {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  log(`--- ${file}`);
  if (oldLines.length !== newLines.length) {
    log('  (line counts differ; showing full replacement)');
    for (const line of oldLines) {
      log(`- ${line}`);
    }
    for (const line of newLines) {
      log(`+ ${line}`);
    }
    return;
  }
  oldLines.forEach((oldLine, index) => {
    const newLine = newLines.at(index) ?? '';
    if (oldLine !== newLine) {
      log(`@@ ${file}:${index + 1}`);
      log(`- ${oldLine}`);
      log(`+ ${newLine}`);
    }
  });
}

export function runCodemod(argv: ReadonlyArray<string>, log: (line: string) => void): CliSummary {
  const failure = {
    exitCode: 2,
    filesScanned: 0,
    filesChanged: 0,
    propsRenamed: 0,
    importsRewritten: 0,
    warnings: 0
  };
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        reverse: { type: 'boolean' },
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean' }
      },
      allowPositionals: true,
      strict: true
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    log(USAGE);
    return failure;
  }
  if (parsed.values.help === true) {
    log(USAGE);
    return { ...failure, exitCode: 0 };
  }
  if (parsed.positionals.length === 0) {
    log(USAGE);
    return failure;
  }
  for (const path of parsed.positionals) {
    if (!existsSync(path)) {
      log(`path does not exist: ${path}`);
      return failure;
    }
  }
  const direction: Direction = parsed.values.reverse === true ? 'to-poly' : 'to-sui';
  const dryRun = parsed.values['dry-run'] === true;

  const files = new Set<string>();
  for (const path of parsed.positionals) {
    collectFiles(resolve(path), files);
  }

  let filesChanged = 0;
  let propsRenamed = 0;
  let importsRewritten = 0;
  let warnings = 0;
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const result: TransformResult = file.endsWith('.svelte')
      ? transformSvelte(source, file, direction)
      : transformModuleSpecifiers(source, file, direction);
    // Reported in both directions and in dry runs: it is a 4.0.0 breaking change
    // to report, not a rename to apply, so it never contributes to filesChanged.
    const childrenWarnings = direction === 'to-sui' ? findChildrenAssignments(source, file) : [];
    for (const warning of [...result.warnings, ...childrenWarnings]) {
      log(`${warning.file}:${warning.line}:${warning.column} WARN ${warning.message}`);
    }
    warnings += result.warnings.length + childrenWarnings.length;
    if (!result.changed) {
      continue;
    }
    filesChanged += 1;
    propsRenamed += result.propsRenamed;
    importsRewritten += result.importsRewritten;
    if (dryRun) {
      printLineDiff(file, source, result.code, log);
    } else {
      writeFileSync(file, result.code);
      log(
        `${file}: ${result.propsRenamed} prop(s) renamed, ${result.importsRewritten} import(s) rewritten`
      );
    }
  }
  log(
    `${dryRun ? '[dry run] ' : ''}scanned ${files.size} file(s), changed ${filesChanged}, ` +
      `renamed ${propsRenamed} prop(s), rewrote ${importsRewritten} import(s), ${warnings} warning(s)`
  );
  return {
    exitCode: 0,
    filesScanned: files.size,
    filesChanged,
    propsRenamed,
    importsRewritten,
    warnings
  };
}

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  const summary = runCodemod(process.argv.slice(2), (line) => {
    console.log(line);
  });
  process.exitCode = summary.exitCode;
}
