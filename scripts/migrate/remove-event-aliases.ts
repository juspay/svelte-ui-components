import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'svelte/compiler';
import type { ComponentNote, Declaration, Group } from './lowercase-event-props.ts';
import { groupDeclarations, scanDeclarations } from './lowercase-event-props.ts';

/**
 * Phase 2 of `docs/EVENT_CASING_MIGRATION.md`: the inverse of
 * `lowercase-event-props.ts`. That script gave every event prop a lowercase
 * twin and kept the old spelling working as a warned `@deprecated` alias;
 * this one removes the alias now that 4.0.0 is the release that drops it.
 *
 * For each `properties.ts`, a group whose canonical member has any
 * `@deprecated` sibling loses every sibling, leaving only the canonical
 * declaration with whatever description the group carries. The component is
 * rewritten to match: the destructured alias binding is dropped, the
 * `resolveDeprecatedProp` statement that resolved it is deleted, and the
 * derived identifier the component's own code used is replaced by the
 * canonical prop directly — a rename only when that identifier was not
 * already spelled like the canonical name (most components resolved into an
 * identifier that already was the canonical spelling, so nothing textual
 * changes there beyond the destructuring).
 *
 *   node --experimental-strip-types scripts/migrate/remove-event-aliases.ts [--apply] [--root <repo>]
 *
 * Running it again on its own output changes nothing (`remove-event-aliases.test.ts`).
 */

/** `lowercase-event-props.ts`'s own banner, duplicated rather than imported — this
 *  codebase's small per-script AST/text constants are copied, not shared, the same
 *  way `alias-wc-props.ts` keeps its own `asRecord`/`asList`/`keyName`/`offsetOf`. */
const BANNER =
  '  // Every spelling this component still accepts resolves to one value; the lowercase one wins.';

/** Offset of the first `;` at bracket depth zero at or after `from`, or -1. */
function statementEnd(source: string, from: number): number {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    const character = source[i];
    if (character === '(' || character === '{' || character === '[') {
      depth += 1;
    } else if (character === ')' || character === '}' || character === ']') {
      depth -= 1;
    } else if (character === ';' && depth === 0) {
      return i;
    }
  }
  return -1;
}

function docBlock(lines: readonly string[], indent: string): string {
  if (lines.length === 0) {
    return '';
  }
  if (lines.length === 1) {
    return `${indent}/** ${lines[0]} */\n`;
  }
  return `${indent}/**\n${lines.map((line) => `${indent} *${line.length > 0 ? ` ${line}` : ''}`).join('\n')}\n${indent} */\n`;
}

// ---------------------------------------------------------------- properties

/**
 * The surviving declaration for a group: the canonical name, its own
 * description when it has one, or else whichever member's description
 * mirrors `emitGroup`'s own fallback chain in `lowercase-event-props.ts` —
 * consulted in reverse, since the canonical member is now the only one left.
 */
function emitCanonical(group: Group): string {
  const { canonical, members } = group;
  const primary =
    members.find((member) => member.name === canonical) ??
    members.find((member) => !member.deprecated) ??
    members[0];
  const describer =
    members.find((member) => member.name === canonical && member.description.length > 0) ??
    members.find((member) => !member.deprecated && member.description.length > 0) ??
    members.find((member) => member.description.length > 0) ??
    null;
  const indent = primary.indent;
  const optional = primary.optional ? '?' : '';
  let out = docBlock(describer === null ? [] : describer.description, indent);
  out += `${indent}${canonical}${optional}: ${primary.signature};\n`;
  return out;
}

