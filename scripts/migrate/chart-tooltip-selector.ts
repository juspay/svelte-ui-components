import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

/**
 * 3.x's ChartTooltip unification: PieChart and SankeyChart's own custom-tooltip
 * wrapper, `<div class="chart-tooltip-slot">`, was replaced by the shared
 * `<ChartTooltip>`, which renders `class="chart-tooltip unstyled"` (plus `portal`
 * when `tooltipPortal` is set) -- see `src/lib/_chart/ChartTooltip.svelte`. A
 * consumer stylesheet selecting `.chart-tooltip-slot` now matches nothing, with
 * no error: a CSS selector matching zero elements is not a build or runtime
 * failure, so this is the one 3.x break a type checker or test suite cannot
 * catch on a consumer's behalf.
 *
 * The rename is mechanical -- one class token to another, nothing structural
 * changes around it -- so this rewrites `.chart-tooltip-slot` to `.chart-tooltip`
 * wherever it is genuinely a class-selector token: in a consumer's `.css` files,
 * inside the `<style>` block of its `.svelte` files, and inside the string
 * argument of a `querySelector`/`querySelectorAll`/`closest`/`matches` call in a
 * `.svelte` file's `<script>` block (see the doc comment on SELECTOR_CALL for
 * why that last one and nothing broader in script code). A `.svelte` file's own
 * template is left untouched -- see rewriteSvelteFile.
 *
 *   node --experimental-strip-types scripts/migrate/chart-tooltip-selector.ts [--apply] <consumer-root>
 *
 * Reports by default; nothing is written without --apply, matching every other
 * script in this directory.
 */

