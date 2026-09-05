import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'svelte/compiler';
import { canonicalEventName } from './casing.ts';

/**
 * Moves every component onto DESIGN_PRINCIPLES §3's rule — event props are
 * lowercase throughout — while keeping every spelling a 3.x release ever
 * accepted working until 4.0.0.
 *
 * For each `properties.ts`, the event props that spell the same event
 * (`onclick`/`onClick`, `onoverlayClick`/`onOverlayClick`, Stepper's four
 * names for one click) form a group whose canonical member is
 * `canonicalEventName`'s answer. The group is rewritten so the canonical
 * declaration comes first and carries the description, and every other
 * member is a one-line `@deprecated` alias pointing at it. The component then
 * destructures every member, resolves them to one value through
 * `resolveDeprecatedProp` — canonical wins, each alias warns once — and reads
 * the result at mount so a consumer on an old spelling is told even if the
 * event never fires. The identifier the component's own code uses is left
 * alone; only the bindings behind it change.
 *
 *   node --experimental-strip-types scripts/migrate/lowercase-event-props.ts [--apply] [--root <repo>]
 *
 * Running it again on its own output changes nothing (`lowercase-event-props.test.ts`).
 */

const DEPRECATION = (canonical: string): string =>
  `@deprecated Use \`${canonical}\` instead; both work until 4.0.0.`;

const BANNER =
  '  // Every spelling this component still accepts resolves to one value; the lowercase one wins.';
const EAGER_COMMENT =
  '  // Read once at mount so an old spelling is reported even if the event never fires.';
const IMPORT = "import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';";

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

// ---------------------------------------------------------------- properties

export type Declaration = {
  readonly name: string;
  readonly optional: boolean;
  readonly signature: string;
  /** The comment block above the declaration, as its content lines. */
  readonly description: readonly string[];
  readonly deprecated: boolean;
  /** Span of doc block + declaration, including the trailing newline. */
  readonly start: number;
  readonly end: number;
  readonly indent: string;
};

function docLines(block: readonly string[]): { lines: string[]; deprecated: boolean } {
  const lines: string[] = [];
  let deprecated = false;
  for (const raw of block) {
    const line = raw
      .trim()
      .replace(/^\/\*\*\s?/, '')
      .replace(/\*\/$/, '')
      .replace(/^\*\s?/, '')
      .replace(/^\/\/\s?/, '')
      .trimEnd();
    if (line.includes('@deprecated')) {
      deprecated = true;
      continue;
    }
    lines.push(line);
  }
  while (lines.length > 0 && lines[0].length === 0) {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].length === 0) {
    lines.pop();
  }
  return { lines, deprecated };
}

