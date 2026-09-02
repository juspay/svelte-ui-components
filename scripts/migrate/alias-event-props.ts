/**
 * Phase 1 of the event-casing migration: give every grandfathered prop its
 * correct spelling alongside the old one, both wired to the same handler.
 *
 * Committed rather than run once and thrown away, because it is the only
 * honest description of how 57 components were edited at once. Re-running it
 * on an already-aliased tree is a no-op.
 *
 * The transform is deliberately narrow. For `onclick` -> `onClick` it rewrites
 *
 *     let { onclick }: ToggleProperties = $props();
 *
 * to
 *
 *     let { onclick: onclickLegacy, onClick }: ToggleProperties = $props();
 *     const onclick = $derived(onClick ?? onclickLegacy);
 *
 * so every existing reference to `onclick` in the script and template keeps
 * resolving, and no call site is touched. That matters more than it sounds:
 * `Toggle.svelte` both destructures a synthetic `onclick` prop AND renders
 * `<input onclick={handleCheckboxClick}>`, and a textual rename would corrupt
 * the second. Only the binding inside the `$props()` pattern is rewritten, and
 * an attribute name is not a binding.
 *
 *   node --experimental-strip-types scripts/migrate/alias-event-props.ts [--apply]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { deriveEventName } from './casing.ts';
import { readSignature } from './signatures.ts';

const BASELINE = 'scripts/event-casing-baseline.json';

type Alias = {
  readonly component: string;
  readonly propertiesFile: string;
  readonly svelteFile: string;
  readonly from: string;
  readonly to: string;
};

type Skip = { readonly entry: string; readonly reason: string };

const legacyBindingFor = (prop: string): string => `${prop}Legacy`;

/**
 * Reads a node's source offset.
 *
 * Svelte attaches `start` and `end` to every node at runtime, but the ESTree
 * types it reuses do not declare them, and this repo bans both type assertions
 * and type predicates — so the offsets are read reflectively and narrowed.
 */
function offsetOf(node: unknown, key: 'start' | 'end'): number {
  if (typeof node !== 'object' || node === null) {
    return -1;
  }
  const value = Reflect.get(node, key);
  return typeof value === 'number' ? value : -1;
}

function componentFileFor(propertiesFile: string): string {
  const directory = dirname(propertiesFile);
  const component = directory.split('/').at(-1) ?? '';
  return join(directory, `${component}.svelte`);
}

/** The `let { ... } = $props()` pattern, as offsets into the instance script. */
type PropsPattern = {
  readonly start: number;
  readonly end: number;
  readonly declarationEnd: number;
  readonly names: ReadonlyMap<
    string,
    { readonly start: number; readonly end: number; readonly fallback: string | null }
  >;
};

function findPropsPattern(source: string): PropsPattern | null {
  const root = parse(source, { modern: true });
  const instance = root.instance;
  if (instance === null || typeof instance === 'undefined') {
    return null;
  }

  for (const node of instance.content.body) {
    if (node.type !== 'VariableDeclaration') {
      continue;
    }
    const declarator = node.declarations[0];
    if (typeof declarator === 'undefined' || declarator.id.type !== 'ObjectPattern') {
      continue;
    }
    const names = new Map<string, { start: number; end: number; fallback: string | null }>();
    for (const property of declarator.id.properties) {
      if (property.type !== 'Property' || property.key.type !== 'Identifier') {
        continue;
      }
      // A destructured default is part of the property node. Dropping it turns
      // `onBlur = () => {}` into an undefined binding, and Input calls
      // `onBlur(event)` unguarded -- a crash for every consumer not passing it.
      const value = property.value;
      const fallback =
        value.type === 'AssignmentPattern'
          ? source.slice(offsetOf(value.right, 'start'), offsetOf(value.right, 'end'))
          : null;
      names.set(property.key.name, {
        start: offsetOf(property, 'start'),
        end: offsetOf(property, 'end'),
        fallback
      });
    }
    return {
      start: offsetOf(declarator.id, 'start'),
      end: offsetOf(declarator.id, 'end'),
      declarationEnd: offsetOf(node, 'end'),
      names
    };
  }
  return null;
}