const USAGE = [
  'Usage: node scripts/migrate/chart-tooltip-selector.ts [--apply] <consumer-root>',
  '',
  'Rewrites the .chart-tooltip-slot selector PieChart and SankeyChart rendered',
  'before 3.x to .chart-tooltip, the class the shared <ChartTooltip> renders now,',
  "across a consumer project's .css and .svelte files. Reports by default;",
  '--apply writes the rewritten files.',
  '',
  '  --apply   write the rewritten files',
  '  --help    show this help'
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

/** A class-selector token, never a substring of a longer class name on either side. */
const CLASS_SELECTOR = /\.chart-tooltip-slot(?![\w-])/g;

/**
 * Rewrites every bare `.chart-tooltip-slot` class-selector token to
 * `.chart-tooltip`, in place inside whatever surrounding selector it sits in.
 *
 * Requiring a literal `.` immediately before the token is what keeps
 * `.my-chart-tooltip-slot` alone: there is no `.` directly before "chart"
 * there, only a `-`, so the pattern never starts matching inside it. The
 * trailing `(?![\w-])` is the other half -- it stops `.chart-tooltip-slot-header`
 * or the unrelated `.chart-tooltip-slots` from matching on their shared prefix.
 * Because only the matched substring is replaced -- the rest of the selector is
 * untouched text on either side -- a compound selector
 * (`.foo .chart-tooltip-slot > .bar`, `.chart-tooltip-slot.portal`) keeps its
 * combinators and structure exactly; nothing here parses selector grammar.
 */
export function rewriteCss(source: string): { readonly code: string; readonly count: number } {
  let count = 0;
  const code = source.replace(CLASS_SELECTOR, () => {
    count += 1;
    return '.chart-tooltip';
  });
  return { code, count };
}

/**
 * The string-literal argument of a querySelector/querySelectorAll/closest/
 * matches call. Deliberately narrow: rewriting `.chart-tooltip-slot` wherever
 * the substring appears in script code would also catch a code comment, a test
 * fixture string, or a log message quoting the old class name for reference,
 * and silently rewriting those changes what they *say* rather than what they
 * *do*. Restricting to the argument of a selector-reading DOM method gives the
 * same guarantee the CSS case gets for free from sitting inside a `<style>`
 * block: the matched text is actually being used as a CSS selector, not merely
 * mentioning one. `rewriteScript`'s own test proves the narrower half of that
 * trade: a bare mention outside such a call is left alone.
 */
const SELECTOR_CALL =
  /(\b(?:querySelector|querySelectorAll|closest|matches)\s*\(\s*)(['"`])((?:\\.|(?!\2)[\s\S])*)(\2\s*\))/g;

export function rewriteScript(source: string): { readonly code: string; readonly count: number } {
  let count = 0;
  const code = source.replace(
    SELECTOR_CALL,
    (_full: string, prefix: string, quote: string, body: string, suffix: string) => {
      const rewritten = rewriteCss(body);
      count += rewritten.count;
      return `${prefix}${quote}${rewritten.code}${suffix}`;
    }
  );
  return { code, count };
}

/**
 * Splices `rewrite`'s output back into `source` at each match of `blockPattern`,
 * leaving everything outside the captured group untouched. `contentStart`
 * bridges the match offset (which points at the opening tag) to where the
 * captured content actually begins -- the same bridge `analyze.ts` uses for its
 * `legacy-back-selector` line numbers, needed here for the same reason: the
 * tag's own length would otherwise misplace where the replacement is spliced in
 * for any block that isn't on the file's first line.
 */
function rewriteBlocks(
  source: string,
  blockPattern: RegExp,
  rewrite: (content: string) => { readonly code: string; readonly count: number }
): { readonly code: string; readonly count: number } {
  let count = 0;
  let out = '';
  let last = 0;
  for (const match of source.matchAll(blockPattern)) {
    const whole = match[0];
    const content = match[1];
    const start = match.index ?? 0;
    const contentStart = start + whole.indexOf(content);
    out += source.slice(last, contentStart);
    const rewritten = rewrite(content);
    out += rewritten.code;
    count += rewritten.count;
    last = contentStart + content.length;
  }
  out += source.slice(last);
  return { code: out, count };
}

const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g;
const SCRIPT_BLOCK = /<script[^>]*>([\s\S]*?)<\/script>/g;

export type SvelteRewrite = {
  readonly code: string;
  readonly selectorCount: number;
  readonly scriptCount: number;
};

/**
 * Rewrites a `.svelte` file's `<style>` and `<script>` blocks only. The
 * template is left alone on purpose: `chart-tooltip-slot` was PieChart/
 * SankeyChart's own internal wrapper, never a prop, slot, or class name a
 * consumer's own markup had reason to write -- so the only places the old name
 * can legitimately appear in a `.svelte` file are a global style rule reaching
 * for it and a script reading the DOM for it. A literal `class="chart-tooltip-
 * slot"` sitting in a consumer's own template is that consumer's own class,
 * coincidentally named, and rewriting it would change markup this rename never
 * touched.
 */
export function rewriteSvelteFile(source: string): SvelteRewrite {
  const afterStyle = rewriteBlocks(source, STYLE_BLOCK, rewriteCss);
  const afterScript = rewriteBlocks(afterStyle.code, SCRIPT_BLOCK, rewriteScript);
  return {
    code: afterScript.code,
    selectorCount: afterStyle.count,
    scriptCount: afterScript.count
  };
}

function targetFiles(root: string): readonly string[] {
  const found: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) {
          visit(join(dir, entry.name));
        }
        continue;
      }
      if (entry.name.endsWith('.css') || entry.name.endsWith('.svelte')) {
        found.push(join(dir, entry.name));
      }
    }
  };
  visit(root);
  return found;
}

export type FileRewrite = {
  readonly file: string;
  readonly code: string;
  readonly selectorCount: number;
  readonly scriptCount: number;
};

