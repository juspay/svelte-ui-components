import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LEGACY_PAIRS } from '../codemod/legacy-pairs.ts';
import type { LegacyPair } from '../codemod/legacy-pairs.ts';

/**
 * The rename table, applied to prose: `docs/<Component>.md` and README.md.
 *
 * `docs/` is what the MCP server serves to consumers and their agents, so a
 * reference page that still says `onClick` is an instruction to use a
 * spelling 4.0.0 removes — the same defect as an internal call site, one
 * layer up. Markdown has no imports to resolve, so three narrower rules stand
 * in for the codemod's component resolution:
 *
 * 1. A component tag carrying the deprecated attribute (`<Toggle onClick=`)
 *    is rewritten wherever it appears, for every pair.
 * 2. A prop-table row or a backticked mention of a name that only ever names
 *    a component prop (`onOverlayClick`) is rewritten wherever it appears.
 * 3. A name that is also a callback key on a config object (`onToggle` on a
 *    `TableColumn`, `onClick` on a `ComboboxAction`) is ambiguous in prose —
 *    config keys keep their spelling — so it is rewritten only inside the
 *    doc of a component that deprecates it as a prop, and only as a table
 *    row or backticked mention there.
 *
 *   node --experimental-strip-types scripts/migrate/rename-doc-usages.ts [--apply] [--root <repo>]
 *
 * `rename-doc-usages.test.ts` runs the plan in report mode and fails if any
 * doc would change, so a deprecated spelling cannot creep back into the docs.
 */

const escapeRegExp = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Every `on*` callback declared somewhere other than a component's own props
 * — a config object's key, or a nested member — across `src/lib`. Ambiguous
 * in prose, see rule 3.
 */
function configCallbackNames(root: string): ReadonlySet<string> {
  const names = new Set<string>();
  const lib = join(root, 'src', 'lib');
  for (const entry of readdirSync(lib)) {
    const file = join(lib, entry, 'properties.ts');
    if (!existsSync(file)) {
      continue;
    }
    let owner = '';
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const typeLine = /^(?:export )?type (\w+)\b/.exec(line);
      if (typeLine !== null) {
        owner = typeLine[1];
      }
      const declaration = /^(\s*)(on[A-Za-z]+)\??:/.exec(line);
      if (declaration !== null && (!owner.endsWith('Properties') || declaration[1].length !== 2)) {
        names.add(declaration[2]);
      }
    }
  }
  return names;
}

// A tag's attributes, up to but not across its closing `>`. An arrow inside an
// inline handler (`onClick={() => …}`) is the one `>` that does not close the
// tag, so it is consumed as a unit before the character class gets a look.
const ATTRIBUTES = '(?:=>|[^>])*?';

function rewriteTags(text: string, pair: LegacyPair): string {
  const component = escapeRegExp(pair.component);
  const legacy = escapeRegExp(pair.legacy);
  return (
    text
      // `legacy={…}` / bare `legacy`: rename the attribute.
      .replace(
        new RegExp(`(<${component}\\b${ATTRIBUTES}\\s)${legacy}(?=[=\\s>/])`, 'g'),
        `$1${pair.corrected}`
      )
      // Shorthand `{legacy}`: expand to `corrected={legacy}`, keeping the local
      // identifier the example's script declares — the same choice the codemod
      // makes, so a doc example and a migrated consumer read alike.
      .replace(
        new RegExp(`(<${component}\\b${ATTRIBUTES}\\s)\\{${legacy}\\}`, 'g'),
        `$1${pair.corrected}={${pair.legacy}}`
      )
  );
}

function rewriteProse(text: string, pair: LegacyPair): string {
  const legacy = escapeRegExp(pair.legacy);
  return (
    text
      .replace(new RegExp(`\`${legacy}\``, 'g'), `\`${pair.corrected}\``)
      // A prop-table row names the prop in its first cell.
      .replace(new RegExp(`^(\\|\\s*)${legacy}(\\s*\\|)`, 'gm'), `$1${pair.corrected}$2`)
      // Property access on a custom element (`element.onsend = …`, `` `.onsend` ``).
      .replace(new RegExp(`\\.${legacy}\\b`, 'g'), `.${pair.corrected}`)
  );
}

/** Pairs whose legacy name only ever names a prop, and maps to one spelling across the table. */
function unambiguousPairs(ambiguous: ReadonlySet<string>): readonly LegacyPair[] {
  const targets = new Map<string, Set<string>>();
  for (const pair of LEGACY_PAIRS) {
    targets.set(pair.legacy, new Set([...(targets.get(pair.legacy) ?? []), pair.corrected]));
  }
  return LEGACY_PAIRS.filter(
    (pair) => !ambiguous.has(pair.legacy) && targets.get(pair.legacy)?.size === 1
  );
}

export function rewriteDoc(file: string, text: string, ambiguous: ReadonlySet<string>): string {
  const component = basename(file, '.md');
  const ownPairs = LEGACY_PAIRS.filter((pair) => pair.component === component);
  let next = text;
  for (const pair of LEGACY_PAIRS) {
    next = rewriteTags(next, pair);
  }
  for (const pair of unambiguousPairs(ambiguous)) {
    next = rewriteProse(next, pair);
  }
  for (const pair of ownPairs) {
    next = rewriteProse(next, pair);
  }
  return next;
}

export type DocRename = { readonly file: string; readonly code: string };

const EXCLUDED_DOCS: ReadonlySet<string> = new Set([
  // Release history and the migration guides talk about the old names on purpose.
  'CHANGELOG.md',
  'EVENT_CASING_MIGRATION.md',
  'MIGRATION_4.0.md'
]);

export function planDocRenames(root: string): readonly DocRename[] {
  const docs = readdirSync(join(root, 'docs'))
    .filter((name) => name.endsWith('.md') && !EXCLUDED_DOCS.has(name))
    .map((name) => join(root, 'docs', name));
  const ambiguous = configCallbackNames(root);
  return [...docs, join(root, 'README.md')].flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    const code = rewriteDoc(file, text, ambiguous);
    return code === text ? [] : [{ file, code }];
  });
}

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  const apply = process.argv.includes('--apply');
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag === -1 ? process.cwd() : (process.argv.at(rootFlag + 1) ?? process.cwd());
  const plan = planDocRenames(root);
  for (const item of plan) {
    console.log(item.file);
    if (apply) {
      writeFileSync(item.file, item.code);
    }
  }
  console.log(`${apply ? 'rewrote' : 'would rewrite'} ${plan.length} file(s)`);
}
