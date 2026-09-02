import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { analyzeManifest, analyzeSvelte, LIBRARY, type Finding } from './analyze.ts';

const TARGET_RANGE = '^3.0.0';

const USAGE = [
  'Usage: node scripts/migrate/cli.ts [--apply] [--target <range>] <consumer path>',
  '',
  `Reports what a consumer must do to move to ${LIBRARY} 3.x, and can apply the`,
  'dependency bump. Reports by default; nothing is written without --apply.',
  '',
  '  --apply           write the new version range into package.json',
  `  --target <range>  version range to move to (default ${TARGET_RANGE})`,
  '  --help            show this help',
  '',
  'The only breaking change in 3.0.0 is Toolbar: with no `backIcon`, the default',
  'back control moved from <div role="button"><img></div> to',
  '<button aria-label><svg></button>. Usages that pass showBackButton={false} or',
  'their own backIcon are unaffected and are not reported.'
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

function svelteFiles(root: string): readonly string[] {
  const found: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) {
          visit(join(dir, entry.name));
        }
        continue;
      }
      if (entry.name.endsWith('.svelte')) {
        found.push(join(dir, entry.name));
      }
    }
  };
  visit(root);
  return found;
}

export type MigrateSummary = {
  readonly exitCode: number;
  readonly filesScanned: number;
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
    return { exitCode: 2, filesScanned: 0, findings: [], blockers: [], applied: false };
  }

  if (parsed.values.help === true || parsed.positionals.length !== 1) {
    log(USAGE);
    return {
      exitCode: parsed.values.help === true ? 0 : 2,
      filesScanned: 0,
      findings: [],
      blockers: [],
      applied: false
    };
  }

  const root = resolve(parsed.positionals[0]);
  const manifestPath = join(root, 'package.json');
  if (!existsSync(manifestPath) || !statSync(root).isDirectory()) {
    log(`error: ${root} is not a project directory (no package.json)`);
    return { exitCode: 2, filesScanned: 0, findings: [], blockers: [], applied: false };
  }

  const manifestText = readFileSync(manifestPath, 'utf8');
  const report = analyzeManifest(JSON.parse(manifestText));

  log(`${LIBRARY}: ${report.currentRange ?? '(absent)'} -> ${parsed.values.target}`);
  log(`svelte: ${report.svelteRange ?? '(absent)'}`);
  log('');

  const files = svelteFiles(root);
  const findings = files.flatMap((file) =>
    analyzeSvelte(readFileSync(file, 'utf8'), relative(root, file))
  );

  for (const blocker of report.blockers) {
    log(`BLOCKER  ${blocker}`);
  }
  for (const finding of findings) {
    log(`${finding.reason}  ${finding.file}:${finding.line}`);
    log(`         ${finding.detail}`);
  }

  if (report.blockers.length === 0 && findings.length === 0) {
    log(`No blockers and no affected Toolbar usage across ${files.length} .svelte files.`);
    log('This project can take 3.x with a dependency bump alone.');
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
        filesScanned: files.length,
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
      return { exitCode: 2, filesScanned: files.length, findings, blockers: [], applied: false };
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
        filesScanned: files.length,
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
    `scanned ${files.length} .svelte file(s), ${findings.length} needing review, ${report.blockers.length} blocker(s)`
  );

  return {
    exitCode: report.blockers.length > 0 ? 1 : 0,
    filesScanned: files.length,
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
