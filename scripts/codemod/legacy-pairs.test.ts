import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_PAIRS, legacyProps, legacyRenameTable } from './legacy-pairs.ts';
import { computeLegacyPairs } from './generate-maps.ts';

/**
 * Reads the JSDoc block attached to a prop declaration in a `properties.ts`.
 *
 * The block sits immediately above the declaration, so walk upwards over the
 * contiguous comment lines and stop at the first line that is not one.
 */
function docBlockFor(source: string, prop: string): string | null {
  const lines = source.split('\n');
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const declaration = new RegExp(`^\\s*${escaped}\\??\\s*:`);
  const index = lines.findIndex((line) => declaration.test(line));
  if (index === -1) {
    return null;
  }
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

// Step's props live in Stepper's shared properties.ts (see generate-maps.ts).
const propertiesDirectory = (component: string): string =>
  component === 'Step' ? 'Stepper' : component;

const propertiesOf = (component: string): string =>
  readFileSync(
    join(process.cwd(), 'src/lib', propertiesDirectory(component), 'properties.ts'),
    'utf8'
  );

describe('LEGACY_PAIRS', () => {
  it('has exactly 190 entries — every prop 4.0.0 renamed', () => {
    // 191 spellings were deprecated in 3.x. Table's `onCellChange` is not here
    // because 4.0.0 deletes that prop rather than renaming it, and a rename
    // table that pointed at it would move a consumer onto a prop that no longer
    // exists. docs/MIGRATION_4.0.md covers it in prose instead.
    expect(LEGACY_PAIRS.length).toBe(190);
  });

  it('is frozen: src/lib no longer derives it, because the tags are gone', () => {
    // In 3.x this table was regenerated from the `@deprecated` tags and
    // asserted equal to them. 4.0.0 removed the tags, so the derivation now
    // yields nothing — which is itself the proof that the removal is complete,
    // and the reason this table is a fixed historical record from here on
    // rather than a projection of the source.
    //
    // It still ships: `npx sui-codemod` reads it to move a 3.x consumer's call
    // sites onto the 4.0.0 spellings, which is work that outlives the aliases
    // it describes. Regenerating it now would silently empty the codemod.
    expect(computeLegacyPairs()).toEqual([]);
    expect(LEGACY_PAIRS.length).toBe(190);
  });

  it('never claims a legacy spelling equals its own correction', () => {
    const noOps = LEGACY_PAIRS.filter((pair) => pair.legacy === pair.corrected).map(
      (pair) => `${pair.component}.${pair.legacy}`
    );

    expect(noOps).toEqual([]);
  });

  it('moves a consumer off a spelling the library no longer declares', () => {
    // In 3.x the check was that every legacy spelling carried an `@deprecated`
    // tag. In 4.0.0 the stronger statement holds: it is not declared at all,
    // so a consumer still writing it gets a prop the component ignores. That is
    // exactly who the codemod is for.
    const surviving = LEGACY_PAIRS.filter(
      (pair) => docBlockFor(propertiesOf(pair.component), pair.legacy) !== null
    ).map((pair) => `${pair.component}.${pair.legacy}`);

    expect(surviving).toEqual([]);
  });

  it('never rewrites a consumer onto a deprecated prop', () => {
    // Landing a consumer on a prop that is itself slated for removal means
    // they owe a second migration immediately, so every target must be the
    // supported spelling.
    const deprecated = LEGACY_PAIRS.filter((pair) =>
      (docBlockFor(propertiesOf(pair.component), pair.corrected) ?? '').includes('@deprecated')
    ).map((pair) => `${pair.component}.${pair.corrected}`);

    expect(deprecated).toEqual([]);
  });
});

describe('legacyRenameTable', () => {
  it('maps every deprecated spelling of a component to its corrected one', () => {
    const stepper = legacyRenameTable().get('Stepper');

    expect(stepper?.get('onstepclick')).toBe('onhandlestepclick');
    expect(stepper?.get('onStepClick')).toBe('onhandlestepclick');
    expect(stepper?.get('onhandleStepClick')).toBe('onhandlestepclick');
  });

  it('lists every legacy spelling for unresolved-tag warnings', () => {
    expect(legacyProps().has('onStepClick')).toBe(true);
    expect(legacyProps().has('onhandlestepclick')).toBe(false);
  });
});