export function removeDeprecatedDeclarations(component: string, source: string): string {
  const groups = groupDeclarations(component, scanDeclarations(source));
  // Back to front so earlier offsets stay valid: every member span is cut and
  // the group's remaining declaration is written where its first member stood.
  const edits: { start: number; end: number; text: string }[] = [];
  for (const group of groups) {
    if (group.members.every((member) => member.name === group.canonical)) {
      continue;
    }
    const first = group.members.reduce((a, b) => (a.start < b.start ? a : b));
    for (const member of group.members) {
      edits.push({
        start: member.start,
        end: member.end,
        text: member === first ? emitCanonical(group) : ''
      });
    }
  }
  edits.sort((a, b) => b.start - a.start);
  let next = source;
  for (const edit of edits) {
    next = `${next.slice(0, edit.start)}${edit.text}${next.slice(edit.end)}`;
  }
  return next;
}

// ----------------------------------------------------------------- component

function offsetOf(node: unknown, key: 'start' | 'end'): number {
  if (typeof node !== 'object' || node === null) {
    return -1;
  }
  const value = Reflect.get(node, key);
  return typeof value === 'number' ? value : -1;
}

type Site = {
  readonly start: number;
  readonly end: number;
  readonly binding: string;
};

type PropsPattern = {
  readonly names: ReadonlyMap<string, Site>;
};

function findPropsPattern(source: string): PropsPattern | null {
  const root = parse(source, { modern: true });
  const instance = root.instance ?? null;
  if (instance === null) {
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
    if (!source.slice(offsetOf(node, 'start'), offsetOf(node, 'end')).includes('$props(')) {
      continue;
    }
    const names = new Map<string, Site>();
    for (const property of declarator.id.properties) {
      if (property.type !== 'Property' || property.key.type !== 'Identifier') {
        continue;
      }
      const value = property.value;
      const target = value.type === 'AssignmentPattern' ? value.left : value;
      const binding = target.type === 'Identifier' ? target.name : property.key.name;
      names.set(property.key.name, {
        start: offsetOf(property, 'start'),
        end: offsetOf(property, 'end'),
        binding
      });
    }
    return { names };
  }
  return null;
}

type Resolver = {
  readonly identifier: string;
  readonly start: number;
  readonly end: number;
  /** A `?? fallback` the statement carries; phase 1 never left one behind, so this is a signal to check by hand. */
  readonly fallback: string | null;
};

/** Every `const X = $derived(resolveDeprecatedProp('C', 'a', 'b', …))` statement whose names touch the group. */
function findResolvers(source: string, names: ReadonlySet<string>): Resolver[] {
  const found: Resolver[] = [];
  const pattern =
    /const\s+(\w+)\s*=\s*\$derived\(\s*resolveDeprecatedProp\(\s*'[^']+'\s*,\s*'(\w+)'\s*,\s*'(\w+)'/g;
  for (const match of source.matchAll(pattern)) {
    if (!names.has(match[2]) && !names.has(match[3]) && !names.has(match[1])) {
      continue;
    }
    const start = typeof match.index === 'number' ? match.index : -1;
    const end = statementEnd(source, start);
    if (start === -1 || end === -1) {
      continue;
    }
    const lineStart = source.lastIndexOf('\n', start) + 1;
    const after = source.indexOf('\n', end);
    const carried = /\)\s*\?\?\s*([\s\S]+?)\s*\)\s*;$/.exec(source.slice(start, end + 1));
    found.push({
      identifier: match[1],
      start: lineStart,
      end: after === -1 ? source.length : after + 1,
      fallback: carried === null ? null : carried[1]
    });
  }
  return found;
}

/** Where an object pattern's property should be cut so no orphaned comma is left behind. */
function spanFor(ordered: readonly Site[], target: Site): { start: number; end: number } {
  const index = ordered.findIndex((site) => site.start === target.start && site.end === target.end);
  const next = index === -1 ? null : (ordered[index + 1] ?? null);
  if (next !== null) {
    return { start: target.start, end: next.start };
  }
  const previous = index <= 0 ? null : (ordered[index - 1] ?? null);
  return previous === null
    ? { start: target.start, end: target.end }
    : { start: previous.end, end: target.end };
}

/**
 * Applies the groups of one `properties.ts` to one component file, removing
 * every deprecated member's alias. Returns the rewritten source, or null when
 * the file destructures none of the props.
 */
