import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalEventName } from './casing.ts';

/**
 * The custom-element half of the 4.0.0 removal, and the inverse of
 * `alias-wc-props.ts`.
 *
 * That script gave every wrapper a second `customElement.props` declaration
 * for each camelCase spelling, so `<sui-toggle onClick={fn}>` kept reaching
 * the component. With the aliases gone from `properties.ts` those
 * declarations now name props no component accepts: the element would still
 * expose a setter, and writing to it would do nothing at all — the worst
 * shape for a removed API, because it fails silently rather than loudly.
 *
 * A declaration is removed only when the canonical spelling it resolves to is
 * declared beside it, which is what makes it an alias rather than a prop that
 * merely happens to be camelCase. The canonical name comes from
 * `canonicalEventName`, not from lowercasing, because four of these do not
 * lowercase into their replacement — Gallery's `onDismiss` became `onclose`
 * and MediaUpload's `onRejected` became `onerror`. Anything without a twin is
 * left alone and reported: `Input.onErrorMessage` is a string, not an event.
 *
 *   node --experimental-strip-types scripts/migrate/remove-wc-alias-props.ts [--apply] [--root <repo>]
 */

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const rootFlag = argv.indexOf('--root');
const root = rootFlag === -1 ? process.cwd() : argv[rootFlag + 1];
const WC_DIR = join(root, 'src/wc/components');

/** `      onClick: { type: 'Object' },` — one declaration, at wrapper indent. */
const DECLARATION = /^(\s*)(on[A-Za-z]+)(\??):\s*\{[^}]*\},?\s*$/;

let changedFiles = 0;
let removed = 0;
const kept: string[] = [];

for (const file of readdirSync(WC_DIR)
  .filter((name) => name.endsWith('.wc.svelte'))
  .sort()) {
  const path = join(WC_DIR, file);
  const source = readFileSync(path, 'utf8');
  const lines = source.split('\n');
  // The component this wraps, which is what `canonicalEventName` keys its
  // per-component overrides on.
  const imported = /import\s+\w+\s+from\s+'\$lib\/[^']*\/(\w+)\.svelte'/.exec(source);
  const component = imported === null ? '' : imported[1];

  const declared = new Set<string>();
  for (const line of lines) {
    const match = DECLARATION.exec(line);
    if (match !== null) {
      declared.add(match[2]);
    }
  }

  const out: string[] = [];
  let touched = false;
  for (const line of lines) {
    const match = DECLARATION.exec(line);
    if (match === null) {
      out.push(line);
      continue;
    }
    const name = match[2];
    if (name === name.toLowerCase()) {
      out.push(line);
      continue;
    }
    const canonical = canonicalEventName(component, name);
    if (canonical === name || !declared.has(canonical)) {
      // No canonical twin beside it, so this is not one of phase 1's aliases.
      kept.push(`${file}: ${name}`);
      out.push(line);
      continue;
    }
    touched = true;
    removed += 1;
  }

  if (touched) {
    changedFiles += 1;
    if (apply) {
      writeFileSync(path, out.join('\n'));
    }
  }
}

for (const entry of kept) {
  console.log(`KEPT ${entry} — no canonical twin declared beside it`);
}
console.log(
  `${apply ? 'removed' : 'would remove'} ${removed} alias declaration(s) across ${changedFiles} wrapper(s)`
);
