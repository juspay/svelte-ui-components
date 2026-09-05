import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LegacyPair } from './legacy-pairs.ts';

/**
 * Regenerates `legacy-pairs.ts`'s `LEGACY_PAIRS` from the `@deprecated` tags
 * in `src/lib/**\/properties.ts`, the same source `legacy-pairs.test.ts`
 * checks it against, so drift between the committed table and the library
 * fails CI instead of shipping quietly.
 *
 * Every deprecated event prop's tag names its replacement (`Use \`onclick\`
 * instead`), written by `scripts/migrate/lowercase-event-props.ts`; that
 * sentence is the rename table. Only a component's own props count — a
 * callback key on a config object is declared in a type not named
 * `…Properties`, or nested deeper than the props type's members.
 *
 * Not shipped: `scripts/migrate` sits outside the published `files`. Run
 * directly (`node scripts/codemod/generate-maps.ts`) to print the table.
 */

/**
 * `Stepper/properties.ts` is the one directory that hosts two exported
 * components; the type name says which one a declaration belongs to.
 */
const OWNER_COMPONENTS: ReadonlyMap<string, string> = new Map([['StepEventProperties', 'Step']]);

const TAG = /@deprecated Use `(on[a-z]+)` instead/;

/** The contiguous comment lines directly above a declaration, and nothing older. */
function docBlockAbove(lines: readonly string[], index: number): string {
  const block: string[] = [];
  for (let i = index - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.length === 0 || !/^(\/\*\*|\*|\/\/)/.test(line)) {
      break;
    }
    block.unshift(line);
  }
  return block.join('\n');
}

export function computeLegacyPairs(root = process.cwd()): readonly LegacyPair[] {
  const lib = join(root, 'src', 'lib');
  const pairs: LegacyPair[] = [];
  for (const entry of readdirSync(lib).sort()) {
    const file = join(lib, entry, 'properties.ts');
    if (!statSync(join(lib, entry)).isDirectory() || !existsSync(file)) {
      continue;
    }
    const lines = readFileSync(file, 'utf8').split('\n');
    let owner = '';
    lines.forEach((line, index) => {
      const typeLine = /^(?:export )?type (\w+)\b/.exec(line);
      if (typeLine !== null) {
        owner = typeLine[1];
      }
      const declaration = /^( {2})(on[A-Za-z]+)\??:/.exec(line);
      if (declaration === null || !owner.endsWith('Properties')) {
        return;
      }
      const tag = TAG.exec(docBlockAbove(lines, index));
      if (tag === null) {
        return;
      }
      pairs.push({
        component: OWNER_COMPONENTS.get(owner) ?? entry,
        legacy: declaration[2],
        corrected: tag[1]
      });
    });
  }
  return pairs;
}

const entryPoint = process.argv.at(1) ?? '';
if (entryPoint !== '' && import.meta.url === pathToFileURL(entryPoint).href) {
  console.log(JSON.stringify(computeLegacyPairs(), null, 2));
}
