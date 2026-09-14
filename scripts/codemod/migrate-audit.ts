import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  analyzeStylesheet,
  analyzeSvelte,
  LIBRARY,
  type AnalyzeContext,
  type Finding,
  type WcComponent
} from '../migrate/analyze.ts';
import { planSelectorRewrites, type FileRewrite } from '../migrate/chart-tooltip-selector.ts';
import { SKIPPED_DIRECTORIES } from './cli.ts';

/**
 * Runs the 4.28.0 breaking-change audit `npm run migrate` runs, from the
 * PUBLISHED `sui-codemod` binary against a consumer project that only has
 * this package installed -- never a repo clone. `npm run migrate` (see
 * scripts/migrate/cli.ts) is not itself shippable: it reads this library's
 * OWN `src/wc/components` and git history, neither of which exist in
 * node_modules. This file reuses its detectors (`analyzeSvelte`/
 * `analyzeStylesheet`) unmodified and replaces only the one input that
 * required repo-only sources -- `AnalyzeContext.wcComponents` -- with a
 * reader for `wc-display.json`, a plain data file `generate-migration-assets.ts`
 * derives during `build:codemod` and ships inside `dist-codemod`. See that
 * file for what it writes and why: `wc-display.json`, `legacy-display.css`,
 * `legacy-palette.css`.
 *
 * Deliberately narrower than `npm run migrate`: it does not reproduce that
 * script's package.json/svelte-peer version bump (`analyzeManifest`) --
 * that is a different, repo-version-coupled feature (pin/bump this
 * library's own dependency range), not one of the seven breaking changes
 * this migration guide documents. What ships here is the audit for those
 * seven, which is the part a consumer with only the published package can
 * never otherwise reach.
 */

// ------------------------------------------------------------- wc-display.json

const MIGRATION_ASSETS_DIRNAME = 'migration-assets';
const WC_DISPLAY_FILENAME = 'wc-display.json';
export const LEGACY_DISPLAY_CSS_FILENAME = 'legacy-display.css';
export const LEGACY_PALETTE_CSS_FILENAME = 'legacy-palette.css';

/**
 * The directory `generate-migration-assets.ts` writes into, resolved off
 * THIS module's own compiled location rather than `process.cwd()` -- so it
 * still finds `dist-codemod/migration-assets` when this module has been
 * compiled to `dist-codemod/migrate-audit.js` and invoked from anywhere.
 * Run against the uncompiled `.ts` source (as the tests below do without an
 * explicit `assetsDir` override) it resolves to a sibling directory that
 * does not exist -- which is the correct answer, not a bug: this module
 * has no other way to find build output that was never produced, and
 * `loadWcDisplay` below turns that into an honest "missing" result rather
 * than a guess.
 */
function defaultAssetsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), MIGRATION_ASSETS_DIRNAME);
}

/**
 * `wc-display.json`'s own schema, as `generate-migration-assets.ts` writes
 * it: `{ tag, property, default }`, one entry per `sui-*` wrapper. It is
 * NOT `WcComponent` -- it has no `component` (the wrapped Svelte component's
 * PascalCase name), because `HostDisplayEntry` (what it is built from, in
 * `host-display-compat.ts`) never carried one either. `wcComponentsFrom`
 * below is what bridges the gap.
 */
type WcDisplayEntry = {
  readonly tag: string;
  readonly property: string;
  readonly default: 'block' | 'inline-block';
};

type UnknownRecord = Record<string, unknown>;

/** Same no-assertion narrowing `analyze.ts`'s own `asRecord` uses: copies known-present keys onto a fresh object rather than casting. */
function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const record: UnknownRecord = {};
  for (const key of Object.keys(value)) {
    Object.defineProperty(record, key, {
      value: Reflect.get(value, key),
      enumerable: true,
      writable: true,
      configurable: true
    });
  }
  return record;
}

/**
 * `null`, never a boolean, on anything that fails to match -- the fail-closed
 * rule `host-display-compat.ts`'s own `parseHostDisplay` documents: a shim
 * silently missing an entry looks exactly as complete as one that isn't, and
 * the same is true of a context built from a partially-invalid file. One bad
 * entry invalidates the whole read; see `loadWcDisplay`.
 */
function asWcDisplayEntry(value: unknown): WcDisplayEntry | null {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }
  const { tag, property } = record;
  const wcDefault = record.default;
  if (typeof tag !== 'string' || tag.length === 0) {
    return null;
  }
  if (typeof property !== 'string' || property.length === 0) {
    return null;
  }
  if (wcDefault !== 'block' && wcDefault !== 'inline-block') {
    return null;
  }
  return { tag, property, default: wcDefault };
}