function aliasProperties(source: string, from: string, to: string): string | null {
  // Scanned rather than matched on a line. A declaration is not reliably one
  // line (`onpointclick?: (event: {\n seriesIndex: number;\n ... }) => void;`)
  // and its type carries `;` of its own, so the end is the first `;` at depth
  // zero, not the first `;` at all.
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opening = new RegExp(`^([ \\t]*)${escaped}\\??\\s*:`, 'm').exec(source);
  if (opening === null) {
    return null;
  }

  const start = opening.index;
  let depth = 0;
  let end = -1;
  for (let i = start; i < source.length; i++) {
    const character = source[i];
    if (character === '(' || character === '{' || character === '[') {
      depth += 1;
    } else if (character === ')' || character === '}' || character === ']') {
      depth -= 1;
    } else if (character === ';' && depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return null;
  }

  const indent = opening[1];
  const block = source.slice(start, end + 1);
  const renamed = block.replace(`${indent}${from}`, `${indent}${to}`);
  // The new spelling goes after the old one, so any JSDoc above the original
  // keeps describing the prop it was written for.
  return `${source.slice(0, end + 1)}\n${renamed}${source.slice(end + 1)}`;
}

function aliasComponent(source: string, aliases: readonly Alias[]): string | null {
  const pattern = findPropsPattern(source);
  if (pattern === null) {
    return null;
  }

  const applicable = aliases.filter((alias) => pattern.names.has(alias.from));
  if (applicable.length === 0) {
    return null;
  }

  // Back to front, so earlier offsets stay valid.
  const ordered = [...applicable].sort(
    (a, b) => (pattern.names.get(b.from)?.start ?? 0) - (pattern.names.get(a.from)?.start ?? 0)
  );

  let code = source;
  for (const alias of ordered) {
    const site = pattern.names.get(alias.from);
    if (typeof site === 'undefined') {
      continue;
    }
    // `onclick` -> `onclick: onclickLegacy, onClick`, carrying any default
    // onto the legacy binding so an unpassed prop still resolves to it.
    const legacy =
      site.fallback === null
        ? legacyBindingFor(alias.from)
        : `${legacyBindingFor(alias.from)} = ${site.fallback}`;
    const rewritten = `${alias.from}: ${legacy}, ${alias.to}`;
    code = `${code.slice(0, site.start)}${rewritten}${code.slice(site.end)}`;
  }

  const deriveds = applicable
    .map(
      (alias) => `  const ${alias.from} = $derived(${alias.to} ?? ${legacyBindingFor(alias.from)});`
    )
    .join('\n');

  const insertAt = code.indexOf('$props();');
  if (insertAt === -1) {
    return null;
  }
  const lineEnd = code.indexOf('\n', insertAt);
  const cut = lineEnd === -1 ? code.length : lineEnd + 1;
  const banner = '\n  // Event-casing phase 1: both spellings accepted, the correct one wins.\n';
  return `${code.slice(0, cut)}${banner}${deriveds}\n${code.slice(cut)}`;
}

export function planAliases(root: string): {
  readonly aliases: readonly Alias[];
  readonly skipped: readonly Skip[];
} {
  const baseline: readonly string[] = JSON.parse(readFileSync(join(root, BASELINE), 'utf8'));
  const aliases: Alias[] = [];
  const skipped: Skip[] = [];

  for (const entry of baseline) {
    const [propertiesFile, prop] = entry.split('::');
    const absolute = join(root, propertiesFile);
    const derived = deriveEventName(prop, readSignature(absolute, prop));
    if (derived.kind === 'unresolved' || derived.kind === 'ok') {
      skipped.push({ entry, reason: `nothing to rename (${derived.kind})` });
      continue;
    }
    const source = readFileSync(absolute, 'utf8');
    if (new RegExp(`^\\s*${derived.target}\\??:`, 'm').test(source)) {
      skipped.push({ entry, reason: `${derived.target} already declared` });
      continue;
    }
    aliases.push({
      component: dirname(propertiesFile).split('/').at(-1) ?? '',
      propertiesFile,
      svelteFile: componentFileFor(propertiesFile),
      from: prop,
      to: derived.target
    });
  }
  return { aliases, skipped };
}

export function applyAliases(
  root: string,
  apply: boolean,
  log: (line: string) => void
): { readonly changed: number; readonly skipped: number } {
  const { aliases, skipped } = planAliases(root);
  const byComponent = new Map<string, Alias[]>();
  for (const alias of aliases) {
    byComponent.set(alias.svelteFile, [...(byComponent.get(alias.svelteFile) ?? []), alias]);
  }

  let changed = 0;
  const failures: string[] = [];

  for (const [svelteFile, group] of byComponent) {
    const propertiesFile = group[0].propertiesFile;
    const propertiesPath = join(root, propertiesFile);
    let properties = readFileSync(propertiesPath, 'utf8');
    let typesOk = true;
    for (const alias of group) {
      const next = aliasProperties(properties, alias.from, alias.to);
      if (next === null) {
        failures.push(`${propertiesFile}: could not find a declaration for ${alias.from}`);
        typesOk = false;
        break;
      }
      properties = next;
    }
    if (!typesOk) {
      continue;
    }

    const sveltePath = join(root, svelteFile);
    const component = aliasComponent(readFileSync(sveltePath, 'utf8'), group);
    if (component === null) {
      failures.push(
        `${svelteFile}: no $props() pattern carrying ${group.map((a) => a.from).join(', ')}`
      );
      continue;
    }

    if (apply) {
      writeFileSync(propertiesPath, properties);
      writeFileSync(sveltePath, component);
    }
    changed += group.length;
    log(`${group[0].component}: ${group.map((a) => `${a.from} -> ${a.to}`).join(', ')}`);
  }

  for (const failure of failures) {
    log(`SKIP  ${failure}`);
  }
  for (const skip of skipped) {
    log(`SKIP  ${skip.entry}: ${skip.reason}`);
  }
  log('');
  log(
    `${changed} alias(es) across ${byComponent.size} component(s); ${failures.length + skipped.length} skipped${apply ? '' : ' (dry run, nothing written)'}`
  );
  return { changed, skipped: failures.length + skipped.length };
}

const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url.endsWith(entrypoint.split('/').at(-1) ?? '');

if (invokedDirectly) {
  applyAliases(resolve('.'), process.argv.includes('--apply'), (line) => console.log(line));
}
