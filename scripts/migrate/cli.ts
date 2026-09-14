import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  analyzeManifest,
  analyzeStylesheet,
  analyzeSvelte,
  LIBRARY,
  readWcComponents,
  type AnalyzeContext,
  type Finding
} from './analyze.ts';

/**
 * The range `--apply` writes, derived from this library's own version rather
 * than written down.
 *
 * It used to be the literal `'^3.0.0'`, correct when the 3.x migration shipped
 * and silently wrong from 4.0.0 on: the tool spent the whole 4.x line offering
 * to move consumers of 4.27.x *back* to ^3.0.0, and nothing caught it because a
 * hardcoded range is always a well-formed range. Reading the major from the
 * package this file ships inside cannot drift the same way -- a release that
 * bumps the major moves this with it.
 */
function targetRange(): string {
  const manifest: unknown = JSON.parse(readFileSync(join(libraryRoot(), 'package.json'), 'utf8'));
  const version =
    typeof manifest === 'object' && manifest !== null && 'version' in manifest
      ? manifest.version
      : null;
  if (typeof version !== 'string') {
    throw new Error('cannot read this library’s own version from package.json');
  }
  const major = version.split('.')[0];
  if (major === '' || Number.isNaN(Number(major))) {
    throw new Error(`unreadable version in package.json: ${version}`);
  }
  return `^${major}.0.0`;
}

const TARGET_RANGE = targetRange();

const USAGE = [
  'Usage: node scripts/migrate/cli.ts [--apply] [--target <range>] <consumer path>',
  '',
  `Reports what a consumer must do to move to ${LIBRARY} ${TARGET_RANGE}, and can apply the`,
  'dependency bump. Reports by default; nothing is written without --apply.',
  '',
  '  --apply           write the new version range into package.json',
  `  --target <range>  version range to move to (default ${TARGET_RANGE})`,
  '  --help            show this help',
  '',
  "Scans .svelte files for: Toolbar's changed default back control;",
  "InputButton's mandatory prop now also setting native required; a sui-*",
  "custom element used where the browser's old implicit inline mattered; and",
  'a chart rendered into a parent narrower than its new 160px floor. Also',
  'scans .svelte and .css files for the renamed chart tooltip slot selector.',
  'See scripts/migrate/README.md for the full reason table.'
].join('\n');

const SKIP = new Set([
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

type ProjectFiles = {
  readonly svelte: readonly string[];
  readonly css: readonly string[];
};

/** Every `.svelte` and `.css` file under `root`, split by extension since each gets a different analyzer. */
function projectFiles(root: string): ProjectFiles {
  const svelte: string[] = [];
  const css: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) {
          visit(join(dir, entry.name));
        }
        continue;
      }
      if (entry.name.endsWith('.svelte')) {
        svelte.push(join(dir, entry.name));
      } else if (entry.name.endsWith('.css')) {
        css.push(join(dir, entry.name));
      }
    }
  };
  visit(root);
  return { svelte, css };
}

/**
 * This library's OWN repo root (not the consumer root the CLI is pointed at),
 * derived from this module's own URL so it is correct regardless of the
 * caller's cwd. `readWcComponents` reads `src/wc/components` off of it to
 * recognise `sui-*` custom-element usage -- a consumer checkout has no such
 * directory, so that context is necessarily built from where this CLI itself
 * lives, not from the project being scanned.
 */
function libraryRoot(): string {
  // Not `new URL('../..', import.meta.url)`: Vite's static analysis special-cases
  // that literal two-argument form as an asset-URL reference and rewrites it at
  // transform time -- under vitest this silently produced an unrelated
  // http://localhost URL instead of resolving this file's own path. Converting
  // to a path first and walking up with `resolve` never matches that pattern.
  const cliFile = fileURLToPath(import.meta.url);
  return resolve(cliFile, '..', '..', '..');
}

export type MigrateSummary = {
  readonly exitCode: number;
  readonly filesScanned: number;
  readonly cssFilesScanned: number;
  readonly findings: readonly Finding[];
  readonly blockers: readonly string[];
  readonly applied: boolean;
};

