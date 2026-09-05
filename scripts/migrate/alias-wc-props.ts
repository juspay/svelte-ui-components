import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { readWrapperParity } from '../wc-parity/prop-parity.ts';
import { scanDeclarations } from './lowercase-event-props.ts';

/**
 * The event-casing migration stops at the Svelte layer on its own:
 * lowercase-event-props.ts gives each event prop its lowercase spelling on the
 * component, but a custom element only forwards what `customElement.props`
 * declares, so a new spelling is unreachable through a web component until it
 * is declared there too. This closes that half.
 *
 * Committed rather than run once and thrown away, for the same reason its
 * sibling is: 126 declarations across 49 wrappers is not a diff anyone can
 * meaningfully review by eye, and the transform is the only honest description
 * of what was done to them. Re-running it is a no-op, and a test asserts that.
 *
 * Scope is deliberately narrow. It adds declarations the parity ratchet already
 * reports as missing, and only for props named like event handlers. Anything
 * else is reported and skipped rather than guessed at: `{ type: 'Object' }` is
 * right for a callback and wrong for a string, and a wrong declaration is worse
 * than an absent one because it looks settled.
 */

type UnknownRecord = Record<string, unknown>;

type Addition = {
  readonly wrapper: string;
  readonly props: readonly string[];
};

type Skip = { readonly wrapper: string; readonly prop: string; readonly reason: string };

/** Mirrors scripts/wc-parity/prop-parity.ts; assertions and predicates are banned repo-wide. */
function asRecord(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null) {
    return {};
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

function asList(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function keyName(node: unknown): string | null {
  const key = asRecord(asRecord(node).key);
  if (typeof key.name === 'string') {
    return key.name;
  }
  return typeof key.value === 'string' ? key.value : null;
}

function offsetOf(node: unknown, key: 'start' | 'end'): number {
  const value = asRecord(node)[key];
  return typeof value === 'number' ? value : -1;
}

/**
 * Whether a prop is an event callback, and so safe to declare as `type: 'Object'`.
 *
 * Judged by the library's own declarations, not by the spelling: with every
 * event prop lowercase, a name test alone cannot tell `onclick` from a future
 * `once`, and a wrong declaration is worse than an absent one because it looks
 * settled. `eventProps` is every `on*` prop declared with a function type in
 * some `src/lib/**\/properties.ts` (see `libraryEventProps`).
 */
export function isEventProp(name: string, eventProps: ReadonlySet<string>): boolean {
  return eventProps.has(name);
}

/** Every event prop name declared on a component's props type, library-wide. */
export function libraryEventProps(root: string): ReadonlySet<string> {
  const names = new Set<string>();
  const lib = join(root, 'src', 'lib');
  for (const entry of readdirSync(lib)) {
    const file = join(lib, entry, 'properties.ts');
    if (!existsSync(file)) {
      continue;
    }
    for (const declaration of scanDeclarations(readFileSync(file, 'utf8'))) {
      names.add(declaration.name);
    }
  }
  return names;
}

/**
 * The end offset of the last entry inside `customElement.props`, which is where
 * a new declaration is appended. Returns -1 when the wrapper has no props object
 * or an empty one: both mean this transform has nothing safe to do, since it
 * would have to invent the object's formatting rather than match it.
 */
export function lastPropertyEnd(source: string): number {
  const root = asRecord(parse(source, { modern: true }));
  const options = asRecord(root.options);
  for (const attribute of asList(options.attributes)) {
    const record = asRecord(attribute);
    if (record.name !== 'customElement') {
      continue;
    }
    const single = Array.isArray(record.value) ? record.value[0] : record.value;
    const object = asRecord(asRecord(single).expression);
    for (const property of asList(object.properties)) {
      if (keyName(property) !== 'props') {
        continue;
      }
      const entries = asList(asRecord(asRecord(property).value).properties);
      return entries.length === 0 ? -1 : offsetOf(entries[entries.length - 1], 'end');
    }
  }
  return -1;
}

/**
 * Indentation of the line the given offset sits on, so appended entries line up
 * with the ones already there instead of assuming a fixed depth.
 */
function indentAt(source: string, offset: number): string {
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
  const line = source.slice(lineStart, offset);
  return line.slice(0, line.length - line.trimStart().length);
}

export function declareProps(source: string, props: readonly string[]): string | null {
  if (props.length === 0) {
    return source;
  }
  const insertAt = lastPropertyEnd(source);
  if (insertAt === -1) {
    return null;
  }
  const indent = indentAt(source, insertAt);
  const entries = props.map((prop) => `${indent}${prop}: { type: 'Object' }`).join(',\n');
  return `${source.slice(0, insertAt)},\n${entries}${source.slice(insertAt)}`;
}

export function planWrapperProps(root: string): {
  readonly additions: readonly Addition[];
  readonly skipped: readonly Skip[];
} {
  const additions: Addition[] = [];
  const skipped: Skip[] = [];
  const eventProps = libraryEventProps(root);

  for (const entry of readWrapperParity()) {
    if (entry.missing.length === 0) {
      continue;
    }
    const events = entry.missing.filter((prop) => isEventProp(prop, eventProps));
    for (const prop of entry.missing) {
      if (!isEventProp(prop, eventProps)) {
        skipped.push({
          wrapper: entry.wrapper,
          prop,
          reason: 'not an event prop; its type cannot be inferred safely'
        });
      }
    }
    if (events.length === 0) {
      continue;
    }
    const source = readFileSync(join(root, 'src/wc/components', entry.wrapper), 'utf8');
    if (lastPropertyEnd(source) === -1) {
      for (const prop of events) {
        skipped.push({ wrapper: entry.wrapper, prop, reason: 'no non-empty customElement props' });
      }
      continue;
    }
    additions.push({ wrapper: entry.wrapper, props: events });
  }

  return { additions, skipped };
}

export function applyWrapperProps(
  root: string,
  apply: boolean,
  log: (line: string) => void
): { readonly changed: number; readonly skipped: number } {
  const { additions, skipped } = planWrapperProps(root);
  let changed = 0;

  for (const addition of additions) {
    const path = join(root, 'src/wc/components', addition.wrapper);
    const next = declareProps(readFileSync(path, 'utf8'), addition.props);
    if (next === null) {
      log(`SKIP  ${addition.wrapper}: could not locate customElement props`);
      continue;
    }
    if (apply) {
      writeFileSync(path, next);
    }
    changed += addition.props.length;
    log(`${addition.wrapper}: +${addition.props.join(', +')}`);
  }

  for (const skip of skipped) {
    log(`SKIP  ${skip.wrapper}.${skip.prop}: ${skip.reason}`);
  }
  log('');
  log(
    `${changed} declaration(s) across ${additions.length} wrapper(s); ${skipped.length} skipped${apply ? '' : ' (dry run, nothing written)'}`
  );
  return { changed, skipped: skipped.length };
}

const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url.endsWith(entrypoint.split('/').at(-1) ?? '');

if (invokedDirectly) {
  applyWrapperProps(resolve('.'), process.argv.includes('--apply'), (line) => console.log(line));
}