/** Every `.css`/`.svelte` file under `root` this rename would change, with its rewritten text. */
export function planSelectorRewrites(root: string): readonly FileRewrite[] {
  const plans: FileRewrite[] = [];
  for (const file of targetFiles(root)) {
    const source = readFileSync(file, 'utf8');
    if (file.endsWith('.css')) {
      const result = rewriteCss(source);
      if (result.count > 0) {
        plans.push({ file, code: result.code, selectorCount: result.count, scriptCount: 0 });
      }
      continue;
    }
    const result = rewriteSvelteFile(source);
    if (result.selectorCount > 0 || result.scriptCount > 0) {
      plans.push({
        file,
        code: result.code,
        selectorCount: result.selectorCount,
        scriptCount: result.scriptCount
      });
    }
  }
  return plans;
}

/**
 * Checked directly against `src/lib/_chart/ChartTooltip.svelte`: both the
 * portalled and inline branches of its template carry `data-pw="chart-tooltip"`
 * unconditionally, so it is present whether or not `unstyled`/`portal` are set
 * -- unlike a class list, which is exactly what this migration exists because a
 * consumer relied on.
 */
const RECOMMENDATION = [
  '',
  'More durable than either selector: ChartTooltip always sets',
  '`data-pw="chart-tooltip"` (present on both the portalled and inline branch,',
  'independent of `unstyled`/`portal` -- verified against',
  'src/lib/_chart/ChartTooltip.svelte), so `[data-pw="chart-tooltip"]` survives',
  "the next class rename the way `.chart-tooltip-slot` just didn't."
].join('\n');

export type SelectorMigrateSummary = {
  readonly exitCode: number;
  readonly filesScanned: number;
  readonly rewrites: readonly FileRewrite[];
  readonly applied: boolean;
};

export function run(argv: readonly string[], log: (line: string) => void): SelectorMigrateSummary {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        apply: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false }
      },
      allowPositionals: true
    });
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    log(USAGE);
    return { exitCode: 2, filesScanned: 0, rewrites: [], applied: false };
  }

  if (parsed.values.help === true || parsed.positionals.length !== 1) {
    log(USAGE);
    return {
      exitCode: parsed.values.help === true ? 0 : 2,
      filesScanned: 0,
      rewrites: [],
      applied: false
    };
  }

  const root = resolve(parsed.positionals[0]);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    log(`error: ${root} is not a directory`);
    return { exitCode: 2, filesScanned: 0, rewrites: [], applied: false };
  }

  const apply = parsed.values.apply === true;
  const files = targetFiles(root);
  const rewrites = planSelectorRewrites(root);

  for (const rewrite of rewrites) {
    const parts = [
      rewrite.selectorCount > 0 ? `${rewrite.selectorCount} selector(s)` : '',
      rewrite.scriptCount > 0 ? `${rewrite.scriptCount} querySelector string(s)` : ''
    ].filter((part) => part.length > 0);
    log(`${relative(root, rewrite.file)}: ${parts.join(', ')}`);
    if (apply) {
      writeFileSync(rewrite.file, rewrite.code);
    }
  }

  if (rewrites.length === 0) {
    log(`No .chart-tooltip-slot selector found across ${files.length} .css/.svelte file(s).`);
  } else {
    log(RECOMMENDATION);
  }

  const totalSelectors = rewrites.reduce((sum, rewrite) => sum + rewrite.selectorCount, 0);
  const totalScript = rewrites.reduce((sum, rewrite) => sum + rewrite.scriptCount, 0);
  log('');
  log(
    `${apply ? 'rewrote' : 'would rewrite'} ${totalSelectors} selector(s) and ${totalScript} querySelector string(s) across ${rewrites.length} of ${files.length} file(s)`
  );

  return { exitCode: 0, filesScanned: files.length, rewrites, applied: apply };
}

// Comparing against a basename split on '/' fails on Windows, where argv[1] uses
// backslashes and the split yields the whole path -- the CLI then silently
// declines to run. Normalising both sides to a file URL is platform-agnostic;
// mirrors cli.ts's own guard.
const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url === pathToFileURL(resolve(entrypoint)).href;

if (invokedDirectly) {
  const summary = run(process.argv.slice(2), (line) => console.log(line));
  process.exitCode = summary.exitCode;
}
