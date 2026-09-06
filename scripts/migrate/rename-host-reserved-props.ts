import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 4.0.0's other removal: custom-element props whose names are already taken on
 * `HTMLElement`.
 *
 * A Svelte custom element turns each declared prop into an accessor on the
 * element class. When the name is one the platform already defines —
 * `title`, `id`, `role`, `hidden`, `children`, and the `aria*` accessors
 * ARIAMixin puts on every Element — the declaration replaces the platform's.
 * `element.title = 'x'` then sets a component prop instead of the tooltip, and
 * `element.children` on the three wrappers that declared it returns undefined
 * rather than an HTMLCollection. `scripts/wc-parity/prop-parity.test.ts`
 * recorded the set rather than failing on it, because renaming a public prop
 * needs a major.
 *
 * The rename is deliberately property-only. Each declaration keeps the exact
 * attribute it observes today — pinned explicitly, since Svelte otherwise
 * derives it by lowercasing the new, longer name — so `<sui-card title="x">`
 * and every other HTML usage is untouched. What changes is the JavaScript
 * property: `element.title` goes back to the platform's, and the component's
 * value moves to `element.cardTitle`. That is the whole defect, and nothing
 * more is broken to fix it.
 *
 * `children` is removed rather than renamed. Slotted content reaches a custom
 * element through the light DOM, so the declaration bought nothing and cost
 * the element its `children` collection.
 *
 *   node --experimental-strip-types scripts/migrate/rename-host-reserved-props.ts [--apply] [--root <repo>]
 */

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const rootFlag = argv.indexOf('--root');
const root = rootFlag === -1 ? process.cwd() : argv[rootFlag + 1];
const WC_DIR = join(root, 'src/wc/components');
const RATCHET = join(root, 'scripts/wc-parity/prop-parity.test.ts');

/** The recorded set is the work list, so the two cannot drift. */
const recorded = (): readonly { file: string; prop: string }[] => {
  const source = readFileSync(RATCHET, 'utf8');
  const block = /const KNOWN_HOST_RESERVED_DECLARATIONS[^[]*\[([\s\S]*?)\n\];/.exec(source);
  if (block === null) {
    throw new Error('KNOWN_HOST_RESERVED_DECLARATIONS not found');
  }
  return [...block[1].matchAll(/'([^:]+):([^']+)'/g)].map((match) => ({
    file: match[1],
    prop: match[2]
  }));
};

/** `Card.wc.svelte` + `title` -> `cardTitle`. Predictable beats clever here. */
const renamed = (file: string, prop: string): string => {
  const component = file.replace('.wc.svelte', '');
  const head = component.charAt(0).toLowerCase() + component.slice(1);
  return `${head}${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
};

const notes: string[] = [];
let changedFiles = 0;
let renames = 0;
let removals = 0;

const byFile = new Map<string, string[]>();
for (const { file, prop } of recorded()) {
  byFile.set(file, [...(byFile.get(file) ?? []), prop]);
}

for (const [file, props] of [...byFile].sort()) {
  const path = join(WC_DIR, file);
  let source = readFileSync(path, 'utf8');
  const before = source;
  const forwards: { from: string; to: string }[] = [];

  for (const prop of props) {
    const declaration = new RegExp(`^(\\s*)${prop}:\\s*\\{([^}]*)\\},?[ \\t]*\\n`, 'm');
    const match = declaration.exec(source);
    if (match === null) {
      notes.push(`${file}: ${prop} — declaration not found, skipped`);
      continue;
    }

    if (prop === 'children') {
      // Nothing to forward: light DOM already carries slotted content.
      source = source.replace(declaration, '');
      removals += 1;
      continue;
    }

    const body = match[2];
    const explicit = /attribute:\s*'([^']+)'/.exec(body);
    const attribute = explicit === null ? prop.toLowerCase() : explicit[1];
    const next = renamed(file, prop);
    if (new RegExp(`^\\s*${next}:`, 'm').test(source)) {
      notes.push(`${file}: ${next} already declared, skipped`);
      continue;
    }

    const kept = body
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !part.startsWith('attribute:'));
    const rebuilt = `${match[1]}${next}: { ${[...kept, `attribute: '${attribute}'`].join(', ')} },\n`;
    source = source.replace(declaration, rebuilt);
    forwards.push({ from: prop, to: next });
    renames += 1;
  }

  // Bind the renamed props out of $props() and hand them to the component
  // under the names it actually declares.
  for (const { to } of forwards) {
    const whole = /let\s+(\w+)\s*=\s*\$props\(\);/.exec(source);
    const rest = /let\s*\{([\s\S]*?)\}(\s*:\s*[\w<>[\], |]+)?\s*=\s*\$props\(\);/.exec(source);
    if (rest !== null && /\.\.\.\w+/.test(rest[1])) {
      source = source.replace(rest[0], rest[0].replace(/\{/, `{\n    ${to},`));
    } else if (whole !== null) {
      source = source.replace(whole[0], `let { ${to}, ...${whole[1]} } = $props();`);
    } else if (rest !== null) {
      source = source.replace(rest[0], rest[0].replace(/\{/, `{\n    ${to},`));
    } else {
      notes.push(`${file}: no $props() binding found for ${to}`);
    }
  }

  if (forwards.length > 0) {
    // One insertion point: the spread that already forwards everything else.
    const spread = /(<[A-Z]\w*[^>]*?\{\.\.\.\w+\})/.exec(source);
    if (spread === null) {
      notes.push(
        `${file}: no spread found, forward these by hand: ${forwards.map((f) => f.to).join(', ')}`
      );
    } else {
      const attrs = forwards.map(({ from, to }) => `${from}={${to}}`).join(' ');
      source = source.replace(spread[1], `${spread[1]} ${attrs}`);
    }
  }

  if (source !== before) {
    changedFiles += 1;
    if (apply) {
      writeFileSync(path, source);
    }
  }
}

for (const note of notes) {
  console.log(`NOTE ${note}`);
}
console.log(
  `${apply ? 'renamed' : 'would rename'} ${renames} prop(s) and ${apply ? 'removed' : 'would remove'} ${removals} children declaration(s) across ${changedFiles} wrapper(s)`
);