export function run(argv: readonly string[], log: (line: string) => void): MigrateSummary {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        apply: { type: 'boolean', default: false },
        target: { type: 'string', default: TARGET_RANGE },
        help: { type: 'boolean', default: false }
      },
      allowPositionals: true
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    log(USAGE);
    return {
      exitCode: 2,
      filesScanned: 0,
      cssFilesScanned: 0,
      findings: [],
      blockers: [],
      applied: false
    };
  }

  if (parsed.values.help === true || parsed.positionals.length !== 1) {
    log(USAGE);
    return {
      exitCode: parsed.values.help === true ? 0 : 2,
      filesScanned: 0,
      cssFilesScanned: 0,
      findings: [],
      blockers: [],
      applied: false
    };
  }

  const root = resolve(parsed.positionals[0]);
  const manifestPath = join(root, 'package.json');
  if (!existsSync(manifestPath) || !statSync(root).isDirectory()) {
    log(`error: ${root} is not a project directory (no package.json)`);
    return {
      exitCode: 2,
      filesScanned: 0,
      cssFilesScanned: 0,
      findings: [],
      blockers: [],
      applied: false
    };
  }

  const manifestText = readFileSync(manifestPath, 'utf8');
  const report = analyzeManifest(JSON.parse(manifestText));

  log(`${LIBRARY}: ${report.currentRange ?? '(absent)'} -> ${parsed.values.target}`);
  log(`svelte: ${report.svelteRange ?? '(absent)'}`);
  log('');

  const context: AnalyzeContext = { wcComponents: readWcComponents(libraryRoot()) };
  const files = projectFiles(root);
  const svelteFindings = files.svelte.flatMap((file) =>
    analyzeSvelte(readFileSync(file, 'utf8'), relative(root, file), context)
  );
  const cssFindings = files.css.flatMap((file) =>
    analyzeStylesheet(readFileSync(file, 'utf8'), relative(root, file))
  );
  const findings = [...svelteFindings, ...cssFindings];

  for (const blocker of report.blockers) {
    log(`BLOCKER  ${blocker}`);
  }
  for (const finding of findings) {
    log(`${finding.reason}  ${finding.file}:${finding.line}`);
    log(`         ${finding.detail}`);
  }

  if (report.blockers.length === 0 && findings.length === 0) {
    log(
      `No blockers and nothing needing review across ${files.svelte.length} .svelte and ${files.css.length} .css files.`
    );
    log(`This project can take ${parsed.values.target} with a dependency bump alone.`);
  }

  let applied = false;
  if (parsed.values.apply === true) {
    if (report.blockers.length > 0) {
      // Bumping past a blocker produces a tree that cannot install or build,
      // which is a worse outcome than refusing.
      log('');
      log('Refusing to --apply while blockers stand. Resolve them first.');
      return {
        exitCode: 1,
        filesScanned: files.svelte.length,
        cssFilesScanned: files.css.length,
        findings,
        blockers: report.blockers,
        applied: false
      };
    }
    // Rewritten as text, not via JSON.stringify of the whole manifest: that
    // would drop the file's own formatting. The VALUE is still serialised
    // properly, because splicing raw text in would let a target containing a
    // quote corrupt the manifest or inject sibling properties.
    const target = parsed.values.target;
    if (typeof target !== 'string') {
      log('error: --target requires a value');
      return {
        exitCode: 2,
        filesScanned: files.svelte.length,
        cssFilesScanned: files.css.length,
        findings,
        blockers: [],
        applied: false
      };
    }
    const pattern = new RegExp(`("${LIBRARY.replace('/', '\\/')}"\\s*:\\s*)"[^"]*"`);
    const next = manifestText.replace(
      pattern,
      (_match, prefix: string) => `${prefix}${JSON.stringify(target)}`
    );
    if (next === manifestText) {
      log('');
      log('Could not locate the dependency entry to rewrite; package.json untouched.');
      return {
        exitCode: 1,
        filesScanned: files.svelte.length,
        cssFilesScanned: files.css.length,
        findings,
        blockers: report.blockers,
        applied: false
      };
    }
    writeFileSync(manifestPath, next);
    applied = true;
    log('');
    log(`package.json updated. Run your package manager's install to refresh the lockfile.`);
  }

  log('');
  log(
    `scanned ${files.svelte.length} .svelte and ${files.css.length} .css file(s), ${findings.length} needing review, ${report.blockers.length} blocker(s)`
  );

  return {
    exitCode: report.blockers.length > 0 ? 1 : 0,
    filesScanned: files.svelte.length,
    cssFilesScanned: files.css.length,
    findings,
    blockers: report.blockers,
    applied
  };
}

// Comparing against a basename split on '/' fails on Windows, where argv[1]
// uses backslashes and the split yields the whole path -- the CLI then silently
// declines to run. Normalising both sides to a file URL is platform-agnostic.
const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url === pathToFileURL(resolve(entrypoint)).href;

if (invokedDirectly) {
  const summary = run(process.argv.slice(2), (line) => console.log(line));
  process.exitCode = summary.exitCode;
}