export type WcDisplayResult =
  | { readonly status: 'ok'; readonly path: string; readonly entries: readonly WcDisplayEntry[] }
  | { readonly status: 'missing'; readonly path: string }
  | { readonly status: 'invalid'; readonly path: string; readonly reason: string };

/**
 * Reads and validates `wc-display.json`, distinguishing "the file is absent"
 * from "the file is present but unreadable" from "ok" -- collapsing either
 * failure to an empty component list would make `host-display-inline` and
 * `chart-min-width` report zero findings exactly as a genuinely clean project
 * would, which is the one thing this audit must not do silently.
 */
export function loadWcDisplay(path: string): WcDisplayResult {
  if (!existsSync(path)) {
    return { status: 'missing', path };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return {
      status: 'invalid',
      path,
      reason: `not valid JSON (${error instanceof Error ? error.message : String(error)})`
    };
  }
  if (!Array.isArray(parsed)) {
    return { status: 'invalid', path, reason: 'expected a JSON array at the top level' };
  }
  const entries: WcDisplayEntry[] = [];
  for (const [index, item] of parsed.entries()) {
    const entry = asWcDisplayEntry(item);
    if (entry === null) {
      return {
        status: 'invalid',
        path,
        reason: `entry ${index} is missing a valid tag/property/default`
      };
    }
    entries.push(entry);
  }
  // An empty array is not a valid manifest, it is a broken build that parsed.
  // Accepting it made the audit print `wc-display.json: ok (0 component(s))`
  // and then silently run with `host-display-inline` and `chart-min-width`
  // disabled -- a clean report that had checked two fewer things than it
  // claimed, which is indistinguishable from a project that has neither
  // problem. `collectWcDisplayEntries` already refuses to WRITE an empty
  // manifest for the same reason; this is the reading half of that rule.
  if (entries.length === 0) {
    return {
      status: 'invalid',
      path,
      reason: 'contains no components — the build that produced it was broken'
    };
  }
  return { status: 'ok', path, entries };
}

/**
 * Recovers each entry's `component` (the wrapped Svelte component's PascalCase
 * name -- `chart-min-width`'s "*Chart" filter and `inputbutton-mandatory`'s
 * "InputButton" spelling both key off it, see `analyzeSvelte`) from `tag`
 * alone, since `wc-display.json` does not carry it (see `WcDisplayEntry`
 * above). This is the one place this file re-derives something `readWcComponents`
 * also derives, rather than only relaying data across the wc-display.json
 * boundary -- justified because the boundary's schema does not (yet) carry the
 * field, and bounded because it is checked against real output below rather
 * than trusted blind: every `sui-*` wrapper in this checkout follows
 * `sui-<kebab-case>` <-> `<PascalCase>`, EXCEPT one (`sui-hitl` -> `HITL`,
 * which this produces as `Hitl`) -- and that exception is neither a `*Chart`
 * name nor `InputButton`, so it cannot affect either detector that reads
 * `component`. A future acronym-named Chart component or a renamed
 * InputButton would need this fixed at the source instead: threading
 * `component` through `HostDisplayEntry` (derivable there from `file`'s own
 * basename, exactly as `readWcComponents` derives it) and into
 * `WcDisplayAsset`/`wc-display.json` itself, which this file cannot do --
 * `generate-migration-assets.ts` and `host-display-compat.ts` are not its own.
 */