export function removeAliasesFromComponent(
  label: string,
  file: string,
  source: string,
  groups: readonly Group[],
  notes: ComponentNote[]
): string | null {
  const pattern = findPropsPattern(source);
  if (pattern === null) {
    return null;
  }

  type Plan = {
    readonly group: Group;
    readonly identifier: string;
    readonly resolver: Resolver;
  };
  const plans: Plan[] = [];

  for (const group of groups) {
    const deprecated = group.members.filter((member) => member.name !== group.canonical);
    if (deprecated.length === 0) {
      continue;
    }
    const anyDeprecatedPresent = deprecated.some((member) => pattern.names.has(member.name));
    if (!anyDeprecatedPresent) {
      continue;
    }
    const names = new Set([...group.members.map((member) => member.name), group.canonical]);
    const resolvers = findResolvers(source, names);
    if (resolvers.length === 0) {
      notes.push({
        file,
        message: `no resolveDeprecatedProp statement found for ${group.canonical}; left untouched for a manual pass`
      });
      continue;
    }
    if (!pattern.names.has(group.canonical)) {
      notes.push({
        file,
        message: `${group.canonical} is not destructured even though a resolver exists; left untouched for a manual pass`
      });
      continue;
    }
    if (resolvers[0].fallback !== null) {
      notes.push({
        file,
        message: `resolver for ${group.canonical} carries a "?? ${resolvers[0].fallback}" fallback; confirm it survives on the destructured prop`
      });
    }
    if (resolvers.length > 1) {
      notes.push({
        file,
        message: `${resolvers.length} resolver statements found for ${group.canonical}; only the first was removed, the rest need a manual pass`
      });
    }
    plans.push({ group, identifier: resolvers[0].identifier, resolver: resolvers[0] });
  }

  if (plans.length === 0) {
    return null;
  }

  const edits: { start: number; end: number; text: string }[] = [];
  const ordered = [...pattern.names.values()].sort((a, b) => a.start - b.start);

  // 1. Destructuring: drop every deprecated binding; de-alias the canonical
  //    one when the identifier had taken its bare name.
  for (const plan of plans) {
    const { group, identifier } = plan;
    const deprecatedNames = group.members
      .filter((member) => member.name !== group.canonical)
      .map((member) => member.name);
    for (const name of deprecatedNames) {
      const site = pattern.names.get(name);
      if (typeof site === 'undefined') {
        continue;
      }
      const span = spanFor(ordered, site);
      edits.push({ start: span.start, end: span.end, text: '' });
    }
    if (identifier === group.canonical) {
      const canonicalSite = pattern.names.get(group.canonical);
      if (typeof canonicalSite !== 'undefined' && canonicalSite.binding !== group.canonical) {
        edits.push({ start: canonicalSite.start, end: canonicalSite.end, text: group.canonical });
      }
    }
  }

  // 2. Resolver statements: delete outright.
  for (const plan of plans) {
    edits.push({ start: plan.resolver.start, end: plan.resolver.end, text: '' });
  }

  // 3. Eager read: drop each resolved identifier; remove the whole block once none remain.
  const eagerPattern =
    /[ \t]*\/\/[^\n]*\n[ \t]*\$effect\.pre\(\(\) => \{\s*readDeprecatedProps\(([^)]*)\);\s*\}\);\n/;
  const existingEager = eagerPattern.exec(source);
  if (existingEager !== null) {
    const removedIdentifiers = new Set(plans.map((plan) => plan.identifier));
    const currentArgs = existingEager[1]
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    const remaining = currentArgs.filter((name) => !removedIdentifiers.has(name));
    if (remaining.length === 0) {
      edits.push({
        start: existingEager.index,
        end: existingEager.index + existingEager[0].length,
        text: ''
      });
    } else {
      notes.push({
        file,
        message: `$effect.pre(readDeprecatedProps(...)) still names ${remaining.join(', ')} after removal; left untouched for a manual pass`
      });
    }
  }

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let next = source;
  for (const edit of edits) {
    next = `${next.slice(0, edit.start)}${edit.text}${next.slice(edit.end)}`;
  }

  // 4. A component that named its derived value after a deprecated spelling
  //    now reads that value straight off the canonical prop instead.
  for (const plan of plans) {
    if (plan.identifier === plan.group.canonical) {
      continue;
    }
    next = next.replace(new RegExp(`\\b${plan.identifier}\\b`, 'g'), plan.group.canonical);
  }

  // 5. The banner introduces the resolver section as a whole, not any one
  //    statement, so no earlier edit's span ever covers it; once every
  //    resolver in the file is gone it is left announcing an empty section.
  //    Prettier collapses the blank line this leaves behind.
  if (!next.includes('resolveDeprecatedProp(')) {
    next = next.replace(`${BANNER}\n`, '');
  }

  if (!/import \{[^}]*readDeprecatedProps[^}]*\} from '\.\.\/deprecation';/.test(next)) {
    next = next.replace(/import \{[^}]*\} from '\.\.\/deprecation';\n/, '');
  } else if (!next.includes('resolveDeprecatedProp(') && !next.includes('readDeprecatedProps(')) {
    next = next.replace(/import \{[^}]*\} from '\.\.\/deprecation';\n/, '');
  }

  return next;
}

