import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// docs/_index.json is what the MCP server's `list_components` / `get_component_docs`
// tools read, so a component with a docs file but no index entry is invisible to
// every AI assistant that composes through the library. Four shipped that way
// (AttachmentChipRow, HITL, KeyValue, TypewriterText) and nothing noticed; this
// keeps the index and the docs directory in lockstep in both directions.

const ROOT = join(import.meta.dirname, '..', '..');
const DOCS = join(ROOT, 'docs');
const LIB = join(ROOT, 'src', 'lib');

type IndexEntry = { readonly name: string; readonly description: string };

const readIndex = (): readonly IndexEntry[] => {
  const parsed: unknown = JSON.parse(readFileSync(join(DOCS, '_index.json'), 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error('docs/_index.json is not an array');
  }
  return parsed.flatMap((entry: unknown): IndexEntry[] => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }
    const name = Reflect.get(entry, 'name');
    const description = Reflect.get(entry, 'description');
    return typeof name === 'string' && typeof description === 'string'
      ? [{ name, description }]
      : [];
  });
};

/** A docs file whose name is also a component directory under src/lib. */
const documentedComponents = (): readonly string[] =>
  readdirSync(DOCS)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.slice(0, -'.md'.length))
    .filter((name) => existsSync(join(LIB, name)))
    .sort();

describe('docs/_index.json', () => {
  it('lists every component that has a docs file', () => {
    const indexed = new Set(readIndex().map((entry) => entry.name));
    const missing = documentedComponents().filter((name) => !indexed.has(name));
    expect(missing, 'documented but not indexed — add an entry to docs/_index.json').toEqual([]);
  });

  it('has a docs file behind every entry', () => {
    const orphans = readIndex()
      .map((entry) => entry.name)
      .filter((name) => !existsSync(join(DOCS, `${name}.md`)));
    expect(orphans, 'indexed but no docs/<name>.md exists').toEqual([]);
  });

  it('gives every entry a non-empty description', () => {
    const empty = readIndex()
      .filter((entry) => entry.description.trim().length === 0)
      .map((entry) => entry.name);
    expect(empty).toEqual([]);
  });
});
