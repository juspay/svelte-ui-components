import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_PAIRS } from '../scripts/codemod/legacy-pairs';

/**
 * The inverse of 3.x's alias matrix: every spelling that release deprecated is
 * gone, and the lowercase one it named is the declaration that remains.
 *
 * In 3.x, `src/deprecated-alias-matrix.test.ts` drove all 191 pairs through
 * their components and proved the deprecated spelling still reached the
 * handler. That test is deleted here, because there is nothing left for it to
 * assert — and deleting a test is exactly how a removal quietly becomes
 * partial. This replaces it with the opposite claim over the same list, so the
 * 191 pairs stay covered across the major rather than falling out of the suite.
 *
 * `LEGACY_PAIRS` is deliberately still shipped and still the source of truth
 * here. It is what `npx sui-codemod` reads to rewrite a 3.x consumer's call
 * sites, so it outlives the aliases themselves; that also makes it the honest
 * checklist for what this release had to remove.
 *
 * Config-object callback keys are out of scope by construction: they were never
 * in `LEGACY_PAIRS`, because they are keys a consumer writes inside an object
 * rather than props on a tag, and 4.0.0 does not touch them.
 */

const LIB = join(process.cwd(), 'src/lib');

/** Where a component's props are declared, via the barrel rather than a guess. */
const propertiesFor = (): ReadonlyMap<string, string> => {
  const barrel = readFileSync(join(LIB, 'index.ts'), 'utf8');
  const found = new Map<string, string>();
  for (const line of barrel.split('\n')) {
    const match = /^export \{ default as (\w+) \} from '\.\/([^/]+)\/[^']+\.svelte';/.exec(line);
    if (match !== null) {
      found.set(match[1], join(LIB, match[2], 'properties.ts'));
    }
  }
  return found;
};

const PROPERTIES = propertiesFor();

/** Declarations at the props type's own indent, which is what a consumer writes on a tag. */
const declaredProps = (file: string): ReadonlySet<string> => {
  const names = new Set<string>();
  let owner = '';
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const type = /^(?:export )?type (\w+)\b/.exec(line);
    if (type !== null) {
      owner = type[1];
    }
    const match = /^ {2}(\w+)\??:/.exec(line);
    if (match !== null && owner.endsWith('Properties')) {
      names.add(match[1]);
    }
  }
  return names;
};

describe('4.0.0 removed every spelling 3.x deprecated', () => {
  it('has a list to check against', () => {
    expect(LEGACY_PAIRS.length).toBeGreaterThan(150);
  });

  for (const { component, legacy, corrected } of LEGACY_PAIRS) {
    it(`${component} no longer declares ${legacy}`, () => {
      const file = PROPERTIES.get(component);
      if (typeof file === 'undefined') {
        throw new Error(`${component} is not exported from src/lib/index.ts`);
      }
      const declared = declaredProps(file);

      expect(
        declared.has(legacy),
        `<${component}> still declares \`${legacy}\`, which 4.0.0 removes. A consumer ` +
          `reading the changelog would expect it gone; leaving it keeps the second ` +
          `convention alive past the release that was supposed to end it.`
      ).toBe(false);

      expect(
        declared.has(corrected),
        `<${component}> lost \`${corrected}\` along with the alias — the removal took the ` +
          `replacement with it, so there is now no way to handle this event at all.`
      ).toBe(true);
    });
  }

  it('leaves no deprecation machinery behind', () => {
    // `resolveDeprecatedProp` and its warning existed only to serve the
    // aliases. With none left, the module is dead weight in every consumer's
    // bundle, so the removal has to take it too.
    const barrel = readFileSync(join(LIB, 'index.ts'), 'utf8');
    expect(barrel).not.toContain('deprecation');
  });
});