export function scanDeclarations(source: string): readonly Declaration[] {
  const lines = source.split('\n');
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  const found: Declaration[] = [];
  let owner = '';
  for (let i = 0; i < lines.length; i++) {
    const typeLine = /^(?:export )?type (\w+)\b/.exec(lines[i]);
    if (typeLine !== null) {
      owner = typeLine[1];
    }
    const match = /^(\s*)(on[A-Za-z]+)(\?)?:\s*/.exec(lines[i]);
    if (match === null) {
      continue;
    }
    // Only a component's own props are events a consumer writes on a tag. A
    // callback key on a config object (`TableColumn.onToggle`, a chat adapter)
    // lives in a type that is not named `…Properties`, or nested deeper than
    // the props type's own members, and keeps its spelling.
    if (!owner.endsWith('Properties') || match[1].length !== 2) {
      continue;
    }
    const declStart = offsets[i];
    const colon = declStart + match[0].length;
    const end = statementEnd(source, colon);
    if (end === -1) {
      continue;
    }
    const signature = source.slice(colon, end).trim();
    if (!signature.includes('=>')) {
      continue;
    }
    let docStart = i;
    while (docStart > 0 && /^\s*(\/\*\*|\*|\/\/)/.test(lines[docStart - 1])) {
      docStart -= 1;
    }
    const { lines: description, deprecated } = docLines(lines.slice(docStart, i));
    const after = source.indexOf('\n', end);
    found.push({
      name: match[2],
      optional: match[3] === '?',
      signature,
      description,
      deprecated,
      start: offsets[docStart],
      end: after === -1 ? source.length : after + 1,
      indent: match[1]
    });
  }
  return found;
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

export type Group = {
  readonly canonical: string;
  readonly members: readonly Declaration[];
};

export function groupDeclarations(
  component: string,
  declarations: readonly Declaration[]
): Group[] {
  const groups = new Map<string, Declaration[]>();
  for (const declaration of declarations) {
    const canonical = canonicalEventName(component, declaration.name);
    groups.set(canonical, [...(groups.get(canonical) ?? []), declaration]);
  }
  return [...groups].map(([canonical, members]) => ({ canonical, members }));
}

function emitGroup(group: Group): string {
  const { canonical, members } = group;
  const primary =
    members.find((member) => member.name === canonical) ??
    members.find((member) => !member.deprecated) ??
    members[0];
  // The description follows the canonical name: it may currently sit above
  // whichever member was canonical before, and a deprecated alias's block only
  // needs to say what to use instead.
  const describer =
    members.find((member) => member.name === canonical && member.description.length > 0) ??
    members.find((member) => !member.deprecated && member.description.length > 0) ??
    members.find((member) => member.description.length > 0) ??
    null;
  const indent = primary.indent;
  const optional = primary.optional ? '?' : '';
  let out = docBlock(describer === null ? [] : describer.description, indent);
  out += `${indent}${canonical}${optional}: ${primary.signature};\n`;
  for (const member of members) {
    if (member.name === canonical) {
      continue;
    }
    const description = member === describer ? [] : member.description;
    out += docBlock([...description, DEPRECATION(canonical)], indent);
    out += `${indent}${member.name}${member.optional ? '?' : ''}: ${member.signature};\n`;
  }
  return out;
}

export function lowercaseProperties(component: string, source: string): string {
  const groups = groupDeclarations(component, scanDeclarations(source));
  // Back to front so earlier offsets stay valid: every member span is cut
  // and the group's block is written where its first member stood.
  const edits: { start: number; end: number; text: string }[] = [];
  for (const group of groups) {
    const first = group.members.reduce((a, b) => (a.start < b.start ? a : b));
    for (const member of group.members) {
      edits.push({
        start: member.start,
        end: member.end,
        text: member === first ? emitGroup(group) : ''
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
  readonly fallback: string | null;
};

type PropsPattern = {
  readonly declarationEnd: number;
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
      const fallback =
        value.type === 'AssignmentPattern'
          ? source.slice(offsetOf(value.right, 'start'), offsetOf(value.right, 'end'))
          : null;
      names.set(property.key.name, {
        start: offsetOf(property, 'start'),
        end: offsetOf(property, 'end'),
        binding,
        fallback
      });
    }
    return { declarationEnd: offsetOf(node, 'end'), names };
  }
  return null;
}

type Resolver = {
  readonly identifier: string;
  readonly start: number;
  readonly end: number;
  /** A `?? fallback` the statement already carries, from an earlier run. */
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

export type ComponentNote = { readonly file: string; readonly message: string };

/**
 * Applies the groups of one `properties.ts` to one component file. Returns the
 * rewritten source, or null when the file destructures none of the props.
 */
export function lowercaseComponent(
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
    readonly fallback: string | null;
    readonly resolvers: readonly Resolver[];
  };
  const plans: Plan[] = [];
  for (const group of groups) {
    // The canonical name is a member only once `lowercaseProperties` has run;
    // the component must bind it either way.
    const names = new Set([...group.members.map((member) => member.name), group.canonical]);
    const present = [...names].filter((name) => pattern.names.has(name));
    if (present.length === 0) {
      continue;
    }
    if (present.length === 1 && present[0] === group.canonical && names.size === 1) {
      continue;
    }
    const resolvers = findResolvers(source, names);
    const identifier =
      resolvers.at(0)?.identifier ??
      pattern.names.get(present.find((name) => name !== group.canonical) ?? present[0])?.binding ??
      present[0];
    // A default moves from the destructuring into the resolved value on the
    // first run; on a later run it is only in the statement, so it is kept.
    const fallback =
      present.map((name) => pattern.names.get(name)?.fallback ?? null).find((f) => f !== null) ??
      resolvers.at(0)?.fallback ??
      null;
    if (resolvers.length > 1) {
      notes.push({
        file,
        message: `${resolvers.length} resolver statements collapsed into one for ${group.canonical}; internal references to ${resolvers
          .slice(1)
          .map((r) => r.identifier)
          .join(', ')} need a manual pass`
      });
    }
    plans.push({ group, identifier, fallback, resolvers });
  }
  if (plans.length === 0) {
    return null;
  }

  const edits: { start: number; end: number; text: string }[] = [];

  // 1. Destructuring: every member bound, the identifier's own name freed.
  for (const plan of plans) {
    const { group, identifier } = plan;
    const bindingFor = (name: string): string => (name === identifier ? `${name}Prop` : name);
    const names = [...new Set([...group.members.map((member) => member.name), group.canonical])];
    const sites = names
      .map((name) => ({ name, site: pattern.names.get(name) ?? null }))
      .filter((entry) => entry.site !== null);
    for (const entry of sites) {
      if (entry.site === null) {
        continue;
      }
      const binding = bindingFor(entry.name);
      edits.push({
        start: entry.site.start,
        end: entry.site.end,
        text: binding === entry.name ? entry.name : `${entry.name}: ${binding}`
      });
    }
    const missing = names.filter((name) => !pattern.names.has(name));
    const last = sites.at(-1)?.site ?? null;
    if (missing.length > 0 && last !== null) {
      edits.push({
        start: last.end,
        end: last.end,
        text: missing
          .map((name) => `, ${bindingFor(name) === name ? name : `${name}: ${bindingFor(name)}`}`)
          .join('')
      });
    }
  }

  // 2. Resolver statements: replace the first existing one, drop the rest,
  //    or insert after `$props()` when the group had none.
  const identifiers: string[] = [];
  const inserted: string[] = [];
  for (const plan of plans) {
    const { group, identifier, fallback, resolvers } = plan;
    identifiers.push(identifier);
    const bindingFor = (name: string): string => (name === identifier ? `${name}Prop` : name);
    let expression = bindingFor(group.canonical);
    const deprecated = group.members.filter((member) => member.name !== group.canonical);
    for (const member of [...deprecated].reverse()) {
      expression = `resolveDeprecatedProp('${label}', '${member.name}', '${group.canonical}', ${bindingFor(member.name)}, ${expression})`;
    }
    // A destructured default becomes the resolved value's fallback. An arrow
    // function needs parens to parse as the right operand of `??`; anything
    // else (null, a literal, an already-parenthesised expression) does not.
    const guarded =
      fallback === null
        ? ''
        : ` ?? ${/=>/.test(fallback) && !/^\(.*\)$/s.test(fallback) ? `(${fallback})` : fallback}`;
    const statement = `  const ${identifier} = $derived(${expression}${guarded});\n`;
    if (resolvers.length > 0) {
      edits.push({ start: resolvers[0].start, end: resolvers[0].end, text: statement });
      for (const extra of resolvers.slice(1)) {
        edits.push({ start: extra.start, end: extra.end, text: '' });
      }
    } else {
      inserted.push(statement);
    }
  }

  // 3. Eager read: one block naming every resolved identifier in the file.
  const eagerPattern =
    /[ \t]*\/\/[^\n]*\n[ \t]*\$effect\.pre\(\(\) => \{\s*readDeprecatedProps\([^)]*\);\s*\}\);\n/;
  const existingEager = eagerPattern.exec(source);
  const existingNames =
    existingEager === null
      ? []
      : [...(existingEager[0].match(/readDeprecatedProps\(([^)]*)\)/)?.[1] ?? '').split(',')]
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
  const eagerNames = [...new Set([...existingNames, ...identifiers])];
  const eagerBlock = `${EAGER_COMMENT}\n  $effect.pre(() => {\n    readDeprecatedProps(${eagerNames.join(', ')});\n  });\n`;
  if (existingEager !== null && typeof existingEager.index === 'number') {
    edits.push({
      start: existingEager.index,
      end: existingEager.index + existingEager[0].length,
      text: eagerBlock
    });
  }

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let next = source;
  for (const edit of edits) {
    next = `${next.slice(0, edit.start)}${edit.text}${next.slice(edit.end)}`;
  }

  // New statements join the existing resolver block, just above its eager
  // read; a file that had none gets the block right after `$props()`.
  const eagerAt = next.indexOf(EAGER_COMMENT);
  const propsEnd = next.indexOf('$props(');
  const lineEnd = next.indexOf('\n', propsEnd);
  const cut = eagerAt !== -1 ? eagerAt : lineEnd === -1 ? next.length : lineEnd + 1;
  const hasBanner = next.includes(BANNER) || next.includes('// Event-casing phase 1');
  const insertion =
    eagerAt !== -1
      ? `${inserted.join('')}\n`
      : (inserted.length > 0 ? `\n${hasBanner ? '' : `${BANNER}\n`}${inserted.join('')}` : '') +
        `\n${eagerBlock}`;
  if (inserted.length > 0 || existingEager === null) {
    next = `${next.slice(0, cut)}${insertion}${next.slice(cut)}`;
  }
  next = next.replace(
    '  // Event-casing phase 1: both spellings accepted, the correct one wins.',
    BANNER
  );

  if (!next.includes(IMPORT)) {
    next = next.replace(/import \{[^}]*\} from '\.\.\/deprecation';\n/, '');
    const anchor = "from './properties';";
    const at = next.indexOf(anchor);
    if (at === -1) {
      notes.push({ file, message: 'no ./properties import to anchor the deprecation import on' });
      return next;
    }
    const end = next.indexOf('\n', at) + 1;
    next = `${next.slice(0, end)}  ${IMPORT}\n${next.slice(end)}`;
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
 * Prettier reflows what this generator writes (a long resolver call wraps, a
 * destructuring pattern spreads over lines), so "unchanged" is judged with
 * whitespace collapsed: a second run must not undo the formatting pass.
 */
const shape = (source: string): string => source.replace(/\s+/g, '');

export function planLowercase(root: string): { changes: Change[]; notes: ComponentNote[] } {
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
    const rewritten = lowercaseProperties(entry, source);
    if (shape(rewritten) !== shape(source)) {
      changes.push({ file: propertiesFile, code: rewritten });
    }
    for (const { file, label } of componentFilesFor(propertiesFile)) {
      if (!existsSync(file)) {
        continue;
      }
      const componentSource = readFileSync(file, 'utf8');
      const next = lowercaseComponent(label, file, componentSource, groups, notes);
      if (next !== null && shape(next) !== shape(componentSource)) {
        changes.push({ file, code: next });
      }
    }
  }
  return { changes, notes };
}

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  const apply = process.argv.includes('--apply');
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag === -1 ? process.cwd() : (process.argv.at(rootFlag + 1) ?? process.cwd());
  const { changes, notes } = planLowercase(root);
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