function pascalCaseFromTag(tag: string): string {
  return tag
    .replace(/^sui-/, '')
    .split('-')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

export function wcComponentsFrom(entries: readonly WcDisplayEntry[]): readonly WcComponent[] {
  return entries.map((entry) => ({
    component: pascalCaseFromTag(entry.tag),
    tag: entry.tag,
    display: entry.default
  }));
}

// ------------------------------------------------------------------- shims

type ShimStatus = {
  readonly filename: string;
  readonly present: boolean;
  readonly path: string;
};

function shimStatus(assetsDir: string, filename: string): ShimStatus {
  const path = join(assetsDir, filename);
  return { filename, present: existsSync(path), path };
}

// -------------------------------------------------------------- file walking

type ConsumerFiles = {
  readonly svelte: readonly string[];
  readonly css: readonly string[];
};

/**
 * `.svelte` and `.css` files under `root`, skipping the same directories the
 * prop-rename transform skips (`SKIPPED_DIRECTORIES`, imported from `cli.ts`
 * rather than redeclared, so the two commands can never drift apart on what
 * "skip node_modules et al." means). Not `scripts/migrate/cli.ts`'s own
 * `projectFiles` -- that function is module-private there and reading a
 * consumer's files is a three-line walk, not detection logic, so writing it
 * here is not the kind of duplication the analyzers themselves must avoid.
 */
function consumerFiles(root: string): ConsumerFiles {
  const svelte: string[] = [];
  const css: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
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

// ------------------------------------------------------------------- CLI

export type MigrateAuditOptions = {
  /** Overrides where `wc-display.json`/the shim stylesheets are read from; defaults to this module's own compiled directory. Exists for tests. */
  readonly assetsDir?: string;
};

export type MigrateAuditSummary = {
  readonly exitCode: number;
  readonly filesScanned: number;
  readonly cssFilesScanned: number;
  readonly findings: readonly Finding[];
  readonly wcDisplay: WcDisplayResult;
  readonly rewrites: readonly FileRewrite[];
  readonly applied: boolean;
};

const MIGRATE_USAGE = [
  'Usage: sui-codemod migrate [--dry-run] <consumer path>',
  '       (inside this repository: node scripts/codemod/cli.ts migrate ...)',
  '',
  `Audits a consumer project against the seven breaking changes in ${LIBRARY} 4.28.0:`,
  "InputButton's mandatory prop now also setting native required; a sui-*",
  "custom element used where the browser's old implicit inline mattered; a",
  'chart rendered into a parent narrower than its new 160px floor; the',
  'renamed chart tooltip slot selector; and sui-chat-composer’s recording',
  "attribute, which no longer reflects. See scripts/migrate/README.md's",
  'reason table -- the same detectors run here as in `npm run migrate`.',
  '',
  'The chart tooltip selector rewrite is mechanical, so it is also applied',
  'directly (like the default prop-rename command): every other finding is',
  'reported for review, never rewritten automatically.',
  '',
  '  --dry-run   print the tooltip selector rewrite as a diff without writing it',
  '  --help      show this help',
  '',
  'Also reports whether this install shipped the two compatibility',
  `stylesheets the migration guide describes -- ${LEGACY_DISPLAY_CSS_FILENAME} and`,
  `${LEGACY_PALETTE_CSS_FILENAME} -- by name, so a consumer knows to look for them`,
  'instead of generating either by hand.'
].join('\n');

function emptySummary(exitCode: number, wcDisplay: WcDisplayResult): MigrateAuditSummary {
  return {
    exitCode,
    filesScanned: 0,
    cssFilesScanned: 0,
    findings: [],
    wcDisplay,
    rewrites: [],
    applied: false
  };
}

const UNRESOLVED_WC_DISPLAY: WcDisplayResult = { status: 'missing', path: '' };

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

export function runMigrateAudit(
  argv: readonly string[],
  log: (line: string) => void,
  options: MigrateAuditOptions = {}
): MigrateAuditSummary {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean' }
      },
      allowPositionals: true,
      strict: true
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    log(MIGRATE_USAGE);
    return emptySummary(2, UNRESOLVED_WC_DISPLAY);
  }

  if (parsed.values.help === true) {
    log(MIGRATE_USAGE);
    return emptySummary(0, UNRESOLVED_WC_DISPLAY);
  }
  if (parsed.positionals.length !== 1) {
    log(MIGRATE_USAGE);
    return emptySummary(2, UNRESOLVED_WC_DISPLAY);
  }

  const root = resolve(parsed.positionals[0]);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    log(`error: ${root} is not a directory`);
    return emptySummary(2, UNRESOLVED_WC_DISPLAY);
  }

  const assetsDir = options.assetsDir ?? defaultAssetsDir();
  const wcDisplay = loadWcDisplay(join(assetsDir, WC_DISPLAY_FILENAME));

  log(`sui-codemod migrate: auditing ${root} against ${LIBRARY} 4.28.0`);
  log('');

  let context: AnalyzeContext;
  if (wcDisplay.status === 'ok') {
    context = { wcComponents: wcComponentsFrom(wcDisplay.entries) };
    log(`wc-display.json: ok (${wcDisplay.entries.length} component(s) at ${wcDisplay.path})`);
  } else if (wcDisplay.status === 'missing') {
    context = { wcComponents: [] };
    log(`wc-display.json: NOT FOUND at ${wcDisplay.path}`);
    log('  host-display-inline and chart-min-width could not be audited -- a clean result below');
    log('  does not mean this project is clear of them, only that this run could not look. This');
    log('  file ships inside dist-codemod; reinstall the package if it is missing.');
  } else {
    context = { wcComponents: [] };
    log(`wc-display.json: INVALID at ${wcDisplay.path} -- ${wcDisplay.reason}`);
    log('  host-display-inline and chart-min-width could not be audited -- a clean result below');
    log('  does not mean this project is clear of them, only that this run could not look.');
  }
  log('');

  const files = consumerFiles(root);
  const svelteFindings = files.svelte.flatMap((file) =>
    analyzeSvelte(readFileSync(file, 'utf8'), relative(root, file), context)
  );
  const cssFindings = files.css.flatMap((file) =>
    analyzeStylesheet(readFileSync(file, 'utf8'), relative(root, file))
  );
  const findings = [...svelteFindings, ...cssFindings];

  for (const finding of findings) {
    log(`${finding.reason}  ${finding.file}:${finding.line}`);
    log(`         ${finding.detail}`);
  }
  if (findings.length === 0) {
    log(`No findings across ${files.svelte.length} .svelte and ${files.css.length} .css file(s).`);
  }
  log('');

  // The one finding above that is mechanically fixable: applied directly
  // under sui-codemod's own --dry-run flag, the same way the default
  // prop-rename command applies its rewrite -- never chart-tooltip-selector.ts's
  // own --apply, which this command does not expose.
  const dryRun = parsed.values['dry-run'] === true;
  const rewrites = planSelectorRewrites(root);
  for (const rewrite of rewrites) {
    const parts = [
      rewrite.selectorCount > 0 ? `${rewrite.selectorCount} selector(s)` : '',
      rewrite.scriptCount > 0 ? `${rewrite.scriptCount} querySelector string(s)` : ''
    ].filter((part) => part.length > 0);
    const relativeFile = relative(root, rewrite.file);
    if (dryRun) {
      const before = readFileSync(rewrite.file, 'utf8');
      log(`[dry run] would rewrite ${relativeFile}: ${parts.join(', ')}`);
      printLineDiff(relativeFile, before, rewrite.code, log);
    } else {
      writeFileSync(rewrite.file, rewrite.code);
      log(`rewrote ${relativeFile}: ${parts.join(', ')}`);
    }
  }
  if (rewrites.length === 0) {
    log('No .chart-tooltip-slot selector found to rewrite.');
  }
  log('');

  const legacyDisplay = shimStatus(assetsDir, LEGACY_DISPLAY_CSS_FILENAME);
  const legacyPalette = shimStatus(assetsDir, LEGACY_PALETTE_CSS_FILENAME);
  log('Compatibility shims shipped with this install:');
  log(
    `  ${legacyDisplay.filename}: ${legacyDisplay.present ? `present at ${legacyDisplay.path}` : 'NOT FOUND'} -- restores the old implicit "inline" default host-display-inline findings above describe`
  );
  log(
    `  ${legacyPalette.filename}: ${legacyPalette.present ? `present at ${legacyPalette.path}` : 'NOT FOUND'} -- restores pre-contrast-pass colors; this audit has no detector for that change, review docs/MIGRATION_4.28.md`
  );
  log('');

  // Findings are computed before the rewrite runs, so on a non-dry run the
  // tooltip selectors this command just FIXED are still sitting in that list.
  // Reporting them as "needing review" sends a consumer to look at something
  // that is already correct on disk, and — worse — makes a second run look
  // like it changed nothing when it had nothing left to change. What remains
  // is what the consumer still has to do by hand.
  const rewrittenFiles = new Set(rewrites.map((rewrite) => relative(root, rewrite.file)));
  const remaining =
    dryRun || rewrites.length === 0
      ? findings
      : findings.filter(
          (finding) =>
            finding.reason !== 'chart-tooltip-slot-selector' || !rewrittenFiles.has(finding.file)
        );
  const fixedCount = findings.length - remaining.length;

  log(
    `scanned ${files.svelte.length} .svelte and ${files.css.length} .css file(s), ` +
      `${remaining.length} finding(s) needing review` +
      (fixedCount > 0 ? `, ${fixedCount} already fixed by this run` : '') +
      `, ${rewrites.length} file(s) with an auto-fixable tooltip selector`
  );

  return {
    exitCode: 0,
    filesScanned: files.svelte.length,
    cssFilesScanned: files.css.length,
    findings: remaining,
    wcDisplay,
    rewrites,
    applied: !dryRun && rewrites.length > 0
  };
}