// ------------------------------------------------------------------- driver

export type Change = { readonly file: string; readonly code: string };

/** Which `.svelte` files consume a `properties.ts` — the directory's own component, plus Step for Stepper. */
function componentFilesFor(propertiesFile: string): readonly { file: string; label: string }[] {
  const directory = dirname(propertiesFile);
  const component = basename(directory);
  const own = { file: join(directory, `${component}.svelte`), label: component };
  return component === 'Stepper'
    ? [own, { file: join(directory, 'Step.svelte'), label: 'Step' }]
    : [own];
}

/**
 * Prettier reflows what this generator writes, so "unchanged" is judged with
 * whitespace collapsed: a second run must not undo the formatting pass.
 */
const shape = (source: string): string => source.replace(/\s+/g, '');

export function planRemoval(root: string): { changes: Change[]; notes: ComponentNote[] } {
  const changes: Change[] = [];
  const notes: ComponentNote[] = [];
  const lib = join(root, 'src', 'lib');
  for (const entry of readdirSync(lib).sort()) {
    const propertiesFile = join(lib, entry, 'properties.ts');
    if (!statSync(join(lib, entry)).isDirectory() || !existsSync(propertiesFile)) {
      continue;
    }
    const source = readFileSync(propertiesFile, 'utf8');
    const groups = groupDeclarations(entry, scanDeclarations(source));
    const rewritten = removeDeprecatedDeclarations(entry, source);
    if (shape(rewritten) !== shape(source)) {
      changes.push({ file: propertiesFile, code: rewritten });
    }
    for (const { file, label } of componentFilesFor(propertiesFile)) {
      if (!existsSync(file)) {
        continue;
      }
      const componentSource = readFileSync(file, 'utf8');
      const next = removeAliasesFromComponent(label, file, componentSource, groups, notes);
      if (next !== null && shape(next) !== shape(componentSource)) {
        changes.push({ file, code: next });
      }
    }
  }
  return { changes, notes };
}

export type { Declaration, Group };

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  const apply = process.argv.includes('--apply');
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag === -1 ? process.cwd() : (process.argv.at(rootFlag + 1) ?? process.cwd());
  const { changes, notes } = planRemoval(root);
  for (const change of changes) {
    console.log(change.file);
    if (apply) {
      writeFileSync(change.file, change.code);
    }
  }
  for (const note of notes) {
    console.log(`NOTE ${note.file}: ${note.message}`);
  }
  console.log(`${apply ? 'rewrote' : 'would rewrite'} ${changes.length} file(s)`);
}
